/**
 * Setup links, login and logout. Accounts are invite-only: an admin creates the user (admin.js or
 * scripts/make-admin.mjs) and a one-time setup link, valid for 7 days, where the person sets their
 * password. Five wrong passwords in a row lock login for 15 minutes. Every failure says the same
 * thing, so the form never tells anyone whether an email has an account.
 */
import { hashPassword, verifyPassword, newToken, sha256Hex, DUMMY } from './crypto.js';
import {
  json,
  fail,
  notFound,
  readJson,
  line,
  startSession,
  getSession,
  clearCookie,
  clientIp,
  allowed,
} from './http.js';

const DAY = 24 * 3600 * 1000;
export const INVITE_DAYS = 7;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;
export const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;
const WRONG =
  'Wrong email or password. After 5 wrong tries in a row, logging in pauses for 15 minutes.';

export const normaliseEmail = (email) => line(email, 200).toLowerCase();
export const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;

/** Adds a user with no password yet. Returns { id, email, name, role }. */
export async function addUser(env, { email, name, role = 'client' }, now = Date.now()) {
  const user = {
    id: crypto.randomUUID(),
    email: normaliseEmail(email),
    name: line(name, 100),
    role,
  };
  await env.DB.prepare(
    'INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(user.id, user.email, user.name, user.role, now)
    .run();
  return user;
}

/** A new setup link for a user. Only the token's hash is stored. */
export async function createInvite(env, userId, origin, now = Date.now()) {
  const token = newToken();
  await env.DB.prepare('INSERT INTO invites (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, now + INVITE_DAYS * DAY)
    .run();
  return `${origin}/account/setup/?t=${token}`;
}

async function findInvite(env, token, now) {
  if (typeof token !== 'string' || !token || token.length > 100) return null;
  return env.DB.prepare(
    `SELECT invites.token_hash, users.id AS user_id, users.email, users.name FROM invites
     JOIN users ON users.id = invites.user_id
     WHERE invites.token_hash = ? AND invites.used_at IS NULL AND invites.expires_at > ?`,
  )
    .bind(await sha256Hex(token), now)
    .first();
}

/** GET /api/auth/setup?t= : who the link is for. */
export async function setupInfo(url, env, now = Date.now()) {
  const invite = await findInvite(env, url.searchParams.get('t'), now);
  if (!invite) return notFound();
  return json({ ok: true, email: invite.email, name: invite.name });
}

/** POST /api/auth/setup { token, name, password } */
export async function setup(request, env, now = Date.now()) {
  const body = await readJson(request);
  if (!body) return fail(413, 'Too large.');
  const invite = await findInvite(env, body.token, now);
  if (!invite) return notFound();
  const name = line(body.name, 100) || invite.name;
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return fail(400, `Please choose a password of at least ${MIN_PASSWORD} characters.`, {
      field: 'password',
    });
  }
  const { hash, salt } = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET name = ?, password_hash = ?, salt = ?, failed_logins = 0, locked_until = 0 WHERE id = ?',
    ).bind(name, hash, salt, invite.user_id),
    env.DB.prepare('UPDATE invites SET used_at = ? WHERE token_hash = ?').bind(
      now,
      invite.token_hash,
    ),
  ]);
  const cookie = await startSession(env, invite.user_id, now);
  const { role } = await env.DB.prepare('SELECT role FROM users WHERE id = ?')
    .bind(invite.user_id)
    .first();
  return json({ ok: true, role }, 200, { 'Set-Cookie': cookie });
}

/** POST /api/auth/login { email, password } */
export async function login(request, env, now = Date.now()) {
  if (!(await allowed(env.LOGIN_PER_IP, clientIp(request)))) {
    return fail(429, 'Too many tries just now. Please wait a minute and try again.');
  }
  const body = await readJson(request);
  if (!body) return fail(413, 'Too large.');
  const password = typeof body.password === 'string' ? body.password.slice(0, MAX_PASSWORD) : '';
  const user = await env.DB.prepare(
    'SELECT id, role, password_hash, salt, failed_logins, locked_until FROM users WHERE email = ?',
  )
    .bind(normaliseEmail(body.email))
    .first();

  // Always hash once, so an unknown email takes as long as a wrong password.
  const good = await verifyPassword(
    password,
    user?.password_hash ?? DUMMY.hash,
    user?.salt ?? DUMMY.salt,
  );
  if (!user || !user.password_hash) return fail(401, WRONG);
  if (user.locked_until > now) return fail(401, WRONG);
  if (!good) {
    const failed = user.failed_logins + 1;
    const lock = failed >= LOCK_AFTER;
    await env.DB.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?')
      .bind(lock ? 0 : failed, lock ? now + LOCK_MS : 0, user.id)
      .run();
    return fail(401, WRONG);
  }
  await env.DB.prepare('UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = ?')
    .bind(user.id)
    .run();
  const cookie = await startSession(env, user.id, now);
  return json({ ok: true, role: user.role }, 200, { 'Set-Cookie': cookie });
}

/** POST /api/auth/logout */
export async function logout(request, env) {
  const session = await getSession(request, env);
  if (session) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}

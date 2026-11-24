/**
 * Setup links, login and logout. Accounts are invite-only: an admin creates the user (admin.js or
 * scripts/make-admin.mjs) and a one-time setup link, valid for 7 days, where the person sets their
 * password. Five wrong passwords in a row lock login for 15 minutes. Every failure says the same
 * thing, so the form never tells anyone whether an email has an account.
 */
import { hashPassword, verifyPassword, newToken, sha256Hex, safeEqual, DUMMY } from './crypto.js';
import { sendToPerson } from './send.js';
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
export async function createInvite(
  env,
  userId,
  origin,
  now = Date.now(),
  lifeMs = INVITE_DAYS * DAY,
) {
  const token = newToken();
  await env.DB.prepare('INSERT INTO invites (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, now + lifeMs)
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
      // The link came by email, so it also proves the address.
      'UPDATE users SET name = ?, password_hash = ?, salt = ?, failed_logins = 0, locked_until = 0, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?',
    ).bind(name, hash, salt, now, invite.user_id),
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
    'SELECT id, email, role, password_hash, salt, failed_logins, locked_until, email_verified_at FROM users WHERE email = ?',
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
  if (!user.email_verified_at) {
    // Right password, email never confirmed: send a fresh code and ask for it.
    const code = await issueCode(env, user.id, now);
    await sendCode(env, user.email, code);
    return json({ ok: false, verify: true, ...devCode(request, env, code) }, 403);
  }
  const cookie = await startSession(env, user.id, now);
  return json({ ok: true, role: user.role }, 200, { 'Set-Cookie': cookie });
}

// ---------- public sign-up (docs/superpowers/specs/2026-11-23-self-serve-portfolios-design.md) ----------

const CODE_MINUTES = 15;
const CODE_TRIES = 5;
const RESET_MS = 60 * 60 * 1000;

/** A 6-digit code, stored only as a hash tied to the user. */
export async function issueCode(env, userId, now) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
  await env.DB.prepare(
    `INSERT INTO email_codes (user_id, code_hash, expires_at, tries) VALUES (?, ?, ?, 0)
     ON CONFLICT (user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, tries = 0`,
  )
    .bind(userId, await sha256Hex(`${userId}:${code}`), now + CODE_MINUTES * 60 * 1000)
    .run();
  return code;
}

export const sendCode = (env, to, code) =>
  sendToPerson(env, {
    to,
    subject: `Your Hu/man code: ${code}`,
    text: `Your code to confirm your email is ${code}.\n\nIt works for ${CODE_MINUTES} minutes. If you didn't ask for it, you can ignore this email: nothing happens without the code.`,
  });

/** Local testing only: the code in the response, when DEV_SHOW_CODES=yes and the host is localhost. */
function devCode(request, env, code) {
  const host = new URL(request.url).hostname;
  return env.DEV_SHOW_CODES === 'yes' && (host === 'localhost' || host === '127.0.0.1')
    ? { devCode: code }
    : {};
}

/** POST /api/auth/signup { name, email, password } */
export async function signup(request, env, now = Date.now()) {
  if (!(await allowed(env.SIGNUP_PER_IP, clientIp(request)))) {
    return fail(429, 'Too many tries just now. Please wait a minute and try again.');
  }
  const body = await readJson(request);
  if (!body) return fail(413, 'Too large.');
  const name = line(body.name, 100);
  const email = normaliseEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = {};
  if (!name) errors.name = 'Please add your name.';
  if (!EMAIL.test(email)) errors.email = 'Please add an email address you can open.';
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    errors.password = `Please choose a password of at least ${MIN_PASSWORD} characters.`;
  }
  if (Object.keys(errors).length) return fail(400, 'Please check the form.', { errors });

  const existing = await env.DB.prepare('SELECT id, email_verified_at FROM users WHERE email = ?')
    .bind(email)
    .first();
  const origin = new URL(request.url).origin;
  if (existing?.email_verified_at) {
    // Same answer as a new sign-up, so nobody can tell which emails have accounts.
    await sendToPerson(env, {
      to: email,
      subject: 'You already have a Hu/man account',
      text: `Someone (hopefully you) tried to create a Hu/man account with this email, but you already have one.\n\nLog in: ${origin}/login/\nForgotten your password? ${origin}/login/?forgot=1\n\nIf it wasn't you, you can ignore this email.`,
    });
    return json({ ok: true, verify: true });
  }
  const { hash, salt } = await hashPassword(password);
  let userId = existing?.id;
  if (userId) {
    await env.DB.prepare('UPDATE users SET name = ?, password_hash = ?, salt = ? WHERE id = ?')
      .bind(name, hash, salt, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, role, password_hash, salt, created_at) VALUES (?, ?, ?, 'client', ?, ?, ?)",
    )
      .bind(userId, email, name, hash, salt, now)
      .run();
  }
  const code = await issueCode(env, userId, now);
  await sendCode(env, email, code);
  return json({ ok: true, verify: true, ...devCode(request, env, code) });
}

/** POST /api/auth/verify { email, code } : confirms the email and logs in. */
export async function verify(request, env, now = Date.now()) {
  const body = (await readJson(request)) ?? {};
  const bad = () =>
    fail(400, 'That code isn’t right, or it has expired. You can ask for a new one.');
  const user = await env.DB.prepare('SELECT id, role FROM users WHERE email = ?')
    .bind(normaliseEmail(body.email))
    .first();
  if (!user) return bad();
  const row = await env.DB.prepare(
    'SELECT code_hash, expires_at, tries FROM email_codes WHERE user_id = ?',
  )
    .bind(user.id)
    .first();
  if (!row || row.expires_at < now || row.tries >= CODE_TRIES) return bad();
  const code = String(body.code ?? '').replace(/\D/g, '');
  if (!safeEqual(await sha256Hex(`${user.id}:${code}`), row.code_hash)) {
    await env.DB.prepare('UPDATE email_codes SET tries = tries + 1 WHERE user_id = ?')
      .bind(user.id)
      .run();
    return bad();
  }
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?',
    ).bind(now, user.id),
    env.DB.prepare('DELETE FROM email_codes WHERE user_id = ?').bind(user.id),
  ]);
  const cookie = await startSession(env, user.id, now);
  return json({ ok: true, role: user.role }, 200, { 'Set-Cookie': cookie });
}

/** POST /api/auth/resend { email } : a new code for an unconfirmed account. Always the same answer. */
export async function resendCode(request, env, now = Date.now()) {
  if (!(await allowed(env.SIGNUP_PER_IP, clientIp(request)))) {
    return fail(429, 'Too many tries just now. Please wait a minute and try again.');
  }
  const body = (await readJson(request)) ?? {};
  const user = await env.DB.prepare(
    `SELECT id, email FROM users WHERE email = ? AND email_verified_at IS NULL
     AND (password_hash IS NOT NULL OR EXISTS (SELECT 1 FROM oauth_identities WHERE user_id = users.id))`,
  )
    .bind(normaliseEmail(body.email))
    .first();
  let extra = {};
  if (user) {
    const code = await issueCode(env, user.id, now);
    await sendCode(env, user.email, code);
    extra = devCode(request, env, code);
  }
  return json({ ok: true, ...extra });
}

/** POST /api/auth/forgot { email } : a one-hour reset link by email. Always the same answer. */
export async function forgot(request, env, now = Date.now()) {
  if (!(await allowed(env.SIGNUP_PER_IP, clientIp(request)))) {
    return fail(429, 'Too many tries just now. Please wait a minute and try again.');
  }
  const body = (await readJson(request)) ?? {};
  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(normaliseEmail(body.email))
    .first();
  if (user) {
    const link = await createInvite(env, user.id, new URL(request.url).origin, now, RESET_MS);
    await sendToPerson(env, {
      to: user.email,
      subject: 'Reset your Hu/man password',
      text: `Choose a new password here (the link works once, for an hour):\n\n${link}\n\nIf you didn't ask for this, ignore this email: your password stays the same.`,
    });
  }
  return json({ ok: true });
}

/** POST /api/auth/logout */
export async function logout(request, env) {
  const session = await getSession(request, env);
  if (session) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}

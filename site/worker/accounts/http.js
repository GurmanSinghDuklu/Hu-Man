/**
 * Shared request and response helpers for the client accounts API: JSON replies with the headers
 * every API reply carries, the same-origin check for changes, the session cookie, and looking up
 * who is logged in.
 */
import { newToken, sha256Hex } from './crypto.js';

export const COOKIE = '__Host-hm_session';
export const SESSION_DAYS = 30;
const DAY = 24 * 3600 * 1000;

/** A JSON reply. Never cached, never indexed. */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

/** An error reply: { ok: false, error, ...extra }. */
export const fail = (status, error, extra = {}) => json({ ok: false, error, ...extra }, status);
export const notFound = () => fail(404, 'Not found.');

/** Changes (anything but GET and HEAD) must come from a page on this same site (CSRF). */
export function sameOrigin(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return true;
  return request.headers.get('Origin') === new URL(request.url).origin;
}

/** Reads a JSON object body (at most `max` bytes); anything else becomes {}. */
export async function readJson(request, max = 128 * 1024) {
  const text = await request.text();
  if (text.length > max) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}

/** A trimmed one-line string, capped at `max` characters (control characters removed). */
export const line = (value, max = 200) =>
  String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .trim()
    .slice(0, max);

export const sessionCookie = (token) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 3600}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function tokenFrom(request) {
  const cookies = request.headers.get('Cookie') ?? '';
  for (const part of cookies.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return null;
}

/** Starts a session for a user; returns the Set-Cookie header value. */
export async function startSession(env, userId, now = Date.now()) {
  const token = newToken();
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    ).bind(await sha256Hex(token), userId, now + SESSION_DAYS * DAY, now),
    // For the 12-month clean-up of unused accounts (cleanup.js).
    env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, userId),
  ]);
  return sessionCookie(token);
}

/** The logged-in user ({ id, email, name, role }) and their session's hash, or null. */
export async function getSession(request, env, now = Date.now()) {
  const token = tokenFrom(request);
  if (!token || token.length > 100) return null;
  const tokenHash = await sha256Hex(token);
  const user = await env.DB.prepare(
    `SELECT users.id, users.email, users.name, users.role FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
  )
    .bind(tokenHash, now)
    .first();
  return user ? { user, tokenHash } : null;
}

/** The address a request came from, for rate limits. */
export const clientIp = (request) => request.headers.get('CF-Connecting-IP') ?? 'unknown';

/** True when a Cloudflare rate-limit binding (if set up) lets this key through. */
export async function allowed(binding, key) {
  if (!binding) return true;
  const { success } = await binding.limit({ key });
  return success;
}

/**
 * The site's own "Page not found" (404, never cached), for pages that exist only for some people:
 * /admin/ and /preview/. Asks the static files for a path that doesn't exist, so it's the real 404
 * page in the site's look.
 */
export async function notFoundPage(env, url) {
  const page = await env.ASSETS.fetch(
    new Request(new URL('/__not-found__/', url), { method: 'GET' }),
  );
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex');
  headers.set('Vary', 'Cookie');
  return new Response(page.body, { status: 404, headers });
}

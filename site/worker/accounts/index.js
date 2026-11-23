/**
 * The client accounts API (docs/superpowers/specs/2026-11-23-client-accounts-design.md):
 *   /api/auth/*     setup links, login, logout (no session needed)
 *   /api/account/*  the logged-in client's own projects, brief and files
 *   /api/admin/*    admins only: clients, setup links, briefs
 * handleAccounts returns null for any other path, so worker/index.js can carry on.
 *
 * Every change must come from this same site (Origin check). Anything a user may not see answers
 * 404, never 403, so ids can't be probed. Free of Cloudflare-only imports, so it runs in Node tests;
 * the email class comes in on env.EmailMessage (worker/index.js sets it).
 */
import { fail, notFound, sameOrigin, getSession } from './http.js';
import { setupInfo, setup, login, logout } from './auth.js';
import { me } from './account.js';

const PREFIXES = ['/api/auth/', '/api/account/', '/api/admin/'];

export async function handleAccounts(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  if (!PREFIXES.some((p) => `${path}/`.startsWith(p))) return null;
  if (!sameOrigin(request)) return fail(403, 'This request has to come from the website itself.');

  const { method } = request;
  if (path === '/api/auth/setup' && method === 'GET') return setupInfo(url, env);
  if (path === '/api/auth/setup' && method === 'POST') return setup(request, env);
  if (path === '/api/auth/login' && method === 'POST') return login(request, env);
  if (path === '/api/auth/logout' && method === 'POST') return logout(request, env);

  const session = await getSession(request, env);
  if (!session) return fail(401, 'Please log in.');
  const { user } = session;

  if (path === '/api/account/me' && method === 'GET') return me(env, user);

  return notFound();
}

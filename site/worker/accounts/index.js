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
import { fail, notFound, sameOrigin, getSession, notFoundPage } from './http.js';
import { setupInfo, setup, login, logout, signup, verify, resendCode, forgot } from './auth.js';
import { me, deleteMe } from './account.js';
import { saveRequest, getRequest, sendRequest } from './requests.js';
import { readCv } from './cvread.js';
import { getBrief, putBrief, sendBrief } from './briefs.js';
import { uploadFile, downloadFile, deleteFile } from './files.js';
import { listEnquiries, setEnquiryStatus, deleteEnquiry } from './enquiries.js';
import { setMoney, setDeposit, markPaid, markLive, pay } from './payments.js';
import {
  listClients,
  createClient,
  clientDetail,
  newInvite,
  reopenBrief,
  deleteClient,
} from './admin.js';

const PREFIXES = ['/api/auth/', '/api/account/', '/api/admin/'];

/**
 * The admin pages (/admin/…) only exist for admins: anyone else, logged in or not, gets the site's
 * own "Page not found" with a 404, so the dashboard's address gives nothing away. wrangler.toml
 * sends /admin and /admin/* to the Worker first so this runs before any static file. Never cached,
 * so an admin's copy can't be served to someone else. Returns null for every other path.
 */
export async function gateAdminPages(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return null;
  const session = await getSession(request, env);
  if (session?.user.role !== 'admin') return notFoundPage(env, url);
  const page = await env.ASSETS.fetch(request);
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex');
  headers.set('Vary', 'Cookie');
  return new Response(page.body, { status: page.status, headers });
}

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
  if (path === '/api/auth/signup' && method === 'POST') return signup(request, env);
  if (path === '/api/auth/verify' && method === 'POST') return verify(request, env);
  if (path === '/api/auth/resend' && method === 'POST') return resendCode(request, env);
  if (path === '/api/auth/forgot' && method === 'POST') return forgot(request, env);

  const session = await getSession(request, env);
  // The admin API, like the admin pages, doesn't admit to existing for anyone but an admin.
  if (!session) return path.startsWith('/api/admin/') ? notFound() : fail(401, 'Please log in.');
  const { user } = session;

  if (path === '/api/account/me' && method === 'GET') return me(env, user);
  if (path === '/api/account/me' && method === 'DELETE') return deleteMe(env, user);
  if (path === '/api/account/request' && method === 'POST') return saveRequest(request, env, user);
  if (path === '/api/account/request' && method === 'GET') return getRequest(url, env, user);
  if (path === '/api/account/cv/read' && method === 'POST') return readCv(request, env, user);
  if (path === '/api/account/request/send' && method === 'POST') {
    return sendRequest(request, url, env, user);
  }
  if (path === '/api/account/brief' && method === 'GET') return getBrief(url, env, user);
  if (path === '/api/account/brief' && method === 'PUT') return putBrief(request, url, env, user);
  if (path === '/api/account/brief/send' && method === 'POST') {
    return sendBrief(request, url, env, user);
  }
  if (path === '/api/account/pay' && method === 'POST') return pay(url, env, user);
  if (path === '/api/account/files' && method === 'POST') {
    return uploadFile(request, url, env, user);
  }
  const fileId = path.match(/^\/api\/account\/files\/([^/]+)$/)?.[1];
  if (fileId && method === 'GET') return downloadFile(env, user, fileId);
  if (fileId && method === 'DELETE') return deleteFile(env, user, fileId);

  if (path.startsWith('/api/admin/')) {
    if (user.role !== 'admin') return notFound();
    const parts = path.split('/').slice(3); // after /api/admin/
    const id = parts[1];
    if (parts[0] === 'enquiries') {
      if (parts.length === 1 && method === 'GET') return listEnquiries(env);
      if (parts.length === 2 && method === 'POST') return setEnquiryStatus(request, env, id);
      if (parts.length === 2 && method === 'DELETE') return deleteEnquiry(env, id);
    }
    if (parts[0] === 'clients') {
      if (parts.length === 1 && method === 'GET') return listClients(env);
      if (parts.length === 1 && method === 'POST') return createClient(request, env, url.origin);
      if (parts.length === 2 && method === 'GET') return clientDetail(env, id);
      if (parts.length === 2 && method === 'DELETE') return deleteClient(env, id);
      if (parts.length === 3 && parts[2] === 'invite' && method === 'POST') {
        return newInvite(env, id, url.origin);
      }
    }
    if (parts[0] === 'projects' && parts.length === 3 && method === 'POST') {
      if (parts[2] === 'money') return setMoney(request, env, id);
      if (parts[2] === 'deposit') return setDeposit(request, env, id);
      if (parts[2] === 'paid') return markPaid(request, env, id);
      if (parts[2] === 'live') return markLive(request, env, id);
    }
    if (
      parts[0] === 'projects' &&
      parts[2] === 'reopen' &&
      parts.length === 3 &&
      method === 'POST'
    ) {
      return reopenBrief(env, id);
    }
  }

  return notFound();
}

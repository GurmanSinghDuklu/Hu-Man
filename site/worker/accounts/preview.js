/**
 * The client's preview of the site we built for them, at /preview/<projectId>/… (in
 * run_worker_first). Files come from the private R2 store, preview/<projectId>/<version>/<path>, the
 * version the upload last switched to (upload.js). Only the project's client and admins see it;
 * anyone else gets the site's own 404 page, as for /admin/.
 *
 * Every HTML page gets a noindex meta, loses any meta CSP (so our bar can render), and gains a bar at
 * the bottom: "Preview for <name> · not live yet" (after payment: "Paid · going live soon"). Nothing
 * is cached, and it can't be framed by other sites.
 */
import { getSession, notFoundPage } from './http.js';
import { projectFor } from './account.js';

const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
};

const extOf = (path) => (path.match(/\.([a-z0-9]+)$/i) ?? [])[1]?.toLowerCase() ?? '';
export const typeFor = (path) => TYPES[extOf(path)] ?? 'application/octet-stream';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Adds noindex, removes any meta CSP, and adds the preview bar. */
export function decorate(html, { name, paid }) {
  const label = paid
    ? `Preview for ${escapeHtml(name)} · paid, going live soon`
    : `Preview for ${escapeHtml(name)} · not live yet`;
  const bar =
    '<div aria-hidden="true" style="height:52px"></div>' +
    '<div id="hm-preview-bar" role="note" style="position:fixed;left:0;right:0;bottom:0;' +
    'z-index:2147483647;display:flex;flex-wrap:wrap;gap:4px 16px;align-items:center;' +
    'justify-content:center;padding:10px 16px;background:#0B0D0A;color:#F2F2EC;' +
    'border-top:3px solid #39FF14;font:500 14px/1.4 system-ui,-apple-system,sans-serif">' +
    `<span>${label}</span>` +
    '<a href="/account/" style="color:#39FF14;text-decoration:underline">Back to your account</a>' +
    '</div>';
  let out = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
  const robots = '<meta name="robots" content="noindex,nofollow">';
  out = /<head[^>]*>/i.test(out)
    ? out.replace(/<head[^>]*>/i, (m) => `${m}${robots}`)
    : robots + out;
  const close = out.toLowerCase().lastIndexOf('</body>');
  return close === -1 ? out + bar : out.slice(0, close) + bar + out.slice(close);
}

const HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "frame-ancestors 'self'",
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Cookie',
};

/** Serves /preview/<projectId>/…, or returns null for any other path. */
export async function servePreview(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/preview\/([^/]+)(\/.*)?$/);
  if (!match) return null;
  const [, projectId, rest] = match;

  const session = await getSession(request, env);
  const project = session ? await projectFor(env, session.user, projectId) : null;
  if (!project?.preview_version) return notFoundPage(env, url);
  if (rest === undefined) {
    return new Response(null, {
      status: 301,
      headers: { ...HEADERS, Location: `/preview/${projectId}/` },
    });
  }

  let path;
  try {
    path = decodeURIComponent(rest.slice(1));
  } catch {
    return notFoundPage(env, url);
  }
  if (path.split('/').some((part) => part === '..')) return notFoundPage(env, url);
  if (path === '' || path.endsWith('/')) path += 'index.html';
  const prefix = `preview/${projectId}/${project.preview_version}/`;
  const object = await env.FILES.get(prefix + path);
  if (!object) {
    // /about → /about/ when it's a folder with an index page.
    if (!extOf(path) && (await env.FILES.get(`${prefix}${path}/index.html`))) {
      return new Response(null, {
        status: 301,
        headers: { ...HEADERS, Location: `${url.pathname}/` },
      });
    }
    return notFoundPage(env, url);
  }

  const type = typeFor(path);
  if (!type.startsWith('text/html')) {
    return new Response(object.body, { headers: { ...HEADERS, 'Content-Type': type } });
  }
  const owner = await env.DB.prepare('SELECT name FROM users WHERE id = ?')
    .bind(project.user_id)
    .first('name');
  const html = decorate(await new Response(object.body).text(), {
    name: owner ?? 'you',
    paid: Boolean(project.paid_at),
  });
  return new Response(html, { headers: { ...HEADERS, 'Content-Type': type } });
}

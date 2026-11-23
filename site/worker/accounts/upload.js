/**
 * The preview upload API that `npm run preview-upload` (scripts/preview-upload.mjs) talks to. Not for
 * browsers: it's authorised by `Authorization: Bearer <token>` matching the Worker secret
 * PREVIEW_UPLOAD_TOKEN, and answers 404 to anything else, including when no secret is set.
 *
 *   POST /api/upload/preview/start   { email, projectId? }  → { projectId, version, basePath }
 *   PUT  /api/upload/preview/<projectId>/<version>/<path>    (the file's bytes, ≤ 25 MB)
 *   POST /api/upload/preview/finish  { projectId, version, count }
 *
 * Files go to R2 under preview/<projectId>/<version>/. Finish checks they all arrived (and that
 * there's an index.html), switches the project to the new version in one step, then deletes every
 * older version, so the client never sees half an update.
 */
import { json, fail, notFound, readJson, line } from './http.js';
import { safeEqual } from './crypto.js';
import { normaliseEmail } from './auth.js';
import { typeFor } from './preview.js';

const PREFIX = '/api/upload/preview/';
const MAX_BYTES = 25 * 1024 * 1024;
const VERSION = /^v\d{13}-[a-z0-9]{6}$/;

function goodPath(path) {
  if (!path || path.length > 300 || path.startsWith('/') || path.includes('\\')) return false;
  return path.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

/** Every key under a prefix (R2 lists 1,000 at a time). */
async function keysUnder(env, prefix) {
  const keys = [];
  let cursor;
  do {
    const page = await env.FILES.list({ prefix, cursor });
    keys.push(...page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
}

async function project(env, id) {
  if (typeof id !== 'string' || !id || id.length > 64) return null;
  return env.DB.prepare('SELECT id, name FROM projects WHERE id = ?').bind(id).first();
}

export async function handlePreviewUpload(request, env, now = Date.now()) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(PREFIX)) return null;
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!env.PREVIEW_UPLOAD_TOKEN || !safeEqual(token, env.PREVIEW_UPLOAD_TOKEN)) return notFound();
  const rest = url.pathname.slice(PREFIX.length);

  if (rest === 'start' && request.method === 'POST') {
    const body = (await readJson(request)) ?? {};
    const user = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND role = 'client'")
      .bind(normaliseEmail(body.email))
      .first();
    if (!user) return fail(404, 'No client with that email.');
    const { results } = await env.DB.prepare(
      'SELECT id, name FROM projects WHERE user_id = ? ORDER BY created_at',
    )
      .bind(user.id)
      .all();
    const chosen = body.projectId
      ? results.find((p) => p.id === body.projectId)
      : results.length === 1
        ? results[0]
        : null;
    if (!chosen) {
      return fail(409, 'Say which project with --project <id>.', {
        projects: results.map((p) => ({ id: p.id, name: p.name })),
      });
    }
    const version = `v${now}-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`;
    return json({
      ok: true,
      projectId: chosen.id,
      name: chosen.name,
      version,
      basePath: `/preview/${chosen.id}/`,
    });
  }

  if (rest === 'finish' && request.method === 'POST') {
    const body = (await readJson(request)) ?? {};
    const found = await project(env, body.projectId);
    if (!found || !VERSION.test(String(body.version))) return notFound();
    const prefix = `preview/${found.id}/${body.version}/`;
    const keys = await keysUnder(env, prefix);
    if (keys.length !== Number(body.count) || !keys.includes(`${prefix}index.html`)) {
      return fail(
        409,
        `Only ${keys.length} of ${Number(body.count)} files arrived, or there's no index.html. Nothing was switched.`,
      );
    }
    await env.DB.prepare('UPDATE projects SET preview_version = ?, preview_at = ? WHERE id = ?')
      .bind(body.version, now, found.id)
      .run();
    const old = (await keysUnder(env, `preview/${found.id}/`)).filter((k) => !k.startsWith(prefix));
    for (let i = 0; i < old.length; i += 1000) await env.FILES.delete(old.slice(i, i + 1000));
    return json({
      ok: true,
      files: keys.length,
      removed: old.length,
      url: `${url.origin}/preview/${found.id}/`,
    });
  }

  const put = rest.match(/^([^/]+)\/([^/]+)\/(.+)$/);
  if (put && request.method === 'PUT') {
    const [, projectId, version] = put;
    let path;
    try {
      path = decodeURIComponent(put[3]);
    } catch {
      return fail(400, 'Bad file path.');
    }
    if (!(await project(env, projectId)) || !VERSION.test(version)) return notFound();
    if (!goodPath(path)) return fail(400, 'Bad file path.');
    if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES)
      return fail(413, 'Over 25 MB.');
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > MAX_BYTES) return fail(413, 'Over 25 MB.');
    await env.FILES.put(`preview/${projectId}/${version}/${path}`, bytes, {
      httpMetadata: { contentType: typeFor(path) },
    });
    return json({ ok: true, path: line(path, 300) }, 201);
  }
  return notFound();
}

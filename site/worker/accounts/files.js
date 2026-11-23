/**
 * Brief uploads, kept in a private R2 bucket (binding FILES); every download goes through here.
 *
 * Upload: POST /api/account/files?p=<project>&field=<files field> with the file itself as the body
 * and its name in X-File-Name (URI-encoded). The type is decided by the file's first bytes, never
 * its name or the browser's word for it: JPG, PNG, WebP, SVG or PDF only. 10 MB each, 20 per
 * project, and at most 10 uploads a minute per user (rate-limit binding UPLOAD_PER_USER).
 * Download: owner or admin. SVG and PDF always download as attachments, so an SVG's script can never
 * run on our site; every file is served with nosniff and a sandboxing CSP.
 */
import { json, fail, notFound, line, allowed } from './http.js';
import { projectFor } from './account.js';
import { fileFieldsFor } from '../../src/data/brief.ts';

export const MAX_BYTES = 10 * 1024 * 1024;
const REQUEST_FIELDS = ['cv', 'image'];
/** Pictures shown on a built portfolio: never SVG (it can carry script). */
export const PICTURES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_FILES = 20;
const ATTACH = new Set([
  'image/svg+xml',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const starts = (bytes, sig, at = 0) => sig.every((b, i) => bytes[at + i] === b);
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

/** The file's real type from its first bytes, or null. */
export function sniff(bytes) {
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (starts(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts(bytes, ascii('RIFF')) && starts(bytes, ascii('WEBP'), 8)) return 'image/webp';
  if (starts(bytes, ascii('%PDF-'))) return 'application/pdf';
  // A Word document is a zip whose parts include word/document.xml.
  if (
    starts(bytes, [0x50, 0x4b, 0x03, 0x04]) &&
    new TextDecoder().decode(bytes).includes('word/')
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  // TextDecoder drops a leading byte-order mark itself.
  const head = new TextDecoder().decode(bytes.subarray(0, 1024)).trimStart();
  if (
    (head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<!--')) &&
    head.includes('<svg')
  ) {
    return 'image/svg+xml';
  }
  return null;
}

/** A safe display name: no folders, no control characters. */
const cleanName = (raw) => {
  let name;
  try {
    name = decodeURIComponent(raw ?? '');
  } catch {
    name = '';
  }
  return line(name.split(/[\\/]/).pop(), 120) || 'file';
};

async function editable(env, user, projectId) {
  const project = await projectFor(env, user, projectId);
  if (!project || project.user_id !== user.id) return null;
  const state = await env.DB.prepare('SELECT state FROM briefs WHERE project_id = ?')
    .bind(project.id)
    .first('state');
  return { project, sent: state === 'sent' };
}

/** POST /api/account/files?p=&field= */
export async function uploadFile(request, url, env, user, now = Date.now()) {
  const found = await editable(env, user, url.searchParams.get('p'));
  if (!found) return notFound();
  const { project, sent } = found;
  const field = url.searchParams.get('field') ?? '';
  // Portfolio requests take their CV and pictures for the design (photo, project screenshots).
  const isRequest = project.kind === 'request';
  if (!(isRequest ? REQUEST_FIELDS : fileFieldsFor(project.type)).includes(field)) {
    return fail(400, 'Unknown upload.');
  }
  // An instant portfolio can be edited and rebuilt after sending, pictures included.
  const rebuilding = isRequest && project.route === 'instant' && field === 'image';
  if (sent && !rebuilding) {
    return fail(409, 'This brief has been sent. Ask us if you need to add files.');
  }
  if (!(await allowed(env.UPLOAD_PER_USER, user.id))) {
    return fail(429, 'Lots of uploads at once. Please wait a minute and carry on.');
  }
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES) {
    return fail(413, 'Files can be up to 10 MB each.');
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return fail(413, 'Files can be up to 10 MB each.');
  if (bytes.length === 0) return fail(400, 'That file is empty.');
  const type = sniff(bytes);
  if (!type) return fail(415, 'Please upload a JPG, PNG, WebP, SVG, PDF or Word (.docx) file.');
  if (field === 'image' && !PICTURES.has(type)) {
    return fail(415, 'Please upload a JPG, PNG or WebP picture.');
  }
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM files WHERE project_id = ?')
    .bind(project.id)
    .first('n');
  if (count >= MAX_FILES)
    return fail(409, `You can upload up to ${MAX_FILES} files. Remove one to add another.`);

  const file = {
    id: crypto.randomUUID(),
    field,
    name: cleanName(request.headers.get('X-File-Name')),
    type,
    size: bytes.length,
  };
  const key = `project/${project.id}/${file.id}`;
  await env.FILES.put(key, bytes, { httpMetadata: { contentType: type } });
  await env.DB.prepare(
    'INSERT INTO files (id, project_id, field, r2_key, name, type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(file.id, project.id, field, key, file.name, type, file.size, now)
    .run();
  return json({ ok: true, file }, 201);
}

async function fileFor(env, user, id) {
  if (typeof id !== 'string' || !id || id.length > 64) return null;
  const file = await env.DB.prepare(
    'SELECT id, project_id, r2_key, name, type FROM files WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!file) return null;
  const project = await projectFor(env, user, file.project_id);
  return project ? { file, project } : null;
}

/** GET /api/account/files/<id> */
export async function downloadFile(env, user, id) {
  const found = await fileFor(env, user, id);
  if (!found) return notFound();
  const object = await env.FILES.get(found.file.r2_key);
  if (!object) return notFound();
  const disposition = ATTACH.has(found.file.type) ? 'attachment' : 'inline';
  return new Response(object.body, {
    headers: {
      'Content-Type': found.file.type,
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(found.file.name)}`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/** DELETE /api/account/files/<id> : the owner, until the brief is sent. */
export async function deleteFile(env, user, id) {
  const found = await fileFor(env, user, id);
  if (!found || found.project.user_id !== user.id) return notFound();
  const state = await env.DB.prepare('SELECT state FROM briefs WHERE project_id = ?')
    .bind(found.project.id)
    .first('state');
  if (state === 'sent')
    return fail(409, 'This brief has been sent. Ask us if you need to remove a file.');
  await env.FILES.delete(found.file.r2_key);
  await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(found.file.id).run();
  return json({ ok: true });
}

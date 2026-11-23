/**
 * Puts a client's built site into their preview (spec:
 * docs/superpowers/specs/2026-11-23-preview-and-payment-design.md).
 *
 *   npm run preview-upload -- <client email> <built folder> [--project <id>] [--local]
 *   npm run preview-upload -- <client email> --base [--project <id>] [--local]
 *
 * --base only prints the base path to build with (for Astro: `base: '/preview/<id>'`), uploading
 * nothing. Uploads go to the live site unless --local (wrangler dev on localhost:8787).
 *
 * The token comes from PREVIEW_UPLOAD_TOKEN, or the file ~/.hu-man/preview-token (one line). It
 * must match the Worker secret of the same name (docs/10-launch.md). Files upload six at a time;
 * the client only sees the new version once every file has arrived.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { productionUrl } from '../src/config/domain.ts';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--project');
const [email, folder] = positional;
const origin = flag('--local') ? 'http://localhost:8787' : productionUrl;
const onlyBase = flag('--base');

if (!email || (!folder && !onlyBase)) {
  console.error(
    'Usage: npm run preview-upload -- <client email> <built folder> [--project <id>] [--local]',
  );
  console.error(
    '       npm run preview-upload -- <client email> --base   (prints the base path to build with)',
  );
  process.exit(1);
}

const token =
  process.env.PREVIEW_UPLOAD_TOKEN ??
  (await readFile(join(homedir(), '.hu-man', 'preview-token'), 'utf8').catch(() => '')).trim();
if (!token) {
  console.error('No upload token. Put it in ~/.hu-man/preview-token (see docs/10-launch.md).');
  process.exit(1);
}

const api = (path, init = {}) =>
  fetch(`${origin}/api/upload/preview/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });

const startRes = await api('start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, projectId: option('--project') }),
});
const start = await startRes.json().catch(() => ({}));
if (!startRes.ok) {
  console.error(
    startRes.status === 404 && !start.error
      ? 'Not found: check the token and the address.'
      : start.error,
  );
  for (const p of start.projects ?? []) console.error(`  --project ${p.id}   ${p.name}`);
  process.exit(1);
}
console.log(`\n${start.name}: build with base path ${start.basePath}`);
console.log(
  `(Astro: base: '${start.basePath.replace(/\/$/, '')}', or relative links throughout.)\n`,
);
if (onlyBase) process.exit(0);

// Every file in the folder.
const root = resolve(folder);
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}
if (!(await stat(root).catch(() => null))?.isDirectory()) {
  console.error(`Not a folder: ${root}`);
  process.exit(1);
}
const files = await walk(root);
const paths = files.map((f) => relative(root, f).split(sep).join('/'));
if (!paths.includes('index.html')) {
  console.error(
    'The folder has no index.html at its top. Point it at the built output (e.g. dist/).',
  );
  process.exit(1);
}

// Links that would break under /preview/<id>/: root-absolute ones that skip the base path.
let warnings = 0;
for (const [i, file] of files.entries()) {
  if (!paths[i].endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  for (const [, attr, value] of html.matchAll(/\b(href|src)="(\/[^"]*)"/g)) {
    if (value.startsWith('//') || value.startsWith(start.basePath)) continue;
    if (warnings++ < 10)
      console.warn(`  ! ${paths[i]}: ${attr}="${value}" won't work in the preview`);
  }
}
if (warnings) {
  console.warn(
    `\n${warnings} link(s) skip the base path. Rebuild with base ${start.basePath} to fix them.\n`,
  );
}

// Upload, six at a time.
let done = 0;
let failed = 0;
const queue = paths.map((path, i) => ({ path, file: files[i] }));
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const body = await readFile(item.file);
    const encoded = item.path.split('/').map(encodeURIComponent).join('/');
    const res = await api(`${start.projectId}/${start.version}/${encoded}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body,
    });
    if (res.ok) done++;
    else {
      failed++;
      console.error(
        `  x ${item.path}: ${(await res.json().catch(() => ({}))).error ?? res.status}`,
      );
    }
    process.stdout.write(`\r  Uploaded ${done} of ${paths.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
process.stdout.write('\n');
if (failed) {
  console.error(`${failed} file(s) failed. Nothing was switched: run it again.`);
  process.exit(1);
}

const finishRes = await api('finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId: start.projectId, version: start.version, count: paths.length }),
});
const finish = await finishRes.json().catch(() => ({}));
if (!finishRes.ok) {
  console.error(finish.error ?? `Finish failed (${finishRes.status}).`);
  process.exit(1);
}
console.log(`\nPreview is up for the client (and you): ${origin}${start.basePath}`);
console.log(`${finish.files} files; ${finish.removed} old file(s) removed.\n`);

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const WEBP = new Uint8Array(
  [...'RIFF']
    .map((c) => c.charCodeAt(0))
    .concat(
      [0, 0, 0, 0],
      [...'WEBP'].map((c) => c.charCodeAt(0)),
    ),
);
const PDF = new TextEncoder().encode('%PDF-1.7\n...');
const SVG = new TextEncoder().encode(
  '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>',
);
const TXT = new TextEncoder().encode('just some text');

async function setUp() {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const created = await (
    await call(env, 'POST', '/api/admin/clients', {
      cookie: admin,
      body: { name: 'Noor', email: 'noor@example.co.uk', project: { type: 'portfolio' } },
    })
  ).json();
  const token = new URL(created.setupUrl).searchParams.get('t');
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Noor', password: 'a long enough password' },
  });
  return {
    env,
    admin,
    client: setup.headers.get('Set-Cookie').split(';')[0],
    projectId: created.projectId,
  };
}

const upload = (env, cookie, projectId, bytes, name, field = 'photos') =>
  call(env, 'POST', `/api/account/files?p=${projectId}&field=${field}`, {
    cookie,
    body: bytes,
    headers: {
      'X-File-Name': encodeURIComponent(name),
      'Content-Type': 'application/octet-stream',
    },
  });

test('images and PDFs are stored by what their bytes are, not their name', async () => {
  const { env, client, projectId } = await setUp();
  const types = [];
  for (const [bytes, name] of [
    [PNG, 'logo.png'],
    [JPG, 'me.jpg'],
    [WEBP, 'shot.webp'],
    [SVG, 'mark.svg'],
    [PDF, 'cv.png'],
  ]) {
    const res = await upload(env, client, projectId, bytes, name);
    assert.equal(res.status, 201, name);
    types.push((await res.json()).file.type);
  }
  assert.deepEqual(types, [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
  ]);
  assert.equal((await upload(env, client, projectId, TXT, 'notes.png')).status, 415);
  assert.equal((await upload(env, client, projectId, PNG, 'x.png', 'notAField')).status, 400);
  assert.equal((await upload(env, client, projectId, PNG, 'x.png', 'brandFiles')).status, 201);
});

test('size and count limits hold', async () => {
  const { env, client, projectId } = await setUp();
  const big = new Uint8Array(10 * 1024 * 1024 + 1);
  big.set(PNG);
  assert.equal((await upload(env, client, projectId, big, 'big.png')).status, 413);
  for (let i = 0; i < 20; i++) {
    assert.equal((await upload(env, client, projectId, PNG, `${i}.png`)).status, 201);
  }
  assert.equal((await upload(env, client, projectId, PNG, '21.png')).status, 409);
});

test('downloads: owner and admins only; SVG and PDF always download, never render', async () => {
  const { env, admin, client, projectId } = await setUp();
  const svg = (await (await upload(env, client, projectId, SVG, 'mark.svg')).json()).file;
  const png = (await (await upload(env, client, projectId, PNG, 'logo.png')).json()).file;

  const mine = await call(env, 'GET', `/api/account/files/${svg.id}`, { cookie: client });
  assert.equal(mine.status, 200);
  assert.equal(mine.headers.get('Content-Type'), 'image/svg+xml');
  assert.match(
    mine.headers.get('Content-Disposition'),
    /^attachment; filename\*=UTF-8''mark\.svg$/,
  );
  assert.equal(mine.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(new Uint8Array(await mine.arrayBuffer()).length, SVG.length);

  const pngRes = await call(env, 'GET', `/api/account/files/${png.id}`, { cookie: admin });
  assert.equal(pngRes.status, 200);
  assert.match(pngRes.headers.get('Content-Disposition'), /^inline/);

  const other = await loggedIn(env, 'other@example.co.uk');
  assert.equal(
    (await call(env, 'GET', `/api/account/files/${svg.id}`, { cookie: other })).status,
    404,
  );
  assert.equal((await upload(env, other, projectId, PNG, 'x.png')).status, 404);
  assert.equal(
    (await call(env, 'DELETE', `/api/account/files/${png.id}`, { cookie: other })).status,
    404,
  );
});

test('a client can delete a file until the brief is sent', async () => {
  const { env, client, projectId } = await setUp();
  const a = (await (await upload(env, client, projectId, PNG, 'a.png')).json()).file;
  const b = (await (await upload(env, client, projectId, PNG, 'b.png')).json()).file;
  assert.equal(
    (await call(env, 'DELETE', `/api/account/files/${a.id}`, { cookie: client })).status,
    200,
  );
  assert.equal(env.FILES.store.size, 1);
  assert.equal(
    (await call(env, 'GET', `/api/account/files/${a.id}`, { cookie: client })).status,
    404,
  );
  await env.DB.prepare("UPDATE briefs SET state = 'sent'").run();
  assert.equal(
    (await call(env, 'DELETE', `/api/account/files/${b.id}`, { cookie: client })).status,
    409,
  );
  assert.equal((await upload(env, client, projectId, PNG, 'c.png')).status, 409);
});

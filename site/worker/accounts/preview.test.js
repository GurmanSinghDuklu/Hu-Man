import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn, cookieFrom, ORIGIN } from './test-env.js';
import { handleAccounts } from './index.js';
import { servePreview } from './preview.js';
import { handlePreviewUpload } from './upload.js';

const TOKEN = 'test-upload-token-0123456789';
const call = (env, ...args) => handleAccounts(req(...args), env);
const up = (env, method, path, { body, token = TOKEN, headers = {} } = {}) =>
  handlePreviewUpload(
    req(method, `/api/upload/preview/${path}`, {
      body,
      origin: null,
      headers: token ? { Authorization: `Bearer ${token}`, ...headers } : headers,
    }),
    env,
  );

function withAssets(env) {
  env.ASSETS = {
    fetch: async () =>
      new Response('<h1>Page not found</h1>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      }),
  };
  env.PREVIEW_UPLOAD_TOKEN = TOKEN;
  return env;
}

/** An admin, and a client called Noor <Haddad> with one portfolio project. */
async function setUp() {
  const env = withAssets(makeEnv());
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const created = await (
    await call(env, 'POST', '/api/admin/clients', {
      cookie: admin,
      body: { name: 'Noor <Haddad>', email: 'noor@example.co.uk', project: { type: 'portfolio' } },
    })
  ).json();
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: {
      token: new URL(created.setupUrl).searchParams.get('t'),
      name: 'Noor <Haddad>',
      password: 'a long enough password',
    },
  });
  return { env, admin, client: cookieFrom(setup), projectId: created.projectId };
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'"><title>Noor</title></head>
<body><h1>Noor's portfolio</h1></body></html>`;

/** Uploads a small site through the upload API and switches to it. */
async function upload(
  env,
  projectId,
  files = { 'index.html': PAGE, 'about/index.html': PAGE, 'css/site.css': 'h1{}' },
) {
  const start = await (
    await up(env, 'POST', 'start', { body: { email: 'noor@example.co.uk' } })
  ).json();
  assert.equal(start.projectId, projectId);
  assert.equal(start.basePath, `/preview/${projectId}/`);
  for (const [path, text] of Object.entries(files)) {
    const res = await up(env, 'PUT', `${projectId}/${start.version}/${path}`, {
      body: new TextEncoder().encode(text),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    assert.equal(res.status, 201, path);
  }
  const finish = await up(env, 'POST', 'finish', {
    body: { projectId, version: start.version, count: Object.keys(files).length },
  });
  assert.equal(finish.status, 200);
  return start.version;
}

const view = (env, path, cookie) => servePreview(req('GET', path, { cookie, origin: null }), env);

test('the upload API needs the secret token, and refuses bad paths', async () => {
  const { env, projectId } = await setUp();
  assert.equal(
    (await up(env, 'POST', 'start', { body: { email: 'noor@example.co.uk' }, token: null })).status,
    404,
  );
  assert.equal(
    (await up(env, 'POST', 'start', { body: { email: 'noor@example.co.uk' }, token: 'wrong' }))
      .status,
    404,
  );
  delete env.PREVIEW_UPLOAD_TOKEN;
  assert.equal(
    (await up(env, 'POST', 'start', { body: { email: 'noor@example.co.uk' } })).status,
    404,
  );
  env.PREVIEW_UPLOAD_TOKEN = TOKEN;
  assert.equal(
    (await up(env, 'POST', 'start', { body: { email: 'nobody@example.co.uk' } })).status,
    404,
  );
  const { version } = await (
    await up(env, 'POST', 'start', { body: { email: 'noor@example.co.uk' } })
  ).json();
  for (const bad of ['../x.html', 'a/../../b.html', '', 'x'.repeat(301)]) {
    const res = await up(env, 'PUT', `${projectId}/${version}/${bad}`, {
      body: new Uint8Array([1]),
    });
    assert.notEqual(res.status, 201, `refused ${bad.slice(0, 20)}`);
  }
  // Finishing with files missing doesn't switch anything.
  await up(env, 'PUT', `${projectId}/${version}/index.html`, {
    body: new TextEncoder().encode(PAGE),
  });
  assert.equal(
    (await up(env, 'POST', 'finish', { body: { projectId, version, count: 2 } })).status,
    409,
  );
});

test('only the client and admins see the preview; everyone else gets the 404 page', async () => {
  const { env, admin, client, projectId } = await setUp();
  // Nothing uploaded yet: not found, even for the owner.
  assert.equal((await view(env, `/preview/${projectId}/`, client)).status, 404);
  await upload(env, projectId);

  const mine = await view(env, `/preview/${projectId}/`, client);
  assert.equal(mine.status, 200);
  assert.equal(mine.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(mine.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(mine.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(mine.headers.get('X-Frame-Options'), 'SAMEORIGIN');
  const html = await mine.text();
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /Preview for Noor &lt;Haddad&gt; · not live yet/);
  assert.match(html, /<h1>Noor's portfolio<\/h1>/);

  assert.equal((await view(env, `/preview/${projectId}/`, admin)).status, 200);
  const other = await loggedIn(env, 'other@example.co.uk');
  for (const cookie of [undefined, other]) {
    const res = await view(env, `/preview/${projectId}/`, cookie);
    assert.equal(res.status, 404);
    assert.match(await res.text(), /Page not found/);
  }
  assert.equal((await view(env, '/preview/not-a-project/', client)).status, 404);
});

test('folders, files and types are served like a normal site', async () => {
  const { env, client, projectId } = await setUp();
  await upload(env, projectId);
  const about = await view(env, `/preview/${projectId}/about/`, client);
  assert.equal(about.status, 200);
  const noSlash = await view(env, `/preview/${projectId}/about`, client);
  assert.equal(noSlash.status, 301);
  assert.equal(noSlash.headers.get('Location'), `/preview/${projectId}/about/`);
  const bare = await view(env, `/preview/${projectId}`, client);
  assert.equal(bare.status, 301);
  const css = await view(env, `/preview/${projectId}/css/site.css`, client);
  assert.equal(css.headers.get('Content-Type'), 'text/css; charset=utf-8');
  assert.equal(await css.text(), 'h1{}');
  assert.equal((await view(env, `/preview/${projectId}/missing.html`, client)).status, 404);
  assert.equal(await servePreview(req('GET', '/about/', { origin: null }), env), null);
});

test('a new upload replaces the old one, and the old files are deleted', async () => {
  const { env, client, projectId } = await setUp();
  const first = await upload(env, projectId);
  const second = await upload(env, projectId, { 'index.html': PAGE.replace("Noor's", 'New') });
  assert.notEqual(first, second);
  assert.match(await (await view(env, `/preview/${projectId}/`, client)).text(), /New portfolio/);
  const keys = [...env.FILES.store.keys()];
  assert.ok(
    keys.every((k) => k.startsWith(`preview/${projectId}/${second}/`)),
    keys.join(', '),
  );
  const me = await (await call(env, 'GET', '/api/account/me', { cookie: client })).json();
  assert.equal(me.projects[0].stage, 'preview');
  assert.equal(me.projects[0].previewPath, `/preview/${projectId}/`);
});

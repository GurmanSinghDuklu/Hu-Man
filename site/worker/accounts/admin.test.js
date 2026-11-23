import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, cookieFrom, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const tokenOf = (url) => new URL(url).searchParams.get('t');

const newClient = {
  name: 'Noor Haddad',
  email: 'noor@example.co.uk',
  project: {
    name: 'Noor’s portfolio',
    type: 'portfolio',
    tier: 'Portfolio: Portfolio',
    concept: 'Noor Haddad',
  },
};

test('clients get 404 from every admin route', async () => {
  const env = makeEnv();
  const client = await loggedIn(env, 'c@example.co.uk', 'client');
  for (const [method, path] of [
    ['GET', '/api/admin/clients'],
    ['POST', '/api/admin/clients'],
    ['GET', '/api/admin/clients/x'],
    ['POST', '/api/admin/clients/x/invite'],
    ['POST', '/api/admin/projects/x/reopen'],
  ]) {
    const res = await call(env, method, path, {
      cookie: client,
      body: method === 'POST' ? {} : undefined,
    });
    assert.equal(res.status, 404, `${method} ${path}`);
  }
});

test('an admin creates a client with a project and gets a working setup link once', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const res = await call(env, 'POST', '/api/admin/clients', { cookie: admin, body: newClient });
  assert.equal(res.status, 201);
  const { client, setupUrl } = await res.json();
  assert.match(
    setupUrl,
    /^https:\/\/humansoftwareagency\.com\/account\/setup\/\?t=[A-Za-z0-9_-]{43}$/,
  );

  const dupe = await call(env, 'POST', '/api/admin/clients', {
    cookie: admin,
    body: { ...newClient, email: 'NOOR@example.co.uk' },
  });
  assert.equal(dupe.status, 409);

  const bad = await call(env, 'POST', '/api/admin/clients', {
    cookie: admin,
    body: { ...newClient, email: 'x@y.co', project: { ...newClient.project, type: 'spaceship' } },
  });
  assert.equal(bad.status, 400);

  const list = await (await call(env, 'GET', '/api/admin/clients', { cookie: admin })).json();
  assert.equal(list.clients.length, 1);
  assert.equal(list.clients[0].projects[0].briefState, 'not-started');
  assert.equal(list.clients[0].projects[0].concept, 'Noor Haddad');
  assert.equal(list.clients[0].hasPassword, false);

  const detail = await (
    await call(env, 'GET', `/api/admin/clients/${client.id}`, { cookie: admin })
  ).json();
  assert.equal(detail.client.email, 'noor@example.co.uk');
  assert.deepEqual(detail.projects[0].answers, {});
  assert.deepEqual(detail.projects[0].files, []);

  // The link works for the client.
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token: tokenOf(setupUrl), name: 'Noor Haddad', password: 'noor’s long password' },
  });
  assert.equal(setup.status, 200);
  const me = await (
    await call(env, 'GET', '/api/account/me', { cookie: cookieFrom(setup) })
  ).json();
  assert.equal(me.projects[0].name, 'Noor’s portfolio');
});

test('a new setup link ends older links and every session of that client', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const { client, setupUrl } = await (
    await call(env, 'POST', '/api/admin/clients', { cookie: admin, body: newClient })
  ).json();
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token: tokenOf(setupUrl), name: 'Noor', password: 'noor’s long password' },
  });
  const clientCookie = cookieFrom(setup);
  const older = await (
    await call(env, 'POST', `/api/admin/clients/${client.id}/invite`, { cookie: admin })
  ).json();
  const fresh = await (
    await call(env, 'POST', `/api/admin/clients/${client.id}/invite`, { cookie: admin })
  ).json();
  assert.equal((await call(env, 'GET', '/api/account/me', { cookie: clientCookie })).status, 401);
  assert.equal(
    (await call(env, 'GET', `/api/auth/setup?t=${tokenOf(older.setupUrl)}`)).status,
    404,
  );
  assert.equal(
    (await call(env, 'GET', `/api/auth/setup?t=${tokenOf(fresh.setupUrl)}`)).status,
    200,
  );
  assert.equal(
    (await call(env, 'POST', '/api/admin/clients/nope/invite', { cookie: admin })).status,
    404,
  );
});

test('an admin can reopen a sent brief', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const { client } = await (
    await call(env, 'POST', '/api/admin/clients', { cookie: admin, body: newClient })
  ).json();
  const detail = await (
    await call(env, 'GET', `/api/admin/clients/${client.id}`, { cookie: admin })
  ).json();
  const projectId = detail.projects[0].id;
  await env.DB.prepare("UPDATE briefs SET state = 'sent', sent_at = 1 WHERE project_id = ?")
    .bind(projectId)
    .run();
  const res = await call(env, 'POST', `/api/admin/projects/${projectId}/reopen`, { cookie: admin });
  assert.equal(res.status, 200);
  const state = await env.DB.prepare('SELECT state FROM briefs WHERE project_id = ?')
    .bind(projectId)
    .first('state');
  assert.equal(state, 'draft');
});

test('deleting a client removes their account, sessions, brief, files and enquiries', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const { handleEnquiry } = await import('../enquiry.js');
  await handleEnquiry(
    req('POST', '/api/enquiry', {
      body: { name: 'Noor', email: 'noor@example.co.uk', message: 'Hi' },
    }),
    env,
    env.EmailMessage,
  );
  const { client, projectId, setupUrl } = await (
    await call(env, 'POST', '/api/admin/clients', { cookie: admin, body: newClient })
  ).json();
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token: tokenOf(setupUrl), name: 'Noor', password: 'noor’s long password' },
  });
  const clientCookie = cookieFrom(setup);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
  await call(env, 'POST', `/api/account/files?p=${projectId}&field=photos`, {
    cookie: clientCookie,
    body: png,
    headers: { 'X-File-Name': 'a.png' },
  });
  assert.equal(env.FILES.store.size, 1);

  // Clients can't delete anyone; admins can't be deleted this way.
  assert.equal(
    (await call(env, 'DELETE', `/api/admin/clients/${client.id}`, { cookie: clientCookie })).status,
    404,
  );
  const adminId = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin'").first('id');
  assert.equal(
    (await call(env, 'DELETE', `/api/admin/clients/${adminId}`, { cookie: admin })).status,
    404,
  );

  const res = await call(env, 'DELETE', `/api/admin/clients/${client.id}`, { cookie: admin });
  assert.equal(res.status, 200);
  assert.equal(env.FILES.store.size, 0, 'uploads removed from storage');
  for (const table of ['users', 'sessions', 'invites', 'projects', 'briefs', 'files']) {
    const where = table === 'users' ? "role = 'client'" : '1 = 1';
    const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).first('n');
    if (table === 'sessions' || table === 'invites') {
      const theirs = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(client.id)
        .first('n');
      assert.equal(theirs, 0, `their ${table}`);
    } else assert.equal(n, 0, table);
  }
  const enquiries = await env.DB.prepare('SELECT COUNT(*) AS n FROM enquiries').first('n');
  assert.equal(enquiries, 0, 'their enquiries');
  assert.equal((await call(env, 'GET', '/api/account/me', { cookie: clientCookie })).status, 401);
  assert.equal(
    (await call(env, 'DELETE', `/api/admin/clients/${client.id}`, { cookie: admin })).status,
    404,
  );
});

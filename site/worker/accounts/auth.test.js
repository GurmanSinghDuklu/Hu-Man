import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, cookieFrom, ORIGIN } from './test-env.js';
import { handleAccounts } from './index.js';
import { createInvite, addUser } from './auth.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const tokenOf = (url) => new URL(url).searchParams.get('t');

async function invited(env, email = 'sam@example.co.uk', role = 'client') {
  const user = await addUser(env, { email, name: 'Sam', role });
  return { user, token: tokenOf(await createInvite(env, user.id, ORIGIN)) };
}

test('a setup link shows its email, sets a password once, and logs the client in', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  const info = await call(env, 'GET', `/api/auth/setup?t=${token}`);
  assert.equal(info.status, 200);
  assert.equal((await info.json()).email, 'sam@example.co.uk');

  const short = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam Patel', password: 'short' },
  });
  assert.equal(short.status, 400);

  const res = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam Patel', password: 'a long enough password' },
  });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('Set-Cookie');
  assert.match(setCookie, /^__Host-hm_session=[A-Za-z0-9_-]{43};/);
  for (const part of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=2592000']) {
    assert.ok(setCookie.includes(part), `cookie lacks ${part}`);
  }
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex');

  const me = await call(env, 'GET', '/api/account/me', { cookie: cookieFrom(res) });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.name, 'Sam Patel');

  // Used up.
  assert.equal((await call(env, 'GET', `/api/auth/setup?t=${token}`)).status, 404);
  const again = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'X', password: 'another long password' },
  });
  assert.equal(again.status, 404);
});

test('an expired or unknown setup link is refused', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  await env.DB.prepare('UPDATE invites SET expires_at = 1').run();
  assert.equal((await call(env, 'GET', `/api/auth/setup?t=${token}`)).status, 404);
  assert.equal((await call(env, 'GET', '/api/auth/setup?t=nope')).status, 404);
});

test('login: right password starts a session, wrong ones get one message, 5 wrong locks', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam', password: 'a long enough password' },
  });

  const ok = await call(env, 'POST', '/api/auth/login', {
    body: { email: ' SAM@example.co.uk ', password: 'a long enough password' },
  });
  assert.equal(ok.status, 200);
  assert.ok(cookieFrom(ok));

  const unknown = await call(env, 'POST', '/api/auth/login', {
    body: { email: 'nobody@example.co.uk', password: 'whatever it is' },
  });
  const wrong = await call(env, 'POST', '/api/auth/login', {
    body: { email: 'sam@example.co.uk', password: 'not the password' },
  });
  assert.equal(unknown.status, 401);
  assert.equal(wrong.status, 401);
  assert.deepEqual(await unknown.json(), await wrong.json());

  for (let i = 0; i < 4; i++) {
    await call(env, 'POST', '/api/auth/login', {
      body: { email: 'sam@example.co.uk', password: 'still wrong!' },
    });
  }
  const locked = await call(env, 'POST', '/api/auth/login', {
    body: { email: 'sam@example.co.uk', password: 'a long enough password' },
  });
  assert.equal(locked.status, 401, 'locked for 15 minutes even with the right password');
});

test('logout ends the session and clears the cookie', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  const res = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam', password: 'a long enough password' },
  });
  const cookie = cookieFrom(res);
  const out = await call(env, 'POST', '/api/auth/logout', { cookie });
  assert.equal(out.status, 200);
  assert.match(out.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await call(env, 'GET', '/api/account/me', { cookie })).status, 401);
});

test('the header’s session check is 200 either way: the user when signed in, null when not', async () => {
  const env = makeEnv();
  const out = await call(env, 'GET', '/api/auth/session');
  assert.equal(out.status, 200);
  assert.deepEqual(await out.json(), { ok: true, user: null });

  const { token } = await invited(env);
  const res = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam Patel', password: 'a long enough password' },
  });
  const signedIn = await call(env, 'GET', '/api/auth/session', { cookie: cookieFrom(res) });
  assert.equal(signedIn.status, 200);
  const body = await signedIn.json();
  assert.deepEqual(body.user, { name: 'Sam Patel', role: 'client' });
  assert.equal(body.user.email, undefined, 'no email on every page');
  assert.equal(signedIn.headers.get('Cache-Control'), 'no-store');
});

test('changes need our own Origin; reads without a session are 401', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  const body = { token, name: 'Sam', password: 'a long enough password' };
  assert.equal((await call(env, 'POST', '/api/auth/setup', { body, origin: null })).status, 403);
  assert.equal(
    (await call(env, 'POST', '/api/auth/setup', { body, origin: 'https://evil.example' })).status,
    403,
  );
  assert.equal((await call(env, 'GET', '/api/account/me')).status, 401);
  assert.equal(await handleAccounts(req('GET', '/api/enquiry'), env), null, 'not ours');
});

test('only setup and login set a cookie; nothing else, and not the enquiry form', async () => {
  const env = makeEnv();
  const { token } = await invited(env);
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam', password: 'a long enough password' },
  });
  const cookie = cookieFrom(setup);
  for (const [method, path] of [
    ['GET', '/api/account/me'],
    ['GET', '/api/auth/setup?t=x'],
    ['GET', '/api/account/brief?p=x'],
    ['GET', '/api/admin/clients'],
  ]) {
    const res = await call(env, method, path, { cookie });
    assert.equal(res.headers.get('Set-Cookie'), null, `${method} ${path}`);
  }
  const { handleEnquiry } = await import('../enquiry.js');
  const enquiry = await handleEnquiry(
    req('POST', '/api/enquiry', { body: { name: 'A', email: 'a@b.co', message: 'Hi' } }),
    env,
    env.EmailMessage,
  );
  assert.equal(enquiry.headers.get('Set-Cookie'), null);
});

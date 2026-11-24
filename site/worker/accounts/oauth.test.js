import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, ORIGIN } from './test-env.js';
import { handleAccounts } from './index.js';
import { toB64url } from './crypto.js';

const MS_CONSUMER = '9188040d-6c67-4c5b-b112-36a304b66dad';
const WORK_TENANT = '11111111-2222-3333-4444-555555555555';

function setUp() {
  const env = makeEnv();
  env.GOOGLE_CLIENT_ID = 'google-id';
  env.GOOGLE_CLIENT_SECRET = 'google-secret';
  env.MICROSOFT_CLIENT_ID = 'ms-id';
  env.MICROSOFT_CLIENT_SECRET = 'ms-secret';
  env.mails = [];
  env.RESEND_API_KEY = 're_test';
  env.RESEND_FETCH = async (_url, init) => {
    const b = JSON.parse(init.body);
    env.mails.push({ to: b.to[0], subject: b.subject });
    return new Response('{}');
  };
  return env;
}

const get = (env, path, cookie) =>
  handleAccounts(
    new Request(`${ORIGIN}${path}`, { headers: cookie ? { Cookie: cookie } : {} }),
    env,
  );
const jwt = (claims) => `e30.${toB64url(new TextEncoder().encode(JSON.stringify(claims)))}.sig`;
const setCookies = (res) => res.headers.getSetCookie?.() ?? [res.headers.get('Set-Cookie')];
const cookieNamed = (res, name) =>
  setCookies(res)
    .find((c) => c?.startsWith(`${name}=`))
    ?.split(';')[0];

/** Starts a sign-in, then comes back from the provider with these claims. */
async function signIn(env, provider, claims, { tamper } = {}) {
  const started = await get(env, `/api/auth/oauth/${provider}/start?popup=1`);
  assert.equal(started.status, 302);
  const to = new URL(started.headers.get('Location'));
  const stateCookie = cookieNamed(started, '__Host-hm_oauth');
  const nonce = to.searchParams.get('nonce');
  env.tokenCalls = [];
  env.OAUTH_FETCH = async (url, init) => {
    env.tokenCalls.push({ url, body: new URLSearchParams(init.body) });
    return new Response(JSON.stringify({ id_token: jwt({ nonce, ...claims }) }));
  };
  const state = tamper === 'state' ? 'wrong' : to.searchParams.get('state');
  const res = await get(
    env,
    `/api/auth/oauth/${provider}/callback?code=abc&state=${encodeURIComponent(state)}`,
    stateCookie,
  );
  assert.equal(res.status, 302);
  return { res, to, location: new URL(res.headers.get('Location')) };
}

const google = (extra = {}) => ({
  iss: 'https://accounts.google.com',
  aud: 'google-id',
  sub: 'g-123',
  email: 'sam@example.co.uk',
  email_verified: true,
  name: 'Sam Okafor',
  exp: Math.floor(Date.now() / 1000) + 600,
  ...extra,
});
const microsoft = (tid, extra = {}) => ({
  iss: `https://login.microsoftonline.com/${tid}/v2.0`,
  aud: 'ms-id',
  tid,
  sub: 'm-456',
  email: 'sam@example.co.uk',
  name: 'Sam Okafor',
  exp: Math.floor(Date.now() / 1000) + 600,
  ...extra,
});

test('only configured providers show, and only they have routes', async () => {
  const env = setUp();
  delete env.MICROSOFT_CLIENT_SECRET;
  const { providers } = await (await get(env, '/api/auth/providers')).json();
  assert.deepEqual(providers, ['google']);
  assert.equal((await get(env, '/api/auth/oauth/microsoft/start')).status, 404);
  assert.notEqual((await get(env, '/api/auth/oauth/facebook/start')).status, 302);
});

test('start: PKCE, state and nonce, and a short-lived locked-down cookie', async () => {
  const env = setUp();
  const res = await get(env, '/api/auth/oauth/google/start?next=//evil.example/x');
  const to = new URL(res.headers.get('Location'));
  assert.equal(to.origin, 'https://accounts.google.com');
  assert.equal(to.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(to.searchParams.get('redirect_uri'), `${ORIGIN}/api/auth/oauth/google/callback`);
  assert.ok(to.searchParams.get('state').length >= 40);
  assert.ok(to.searchParams.get('nonce').length >= 40);
  const cookie = setCookies(res).find((c) => c.startsWith('__Host-hm_oauth='));
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
});

test('Google, new person: account made, email trusted, signed in', async () => {
  const env = setUp();
  const { res, location } = await signIn(env, 'google', google());
  assert.equal(location.pathname, '/auth/done/');
  assert.equal(location.searchParams.get('ok'), '1');
  assert.equal(location.searchParams.get('popup'), '1');
  const session = cookieNamed(res, '__Host-hm_session');
  assert.ok(session && session.length > 30);
  const me = await (await get(env, '/api/account/me', session)).json();
  assert.equal(me.user.email, 'sam@example.co.uk');
  assert.equal(me.user.name, 'Sam Okafor');
  // The code went with our secret and the PKCE verifier.
  assert.equal(env.tokenCalls[0].body.get('client_secret'), 'google-secret');
  assert.ok(env.tokenCalls[0].body.get('code_verifier').length >= 40);
  // Next time the Google id decides, even with a new email.
  const again = await signIn(env, 'google', google({ email: 'new@example.co.uk' }));
  const me2 = await (
    await get(env, '/api/account/me', cookieNamed(again.res, '__Host-hm_session'))
  ).json();
  assert.equal(me2.user.email, 'sam@example.co.uk');
  const users = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first('n');
  assert.equal(users, 1);
});

test('a wrong state, nonce, audience or issuer never signs anyone in', async () => {
  const env = setUp();
  const cases = [
    [{}, { tamper: 'state' }, 'expired'],
    [{ nonce: 'other' }, {}, 'failed'],
    [{ aud: 'someone-else' }, {}, 'failed'],
    [{ iss: 'https://evil.example' }, {}, 'failed'],
    [{ exp: 10 }, {}, 'failed'],
  ];
  for (const [extra, opts, error] of cases) {
    const { res, location } = await signIn(env, 'google', google(extra), opts);
    assert.equal(location.searchParams.get('error'), error, JSON.stringify(extra));
    assert.equal(cookieNamed(res, '__Host-hm_session'), undefined);
  }
  assert.equal(await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first('n'), 0);
});

test('an unconfirmed password sign-up with the same email loses its password on linking', async () => {
  const env = setUp();
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, role, password_hash, salt, created_at) VALUES ('u1', 'sam@example.co.uk', 'Stranger', 'client', 'h', 's', 1)",
  ).run();
  const { location } = await signIn(env, 'google', google());
  assert.equal(location.searchParams.get('ok'), '1');
  const user = await env.DB.prepare(
    'SELECT password_hash, email_verified_at FROM users WHERE id = ?',
  )
    .bind('u1')
    .first();
  assert.equal(user.password_hash, null);
  assert.ok(user.email_verified_at);
});

test('Microsoft: personal accounts are trusted; a work email it can’t vouch for needs our code', async () => {
  const env = setUp();
  const personal = await signIn(env, 'microsoft', microsoft(MS_CONSUMER));
  assert.equal(personal.location.searchParams.get('ok'), '1');

  const env2 = setUp();
  const work = await signIn(env2, 'microsoft', microsoft(WORK_TENANT));
  assert.equal(work.location.searchParams.get('verify'), 'sam@example.co.uk');
  assert.equal(cookieNamed(work.res, '__Host-hm_session'), undefined, 'not signed in yet');
  assert.match(env2.mails[0].subject, /Your Hu\/man code/);

  // An account already has that email: an unvouched provider email can't take it over.
  const env3 = setUp();
  await env3.DB.prepare(
    "INSERT INTO users (id, email, name, role, created_at, email_verified_at) VALUES ('u1', 'sam@example.co.uk', 'Sam', 'client', 1, 1)",
  ).run();
  const taken = await signIn(env3, 'microsoft', microsoft(WORK_TENANT));
  assert.equal(taken.location.searchParams.get('error'), 'exists');
  assert.equal(cookieNamed(taken.res, '__Host-hm_session'), undefined);
});

test('deleting the account removes its Google link too', async () => {
  const env = setUp();
  const { res } = await signIn(env, 'google', google());
  const cookie = cookieNamed(res, '__Host-hm_session');
  const del = await handleAccounts(
    new Request(`${ORIGIN}/api/account/me`, {
      method: 'DELETE',
      headers: { Cookie: cookie, Origin: ORIGIN },
    }),
    env,
  );
  assert.equal(del.status, 200);
  assert.equal(await env.DB.prepare('SELECT COUNT(*) AS n FROM oauth_identities').first('n'), 0);
});

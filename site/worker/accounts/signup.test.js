import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, cookieFrom, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);

/** An env whose Resend calls are captured: env.mails = [{ to, subject, text }]. */
function withResend(env = makeEnv()) {
  env.mails = [];
  env.RESEND_API_KEY = 're_test_key';
  env.RESEND_FETCH = async (url, init) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(init.headers.Authorization, 'Bearer re_test_key');
    const body = JSON.parse(init.body);
    env.mails.push({ to: body.to[0], subject: body.subject, text: body.text });
    return new Response('{"id":"x"}', { status: 200 });
  };
  return env;
}
const codeIn = (mail) => (mail.subject.match(/(\d{6})/) ?? [])[1];
const signUp = (env, body) => call(env, 'POST', '/api/auth/signup', { body });
const NEW = { name: 'Priya Shah', email: 'Priya@Example.co.uk', password: 'a good long password' };

test('sign up, get a code by email, confirm it, and be logged in', async () => {
  const env = withResend();
  const res = await signUp(env, NEW);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, verify: true });
  assert.equal(env.mails.length, 1);
  assert.equal(env.mails[0].to, 'priya@example.co.uk');
  const code = codeIn(env.mails[0]);
  assert.match(code, /^\d{6}$/);

  // Not confirmed yet: the right password asks for a code instead of logging in.
  const early = await call(env, 'POST', '/api/auth/login', {
    body: { email: NEW.email, password: NEW.password },
  });
  assert.equal(early.status, 403);
  assert.equal((await early.json()).verify, true);
  const fresh = codeIn(env.mails.at(-1));

  assert.equal(
    (await call(env, 'POST', '/api/auth/verify', { body: { email: NEW.email, code } })).status,
    400,
    'the older code was replaced',
  );
  const ok = await call(env, 'POST', '/api/auth/verify', {
    body: { email: NEW.email, code: fresh },
  });
  assert.equal(ok.status, 200);
  const me = await call(env, 'GET', '/api/account/me', { cookie: cookieFrom(ok) });
  assert.equal((await me.json()).user.name, 'Priya Shah');

  const login = await call(env, 'POST', '/api/auth/login', {
    body: { email: NEW.email, password: NEW.password },
  });
  assert.equal(login.status, 200);
});

test('five wrong codes use the code up', async () => {
  const env = withResend();
  await signUp(env, NEW);
  const code = codeIn(env.mails[0]);
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) {
    await call(env, 'POST', '/api/auth/verify', { body: { email: NEW.email, code: wrong } });
  }
  assert.equal(
    (await call(env, 'POST', '/api/auth/verify', { body: { email: NEW.email, code } })).status,
    400,
  );
});

test('signing up with an email that has an account says the same, and emails the owner', async () => {
  const env = withResend();
  await loggedIn(env, 'taken@example.co.uk');
  const res = await signUp(env, { ...NEW, email: 'taken@example.co.uk' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, verify: true });
  assert.equal(env.mails[0].subject, 'You already have a Hu/man account');
  assert.equal(codeIn(env.mails[0]), undefined, 'no code: nobody can take the account over');
  // The owner's password is unchanged.
  const login = await call(env, 'POST', '/api/auth/login', {
    body: { email: 'taken@example.co.uk', password: 'a long enough password' },
  });
  assert.equal(login.status, 200);
});

test('bad sign-ups are refused with field errors', async () => {
  const env = withResend();
  const res = await signUp(env, { name: '', email: 'nope', password: 'short' });
  assert.equal(res.status, 400);
  const { errors } = await res.json();
  assert.ok(errors.name && errors.email && errors.password);
  assert.equal(env.mails.length, 0);
});

test('forgot password: a one-hour link by email; unknown emails get the same answer', async () => {
  const env = withResend();
  await loggedIn(env, 'sam@example.co.uk');
  const a = await call(env, 'POST', '/api/auth/forgot', { body: { email: 'sam@example.co.uk' } });
  const b = await call(env, 'POST', '/api/auth/forgot', { body: { email: 'ghost@example.co.uk' } });
  assert.deepEqual(await a.json(), await b.json());
  assert.equal(env.mails.length, 1);
  const link = env.mails[0].text.match(/https:\/\/\S+\/account\/setup\/\?t=\S+/)[0];
  const token = new URL(link).searchParams.get('t');
  const reset = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Sam', password: 'my brand new password' },
  });
  assert.equal(reset.status, 200);
  const old = await call(env, 'POST', '/api/auth/login', {
    body: { email: 'sam@example.co.uk', password: 'a long enough password' },
  });
  assert.equal(old.status, 401);
});

test('no Resend key: nothing is sent, nothing breaks; DEV_SHOW_CODES only on localhost', async () => {
  const env = makeEnv();
  const res = await signUp(env, NEW);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).devCode, undefined);
  env.DEV_SHOW_CODES = 'yes';
  const prod = await signUp(env, { ...NEW, email: 'b@example.co.uk' });
  assert.equal((await prod.json()).devCode, undefined, 'never on the real domain');
  const local = await handleAccounts(
    new Request('http://localhost:8787/api/auth/signup', {
      method: 'POST',
      headers: { Origin: 'http://localhost:8787', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...NEW, email: 'c@example.co.uk' }),
    }),
    env,
  );
  assert.match((await local.json()).devCode, /^\d{6}$/);
});

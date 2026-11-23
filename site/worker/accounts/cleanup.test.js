import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';
import { cleanUp } from './cleanup.js';

const DAY = 24 * 3600 * 1000;

test('the daily clean-up keeps its promises', async () => {
  const env = makeEnv();
  await loggedIn(env, 'active@example.co.uk');
  await loggedIn(env, 'gone-quiet@example.co.uk');
  await loggedIn(env, 'paid-up@example.co.uk');
  await loggedIn(env, 'admin@example.co.uk', 'admin');
  await handleAccounts(
    req('POST', '/api/auth/signup', {
      body: {
        name: 'Never Confirmed',
        email: 'never@example.co.uk',
        password: 'a long enough password',
      },
    }),
    env,
  );
  const old = Date.now() - 400 * DAY;
  await env.DB.prepare(
    "UPDATE users SET last_login_at = ?, created_at = ? WHERE email IN ('gone-quiet@example.co.uk', 'paid-up@example.co.uk', 'admin@example.co.uk')",
  )
    .bind(old, old)
    .run();
  await env.DB.prepare("UPDATE users SET created_at = ? WHERE email = 'never@example.co.uk'")
    .bind(Date.now() - 8 * DAY)
    .run();
  const paidUp = await env.DB.prepare(
    "SELECT id FROM users WHERE email = 'paid-up@example.co.uk'",
  ).first('id');
  await env.DB.prepare(
    "INSERT INTO projects (id, user_id, name, type, created_at, paid_at) VALUES ('p1', ?, 'x', 'portfolio', 1, 1)",
  )
    .bind(paidUp)
    .run();

  const result = await cleanUp(env);
  assert.deepEqual(result, { unconfirmed: 1, unused: 1 });
  const left = (await env.DB.prepare('SELECT email FROM users ORDER BY email').all()).results.map(
    (r) => r.email,
  );
  assert.deepEqual(left, ['active@example.co.uk', 'admin@example.co.uk', 'paid-up@example.co.uk']);
});

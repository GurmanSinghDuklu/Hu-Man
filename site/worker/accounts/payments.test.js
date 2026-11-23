import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { makeEnv, req, loggedIn, cookieFrom, bodyOf } from './test-env.js';
import { handleAccounts } from './index.js';
import { handleStripeWebhook } from './payments.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const WEBHOOK_SECRET = 'whsec_test_secret';

async function setUp({ stripe = true } = {}) {
  const env = makeEnv();
  const calls = [];
  if (stripe) {
    env.STRIPE_SECRET_KEY = 'sk_test_123';
    env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    env.STRIPE_FETCH = async (url, init) => {
      calls.push({ url, init, body: new URLSearchParams(init.body) });
      return new Response(
        JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };
  }
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const created = await (
    await call(env, 'POST', '/api/admin/clients', {
      cookie: admin,
      body: {
        name: 'Noor',
        email: 'noor@example.co.uk',
        project: { name: 'Noor’s portfolio', type: 'portfolio' },
      },
    })
  ).json();
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: {
      token: new URL(created.setupUrl).searchParams.get('t'),
      name: 'Noor',
      password: 'a long enough password',
    },
  });
  return { env, calls, admin, client: cookieFrom(setup), projectId: created.projectId };
}

const admin = (env, cookie, projectId, action, body = {}) =>
  call(env, 'POST', `/api/admin/projects/${projectId}/${action}`, { cookie, body });
const project = async (env, cookie) =>
  (await (await call(env, 'GET', '/api/account/me', { cookie })).json()).projects[0];
const previewReady = (env, projectId) =>
  env.DB.prepare("UPDATE projects SET preview_version = 'v1', preview_at = 1 WHERE id = ?")
    .bind(projectId)
    .run();

function signed(payload, { secret = WEBHOOK_SECRET, t = Math.floor(Date.now() / 1000) } = {}) {
  const body = JSON.stringify(payload);
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return new Request('https://humansoftwareagency.com/api/stripe/webhook', {
    method: 'POST',
    headers: { 'Stripe-Signature': `t=${t},v1=${v1}`, 'Content-Type': 'application/json' },
    body,
  });
}
const paidEvent = (projectId, amount = 46600) => ({
  id: 'evt_1',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_1',
      payment_status: 'paid',
      amount_total: amount,
      currency: 'gbp',
      client_reference_id: projectId,
      metadata: { project_id: projectId },
    },
  },
});

test('admins set the quote and deposit; the client sees what is left to pay', async () => {
  const { env, admin: a, client, projectId } = await setUp();
  assert.equal(
    (await admin(env, a, projectId, 'money', { quote: '932', deposit: 466 })).status,
    200,
  );
  assert.equal((await admin(env, a, projectId, 'money', { quote: '-5' })).status, 400);
  assert.equal(
    (await admin(env, client, projectId, 'money', { quote: 1 })).status,
    404,
    'not for clients',
  );
  let p = await project(env, client);
  assert.equal(p.stage, 'brief');
  assert.equal(p.quotePence, 93200);
  assert.equal(p.duePence, 93200, 'deposit not yet marked paid');
  assert.equal((await admin(env, a, projectId, 'deposit', { paid: true })).status, 200);
  p = await project(env, client);
  assert.equal(p.stage, 'building');
  assert.equal(p.duePence, 46600);
});

test('pay: only once the preview is ready, and it opens Stripe Checkout for the amount due', async () => {
  const { env, calls, admin: a, client, projectId } = await setUp();
  await admin(env, a, projectId, 'money', { quote: 932, deposit: 466 });
  await admin(env, a, projectId, 'deposit', { paid: true });
  const pay = (cookie = client) => call(env, 'POST', `/api/account/pay?p=${projectId}`, { cookie });
  assert.equal((await pay()).status, 409, 'no preview yet');
  await previewReady(env, projectId);
  assert.equal((await pay(a)).status, 404, 'only the client pays');

  const res = await pay();
  assert.equal(res.status, 200);
  assert.equal((await res.json()).url, 'https://checkout.stripe.com/c/pay/cs_test_1');
  assert.equal(calls.length, 1);
  const { url, init, body } = calls[0];
  assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(init.headers.Authorization, 'Bearer sk_test_123');
  assert.equal(body.get('mode'), 'payment');
  assert.equal(body.get('line_items[0][price_data][currency]'), 'gbp');
  assert.equal(body.get('line_items[0][price_data][unit_amount]'), '46600');
  assert.equal(body.get('customer_email'), 'noor@example.co.uk');
  assert.equal(body.get('metadata[project_id]'), projectId);
  assert.equal(body.get('client_reference_id'), projectId);
  assert.match(body.get('success_url'), /\/account\/\?paid=1$/);
});

test('without Stripe keys, paying says payment details will be sent instead', async () => {
  const { env, admin: a, client, projectId } = await setUp({ stripe: false });
  await admin(env, a, projectId, 'money', { quote: 500 });
  await previewReady(env, projectId);
  const res = await call(env, 'POST', `/api/account/pay?p=${projectId}`, { cookie: client });
  assert.equal(res.status, 503);
});

test('the webhook marks it paid only with a genuine, fresh signature, and only once', async () => {
  const { env, admin: a, client, projectId } = await setUp();
  await admin(env, a, projectId, 'money', { quote: 932, deposit: 466 });
  await previewReady(env, projectId);

  const forged = await handleStripeWebhook(
    signed(paidEvent(projectId), { secret: 'whsec_wrong' }),
    env,
  );
  assert.equal(forged.status, 400);
  const stale = await handleStripeWebhook(
    signed(paidEvent(projectId), { t: Math.floor(Date.now() / 1000) - 600 }),
    env,
  );
  assert.equal(stale.status, 400);
  assert.equal((await project(env, client)).stage, 'preview');

  assert.equal((await handleStripeWebhook(signed(paidEvent(projectId)), env)).status, 200);
  const p = await project(env, client);
  assert.equal(p.stage, 'paid');
  assert.equal(p.paidPence, 46600);
  assert.equal(p.duePence, 0);
  assert.equal(env.sent.length, 1);
  assert.match(bodyOf(env.sent[0].raw), /£466\.00/);

  // Stripe retries: no second email, nothing changes.
  assert.equal((await handleStripeWebhook(signed(paidEvent(projectId)), env)).status, 200);
  assert.equal(env.sent.length, 1);
  assert.equal(await handleStripeWebhook(req('GET', '/about/', { origin: null }), env), null);
});

test('paid by hand, then live: live needs payment and a real address', async () => {
  const { env, admin: a, client, projectId } = await setUp();
  await admin(env, a, projectId, 'money', { quote: 932, deposit: 466 });
  await previewReady(env, projectId);
  assert.equal(
    (await admin(env, a, projectId, 'live', { url: 'https://noor.example' })).status,
    409,
  );
  assert.equal((await admin(env, a, projectId, 'paid', {})).status, 200);
  assert.equal((await admin(env, a, projectId, 'paid', {})).status, 409, 'already paid');
  assert.equal((await project(env, client)).paidPence, 93200 - 0, 'deposit not marked: full quote');
  assert.equal(
    (await admin(env, a, projectId, 'live', { url: 'javascript:alert(1)' })).status,
    400,
  );
  assert.equal(
    (await admin(env, a, projectId, 'live', { url: 'https://noor.example' })).status,
    200,
  );
  const p = await project(env, client);
  assert.equal(p.stage, 'live');
  assert.equal(p.liveUrl, 'https://noor.example/');
  assert.equal(
    (await call(env, 'POST', `/api/account/pay?p=${projectId}`, { cookie: client })).status,
    409,
  );
});

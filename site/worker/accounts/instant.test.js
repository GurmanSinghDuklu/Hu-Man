import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { makeEnv, req, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';
import { servePublished, instantDesign } from './instant.js';
import { servePreview } from './preview.js';
import { handleStripeWebhook } from './payments.js';
import { leah } from './templates/leah.js';
import { noor } from './templates/noor.js';
import { theo } from './templates/theo.js';
import { profile } from './templates/shared.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const ANSWERS = {
  firstName: 'Priya',
  surname: 'Shah',
  email: 'priya@example.co.uk',
  phone: '0113 496 0000',
  town: 'Leeds',
  jobTitle: 'Operations manager',
  summary: 'Calm <img src=x onerror=alert(1)> teams.',
  linkedin: 'linkedin.com/in/priya',
  website: 'priya.example',
  skills: 'Rotas\nBudgets',
  experience: [
    { title: 'Ops lead', employer: 'Acme', from: '2021-03', current: true, did: 'Ran rotas' },
  ],
  education: [{ qualification: 'BSc', where: 'Leeds', year: '2018' }],
  consent: true,
};

function setUp() {
  const env = makeEnv();
  env.ASSETS = { fetch: async () => new Response('<h1>Page not found</h1>', { status: 404 }) };
  env.mails = [];
  env.RESEND_API_KEY = 're_test';
  env.RESEND_FETCH = async (url, init) => {
    const b = JSON.parse(init.body);
    env.mails.push({ to: b.to[0], subject: b.subject, text: b.text });
    return new Response('{}');
  };
  env.STRIPE_SECRET_KEY = 'sk_test';
  env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  env.STRIPE_FETCH = async () =>
    new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/x' }));
  return env;
}

async function sendInstant(env, cookie, concept = 'Leah Morgan') {
  const { projectId } = await (
    await call(env, 'POST', '/api/account/request', {
      cookie,
      body: { route: 'instant', concept, answers: ANSWERS },
    })
  ).json();
  const sent = await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie,
    body: { answers: ANSWERS },
  });
  return { projectId, sent: await sent.json() };
}

const paid = (projectId) => {
  const body = JSON.stringify({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        payment_status: 'paid',
        amount_total: 15600,
        metadata: { project_id: projectId },
      },
    },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', 'whsec_test').update(`${t}.${body}`).digest('hex');
  return new Request('https://humansoftwareagency.com/api/stripe/webhook', {
    method: 'POST',
    headers: { 'Stripe-Signature': `t=${t},v1=${v1}` },
    body,
  });
};
const host = (h, path = '/') => new Request(`https://${h}${path}`);

test('the three instant designs exist, priced from pricing.ts', () => {
  for (const name of ['Leah Morgan', 'Noor Haddad', 'Theo Lindqvist']) {
    const d = instantDesign(name);
    assert.ok(d, name);
    assert.equal(d.pence, 15600);
  }
  assert.equal(instantDesign('Ellie Brooks'), null, 'hand-made designs are not instant');
});

test('every template escapes what people type and never links to javascript:', () => {
  const p = profile(
    { ...ANSWERS, firstName: '<script>alert(1)</script>', website: 'javascript:alert(1)' },
    { cvUrl: 'cv.pdf' },
  );
  for (const t of [leah, noor, theo]) {
    const html = t(p, { fontBase: 'https://humansoftwareagency.com' });
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /href="javascript:/i);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /"@type":"Person"/);
    assert.match(html, /href="cv\.pdf"/);
    assert.match(html, /linkedin\.com\/in\/priya/);
  }
});

test('send builds it at once; the preview shows it; editing rebuilds it', async () => {
  const env = setUp();
  const cookie = await loggedIn(env, 'priya.login@example.co.uk');
  const { projectId, sent } = await sendInstant(env, cookie);
  assert.equal(sent.previewPath, `/preview/${projectId}/`);
  const page = await servePreview(
    req('GET', `/preview/${projectId}/`, { cookie, origin: null }),
    env,
  );
  const html = await page.text();
  assert.match(html, /PRIYA SHAH|Priya Shah/);
  assert.match(html, /Preview for/);
  const me = await (await call(env, 'GET', '/api/account/me', { cookie })).json();
  assert.equal(me.projects[0].stage, 'preview');
  assert.equal(me.projects[0].duePence, 15600);

  const again = await call(env, 'POST', `/api/account/request/rebuild?p=${projectId}`, {
    cookie,
    body: { answers: { ...ANSWERS, jobTitle: 'Head of operations' } },
  });
  assert.equal(again.status, 200);
  const rebuilt = await (
    await servePreview(req('GET', `/preview/${projectId}/`, { cookie, origin: null }), env)
  ).text();
  assert.match(rebuilt, /Head of operations/);
  assert.equal(
    [...env.FILES.store.keys()].filter((k) => k.startsWith(`preview/${projectId}/`)).length,
    1,
  );
});

test('pay needs the cancellation tick; payment publishes it on its own address', async () => {
  const env = setUp();
  const cookie = await loggedIn(env, 'priya.login@example.co.uk');
  const { projectId } = await sendInstant(env, cookie);
  assert.equal(
    (await call(env, 'POST', `/api/account/pay?p=${projectId}`, { cookie, body: {} })).status,
    400,
  );
  const pay = await call(env, 'POST', `/api/account/pay?p=${projectId}`, {
    cookie,
    body: { waiver: true },
  });
  assert.equal(pay.status, 200);

  assert.equal((await handleStripeWebhook(paid(projectId), env)).status, 200);
  const me = await (await call(env, 'GET', '/api/account/me', { cookie })).json();
  assert.equal(me.projects[0].stage, 'live');
  assert.equal(me.projects[0].liveUrl, 'https://priya-shah.humansoftwareagency.com/');
  assert.ok(env.mails.some((m) => m.subject === 'Your portfolio is live'));

  const site = await servePublished(host('priya-shah.humansoftwareagency.com'), env);
  assert.equal(site.status, 200);
  const html = await site.text();
  assert.match(html, /Priya Shah/);
  assert.doesNotMatch(html, /Preview for/, 'no preview bar once published');
  assert.equal((await servePublished(host('nobody.humansoftwareagency.com'), env)).status, 404);
  assert.equal(
    await servePublished(host('humansoftwareagency.com'), env),
    null,
    'the main site carries on',
  );
  assert.equal(await servePublished(host('www.humansoftwareagency.com'), env), null);
});

test('Speak with us and Contact us to change it land in the Enquiries list', async () => {
  const env = setUp();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const cookie = await loggedIn(env, 'priya.login@example.co.uk');
  const { projectId } = await sendInstant(env, cookie);
  assert.equal(
    (await call(env, 'POST', `/api/account/request/talk?p=${projectId}`, { cookie, body: {} }))
      .status,
    200,
  );
  assert.equal(
    (
      await call(env, 'POST', `/api/account/request/talk?p=${projectId}`, {
        cookie,
        body: { about: 'change', message: 'New photo please' },
      })
    ).status,
    200,
  );
  const { enquiries } = await (
    await call(env, 'GET', '/api/admin/enquiries', { cookie: admin })
  ).json();
  const vias = enquiries.map((e) => e.via);
  assert.ok(vias.includes('Portfolio: speak with us'));
  assert.ok(vias.includes('Portfolio: change request'));
});

test('own domain: not before it is live, checked with Cloudflare, then served', async () => {
  const env = setUp();
  const cookie = await loggedIn(env, 'priya.login@example.co.uk');
  const { projectId } = await sendInstant(env, cookie);
  const connect = (domain) =>
    call(env, 'POST', `/api/account/domain?p=${projectId}`, { cookie, body: { domain } });
  assert.equal((await connect('www.priyashah.co.uk')).status, 404, 'only once live');
  await call(env, 'POST', `/api/account/pay?p=${projectId}`, { cookie, body: { waiver: true } });
  await handleStripeWebhook(paid(projectId), env);
  assert.equal((await connect('www.priyashah.co.uk')).status, 503, 'switched off without keys');

  let status = 'pending';
  env.CF_API_TOKEN = 'cf_test';
  env.CF_ZONE_ID = 'zone1';
  env.CF_FETCH = async (url, init) => {
    if (init.method === 'POST')
      return new Response(JSON.stringify({ success: true, result: { id: 'ch_1' } }));
    return new Response(JSON.stringify({ success: true, result: { status, ssl: { status } } }));
  };
  assert.equal((await connect('not a domain')).status, 400);
  assert.equal((await connect('shop.humansoftwareagency.com')).status, 400);
  const made = await (await connect('https://WWW.PriyaShah.co.uk/')).json();
  assert.equal(made.domain, 'www.priyashah.co.uk');
  assert.equal(made.target, 'sites.humansoftwareagency.com');
  assert.equal(
    (await servePublished(host('www.priyashah.co.uk'), env)).status,
    404,
    'not until active',
  );
  status = 'active';
  const check = await (
    await call(env, 'GET', `/api/account/domain?p=${projectId}`, { cookie })
  ).json();
  assert.equal(check.status, 'active');
  assert.equal((await servePublished(host('www.priyashah.co.uk'), env)).status, 200);
  const me = await (await call(env, 'GET', '/api/account/me', { cookie })).json();
  assert.equal(me.projects[0].liveUrl, 'https://www.priyashah.co.uk/');
  await call(env, 'DELETE', `/api/account/domain?p=${projectId}`, { cookie });
  const after = await (await call(env, 'GET', '/api/account/me', { cookie })).json();
  assert.equal(after.projects[0].liveUrl, 'https://priya-shah.humansoftwareagency.com/');
});

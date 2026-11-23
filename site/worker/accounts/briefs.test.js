import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn, bodyOf } from './test-env.js';
import { handleAccounts } from './index.js';
import { briefSteps, validateBrief } from '../../src/data/brief.ts';
import { tiers, portfolioTiers } from '../../src/data/pricing.ts';

const call = (env, ...args) => handleAccounts(req(...args), env);

async function setUp() {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const created = await (
    await call(env, 'POST', '/api/admin/clients', {
      cookie: admin,
      body: {
        name: 'Ashby',
        email: 'ashby@example.co.uk',
        project: { name: 'Ashby Electrical', type: 'business', tier: 'Launch' },
      },
    })
  ).json();
  const token = new URL(created.setupUrl).searchParams.get('t');
  const setup = await call(env, 'POST', '/api/auth/setup', {
    body: { token, name: 'Ashby', password: 'a long enough password' },
  });
  const client = setup.headers.get('Set-Cookie').split(';')[0];
  return { env, admin, client, projectId: created.projectId };
}

test('every tier named in the brief exists in pricing.ts', () => {
  const names = new Set([
    ...tiers.map((t) => t.name),
    ...portfolioTiers.map((t) => `Portfolio: ${t.name}`),
  ]);
  for (const step of briefSteps) {
    for (const field of step.fields) {
      for (const option of field.options ?? []) {
        for (const tier of option.in ?? []) {
          assert.ok(names.has(tier), `${field.id}/${option.value}: ${tier}`);
        }
      }
    }
  }
});

test('validateBrief drops unknown keys and bad choices, and checks required fields on send', () => {
  const { answers, errors } = validateBrief('business', {
    businessName: '  Ashby Electrical ',
    sneaky: 'x',
    words: 'not-an-option',
    goals: ['enquiries', 'hack'],
    byDate: '31/12/2026',
    likes: [{ url: 'https://a.example', why: 'Clean', extra: 'no' }, {}],
    displayName: 'only for portfolios',
  });
  assert.deepEqual(answers, {
    businessName: 'Ashby Electrical',
    goals: ['enquiries'],
    likes: [{ url: 'https://a.example', why: 'Clean' }],
  });
  assert.deepEqual(errors, {});
  const sending = validateBrief('business', { businessName: 'A' }, { sending: true }).errors;
  assert.ok(sending.whatYouDo && sending.consent && !sending.businessName);
  assert.ok(validateBrief('business', { feel: 'x'.repeat(101) }).errors.feel);
});

test('a client reads and saves their own brief; nobody else can', async () => {
  const { env, admin, client, projectId } = await setUp();
  const brief = (cookie) => call(env, 'GET', `/api/account/brief?p=${projectId}`, { cookie });
  const save = (cookie, answers) =>
    call(env, 'PUT', `/api/account/brief?p=${projectId}`, { cookie, body: { answers } });

  const first = await (await brief(client)).json();
  assert.equal(first.state, 'draft');
  assert.deepEqual(first.answers, {});
  assert.equal(first.project.tier, 'Launch');

  assert.equal((await save(client, { businessName: 'Ashby Electrical', nope: 1 })).status, 200);
  assert.deepEqual((await (await brief(client)).json()).answers, {
    businessName: 'Ashby Electrical',
  });
  const me = await (await call(env, 'GET', '/api/account/me', { cookie: client })).json();
  assert.equal(me.projects[0].briefState, 'draft');

  const other = await loggedIn(env, 'other@example.co.uk', 'client');
  assert.equal((await brief(other)).status, 404);
  assert.equal((await save(other, {})).status, 404);
  // Admins may read, but only the client writes.
  assert.equal((await brief(admin)).status, 200);
  assert.equal((await save(admin, {})).status, 404);
});

test('sending needs the required fields and the tick; then it locks and emails the studio', async () => {
  const { env, client, projectId } = await setUp();
  const send = (answers) =>
    call(env, 'POST', `/api/account/brief/send?p=${projectId}`, {
      cookie: client,
      body: { answers },
    });

  const early = await send({ businessName: 'Ashby Electrical' });
  assert.equal(early.status, 400);
  const { errors } = await early.json();
  assert.ok(errors.whatYouDo && errors.consent);
  assert.equal(env.sent.length, 0);

  const sent = await send({
    businessName: 'Ashby Electrical',
    whatYouDo: 'Electrician in Leeds',
    features: ['booking'],
    consent: true,
  });
  assert.equal(sent.status, 200);
  assert.equal(env.sent.length, 1);
  const raw = env.sent[0].raw;
  const subject = raw.split('\r\n').find((l) => l.startsWith('Subject: '));
  assert.equal(
    Buffer.from(subject.split('?B?')[1].split('?=')[0], 'base64').toString('utf8'),
    '[Client brief] Ashby Electrical from Ashby',
  );
  const body = bodyOf(raw);
  assert.match(body, /What you do, in one line: Electrician in Leeds/);
  assert.match(body, /Features you want: Online booking/);
  assert.match(body, /https:\/\/humansoftwareagency\.com\/admin\/client\/\?id=/);

  const me = await (await call(env, 'GET', '/api/account/me', { cookie: client })).json();
  assert.equal(me.projects[0].briefState, 'sent');
  const put = await call(env, 'PUT', `/api/account/brief?p=${projectId}`, {
    cookie: client,
    body: { answers: {} },
  });
  assert.equal(put.status, 409);
  assert.equal((await send({})).status, 409);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn, bodyOf } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const PDF = new TextEncoder().encode('%PDF-1.7 a CV');
const ANSWERS = {
  firstName: 'Priya',
  surname: 'Shah',
  email: 'priya@example.co.uk',
  jobTitle: 'Operations manager',
  summary: 'I make busy teams calm.',
  experience: [
    { title: 'Ops lead', employer: 'Acme', from: '2021-03', current: true, did: 'Ran things' },
  ],
  education: [{ qualification: 'BSc Management', where: 'Leeds', year: '2018' }],
  street: '1 Secret Road',
};

async function setUp() {
  const env = makeEnv();
  env.mails = [];
  env.RESEND_API_KEY = 're_test';
  env.RESEND_FETCH = async (url, init) => {
    const b = JSON.parse(init.body);
    env.mails.push({ to: b.to[0], subject: b.subject, text: b.text });
    return new Response('{}');
  };
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const client = await loggedIn(env, 'priya.login@example.co.uk');
  return { env, admin, client };
}

test('draft, CV, send: it lands in /admin/ and both emails go out', async () => {
  const { env, admin, client } = await setUp();
  const draft = await call(env, 'POST', '/api/account/request', {
    cookie: client,
    body: { route: 'instant', concept: 'Noor Haddad', answers: ANSWERS },
  });
  assert.equal(draft.status, 200);
  const { projectId } = await draft.json();

  const up = await call(env, 'POST', `/api/account/files?p=${projectId}&field=cv`, {
    cookie: client,
    body: PDF,
    headers: { 'X-File-Name': 'Priya-CV.pdf' },
  });
  assert.equal(up.status, 201);

  const early = await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie: client,
    body: { answers: ANSWERS },
  });
  assert.equal(early.status, 400);
  assert.ok((await early.json()).errors.consent);

  const sent = await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie: client,
    body: { answers: { ...ANSWERS, consent: true } },
  });
  assert.equal(sent.status, 200);

  // The person's confirmation (Resend), to their login email.
  assert.equal(env.mails.length, 1);
  assert.equal(env.mails[0].to, 'priya.login@example.co.uk');
  assert.equal(env.mails[0].subject, 'We’ve got your portfolio request');
  // The studio's copy (SEND_EMAIL), with every answer but no street address.
  assert.equal(env.sent.length, 1);
  const studio = bodyOf(env.sent[0].raw);
  assert.match(studio, /Route: Choose design \+ upload CV · Design: Noor Haddad/);
  assert.match(
    studio,
    /Jobs: 1\. Job title: Ops lead · Employer: Acme · From: 2021-03 · What you did: Ran things · Current/,
  );
  assert.match(studio, /CV: Priya-CV\.pdf/);
  assert.doesNotMatch(studio, /Secret Road/);

  // In the Enquiries list, linked to the account.
  const { enquiries } = await (
    await call(env, 'GET', '/api/admin/enquiries', { cookie: admin })
  ).json();
  assert.equal(enquiries[0].via, 'Portfolio request');
  assert.ok(enquiries[0].clientId);
  // Locked once sent; others can't see it.
  const again = await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie: client,
    body: { answers: { ...ANSWERS, consent: true } },
  });
  assert.equal(again.status, 409);
  const other = await loggedIn(env, 'other@example.co.uk');
  assert.equal(
    (await call(env, 'GET', `/api/account/request?p=${projectId}`, { cookie: other })).status,
    404,
  );
  const mine = await (
    await call(env, 'GET', `/api/account/request?p=${projectId}`, { cookie: client })
  ).json();
  assert.equal(mine.answers.firstName, 'Priya');
  assert.equal(mine.answers.street, undefined, 'unknown fields are never kept');
});

test('the instant route needs a real design; Word CVs are accepted', async () => {
  const { env, client } = await setUp();
  const bad = await call(env, 'POST', '/api/account/request', {
    cookie: client,
    body: { route: 'instant', concept: 'Not A Design', answers: ANSWERS },
  });
  assert.equal(bad.status, 400);
  const { projectId } = await (
    await call(env, 'POST', '/api/account/request', {
      cookie: client,
      body: { route: 'custom', answers: ANSWERS },
    })
  ).json();
  const docx = new TextEncoder().encode('PK\u0003\u0004....word/document.xml....');
  const up = await call(env, 'POST', `/api/account/files?p=${projectId}&field=cv`, {
    cookie: client,
    body: docx,
    headers: { 'X-File-Name': 'cv.docx' },
  });
  assert.equal(up.status, 201);
  assert.equal(
    (await up.json()).file.type,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
});

test('Delete my account removes everything and logs them out; admins can’t', async () => {
  const { env, admin, client } = await setUp();
  const { projectId } = await (
    await call(env, 'POST', '/api/account/request', {
      cookie: client,
      body: { route: 'custom', answers: ANSWERS },
    })
  ).json();
  await call(env, 'POST', `/api/account/files?p=${projectId}&field=cv`, {
    cookie: client,
    body: PDF,
    headers: { 'X-File-Name': 'cv.pdf' },
  });
  await env.FILES.put(`preview/${projectId}/v1/index.html`, new TextEncoder().encode('<p>hi</p>'));
  const res = await call(env, 'DELETE', '/api/account/me', { cookie: client });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal(env.FILES.store.size, 0, 'CV and preview files gone');
  const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'client'").first(
    'n',
  );
  assert.equal(left, 0);
  assert.equal((await call(env, 'GET', '/api/account/me', { cookie: client })).status, 401);
  assert.equal((await call(env, 'DELETE', '/api/account/me', { cookie: admin })).status, 403);
});

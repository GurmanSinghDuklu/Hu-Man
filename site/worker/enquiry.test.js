/**
 * Tests for the enquiry endpoint, run with `npm test` (Node's built-in test runner). They use a
 * fake EmailMessage and send_email binding, so nothing is sent anywhere.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEnquiry, validate, buildEmail } from './enquiry.js';

class FakeEmailMessage {
  constructor(from, to, raw) {
    Object.assign(this, { from, to, raw });
  }
}

function makeEnv() {
  const sent = [];
  return {
    sent,
    FROM_ADDRESS: 'website@humansoftwareagency.com',
    TO_ADDRESS: 'humansoftwareagency@gmail.com',
    SEND_EMAIL: { send: async (msg) => sent.push(msg) },
  };
}

const URL_ = 'https://humansoftwareagency.com/api/enquiry';
const jsonPost = (body) =>
  new Request(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const formPost = (fields, origin = 'https://humansoftwareagency.com') =>
  new Request(URL_, {
    method: 'POST',
    headers: { Origin: origin },
    body: new URLSearchParams(fields),
  });

/** The decoded text body of a raw MIME message. */
const bodyOf = (raw) =>
  Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8');
const header = (raw, name) => raw.split('\r\n').find((l) => l.startsWith(`${name}: `));

test('a JSON enquiry is emailed with every field and the sender as Reply-To', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    jsonPost({
      name: 'Sam Patel',
      email: 'sam@example.co.uk',
      topic: 'idea',
      message: 'An app for my café',
      phone: '0113 000 0000',
    }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(env.sent.length, 1);
  const { raw, from, to } = env.sent[0];
  assert.equal(from, 'website@humansoftwareagency.com');
  assert.equal(to, 'humansoftwareagency@gmail.com');
  assert.match(header(raw, 'Reply-To'), /<sam@example\.co\.uk>$/);
  assert.match(header(raw, 'Message-ID'), /@humansoftwareagency\.com>$/);
  const body = bodyOf(raw);
  assert.match(body, /An app for my café/);
  assert.match(body, /Phone: {4}0113 000 0000/);
  assert.match(body, /Topic: {4}An idea/);
});

test('a free AI check needs a website but no message', async () => {
  assert.ok(
    validate({ name: 'A', email: 'a@b.co', topic: 'ai-check', website: 'mysite.co.uk' }).data,
  );
  assert.ok(validate({ name: 'A', email: 'a@b.co', topic: 'ai-check' }).errors.website);
  assert.ok(validate({ name: 'A', email: 'a@b.co', topic: 'website' }).errors.message);
});

test('bad input is refused with field errors and nothing is sent', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    jsonPost({ name: '', email: 'not-an-email', message: 'x'.repeat(5000) }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 400);
  const { errors } = await res.json();
  assert.ok(errors.name && errors.email && errors.message);
  assert.equal(env.sent.length, 0);
});

test('a filled honeypot looks like success but sends nothing', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    jsonPost({ name: 'Bot', email: 'b@b.co', message: 'hi', company: 'spam' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 200);
  assert.equal(env.sent.length, 0);
});

test('a normal form post redirects to /thanks/', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    formPost({ name: 'Jo', email: 'jo@example.com', message: 'Hello' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://humansoftwareagency.com/thanks/');
  assert.equal(env.sent.length, 1);
});

test('form posts from other sites are refused', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    formPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }, 'https://evil.example'),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 403);
  assert.equal(env.sent.length, 0);
});

test('header injection is neutralised', () => {
  const { data } = validate({ name: 'Eve\r\nBcc: x@y.z', email: 'eve@example.com', message: 'hi' });
  const raw = buildEmail(data, {
    from: 'website@humansoftwareagency.com',
    to: 'humansoftwareagency@gmail.com',
  });
  assert.ok(!raw.split('\r\n').some((l) => l.startsWith('Bcc:')));
});

test('GET describes the endpoint for people and agents', async () => {
  const res = await handleEnquiry(new Request(URL_), makeEnv(), FakeEmailMessage);
  assert.equal(res.status, 200);
  const doc = await res.json();
  assert.equal(doc.method, 'POST');
  assert.ok(doc.fields.email.required);
});

test('a failed send tells the sender to email instead', async () => {
  const env = {
    ...makeEnv(),
    SEND_EMAIL: {
      send: async () => {
        throw new Error('down');
      },
    },
  };
  const res = await handleEnquiry(
    jsonPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 502);
});

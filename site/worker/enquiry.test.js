/**
 * Tests for the enquiry endpoint, run with `npm test` (Node's built-in test runner). They use a
 * fake EmailMessage and send_email binding, so nothing is sent anywhere.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEnquiry, validate, buildEmail, buildAutoReply } from './enquiry.js';
import { siteUrl, blockedAgents, lookAtSite } from './site-look.js';

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

test('an oversized body is refused before it is parsed', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    jsonPost({ name: 'Big', email: 'big@example.com', message: 'x'.repeat(20000) }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 413);
  assert.equal(env.sent.length, 0);
});

test('the rate limit answers 429 and sends nothing', async () => {
  const env = { ...makeEnv(), ENQUIRY_PER_IP: { limit: async () => ({ success: false }) } };
  const res = await handleEnquiry(
    jsonPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '60');
  assert.equal(env.sent.length, 0);
});

test('a rate-limited form post goes back to the contact page with a message', async () => {
  const env = { ...makeEnv(), ENQUIRY_GLOBAL: { limit: async () => ({ success: false }) } };
  const res = await handleEnquiry(
    formPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 303);
  assert.match(res.headers.get('location'), /\/contact\/\?error=busy$/);
});

test('JSON that is not an object, and too many fields, are handled safely', async () => {
  const env = makeEnv();
  const arr = await handleEnquiry(
    new Request('https://humansoftwareagency.com/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '[1,2,3]',
    }),
    env,
    FakeEmailMessage,
  );
  assert.equal(arr.status, 400);
  const many = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`f${i}`, 'x']));
  const res = await handleEnquiry(
    jsonPost({ ...many, name: 'A', email: 'a@b.co', message: 'hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 400);
  assert.equal(env.sent.length, 0);
});

test('API responses carry a lock-down CSP and stay out of search', async () => {
  const res = await handleEnquiry(
    new Request('https://humansoftwareagency.com/api/enquiry'),
    makeEnv(),
    FakeEmailMessage,
  );
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex');
});

/** A fake fetch serving a small site: a page, a robots.txt and no llms.txt. */
const fakeSite =
  ({
    robots = 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n',
    slow = false,
  } = {}) =>
  async (target, { signal } = {}) => {
    if (slow)
      return new Promise((_, reject) => {
        // Before Node 24, AbortSignal.timeout's timer doesn't keep the process alive on its own.
        const keepAlive = setTimeout(() => {}, 5000);
        signal.addEventListener('abort', () => {
          clearTimeout(keepAlive);
          reject(signal.reason);
        });
      });
    const { pathname } = new URL(target);
    if (pathname === '/robots.txt')
      return new Response(robots, { headers: { 'Content-Type': 'text/plain' } });
    if (pathname === '/llms.txt')
      return new Response('<html>Not found</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    return new Response(
      '<html><head><title>Ashby Electrical &amp; Sons</title><meta name="description" content="Electricians in Leeds"></head><body>x</body></html>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  };

test('only public web addresses are looked at', () => {
  assert.equal(siteUrl('mysite.co.uk')?.toString(), 'https://mysite.co.uk/');
  for (const bad of [
    'localhost',
    'http://127.0.0.1/',
    'http://[::1]/',
    'https://intranet',
    'https://a.co.uk:8080/',
    'ftp://a.co.uk',
    'https://user:pw@a.co.uk/',
    'printer.local',
  ])
    assert.equal(siteUrl(bad), null, bad);
});

test('robots.txt blocks are read per crawler, falling back to *', () => {
  assert.deepEqual(blockedAgents('User-agent: GPTBot\nDisallow: /\n'), ['GPTBot']);
  assert.deepEqual(
    blockedAgents('User-agent: *\nDisallow: /\n\nUser-agent: ClaudeBot\nAllow: /\n'),
    [
      'GPTBot',
      'OAI-SearchBot',
      'Claude-SearchBot',
      'PerplexityBot',
      'Google-Extended',
      'Applebot-Extended',
      'CCBot',
    ],
  );
  assert.deepEqual(blockedAgents('User-agent: *\nDisallow: /admin\n'), []);
});

test('the look reports title, robots blocks and a missing llms.txt', async () => {
  const look = await lookAtSite('ashby.co.uk', { fetch: fakeSite() });
  assert.equal(look.title, 'Ashby Electrical & Sons');
  assert.equal(look.description, 'Electricians in Leeds');
  assert.deepEqual(look.blocked, ['GPTBot']);
  assert.equal(look.llms, false, 'an HTML page at /llms.txt is not an llms.txt');
});

test('a site that never answers times out instead of holding the enquiry', async () => {
  const look = await lookAtSite('slow.co.uk', { fetch: fakeSite({ slow: true }), timeoutMs: 50 });
  assert.match(look.error, /timed out/);
});

test('a fetch that ignores its abort signal still cannot hold the enquiry', async () => {
  let keepAlive;
  const stuck = () =>
    new Promise(() => {
      keepAlive = setTimeout(() => {}, 5000);
    });
  const started = Date.now();
  const look = await lookAtSite('stuck.co.uk', { fetch: stuck, timeoutMs: 50 });
  clearTimeout(keepAlive);
  assert.match(look.error, /timed out/);
  assert.ok(Date.now() - started < 2000);
});

test('the studio email says where it came from, when to reply, and what the look found', async () => {
  const env = makeEnv();
  const res = await handleEnquiry(
    new Request(URL_, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://humansoftwareagency.com/free-ai-check/',
      },
      body: JSON.stringify({
        name: 'Al',
        email: 'al@ashby.co.uk',
        topic: 'ai-check',
        website: 'ashby.co.uk',
      }),
    }),
    env,
    FakeEmailMessage,
    undefined,
    { fetch: fakeSite() },
  );
  assert.equal(res.status, 200);
  const body = bodyOf(env.sent[0].raw);
  assert.match(body, /From: {6}\/free-ai-check\//);
  assert.match(body, /Reply by: .+\(48 hours\)/);
  assert.match(body, /Title: {8}Ashby Electrical & Sons/);
  assert.match(body, /blocks the whole site for GPTBot/);
  assert.match(body, /pagespeed\.web\.dev\/analysis\?url=https%3A%2F%2Fashby\.co\.uk%2F/);
});

test('no auto-reply goes out until the REPLY_EMAIL binding exists', async () => {
  const env = makeEnv();
  await handleEnquiry(
    jsonPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(env.sent.length, 1);
});

test('with the binding, the sender gets a fixed auto-reply after the response', async () => {
  const env = makeEnv();
  const replies = [];
  env.REPLY_EMAIL = { send: async (msg) => replies.push(msg) };
  const waits = [];
  const res = await handleEnquiry(
    jsonPost({ name: 'Visit spam.example now', email: 'Jo@Example.com', message: 'Buy pills' }),
    env,
    FakeEmailMessage,
    { waitUntil: (p) => waits.push(p) },
  );
  assert.equal(res.status, 200);
  await Promise.all(waits);
  assert.equal(replies.length, 1);
  const { raw, to } = replies[0];
  assert.equal(to, 'Jo@Example.com');
  assert.match(header(raw, 'Auto-Submitted'), /auto-replied/);
  assert.match(header(raw, 'Reply-To'), /<humansoftwareagency@gmail\.com>/);
  const decoded = raw
    .split(/--hu-man-[^\r]+\r\n/)
    .slice(1)
    .map((part) => Buffer.from(part.split('\r\n\r\n')[1] ?? '', 'base64').toString('utf8'))
    .join('\n');
  assert.match(decoded, /within 48 hours/);
  assert.doesNotMatch(decoded, /spam\.example|pills/, 'nothing the sender typed is echoed');
});

test('the auto-reply is skipped for odd addresses, our own, and when rate-limited', async () => {
  for (const [email, extra] of [
    ['"x"<a>@evil.com', {}],
    ['website@humansoftwareagency.com', {}],
    ['jo@example.com', { REPLY_PER_ADDRESS: { limit: async () => ({ success: false }) } }],
  ]) {
    const env = { ...makeEnv(), ...extra };
    const replies = [];
    env.REPLY_EMAIL = { send: async (msg) => replies.push(msg) };
    await handleEnquiry(jsonPost({ name: 'Jo', email, message: 'Hi' }), env, FakeEmailMessage);
    assert.equal(replies.length, 0, email);
  }
});

test('a failed auto-reply does not fail the enquiry', async () => {
  const env = makeEnv();
  env.REPLY_EMAIL = {
    send: async () => {
      throw new Error('E_SENDER_NOT_VERIFIED');
    },
  };
  const res = await handleEnquiry(
    jsonPost({ name: 'Jo', email: 'jo@example.com', message: 'Hi' }),
    env,
    FakeEmailMessage,
  );
  assert.equal(res.status, 200);
  assert.equal(env.sent.length, 1);
});

test('the AI check auto-reply promises findings, not just a reply', () => {
  const raw = buildAutoReply(
    { email: 'a@b.co', topic: 'ai-check' },
    {
      from: 'website@humansoftwareagency.com',
      replyTo: 'x@y.co',
      origin: 'https://humansoftwareagency.com',
    },
  );
  const text = Buffer.from(
    raw.split('\r\n\r\n')[2].split('\r\n--')[0].replace(/\r\n/g, ''),
    'base64',
  ).toString('utf8');
  assert.match(text, /free AI check by hand/);
});

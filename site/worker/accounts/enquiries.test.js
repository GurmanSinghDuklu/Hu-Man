import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn, ORIGIN } from './test-env.js';
import { handleAccounts } from './index.js';
import { handleEnquiry } from '../enquiry.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const send = (env, body, headers = {}) =>
  handleEnquiry(
    req('POST', '/api/enquiry', { body, headers: { Referer: `${ORIGIN}/contact/`, ...headers } }),
    env,
    env.EmailMessage,
  );
const list = async (env, cookie) =>
  (await (await call(env, 'GET', '/api/admin/enquiries', { cookie })).json()).enquiries;

test('every valid form send is saved and listed for admins, newest first', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  assert.equal(
    (await send(env, { name: 'Sam', email: 'sam@example.co.uk', message: 'A new site' })).status,
    200,
  );
  await send(env, {
    name: 'Noor',
    email: 'noor@example.co.uk',
    concept: 'Noor Haddad',
    service: 'Portfolio or CV website',
    via: 'Contact page',
  });
  // Bots (the hidden field) and invalid sends are never saved.
  await send(env, { name: 'Bot', email: 'bot@example.co.uk', message: 'x', company: 'Spam Ltd' });
  await send(env, { name: '', email: 'nope', message: '' });

  const res = await call(env, 'GET', '/api/admin/enquiries', { cookie: admin });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  const { enquiries, newCount } = await res.json();
  assert.equal(enquiries.length, 2);
  assert.equal(newCount, 2);
  assert.equal(enquiries[0].name, 'Noor');
  assert.equal(enquiries[0].concept, 'Noor Haddad');
  assert.equal(enquiries[0].via, 'Contact page');
  assert.equal(enquiries[0].source, '/contact/');
  assert.equal(enquiries[0].status, 'new');
  assert.equal(enquiries[1].message, 'A new site');
  assert.equal(env.sent.length, 2, 'the email still goes out');
});

test('an enquiry is kept even when the email fails, and the sender is told it worked', async () => {
  const env = makeEnv();
  env.SEND_EMAIL = {
    send: async () => {
      throw new Error('mail down');
    },
  };
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const res = await send(env, { name: 'Sam', email: 'sam@example.co.uk', message: 'Hello' });
  assert.equal(res.status, 200);
  assert.equal((await list(env, admin)).length, 1);
});

test('admins mark enquiries; clients and strangers cannot see them', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const client = await loggedIn(env, 'client@example.co.uk', 'client');
  await send(env, { name: 'Sam', email: 'sam@example.co.uk', message: 'Hello' });
  const [enquiry] = await list(env, admin);

  assert.equal((await call(env, 'GET', '/api/admin/enquiries', { cookie: client })).status, 404);
  assert.equal((await call(env, 'GET', '/api/admin/enquiries')).status, 404);

  const mark = (status, cookie = admin, id = enquiry.id) =>
    call(env, 'POST', `/api/admin/enquiries/${id}`, { cookie, body: { status } });
  assert.equal((await mark('replied')).status, 200);
  assert.equal((await list(env, admin))[0].status, 'replied');
  assert.equal((await mark('not-a-fit')).status, 200);
  assert.equal((await mark('nonsense')).status, 400);
  assert.equal((await mark('replied', admin, 'missing')).status, 404);
  assert.equal((await mark('replied', client)).status, 404);
});

test('making a client from an enquiry links the two', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  await send(env, {
    name: 'Noor',
    email: 'noor@example.co.uk',
    concept: 'Noor Haddad',
    message: 'Hi',
  });
  const [enquiry] = await list(env, admin);
  const created = await call(env, 'POST', '/api/admin/clients', {
    cookie: admin,
    body: {
      name: 'Noor',
      email: 'noor@example.co.uk',
      enquiryId: enquiry.id,
      project: { type: 'portfolio', concept: 'Noor Haddad' },
    },
  });
  assert.equal(created.status, 201);
  const { client } = await created.json();
  const [after] = await list(env, admin);
  assert.equal(after.status, 'client');
  assert.equal(after.clientId, client.id);
});

test('enquiries older than 12 months are deleted, unless they became clients', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  await send(env, { name: 'Old', email: 'old@example.co.uk', message: 'Hi' });
  await send(env, { name: 'Kept', email: 'kept@example.co.uk', message: 'Hi' });
  const year = 366 * 24 * 3600 * 1000;
  await env.DB.prepare('UPDATE enquiries SET created_at = created_at - ?').bind(year).run();
  await env.DB.prepare("UPDATE enquiries SET status = 'client' WHERE name = 'Kept'").run();
  const left = await list(env, admin);
  assert.deepEqual(
    left.map((e) => e.name),
    ['Kept'],
  );
});

test('admins delete an enquiry; clients cannot', async () => {
  const env = makeEnv();
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const client = await loggedIn(env, 'client@example.co.uk', 'client');
  await send(env, { name: 'Sam', email: 'sam@example.co.uk', message: 'Hello' });
  const [enquiry] = await list(env, admin);
  const del = (cookie, id = enquiry.id) =>
    call(env, 'DELETE', `/api/admin/enquiries/${id}`, { cookie });
  assert.equal((await del(client)).status, 404);
  assert.equal((await del(admin)).status, 200);
  assert.equal((await list(env, admin)).length, 0);
  assert.equal((await del(admin)).status, 404);
});

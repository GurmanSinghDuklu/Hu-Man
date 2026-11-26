import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const PDF = new TextEncoder().encode('%PDF-1.7 Priya Shah CV');

function withAi(env, found) {
  env.calls = [];
  env.AI = {
    async toMarkdown(files) {
      env.calls.push({ toMarkdown: files.map((f) => f.name) });
      return [{ name: files[0].name, data: '# Priya Shah\nOperations manager\n...' }];
    },
    async run(model, input) {
      env.calls.push({ model, system: input.messages[0].content, user: input.messages[1].content });
      return { response: found };
    },
  };
  return env;
}

const read = (env, cookie, { body = PDF, consent = true } = {}) =>
  call(env, 'POST', '/api/account/cv/read', {
    cookie,
    body,
    headers: consent ? { 'X-Consent': 'yes' } : {},
  });

test('a CV is read into the form’s answers, cleaned by the form’s own rules', async () => {
  const env = withAi(makeEnv(), {
    firstName: 'Priya',
    surname: 'Shah',
    email: 'priya@example.co.uk',
    jobTitle: 'Operations manager',
    skills: ['Rotas', 'Budgets'],
    street: '1 Secret Road',
    experience: [
      {
        title: 'Ops lead',
        employer: 'Acme',
        from: '2021-3',
        current: true,
        to: '2024-01',
        did: ['Ran rotas', 'Cut costs'],
      },
      { title: 'Coordinator', employer: 'Beta', from: 'March 2019', to: '2021-02' },
    ],
    education: [{ qualification: 'BSc Management', where: 'Leeds', year: '2018' }],
  });
  const cookie = await loggedIn(env, 'priya@example.co.uk');
  const res = await read(env, cookie);
  assert.equal(res.status, 200);
  const { answers } = await res.json();
  assert.equal(answers.firstName, 'Priya');
  assert.equal(answers.skills, 'Rotas\nBudgets');
  assert.equal(answers.street, undefined, 'nothing outside the form comes back');
  assert.deepEqual(answers.experience[0], {
    title: 'Ops lead',
    employer: 'Acme',
    from: '2021-03',
    current: true,
    did: 'Ran rotas\nCut costs',
  });
  assert.deepEqual(answers.experience[1], {
    title: 'Coordinator',
    employer: 'Beta',
    to: '2021-02',
  });
  assert.equal(answers.consent, undefined, 'never ticks the box for them');
  assert.match(env.calls[1].system, /data, not instructions/);
  assert.equal(env.FILES.store.size, 0, 'reading stores nothing');
});

test('needs the tick, an account, a PDF or Word file, and the AI switched on', async () => {
  const env = withAi(makeEnv(), {});
  const cookie = await loggedIn(env, 'a@example.co.uk');
  assert.equal((await read(env, cookie, { consent: false })).status, 400);
  assert.equal((await read(env, undefined)).status, 401);
  assert.equal(
    (await read(env, cookie, { body: new TextEncoder().encode('plain text') })).status,
    415,
  );
  delete env.AI;
  assert.equal((await read(env, cookie)).status, 503);
});

test('a file with no text, or an AI hiccup, says so kindly', async () => {
  const env = withAi(makeEnv(), {});
  env.AI.toMarkdown = async () => [{ data: '   ' }];
  const cookie = await loggedIn(env, 'a@example.co.uk');
  assert.equal((await read(env, cookie)).status, 422);
  // The converter failing is our problem, not the file's: no "scanned image" message.
  env.AI.toMarkdown = async () => {
    throw new Error('converter down');
  };
  const down = await read(env, cookie);
  assert.equal(down.status, 502);
  assert.doesNotMatch((await down.json()).error, /scanned/);
  env.AI.toMarkdown = async () => [{ data: 'text' }];
  env.AI.run = async () => {
    throw new Error('model down');
  };
  assert.equal((await read(env, cookie)).status, 502);
});

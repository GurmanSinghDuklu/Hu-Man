/**
 * Instant portfolios built from the real concept pages (concepts/*.js): the design's own page with
 * the customer's content, nothing of the sample person left, and the files it needs copied in.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn } from './test-env.js';
import { handleAccounts } from './index.js';

const call = (env, ...args) => handleAccounts(req(...args), env);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

const BASE = {
  firstName: 'Sam',
  surname: 'Okafor',
  email: 'sam@example.co.uk',
  jobTitle: 'Service designer',
  consent: true,
};
const FULL = {
  ...BASE,
  phone: '0113 496 0000',
  town: 'Leeds',
  summary: 'I make public services calmer. Mostly <b>forms</b>, queues and letters.',
  linkedin: 'linkedin.com/in/sam',
  skills: 'Research\nPrototyping',
  headline: 'Eight years making services people can finish.',
  availability: 'Open to roles from March',
  experience: [
    {
      title: 'Lead designer',
      employer: 'Kestrel Council',
      from: '2021-03',
      current: true,
      did: 'Ran research',
    },
    { title: 'Designer', employer: 'Ouse Digital', from: '2017-06', to: '2021-02' },
  ],
  education: [{ qualification: 'BA Design', where: 'Leeds', year: '2017' }],
  facts: [{ title: 'Eight years', text: 'Councils and charities.' }],
  steps: [
    { title: 'Look', text: 'Sit with the people who use it.' },
    { title: 'Try', text: 'Paper first.' },
  ],
  projects: [
    {
      title: 'Bin day <script>x</script>',
      what: 'A collections finder',
      role: 'Lead',
      year: '2024',
      problem: 'Nobody knew.',
      outcome: 'Fewer calls.',
    },
    { title: 'Parking', what: 'Permit renewals', link: 'example.org/parking' },
  ],
};

/** Every distinctive piece of the sample people's content. None may reach a customer's site. */
const SAMPLE = {
  noor: [
    'Noor',
    'Haddad',
    'Tally',
    'Clinic Queue',
    'Loop Library',
    'Field Notes',
    'Calderside',
    'Tarnside',
    'Ferrow',
    'Marrow',
    'Armley',
    'shift workers',
    'January 2027',
    'noorhaddad',
    'part of the concept',
    'Back to HU/MAN',
    'preview.js',
    'noindex',
  ],
  leah: [
    'Leah',
    'Morgan',
    'Bristol',
    'library',
    'wayfinding',
    'fit-out',
    'Systems migration',
    'PRINCE2',
    'APM',
    'leahmorgan',
    'eleven years',
    'sample content',
    'img/p[0-9]',
    '®',
    '™',
    'Back to HU/MAN',
    'noindex',
  ],
  theo: [
    'Theo',
    'Lindqvist',
    'Manchester',
    '53.48N',
    'Ledgerline',
    'Pathfinder',
    'tiny-diff',
    'Northwharf',
    'Brindle',
    'Mill Street',
    'Kubernetes',
    'made-up',
    'Illustrative',
    'theolindqvist',
    'part of the concept',
    'Back to HU/MAN',
    'noindex',
  ],
};
/** Sample words the design's script would put on the page. */
const SAMPLE_SCRIPT = {
  noor: [],
  leah: ['On time', 'On budget', 'Procure', "'Handover'"],
  theo: [],
};

async function build(concept, answers, { image = false } = {}) {
  const env = makeEnv();
  env.RESEND_API_KEY = '';
  const cookie = await loggedIn(env, 'sam.login@example.co.uk');
  const draft = await call(env, 'POST', '/api/account/request', {
    cookie,
    body: { concept, answers },
  });
  const { projectId } = await draft.json();
  let body = answers;
  const uploads = [];
  if (image) {
    for (let i = 0; i < 2; i++) {
      const up = await call(env, 'POST', `/api/account/files?p=${projectId}&field=image`, {
        cookie,
        body: PNG,
        headers: { 'X-File-Name': `shot${i}.png` },
      });
      assert.equal(up.status, 201);
      uploads.push((await up.json()).file.id);
    }
    // The first is used, the second was replaced before sending.
    body = {
      ...answers,
      projects: [{ ...answers.projects[0], image: uploads[0] }, ...answers.projects.slice(1)],
    };
  }
  const sent = await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie,
    body: { answers: body },
  });
  assert.equal(sent.status, 200, await sent.clone().text());
  const admin = await loggedIn(env, 'team@example.co.uk', 'admin');
  const built = await call(env, 'POST', `/api/admin/projects/${projectId}/build`, {
    cookie: admin,
  });
  assert.equal(built.status, 200, await built.clone().text());
  const keys = [...env.FILES.store.keys()].filter((k) => k.startsWith(`preview/${projectId}/`));
  const file = (end) => env.FILES.store.get(keys.find((k) => k.endsWith(end)));
  const html = new TextDecoder().decode(file('/index.html').bytes);
  return { env, html, keys, uploads, file };
}

/** The page as people and crawlers read it: styles, scripts and class names don't count. */
const readable = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script(?! type="application\/ld\+json")[\s\S]*?<\/script>/g, '')
    .replace(/ class="[^"]*"/g, '');

const noSample = (html, slug) => {
  const text = readable(html);
  for (const word of SAMPLE[slug]) assert.doesNotMatch(text, new RegExp(word, 'i'), word);
  for (const word of SAMPLE_SCRIPT[slug]) assert.ok(!html.includes(word), word);
};

test('Noor: the real page with their content, four deck cards, nothing of Noor left', async () => {
  const { html, keys, uploads, env } = await build('Noor Haddad', FULL, { image: true });
  noSample(html, 'noor');
  assert.match(html, /aria-label="Sam Okafor"/);
  assert.match(html, /<span class="wi">Okafor<\/span>/);
  assert.match(html, /Eight years making services people can finish\./);
  assert.match(html, /Open to roles from March/);
  assert.equal(html.match(/<div class="card" /g).length, 4, 'the deck always has four');
  assert.match(html, /data-key="c0"[^>]*>.*?<div class="screen g-img"><img src="img\//s);
  assert.equal(html.match(/<article class="row"/g).length, 2);
  assert.match(html, /Bin day &lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>x/);
  assert.match(html, /href="https:\/\/example\.org\/parking"/);
  assert.equal(html.match(/<li class="step">/g).length, 2);
  assert.match(
    html,
    /<i class="b1" style="left:[\d.]+%;width:[\d.]+%;top:10px">Ouse Digital<\/i><i class="b2" [^>]*top:10px">Kestrel Council/,
    'timeline drawn from their dates, back-to-back jobs on one line',
  );
  assert.match(html, /<span style="left:0\.00%">2017<\/span>/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /<span class="addr" id="addr">sam@example\.co\.uk<\/span>/);
  // The design's motion is still there, with its files copied in.
  assert.match(html, /<script src="vendor\/gsap\.min\.js"><\/script>/);
  assert.match(html, /var order = cards\.slice\(\);/);
  assert.ok(keys.some((k) => k.endsWith('/vendor/gsap.min.js')));
  assert.ok(keys.some((k) => k.endsWith('/vendor/ScrollTrigger.min.js')));
  assert.ok(keys.some((k) => /\/fonts\/[\w.-]+\.woff2$/.test(k)));
  assert.ok(keys.some((k) => k.endsWith(`/img/${uploads[0]}.png`)));
  // The picture they stopped using is gone.
  assert.ok(![...env.FILES.store.keys()].some((k) => k.endsWith(uploads[1])));
});

test('Noor with only the required answers: still four cards, empty sections left out', async () => {
  const { html } = await build('Noor Haddad', BASE);
  noSample(html, 'noor');
  assert.equal(html.match(/<div class="card" /g).length, 4);
  assert.doesNotMatch(html, /id="work"/);
  assert.doesNotMatch(html, /id="process"/);
  assert.doesNotMatch(html, /id="experience"/);
  assert.doesNotMatch(html, /class="pill"/);
  assert.match(
    html,
    /<nav class="bar-r" aria-label="Sections"><a href="#contact">Contact<\/a><\/nav>/,
  );
});

test('pictures: JPG, PNG or WebP only; added within 3 hours of sending, or to rebuild a preview', async () => {
  const env = makeEnv();
  const cookie = await loggedIn(env, 'sam.login@example.co.uk');
  const { projectId } = await (
    await call(env, 'POST', '/api/account/request', {
      cookie,
      body: { concept: 'Noor Haddad', answers: BASE },
    })
  ).json();
  const upload = (body) =>
    call(env, 'POST', `/api/account/files?p=${projectId}&field=image`, {
      cookie,
      body,
      headers: { 'X-File-Name': 'x' },
    });
  assert.equal((await upload(new TextEncoder().encode('<svg></svg>'))).status, 415);
  assert.equal((await upload(new TextEncoder().encode('%PDF-1.7'))).status, 415);
  await call(env, 'POST', `/api/account/request/send?p=${projectId}`, {
    cookie,
    body: { answers: BASE },
  });
  const cv = () =>
    call(env, 'POST', `/api/account/files?p=${projectId}&field=cv`, {
      cookie,
      body: new TextEncoder().encode('%PDF-1.7'),
      headers: { 'X-File-Name': 'cv.pdf' },
    });
  assert.equal((await upload(PNG)).status, 201, 'within 3 hours of sending');
  assert.equal((await cv()).status, 201, 'within 3 hours of sending');
  await env.DB.prepare('UPDATE briefs SET sent_at = ? WHERE project_id = ?')
    .bind(Date.now() - 4 * 3600 * 1000, projectId)
    .run();
  assert.equal((await cv()).status, 409, 'locked after 3 hours');
  assert.equal((await upload(PNG)).status, 409, 'locked after 3 hours');
  await env.DB.prepare("UPDATE projects SET route = 'instant' WHERE id = ?").bind(projectId).run();
  assert.equal((await upload(PNG)).status, 201, 'a built preview takes pictures for a rebuild');
});

test('Leah: their words in the heading, chart and ticker; pictures in the cards', async () => {
  const { html, keys, uploads } = await build('Leah Morgan', FULL, { image: true });
  noSample(html, 'leah');
  assert.match(html, /<a class="name" href="#top">Sam Okafor<sup class="m">°<\/sup><\/a>/);
  assert.match(
    html,
    /<span><b>Sam<\/b><\/span><span><b>Okafor<sup class="m">°<\/sup><\/b><\/span>/,
  );
  assert.match(html, /class="photo g-mono"[^>]*><span>SO<\/span>/, 'initials without a photo');
  assert.match(html, /const words = \["Research°","Prototyping°"\];/);
  assert.match(html, /const rows = \[\["Look",/);
  assert.equal(html.match(/<article class="card">/g).length, 2);
  assert.match(html, new RegExp(`<img src="img/${uploads[0]}\\.png"`));
  assert.equal(html.match(/<li class="step">/g).length, 2);
  assert.doesNotMatch(html, /id="services"/, 'no areas given');
  assert.doesNotMatch(html, /id="faq"/, 'no questions given');
  assert.match(html, /<span>BA Design<\/span>/);
  assert.match(html, /href="mailto:sam@example\.co\.uk\?subject=Hello"/);
  assert.match(html, /if \(\$\('#track'\)\) \{/);
  assert.ok(keys.some((k) => k.endsWith('/fonts/unbounded-latin-800-normal.woff2')));
});

test('Leah with only the required answers still runs: no projects, steps or questions', async () => {
  const { html } = await build('Leah Morgan', BASE);
  noSample(html, 'leah');
  assert.doesNotMatch(html, /id="projects"/);
  assert.doesNotMatch(html, /id="approach"/);
  assert.match(html, /const rows = \[\["Service d…",/, 'chart falls back to their title');
});

test('Theo: build logs from their projects, no sample heatmap', async () => {
  const { html, uploads } = await build('Theo Lindqvist', FULL, { image: true });
  noSample(html, 'theo');
  assert.doesNotMatch(html, /id="lately"/);
  assert.match(html, /<span class="w" aria-hidden="true">Okafor<\/span>/);
  assert.match(html, /<b>Service designer\.<\/b> Eight years making services people can finish\./);
  assert.match(html, /<article class="log" data-viz="image">/);
  assert.match(html, /<article class="log" data-viz="readout">/);
  assert.match(html, new RegExp(`src="img/${uploads[0]}\\.png"`));
  assert.match(html, /readout:function\(root\)/);
  assert.match(html, /if\(heat\) ScrollTrigger\.create/);
  assert.match(html, /<li>Research<\/li><li>Prototyping<\/li>/);
  assert.match(html, /<h3>Lead designer<\/h3><p class="co">Kestrel Council<\/p>/);
  assert.match(html, /<canvas id="field"/);
});

test('Theo with only the required answers', async () => {
  const { html } = await build('Theo Lindqvist', BASE);
  noSample(html, 'theo');
  assert.doesNotMatch(html, /id="builds"/);
  assert.match(html, /<a class="skip" href="#contact">Skip to contact<\/a>/);
});

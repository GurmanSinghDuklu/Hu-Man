/**
 * Leah Morgan's design (public/concepts/leah/), filled with a customer's own content.
 * Kept: the huge three-word heading, the photo with the spinning tag and the live plan chart (its
 * rows are their steps, areas or skills), the ticker, the draggable project cards with their hover
 * summaries, the accordion, the approach line that fills as you scroll, the questions and the
 * click-anywhere contact block with its "Say hi" cursor. Leah's ® and ™ marks become ° (a real
 * person's name must never carry a registered-trade-mark sign they don't have).
 */
import { esc } from './profile.js';
import {
  loadConcept,
  swap,
  swapText,
  addCss,
  finish,
  contactLinks,
  linkHtml,
  credit,
} from './page.js';

const M = '<sup class="m">°</sup>';
const pad = (n) => String(n).padStart(2, '0');
const short = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const initials = (p) =>
  p.name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase();

function header(p, nav) {
  return `<header class="top">
  <a class="name" href="#top">${esc(p.name)}${M}</a>
  <nav aria-label="Main">
    ${nav}
    <a class="pill" href="mailto:${esc(p.email)}"><i></i>Contact ${esc(p.firstName)}</a>
  </nav>
</header>`;
}

function hero(p, gantt, hasProjects) {
  const words = (p.heroWords.length ? p.heroWords : p.name.split(/\s+/)).slice(0, 3);
  const longest = Math.max(...words.map((w) => w.length));
  const size =
    longest > 10
      ? ` style="font-size:calc(clamp(26px,4.55vw,84px) * ${(10 / longest).toFixed(3)})"`
      : '';
  const label = [p.jobTitle, p.town].filter(Boolean).map(esc).join(' &nbsp;/&nbsp; ');
  const photo = p.photo
    ? `<div class="photo"><img src="${esc(p.photo)}" width="1100" height="825" alt="" fetchpriority="high"></div>`
    : `<div class="photo g-mono" aria-hidden="true"><span>${esc(initials(p))}</span></div>`;
  const tagName = p.firstName.length <= 8 ? p.firstName : initials(p);
  return `<div class="hero">
  <div>
    ${label ? `<p class="label" style="margin-bottom:18px">${label}</p>` : ''}
    <h1 class="disp"${size}>${words.map((w, i) => `<span><b>${esc(w)}${i === words.length - 1 ? M : ''}</b></span>`).join('')}</h1>
    ${p.summary ? `<p class="lede">${esc(p.summary)}</p>` : ''}
    <div class="cta">
      <a class="pill" href="mailto:${esc(p.email)}"><i></i>Contact ${esc(p.firstName)}</a>
      ${hasProjects ? '<a class="pill ghost" href="#projects">See projects</a>' : ''}
    </div>
  </div>
  <div class="vis">
    ${photo}
    <div class="tag-spin" aria-hidden="true">Hello<br>I’m<br>${esc(tagName)}<br>°</div>
    ${gantt}
  </div>
</div>
<div class="ticker" aria-hidden="true"><div class="row" id="tk"></div></div>`;
}

function projects(list) {
  if (!list.length) return '';
  const fills = ['#0000EE', '#000', '#4D4D4D'];
  const cards = list.map((x, i) => {
    const sum = x.outcome
      ? ['Outcome', x.outcome]
      : x.built
        ? ['What I did', x.built]
        : x.problem
          ? ['The problem', x.problem]
          : null;
    const tags = (x.tools ? x.tools.split(',') : [x.what])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);
    const frame = x.image
      ? `<img src="${esc(x.image)}" width="1100" height="825" alt="" loading="lazy" draggable="false">`
      : `<div class="g-frame" style="background:${fills[i % 3]}"><span>${esc(x.title || x.what)}</span></div>`;
    return `    <article class="card"><div class="frame">${frame}${sum ? `<div class="sum"><b>${sum[0]}</b>${esc(sum[1])}</div>` : ''}</div>
      <div class="meta"><h3>${esc(x.title || x.what || 'Project')}</h3>${x.year ? `<span class="yr">${esc(x.year)}</span>` : ''}</div>${tags.length ? `<ul>${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${x.link ? `<a class="g-link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Visit the project</a>` : ''}</article>`;
  });
  return `<section id="projects" aria-labelledby="h-proj">
  <div class="wrap sh"><h2 class="disp" id="h-proj">Projects${M}</h2>
    <div class="ctrl"><button type="button" id="prev" aria-label="Previous projects">&larr;</button><button type="button" id="next" aria-label="Next projects">&rarr;</button></div></div>
  <div class="track" id="track" tabindex="0" role="region" aria-label="Projects, scroll sideways">
${cards.join('\n')}
  </div>
  <div class="bar" aria-hidden="true"><i id="pbar"></i></div>
</section>`;
}

function services(list) {
  const areas = list.filter((s) => s.title).slice(0, 6);
  if (!areas.length) return '';
  return `<section id="services" aria-labelledby="h-serv">
  <div class="wrap sh"><h2 class="disp" id="h-serv">What I do${M}</h2><span class="label">${pad(areas.length)} things</span></div>
  <div class="acc wrap" id="acc">
${areas
  .map(
    (
      s,
      i,
    ) => `    <h3><button type="button" aria-expanded="false" aria-controls="a${i + 1}" id="b${i + 1}"><span class="n">${pad(i + 1)}</span><span class="t">${esc(s.title)}${M}</span><span class="pm" aria-hidden="true"></span></button></h3>
    <div class="panel" id="a${i + 1}" role="region" aria-labelledby="b${i + 1}"><div><div class="in">${s.text ? `<p>${esc(s.text)}</p>` : ''}${s.points.length ? `<ul>${s.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div></div>`,
  )
  .join('\n')}
  </div>
</section>`;
}

function approach(p) {
  const steps = p.steps.filter((s) => s.title).slice(0, 4);
  const creds = p.education.filter((e) => e.qualification).slice(0, 4);
  if (!steps.length && !creds.length) return '';
  return `<section id="approach" aria-labelledby="h-app">
  <div class="wrap sh"><h2 class="disp" id="h-app">${steps.length ? 'Approach' : 'Qualifications'}${M}</h2>${steps.length ? '<span class="label">Start to finish</span>' : ''}</div>
  ${
    steps.length
      ? `<div class="steps" id="steps">
    <div class="track-line" aria-hidden="true"><div class="fill" id="fill"></div></div>
    <ol style="list-style:none;padding:0">
${steps.map((s, i) => `    <li class="step"><h3><small>Step ${pad(i + 1)}</small>${esc(s.title)}</h3>${s.text ? `<p>${esc(s.text)}</p>` : ''}</li>`).join('\n')}
    </ol>
  </div>`
      : ''
  }
  ${creds.length ? `<div class="creds"><span class="label">Qualifications</span>${creds.map((e) => `<span>${esc(e.qualification)}</span>`).join('')}</div>` : ''}
</section>`;
}

function faq(list) {
  if (!list.length) return '';
  return `<section id="faq" aria-labelledby="h-faq">
  <div class="wrap sh"><h2 class="disp" id="h-faq">Questions<sup class="m">?</sup></h2></div>
  <div class="faq">
${list.map((q) => `    <details><summary>${esc(q.question)}</summary><p>${esc(q.answer)}</p></details>`).join('\n')}
  </div>
</section>`;
}

/** The plan chart's rows: their steps, areas or skills, spread over its twelve weeks. */
function ganttRows(p) {
  const labels = [
    p.steps.map((s) => s.title),
    p.services.map((s) => s.title),
    p.skills,
    p.heroWords,
    [p.jobTitle, p.town, p.firstName],
  ]
    .map((l) => l.filter(Boolean))
    .find((l) => l.length >= 2) ?? ['Start', 'Finish'];
  const rows = labels.slice(0, 5);
  const n = rows.length;
  const len = 12 / n;
  return rows.map((label, i) => {
    const start = Math.round(i * len * 0.85 * 2) / 2;
    const end = Math.min(12, Math.round((start + len * 1.5) * 2) / 2);
    return [short(label, 10), start, i === n - 1 ? 12 : end];
  });
}

function contact(p) {
  return `<a class="start" id="start" href="mailto:${esc(p.email)}?subject=Hello">
  <span class="label">Next up${M}</span>
  <span class="big">Click anywhere to <em>say hello</em></span>
  <span class="mail">${esc(p.email)}</span>
</a>`;
}

function footer(p) {
  const links = contactLinks(p).filter((l) => !l.href.startsWith('mailto:'));
  return `<footer><span>${esc([p.name, p.jobTitle, p.town].filter(Boolean).join(', '))}</span>${links.length ? `<span class="g-links">${links.map((l) => linkHtml(l)).join(' · ')}</span>` : ''}<span>${credit()}</span></footer>`;
}

const CSS = `
.vis .g-mono{display:grid;place-items:center;background:var(--blue);color:#fff}
.vis .g-mono span{font-family:var(--disp);font-weight:800;font-size:clamp(64px,11vw,170px);letter-spacing:-.04em}
.card .g-frame{width:100%;height:100%;display:flex;align-items:flex-end;padding:22px;color:#fff;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.card .g-frame span{font-family:var(--disp);font-weight:800;text-transform:uppercase;font-size:clamp(26px,3vw,44px);line-height:1;letter-spacing:-.02em;overflow-wrap:anywhere}
.card.is-on .g-frame{transform:scale(1.04)}
@media (hover:none){.card .frame .g-frame{aspect-ratio:4/5;height:auto}}
.card .g-link{display:inline-block;margin-top:10px;font-weight:700;font-size:15px}
footer .g-links a{color:inherit}
footer a{color:inherit}
`;

export async function leah(env, p) {
  let html = await loadConcept(env, 'leah');
  const work = p.projects.filter((x) => x.title || x.what || x.image).slice(0, 6);
  const gantt = (html.match(/<div class="gantt">[\s\S]*?<\/svg>\s*<\/div>/) ?? [''])[0].replace(
    /<span>Programme plan<\/span>/,
    `<span>${p.steps.length ? 'How I work' : 'The plan'}</span>`,
  );
  const sections = {
    projects: projects(work),
    services: services(p.services),
    approach: approach(p),
    faq: faq(p.faqs),
  };
  const nav = [
    sections.projects && '<a href="#projects">Projects</a>',
    sections.services && '<a href="#services">What I do</a>',
    sections.approach &&
      `<a href="#approach">${p.steps.length ? 'Approach' : 'Qualifications'}</a>`,
    sections.faq && '<a href="#faq">Questions</a>',
  ]
    .filter(Boolean)
    .join('');

  html = swap(html, '<header class="top">', '</header>', header(p, nav));
  html = swap(
    html,
    '<div class="hero">',
    '<div class="ticker" aria-hidden="true"><div class="row" id="tk"></div></div>',
    hero(p, gantt, Boolean(work.length)),
  );
  html = swap(html, '<section id="projects"', '</section>', sections.projects);
  html = swap(html, '<section id="services"', '</section>', sections.services);
  html = swap(html, '<section id="approach"', '</section>', sections.approach);
  html = swap(html, '<section id="faq"', '</section>', sections.faq);
  html = swap(html, '<a class="start" id="start"', '</a>', contact(p));
  html = swap(html, '<footer>', '</footer>', footer(p));

  // The script: their words in the ticker and the plan chart; parts they left out are skipped.
  const ticker = (p.skills.length ? p.skills : [...p.heroWords, p.jobTitle, p.town])
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => `${w}°`);
  html = swap(
    html,
    'const words = [',
    '];',
    `const words = ${JSON.stringify(ticker).replace(/</g, '\\u003c')};`,
  );
  const rows = ganttRows(p);
  html = swap(
    html,
    'const rows = [',
    '];',
    `const rows = ${JSON.stringify(rows).replace(/</g, '\\u003c')};`,
  );
  html = swap(
    html,
    'const miles = [[',
    ']].map(',
    `const miles = ${JSON.stringify(rows.map((r, i) => [r[2], i]))}.map(`,
  );
  html = swapText(
    html,
    '/* ---- Projects: drag, buttons, hover via JS ---- */',
    "/* ---- Projects: drag, buttons, hover via JS ---- */\n  if ($('#track')) {",
  );
  html = swapText(
    html,
    "cards.forEach(c => c.setAttribute('tabindex', '0'));",
    "cards.forEach(c => c.setAttribute('tabindex', '0'));\n  }",
  );
  html = swapText(html, "if (RM) { $('#a1')", "if (RM && $('#a1')) { $('#a1')");
  html = swapText(
    html,
    "const steps = $$('.step'), fill = $('#fill'), sbox = $('#steps');",
    "if ($('#steps')) {\n  const steps = $$('.step'), fill = $('#fill'), sbox = $('#steps');",
  );
  html = swapText(
    html,
    "addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();",
    "addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();\n  }",
  );
  html = addCss(html, CSS);
  return finish(html, p);
}

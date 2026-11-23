/**
 * Noor Haddad's design (public/concepts/noor/), filled with a customer's own content.
 * The deck always holds four phone screens: their project pictures first (shown as the screen),
 * then screens drawn in Noor's four palettes from their projects, jobs, qualifications and contact
 * details. Work rows are their first four projects (each row's peek shows its deck screen), the
 * timeline is drawn from their job dates, and any section they gave nothing for is left out.
 */
import { esc } from './profile.js';
import {
  loadConcept,
  swap,
  addCss,
  finish,
  firstSentence,
  yearOf,
  contactLinks,
  linkHtml,
  credit,
} from './page.js';

const PALETTES = [
  { cls: 's-tally', ink: '#EDECE6', a: '#FFD23F', b: '#121317' },
  { cls: 's-clinic', ink: '#121317', a: '#2D3BFF', b: '#FFD23F' },
  { cls: 's-loop', ink: '#121317', a: '#2D3BFF', b: '#F3F2EC' },
  { cls: 's-field', ink: '#EAE3D0', a: '#9DB36B', b: '#C9703F' },
];
const STATUS = `<div class="sb"><span>9:41</span><span class="sbi"><i></i><i></i><i></i><b></b></span></div>`;

/** Shapes in the poster's language, different for each card. */
function art(i, { ink, a, b }) {
  const sets = [
    `<rect x="0" y="40" width="74" height="74" rx="37" fill="${a}"/><path d="M90 114V40a74 74 0 0 1 74 74Z" fill="${ink}"/><rect x="182" y="40" width="74" height="74" fill="${b}"/><circle cx="219" cy="77" r="16" fill="${ink}"/>`,
    `<rect x="0" y="40" width="256" height="20" rx="10" fill="${a}"/><rect x="0" y="70" width="170" height="20" rx="10" fill="${ink}" opacity=".85"/><rect x="0" y="100" width="96" height="20" rx="10" fill="${b}"/><circle cx="232" cy="100" r="20" fill="none" stroke="${ink}" stroke-width="4"/>`,
    `<circle cx="40" cy="80" r="36" fill="${a}"/><circle cx="128" cy="80" r="36" fill="none" stroke="${ink}" stroke-width="4"/><path d="M180 116a40 40 0 0 1 76 0Z" fill="${ink}"/><circle cx="218" cy="56" r="12" fill="${a}"/>`,
    `<rect x="0" y="40" width="40" height="76" rx="20" fill="${a}"/><rect x="54" y="62" width="40" height="54" rx="20" fill="${ink}"/><rect x="108" y="50" width="40" height="66" rx="20" fill="${b}"/><rect x="162" y="78" width="40" height="38" rx="19" fill="${ink}" opacity=".6"/><rect x="216" y="44" width="40" height="72" rx="20" fill="${a}"/>`,
  ];
  return `<svg class="g-art" viewBox="0 0 256 120" aria-hidden="true">${sets[i % 4]}</svg>`;
}

const sizeFor = (title) => (title.length <= 7 ? '' : title.length <= 12 ? ' m' : ' s');

/** One phone screen: their picture, or a drawn screen in a palette. */
function screen(card, i) {
  if (card.image) {
    return `<div class="screen g-img"><img src="${esc(card.image)}" alt="" loading="lazy"></div>`;
  }
  const pal = PALETTES[i % 4];
  const list = card.meta.filter(([, v]) => v).slice(0, 2);
  return `<div class="screen ${pal.cls} g-scr">${STATUS}<p class="g-kind">${esc(card.kind)}</p><p class="big g-t${sizeFor(card.title)}">${esc(card.title)}</p>${card.note ? `<p class="g-note">${esc(card.note)}</p>` : ''}${list.length ? `<ul class="g-list">${list.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}${art(i, pal)}</div>`;
}

/** Four cards, always: the deck's motion needs exactly four. */
function deckCards(p, projects) {
  const cards = projects.map((x) => ({
    title: x.title || 'Project',
    sub: x.what || x.role || '',
    kind: x.what || 'Project',
    note: firstSentence(x.outcome || x.built || x.problem)[0],
    meta: [
      ['Role', x.role],
      ['Year', x.year],
    ],
    image: x.image,
  }));
  for (const j of p.jobs) {
    cards.push({
      title: j.title || j.employer || 'Experience',
      sub: [j.employer, j.dates].filter(Boolean).join(', '),
      kind: 'Experience',
      note: j.points[0] ?? '',
      meta: [
        ['Where', j.employer],
        ['When', j.dates],
      ],
    });
  }
  for (const e of p.education) {
    cards.push({
      title: e.qualification || 'Qualification',
      sub: e.where,
      kind: 'Qualification',
      note: '',
      meta: [
        ['Where', e.where],
        ['Year', e.year],
      ],
    });
  }
  cards.splice(Math.max(4, projects.length), Infinity); // keep room only for what's needed
  const extra = [
    {
      title: p.firstName,
      sub: p.jobTitle,
      kind: p.jobTitle || 'Portfolio',
      note: firstSentence(p.summary)[0],
      meta: [['Based in', p.town]],
    },
    {
      title: 'Say hello',
      sub: p.email,
      kind: 'Contact',
      note: p.email,
      meta: [['Phone', p.phone]],
    },
    { title: p.name, sub: p.jobTitle, kind: p.town || 'Portfolio', note: '', meta: [] },
    {
      title: p.jobTitle || p.firstName,
      sub: p.town,
      kind: 'What I do',
      note: p.availability,
      meta: [['Based in', p.town]],
    },
  ];
  if (p.skills.length) {
    extra.splice(2, 0, {
      title: p.skills[0],
      sub: p.skills.slice(1, 3).join(', '),
      kind: 'Skills',
      note: p.skills.slice(1, 6).join(', '),
      meta: [],
    });
  }
  while (cards.length < 4) cards.push(extra.shift());
  return cards.slice(0, 4).map((c, i) => ({ ...c, key: `c${i}` }));
}

function hero(p, cards, nav) {
  const words = p.name.split(/\s+/).filter(Boolean);
  const town = p.town
    ? `<p class="clock" aria-label="Local time in ${esc(p.town)}">${esc(p.town.toUpperCase())} <time id="clock"></time></p>`
    : '<p></p>';
  const line = p.headline || firstSentence(p.summary)[0] || '';
  const top = cards[3];
  return `<header class="sec hero" id="hero">
  <div class="bar">
    <p class="bar-l">${esc(p.jobTitle)}</p>
    ${town}
    <nav class="bar-r" aria-label="Sections">${nav}</nav>
  </div>
  <h1 class="name" id="name" aria-label="${esc(p.name)}">${words.map((w) => `<span class="w" aria-hidden="true"><span class="wi">${esc(w)}</span></span>`).join('')}</h1>
  <div class="hero-grid">
    <div class="hl">${line ? `<p>${esc(line)}</p>` : ''}</div>
    <div class="mid">
      <div class="stage" id="stage">
        <div class="deck" id="deck" aria-hidden="true">
${cards.map((c, i) => `          <div class="card" data-slot="${i}" data-key="${c.key}" data-title="${esc(c.title)}" data-sub="${esc(c.sub)}">${screen(c, i)}</div>`).join('\n')}
        </div>
      </div>
      <div class="deal">
        <p id="cap" aria-live="off">On top: <strong>${esc(top.title)}</strong>${top.sub ? `, ${esc(top.sub)}` : ''}</p>
        <button class="btn" type="button" id="dealbtn">Deal again</button>
      </div>
    </div>
    <div class="hr">
      ${p.availability ? `<span class="pill"><i></i>${esc(p.availability)}</span>` : ''}
      ${p.town ? `<p>Based in ${esc(p.town)}.</p>` : p.skills.length ? `<p>${esc(p.skills.slice(0, 3).join(', '))}</p>` : ''}
    </div>
  </div>
</header>`;
}

function intro(p) {
  const [first, rest] = firstSentence(p.summary);
  if (!first && !p.facts.length) return '';
  const facts = p.facts.filter((f) => f.title || f.text);
  return `<section class="sec intro" aria-label="Introduction">
  <div class="intro-grid">
    ${first ? `<p class="statement">${esc(first)}${rest ? ` <span>${esc(rest)}</span>` : ''}</p>` : ''}
    <div class="poster" aria-hidden="true">@@POSTER@@</div>
    ${facts.length ? `<div class="facts">${facts.map((f) => `<p><strong>${esc(f.title)}</strong>${esc(f.text)}</p>`).join('')}</div>` : ''}
  </div>
</section>`;
}

function work(projects) {
  if (!projects.length) return '';
  const rows = projects.map((x, i) => {
    const meta = [x.role, x.year].filter(Boolean).join(', ');
    const result = x.outcome ? ['Outcome', x.outcome] : x.built ? ['What I did', x.built] : null;
    return `  <article class="row" tabindex="0" data-key="c${i}" aria-labelledby="w${i}">
    <p class="num">${String(i + 1).padStart(2, '0')}</p>
    <h3 class="display rt" id="w${i}">${esc(x.title || 'Project')}</h3>
    <div class="kind">${x.what ? `<b>${esc(x.what)}</b>` : ''}${meta ? `<span>${esc(meta)}</span>` : ''}${x.link ? `<a class="g-link" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Visit the project</a>` : ''}</div>
    ${x.problem ? `<dl class="prob"><dt>Problem</dt><dd>${esc(x.problem)}</dd></dl>` : ''}
    ${result ? `<dl class="outc"><dt>${result[0]}</dt><dd>${esc(result[1])}</dd></dl>` : ''}
    <div class="inline-screen" aria-hidden="true"></div>
  </article>`;
  });
  return `<section class="sec work" id="work" aria-labelledby="work-h">
  <div class="shead">
    <h2 id="work-h">Selected work</h2>
    <p class="hint">Rest on a project to see its screen.</p>
  </div>
${rows.join('\n')}
</section>`;
}

function process(p, icons) {
  const steps = p.steps.filter((s) => s.title || s.text).slice(0, 4);
  if (!steps.length) return '';
  const cols =
    steps.length < 4 ? ` style="grid-template-columns:repeat(${steps.length},minmax(0,1fr))"` : '';
  return `<section class="sec process dark" id="process" aria-labelledby="proc-h">
  <div class="shead">
    <h2 id="proc-h">How I work</h2>
  </div>
  <ol class="steps"${cols}>
${steps.map((s, i) => `    <li class="step"><span class="n" aria-hidden="true">${i + 1}</span>${icons[i] ?? ''}<h3>${esc(s.title)}</h3>${s.text ? `<p>${esc(s.text)}</p>` : ''}</li>`).join('\n')}
  </ol>
</section>`;
}

/** The timeline above the jobs: one bar per dated job, on as many lanes as overlaps need. */
function axis(jobs) {
  // Months as fractions of a year, so one job ending as the next starts shares a lane.
  const at = (ym, end = false) => {
    const m = String(ym ?? '').match(/^(\d{4})-(\d{2})$/);
    return m ? Number(m[1]) + (Number(m[2]) - (end ? 0 : 1)) / 12 : null;
  };
  const today = new Date();
  const now = today.getFullYear() + (today.getMonth() + 1) / 12;
  const dated = jobs
    .map((j) => {
      const from = at(j.from);
      return {
        label: j.employer || j.title,
        from,
        to: j.current ? now : (at(j.to, true) ?? (from === null ? null : from + 1 / 12)),
      };
    })
    .filter((j) => j.from !== null && j.to > j.from)
    .sort((x, y) => x.from - y.from);
  if (!dated.length) return '';
  const start = Math.floor(dated[0].from);
  const end = Math.max(Math.ceil(Math.max(...dated.map((j) => j.to))), start + 1);
  const span = end - start;
  const pct = (y) => `${(((y - start) / span) * 100).toFixed(2)}%`;
  const step = span > 12 ? 3 : span > 7 ? 2 : 1;
  const ticks = [];
  for (let y = start; y < end; y += step) ticks.push(y);
  ticks.push(end);
  const lanes = [];
  const bars = dated.map((j, i) => {
    let lane = lanes.findIndex((last) => last <= j.from + 0.001);
    if (lane < 0) lane = lanes.push(0) - 1;
    lanes[lane] = j.to;
    return `<i class="b${(i % 3) + 1}" style="left:${pct(j.from)};width:${pct(start + (j.to - j.from))};top:${10 + lane * 54}px">${esc(j.label)}</i>`;
  });
  return `<div class="axis" aria-hidden="true">
    <div class="ticks">${ticks.map((y) => `<span style="left:${pct(y)}">${y}</span>`).join('')}</div>
    <div class="bars" style="height:${10 + lanes.length * 54}px">${bars.join('')}</div>
  </div>`;
}

function experience(p) {
  if (!p.jobs.length && !p.education.length) return '';
  const years = (j) => {
    const from = yearOf(j.from);
    const to = j.current ? 'now' : yearOf(j.to);
    return from ? (to && to !== from ? `${from} to ${to}` : String(from)) : '';
  };
  const items = [
    ...p.jobs.map(
      (j) =>
        `<li><p class="display yr">${esc(years(j))}</p><div class="who"><b>${esc(j.title)}</b>${[j.employer, j.place].filter(Boolean).length ? `<span>${esc([j.employer, j.place].filter(Boolean).join(', '))}</span>` : ''}</div><p class="what">${esc(j.points.join(' '))}</p></li>`,
    ),
    ...p.education.map(
      (e) =>
        `<li><p class="display yr">${esc(e.year)}</p><div class="who"><b>${esc(e.qualification)}</b>${e.where ? `<span>${esc(e.where)}</span>` : ''}</div><p class="what"></p></li>`,
    ),
  ];
  return `<section class="sec exp" id="experience" aria-labelledby="exp-h">
  <div class="shead">
    <h2 id="exp-h">Experience</h2>
  </div>
  ${axis(p.jobs)}
  <ul class="jobs">
    ${items.join('\n    ')}
  </ul>
</section>`;
}

function contact(p) {
  const links = contactLinks(p).filter((l) => !l.href.startsWith('mailto:'));
  return `<footer class="sec contact dark" id="contact">
  <p class="display big" id="bigline">Say hello.</p>
  ${p.availability ? `<p class="when">${esc(p.availability)}</p>` : ''}
  <div class="contact-grid">
    <div class="mail">
      <p>Write to me at</p>
      <span class="addr" id="addr">${esc(p.email)}</span>
    </div>
    <p class="what">${links.map((l) => linkHtml(l)).join(' · ')}</p>
    <div class="copyrow"><button class="btn" type="button" id="copy">Copy email</button><small id="copymsg" role="status"></small></div>
  </div>
  <p class="fine">© ${esc(p.name)}. ${credit()}</p>
</footer>`;
}

const CSS = `
.g-scr{display:block}
.g-scr .g-kind{font-weight:600;font-size:14px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g-scr .g-t{font-size:84px;margin:10px 0 14px -3px;overflow-wrap:anywhere}
.g-scr .g-t.m{font-size:58px}.g-scr .g-t.s{font-size:42px;line-height:.92}
.g-scr .g-note{overflow-wrap:anywhere;font-size:15px;font-weight:500;line-height:1.3;max-width:240px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.g-scr .g-list{margin-top:14px}
.g-scr .g-list li{display:flex;flex-flow:row nowrap;align-items:baseline;justify-content:space-between;min-height:0;height:auto;gap:12px;padding:9px 0;border-top:1px solid;font-size:14px;font-weight:500}
.g-scr .g-list li span:last-child{font-weight:700;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.g-scr .g-art{position:absolute;left:22px;bottom:28px;width:calc(100% - 44px);height:auto}
.g-img{padding:0;background:#121317}
.g-img img{display:block;width:100%;height:100%;object-fit:cover}
.row .g-link{display:inline-block;margin-top:10px;font-size:15px;font-weight:700}
.contact .what a{color:inherit;text-underline-offset:.2em}
.fine a{color:inherit}
`;

export async function noor(env, p) {
  let html = await loadConcept(env, 'noor');
  const projects = p.projects.filter((x) => x.title || x.what || x.image).slice(0, 4);
  const cards = deckCards(p, projects);
  const poster = html.match(/<div class="poster" aria-hidden="true">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const icons = [...html.matchAll(/<li class="step">[\s\S]*?(<svg[\s\S]*?<\/svg>)/g)].map(
    (m) => m[1],
  );

  const sections = {
    intro: intro(p).replace('@@POSTER@@', poster),
    work: work(projects),
    process: process(p, icons),
    experience: experience(p),
  };
  const nav = [
    sections.work && '<a href="#work">Work</a>',
    sections.process && '<a href="#process">Process</a>',
    sections.experience && '<a href="#experience">Experience</a>',
    '<a href="#contact">Contact</a>',
  ]
    .filter(Boolean)
    .join('');

  html = swap(html, '<header class="sec hero" id="hero">', '</header>', hero(p, cards, nav));
  html = swap(html, '<section class="sec intro"', '</section>', sections.intro);
  html = swap(html, '<section class="sec work"', '</section>', sections.work);
  html = swap(html, '<section class="sec process', '</section>', sections.process);
  html = swap(html, '<section class="sec exp"', '</section>', sections.experience);
  html = swap(html, '<footer class="sec contact', '</footer>', contact(p));
  html = addCss(html, CSS);
  return finish(html, p);
}

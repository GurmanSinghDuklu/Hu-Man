/**
 * Theo Lindqvist's design (public/concepts/theo/), filled with a customer's own content.
 * Kept: the live contour map in the hero that parts around the pointer, the letter-by-letter name,
 * the build logs (each project's panel plays when it scrolls in, and Replay plays it again: their
 * picture, or a readout of the project in the design's diff style), the toolbox, the path and the
 * contact block. Left out: the "made-up year of commits" heatmap, which only works with sample data.
 */
import { esc } from './profile.js';
import { loadConcept, swap, swapText, addCss, finish, contactLinks, credit } from './page.js';

const short = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const slugOf = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'project';

function hero(p, nav) {
  const words = p.name.split(/\s+/).filter(Boolean);
  return `<header class="hero" id="top">
  <canvas id="field" aria-hidden="true"></canvas>
  <div class="hero-top">
    <nav aria-label="Sections">
      ${nav}
    </nav>
    ${p.town ? `<span class="where">${esc(p.town)}</span>` : ''}
  </div>
  <div class="hero-bottom">
    <h1 class="name" aria-label="${esc(p.name)}">${words.map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join('')}</h1>
    <div class="hero-line">
      <p class="role"><b>${esc(p.jobTitle)}.</b>${p.headline ? ` ${esc(p.headline)}` : ''}</p>
      <p class="hint"><i></i>Move through the map. It parts around you.</p>
    </div>
  </div>
</header>`;
}

function thesis(p) {
  const big = p.belief || p.summary;
  if (!big) return '';
  const small = p.belief ? p.summary : '';
  return `<section class="thesis" aria-label="About me">
    <p>${esc(big)}</p>
    ${small ? `<small>${esc(small)}</small>` : ''}
  </section>`;
}

function viz(x) {
  if (x.image) {
    return {
      kind: 'image',
      body: `<img class="g-shot" src="${esc(x.image)}" alt="" loading="lazy">`,
    };
  }
  const lines = [
    `<span class="ln ctx">${esc(slugOf(x.title))} {</span>`,
    x.role && `<span class="ln ctx">  role: ${esc(short(x.role, 44))}</span>`,
    x.problem && `<span class="ln del">-  ${esc(short(x.problem, 60))}</span>`,
    x.built && `<span class="ln add">+  ${esc(short(x.built, 60))}</span>`,
    x.outcome && `<span class="ln add">+  ${esc(short(x.outcome, 60))}</span>`,
    '<span class="ln ctx">}</span>',
    x.what && `<span class="pill">${esc(short(x.what, 48))}</span>`,
  ].filter(Boolean);
  return {
    kind: 'readout',
    body: `<div class="code" role="img" aria-label="Summary of ${esc(x.title || 'the project')}">\n${lines.join('\n')}\n</div>`,
  };
}

function logs(list) {
  if (!list.length) return '';
  const articles = list.map((x) => {
    const v = viz(x);
    const facts = [
      ['Role', x.role],
      ['Tools', x.tools],
      ['Year', x.year],
    ].filter(([, val]) => val);
    const beats = [
      ['Problem', x.problem],
      ['What I did', x.built],
      ['Outcome', x.outcome],
    ].filter(([, val]) => val);
    return `    <article class="log" data-viz="${v.kind}">
      <div class="log-head">
        <h3>${esc(x.title || 'Project')}</h3>
        ${x.what ? `<p class="kind">${esc(x.what)}</p>` : ''}
      </div>
      <div class="log-viz">
        <div class="panel">
          <div class="panel-bar"><span>${esc(slugOf(x.title))} / ${v.kind === 'image' ? 'screenshot' : 'summary'}</span><button class="replay" type="button" aria-label="Replay ${esc(x.title || 'project')} animation">Replay</button></div>
          <div class="panel-body">
            ${v.body}
          </div>
        </div>
      </div>
      <div class="log-body">
        ${facts.length ? `<dl class="facts">${facts.map(([k, val]) => `<dt>${k}</dt><dd>${esc(val)}</dd>`).join('')}</dl>` : ''}
        ${beats.map(([k, val]) => `<div class="beat"><h4>${k}</h4><p>${esc(val)}</p></div>`).join('\n        ')}
        ${x.link ? `<p class="g-link"><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Visit the project</a></p>` : ''}
      </div>
    </article>`;
  });
  return `<section class="logs" id="builds" aria-labelledby="h-builds">
    <div class="sec-head">
      <h2 id="h-builds">Build logs</h2>
    </div>
${articles.join('\n')}
  </section>`;
}

function toolbox(p) {
  const used = [
    ...new Set(
      p.projects
        .flatMap((x) => (x.tools ? x.tools.split(',') : []))
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ].filter((t) => !p.skills.includes(t));
  if (!p.skills.length && !used.length) return '';
  const row = (title, sub, items) =>
    `<div class="stack-row">
      <h3>${title}<small>${sub}</small></h3>
      <ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>`;
  return `<section class="stack" id="toolbox" aria-labelledby="h-stack">
    <div class="sec-head"><h2 id="h-stack">Toolbox</h2></div>
    ${p.skills.length ? row('Skills', 'What I work with', p.skills.slice(0, 24)) : ''}
    ${used.length ? row('In my projects', 'Used in the work above', used.slice(0, 16)) : ''}
  </section>`;
}

function path(p) {
  if (!p.jobs.length && !p.education.length) return '';
  const when = (j) => {
    const from = j.from.slice(0, 4);
    const to = j.current ? 'now' : j.to.slice(0, 4);
    return from ? (to && to !== from ? `${from} to ${to}` : from) : '';
  };
  const items = [
    ...p.jobs.map(
      (j) => `      <li>
        <div class="when">${esc(when(j))}</div>
        <div class="what"><h3>${esc(j.title)}</h3>${j.employer || j.place ? `<p class="co">${esc([j.employer, j.place].filter(Boolean).join(', '))}</p>` : ''}${j.points.length ? `<p>${esc(j.points.join(' '))}</p>` : ''}</div>
      </li>`,
    ),
    ...p.education.map(
      (e) => `      <li>
        <div class="when">${esc(e.year)}</div>
        <div class="what"><h3>${esc(e.qualification)}</h3>${e.where ? `<p class="co">${esc(e.where)}</p>` : ''}</div>
      </li>`,
    ),
  ];
  return `<section class="path" id="path" aria-labelledby="h-path">
    <div class="sec-head"><h2 id="h-path">Path so far</h2></div>
    <ol class="tl">
${items.join('\n')}
    </ol>
  </section>`;
}

function contact(p) {
  const links = contactLinks(p).filter((l) => !l.href.startsWith('mailto:'));
  const label = (l) =>
    l.href.startsWith('tel:') ? 'Phone' : l.text === 'Download my CV (PDF)' ? 'CV' : l.text;
  const shown = (l) =>
    l.href.startsWith('tel:')
      ? l.text
      : l.text === 'Download my CV (PDF)'
        ? 'Download (PDF)'
        : l.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return `<section class="contact" id="contact" aria-labelledby="h-contact">
    <h2 id="h-contact">Say hello</h2>
    ${p.availability ? `<p class="lead">${esc(p.availability)}</p>` : ''}
    <a class="mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a>
    ${links.length ? `<div class="links">${links.map((l) => `<a href="${esc(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ''}><span>${esc(label(l))}</span>${esc(shown(l))}</a>`).join('\n      ')}</div>` : ''}
  </section>`;
}

const CSS = `
.panel-body .g-shot{display:block;width:100%;height:auto;max-height:340px;object-fit:cover;object-position:top}
.log-body .g-link a{color:inherit;font-weight:600}
footer a{color:inherit}
`;

/** Extra panel animations for their projects, in the style of the design's own. */
const BUILDERS = `var builders={
    readout:function(root){
      var tl=gsap.timeline();
      tl.from(q(root,'.ln'),{opacity:0,x:-16,duration:0.45,stagger:0.17,ease:'power2.out'})
        .from(q(root,'.ln.add'),{backgroundColor:'rgba(255,176,46,.35)',duration:0.9,stagger:0.1},0.55)
        .from(q(root,'.pill'),{opacity:0,scale:0.8,duration:0.4,ease:'back.out(3)'},'>-0.2');
      return tl;
    },
    image:function(root){
      return gsap.timeline().from(q(root,'img'),{opacity:0,scale:1.06,duration:0.9,ease:'power2.out'});
    },`;

export async function theo(env, p) {
  let html = await loadConcept(env, 'theo');
  const work = p.projects.filter((x) => x.title || x.what || x.image).slice(0, 6);
  const sections = {
    thesis: thesis(p),
    logs: logs(work),
    toolbox: toolbox(p),
    path: path(p),
  };
  const nav = [
    sections.logs && '<a href="#builds">Build logs</a>',
    sections.toolbox && '<a href="#toolbox">Toolbox</a>',
    sections.path && '<a href="#path">Path</a>',
    '<a href="#contact">Contact</a>',
  ]
    .filter(Boolean)
    .join('\n      ');

  html = swapText(
    html,
    '<a class="skip" href="#builds">Skip to build logs</a>',
    sections.logs
      ? '<a class="skip" href="#builds">Skip to build logs</a>'
      : '<a class="skip" href="#contact">Skip to contact</a>',
  );
  html = swap(html, '<header class="hero" id="top">', '</header>', hero(p, nav));
  html = swap(html, '<section class="thesis"', '</section>', sections.thesis);
  html = swap(html, '<section class="logs"', '</section>', sections.logs);
  html = swap(html, '<section class="activity"', '</section>', '');
  html = swap(html, '<section class="stack"', '</section>', sections.toolbox);
  html = swap(html, '<section class="path"', '</section>', sections.path);
  html = swap(html, '<section class="contact"', '</section>', contact(p));
  html = swap(
    html,
    '<footer>',
    '</footer>',
    `<footer>\n    <span>${esc(p.name)}</span>\n    <span>${credit()}</span>\n  </footer>`,
  );

  // The script: no heatmap any more, and panel animations for their projects.
  html = swapText(
    html,
    '/* ================= heatmap ================= */',
    "/* ================= heatmap ================= */\n  if(document.getElementById('heat')){",
  );
  html = swapText(
    html,
    '/* ================= motion ================= */',
    '}\n  /* ================= motion ================= */',
  );
  html = swapText(
    html,
    'ScrollTrigger.create({trigger:heat,',
    'if(heat) ScrollTrigger.create({trigger:heat,',
  );
  html = swapText(html, 'var builders={', BUILDERS);
  html = addCss(html, CSS);
  return finish(html, p);
}

/**
 * Instant template in the Leah Morgan concept's style: Swiss minimal. Light grey, black type,
 * electric blue, Unbounded capitals over Figtree, numbered sections on hairlines.
 */
import { esc, head, fontFaces, contactItems, linkAttrs, credit } from './shared.js';

export function leah(p, { fontBase }) {
  const css = `${fontFaces(fontBase, [
    ['Unbounded', 800, 'unbounded-latin-800-normal.woff2'],
    ['Figtree', 400, 'figtree-latin-400-normal.woff2'],
    ['Figtree', 700, 'figtree-latin-700-normal.woff2'],
  ])}
:root{--bg:#F7F7F7;--ink:#000;--mute:#4D4D4D;--blue:#0000EE;--pad:clamp(16px,3.4vw,48px);--disp:'Unbounded','Arial Black',system-ui,sans-serif;--body:'Figtree',system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font:400 18px/1.55 var(--body)}
a{color:var(--blue)}a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.wrap{max-width:1240px;margin:0 auto;padding:0 var(--pad)}
.top{display:flex;justify-content:space-between;gap:1rem;padding:20px 0;border-bottom:2px solid var(--ink);font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase}
.hero{padding:clamp(48px,10vw,140px) 0 clamp(40px,7vw,90px)}
.name{font:800 clamp(44px,11vw,150px)/.9 var(--disp);text-transform:uppercase;letter-spacing:-.03em;overflow-wrap:anywhere}
.role{margin-top:24px;font-size:clamp(20px,2.6vw,30px);font-weight:700}
.role span{color:var(--blue)}
.summary{max-width:36ch;margin-top:28px;font-size:clamp(20px,2.4vw,28px);line-height:1.35}
section{display:grid;gap:24px;padding:40px 0;border-top:2px solid var(--ink)}
@media(min-width:800px){section{grid-template-columns:3fr 9fr}}
h2{font:800 clamp(22px,2.6vw,30px)/1 var(--disp);text-transform:uppercase}
h2 small{display:block;margin-bottom:10px;font:700 14px var(--body);color:var(--blue)}
.rows{display:grid;gap:0}
.row{display:grid;gap:6px 24px;padding:20px 0;border-bottom:1px solid #c9c9c9}
.row:first-child{padding-top:0}
@media(min-width:800px){.row{grid-template-columns:3fr 6fr}}
.when{color:var(--mute);font-size:15px;font-weight:700}
.row h3{font-size:20px}
.row p,.row li{color:var(--mute)}
.row ul{margin-top:8px;padding-left:1.1em}
.skills{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0}
.skills li{padding:6px 14px;border:2px solid var(--ink);font-weight:700;font-size:15px}
.contact a{display:block;width:fit-content;font:800 clamp(20px,3.4vw,40px)/1.2 var(--disp);text-decoration:none;overflow-wrap:anywhere}
.contact a:hover{text-decoration:underline}
footer{padding:28px 0;border-top:2px solid var(--ink);font-size:14px;color:var(--mute)}
footer a{color:var(--mute)}`;

  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  const section = (title, body) =>
    `<section><h2><small>${num()}</small>${title}</h2><div>${body}</div></section>`;
  const jobs = p.jobs.length
    ? section(
        'Experience',
        `<div class="rows">${p.jobs
          .map(
            (
              j,
            ) => `<article class="row"><p class="when">${esc(j.dates)}</p><div><h3>${esc(j.title)}</h3>
<p>${esc([j.employer, j.place].filter(Boolean).join(', '))}</p>${j.points.length ? `<ul>${j.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></article>`,
          )
          .join('')}</div>`,
      )
    : '';
  const skills = p.skills.length
    ? section(
        'Skills',
        `<ul class="skills">${p.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`,
      )
    : '';
  const education = p.education.length
    ? section(
        'Education',
        `<div class="rows">${p.education
          .map(
            (e) =>
              `<article class="row"><p class="when">${esc(e.year)}</p><div><h3>${esc(e.qualification)}</h3><p>${esc(e.where)}</p></div></article>`,
          )
          .join('')}</div>`,
      )
    : '';
  const contact = section(
    'Contact',
    `<div class="contact">${contactItems(p)
      .map((c) => `<a href="${esc(c.href)}"${linkAttrs(c)}>${esc(c.text)}</a>`)
      .join('')}</div>`,
  );

  return `<!doctype html><html lang="en-GB"><head>${head(p, { css })}</head><body>
<div class="wrap"><header class="top"><span>${esc(p.name)}</span><span>${esc(p.town)}</span></header>
<main><div class="hero"><h1 class="name">${esc(p.name)}</h1>
${p.jobTitle ? `<p class="role"><span>●</span> ${esc(p.jobTitle)}</p>` : ''}
${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}</div>
${jobs}${skills}${education}${contact}</main>
<footer>© ${esc(p.name)} · ${credit}</footer></div></body></html>`;
}

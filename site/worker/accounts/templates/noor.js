/**
 * Instant template in the Noor Haddad concept's style: warm paper, ink, cobalt and a yellow
 * highlighter, Bricolage Grotesque, work as cards, skills as chips, a cobalt contact block.
 */
import { esc, head, fontFaces, contactItems, linkAttrs, credit } from './shared.js';

export function noor(p, { fontBase }) {
  const css = `${fontFaces(fontBase, [['Bricolage Grotesque', '200 800', 'bricolage-grotesque-latin-standard-normal.woff2']])}
:root{--paper:#EDECE6;--ink:#121317;--mute:#55565D;--cobalt:#2D3BFF;--yellow:#FFD23F;--pad:clamp(16px,4vw,56px);--f:'Bricolage Grotesque',system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
*{box-sizing:border-box;margin:0}
body{background:var(--paper);color:var(--ink);font:400 18px/1.55 var(--f)}
a{color:inherit}a:focus-visible{outline:3px solid var(--cobalt);outline-offset:3px}
.wrap{max-width:1180px;margin:0 auto;padding:0 var(--pad)}
.hero{padding:clamp(48px,9vw,120px) 0 clamp(36px,6vw,72px)}
.hi{font-weight:600;color:var(--mute)}
.name{margin-top:12px;font-weight:800;font-size:clamp(48px,10vw,132px);line-height:.92;letter-spacing:-.04em;overflow-wrap:anywhere}
.role{display:inline-block;margin-top:22px;padding:4px 12px;background:var(--yellow);font-weight:700;font-size:clamp(20px,2.4vw,28px);transform:rotate(-1deg)}
.summary{max-width:38ch;margin-top:26px;font-size:clamp(19px,2.2vw,25px);line-height:1.4}
.town{margin-top:14px;color:var(--mute);font-weight:600}
h2{margin:clamp(40px,6vw,72px) 0 22px;font-weight:800;font-size:clamp(30px,4vw,48px);letter-spacing:-.02em}
.cards{display:grid;gap:16px}
@media(min-width:820px){.cards{grid-template-columns:1fr 1fr}}
.card{padding:24px 26px;background:#fff;border-left:6px solid var(--cobalt);border-radius:4px}
.card .when{font-size:14px;font-weight:700;color:var(--cobalt);letter-spacing:.03em;text-transform:uppercase}
.card h3{margin-top:6px;font-size:22px;font-weight:800}
.card .at{color:var(--mute);font-weight:600}
.card ul{margin-top:10px;padding-left:1.1em}
.chips{display:flex;flex-wrap:wrap;gap:10px;list-style:none;padding:0}
.chips li{padding:8px 16px;border-radius:999px;background:var(--ink);color:var(--paper);font-weight:600;font-size:16px}
.edu{display:grid;gap:12px;list-style:none;padding:0}
.edu li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 16px;padding:16px 0;border-bottom:2px solid var(--ink)}
.edu strong{font-size:20px}
.contact{margin:clamp(48px,7vw,90px) 0 0;padding:clamp(32px,6vw,64px) var(--pad);background:var(--cobalt);color:#fff;border-radius:8px}
.contact h2{margin-top:0;color:#fff}
.contact a{display:block;width:fit-content;margin-top:8px;font-weight:700;font-size:clamp(20px,2.8vw,32px);text-underline-offset:.15em;overflow-wrap:anywhere}
.contact a:focus-visible{outline-color:var(--yellow)}
footer{padding:28px 0 36px;color:var(--mute);font-size:14px}`;

  const jobs = p.jobs.length
    ? `<h2>Experience</h2><div class="cards">${p.jobs
        .map(
          (j) => `<article class="card"><p class="when">${esc(j.dates)}</p><h3>${esc(j.title)}</h3>
<p class="at">${esc([j.employer, j.place].filter(Boolean).join(' · '))}</p>${j.points.length ? `<ul>${j.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</article>`,
        )
        .join('')}</div>`
    : '';
  const skills = p.skills.length
    ? `<h2>What I’m good at</h2><ul class="chips">${p.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';
  const education = p.education.length
    ? `<h2>Education</h2><ul class="edu">${p.education
        .map(
          (e) =>
            `<li><span><strong>${esc(e.qualification)}</strong><br>${esc(e.where)}</span><span>${esc(e.year)}</span></li>`,
        )
        .join('')}</ul>`
    : '';

  return `<!doctype html><html lang="en-GB"><head>${head(p, { css })}</head><body><div class="wrap">
<main><div class="hero"><p class="hi">Hello, I’m</p><h1 class="name">${esc(p.name)}</h1>
${p.jobTitle ? `<p class="role">${esc(p.jobTitle)}</p>` : ''}
${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}${p.town ? `<p class="town">Based in ${esc(p.town)}</p>` : ''}</div>
${jobs}${skills}${education}
<section class="contact" aria-labelledby="c-h"><h2 id="c-h">Get in touch</h2>
${contactItems(p)
  .map((c) => `<a href="${esc(c.href)}"${linkAttrs(c)}>${esc(c.text)}</a>`)
  .join('')}</section></main>
<footer>© ${esc(p.name)} · ${credit}</footer></div></body></html>`;
}

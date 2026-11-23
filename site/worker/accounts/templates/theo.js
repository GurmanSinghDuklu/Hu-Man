/**
 * Instant template in the Theo Lindqvist concept's style: dark and technical. Near-black ground,
 * warm white type, amber accent, Big Shoulders Display capitals, IBM Plex Sans and Mono, a path
 * timeline and a toolbox grid.
 */
import { esc, head, fontFaces, contactItems, linkAttrs, credit } from './shared.js';

export function theo(p, { fontBase }) {
  const css = `${fontFaces(fontBase, [
    ['Big Shoulders Display', 800, 'big-shoulders-display-latin-800-normal.woff2'],
    ['IBM Plex Sans', 400, 'ibm-plex-sans-latin-400-normal.woff2'],
    ['IBM Plex Sans', 500, 'ibm-plex-sans-latin-500-normal.woff2'],
    ['IBM Plex Mono', 400, 'ibm-plex-mono-latin-400-normal.woff2'],
  ])}
:root{--ground:#131518;--raise:#1a1d21;--line:#2b2f35;--text:#ece8df;--muted:#a2a5a8;--amber:#ffb02e;--pad:clamp(16px,4vw,56px);--disp:'Big Shoulders Display',Impact,system-ui,sans-serif;--sans:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;--mono:'IBM Plex Mono',ui-monospace,Menlo,monospace}
*{box-sizing:border-box;margin:0}
body{background:var(--ground);color:var(--text);font:400 17px/1.6 var(--sans)}
a{color:var(--amber)}a:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
.wrap{max-width:1160px;margin:0 auto;padding:0 var(--pad)}
.bar{display:flex;justify-content:space-between;gap:1rem;padding:18px 0;border-bottom:1px solid var(--line);font:400 13px var(--mono);color:var(--muted)}
.bar b{color:var(--amber);font-weight:400}
.hero{padding:clamp(56px,10vw,130px) 0 clamp(40px,6vw,80px)}
.name{font:800 clamp(56px,12vw,168px)/.85 var(--disp);text-transform:uppercase;letter-spacing:.01em;overflow-wrap:anywhere}
.role{margin-top:20px;font:400 clamp(15px,1.6vw,18px) var(--mono);color:var(--amber)}
.role::before{content:'> '}
.summary{max-width:44ch;margin-top:22px;font-size:clamp(19px,2.1vw,24px);line-height:1.45}
h2{display:flex;align-items:baseline;gap:14px;margin:clamp(40px,6vw,76px) 0 20px;font:800 clamp(34px,4.6vw,56px)/1 var(--disp);text-transform:uppercase}
h2::before{content:attr(data-n);font:400 14px var(--mono);color:var(--amber)}
.path{list-style:none;padding:0;border-left:1px solid var(--line)}
.path>li{position:relative;padding:0 0 28px 26px}
.path>li::before{content:'';position:absolute;left:-5px;top:8px;width:9px;height:9px;background:var(--amber)}
.path .when{font:400 13px var(--mono);color:var(--muted)}
.path h3{font-size:20px;font-weight:500}
.path .at{color:var(--muted)}
.path ul{margin-top:8px;padding-left:1.1em;color:#cfcac0}
.path ul li{padding:2px 0}
.tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);list-style:none;padding:0}
.tools li{padding:14px 16px;background:var(--raise);font:400 14px var(--mono)}
.edu{list-style:none;padding:0}
.edu li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 16px;padding:14px 0;border-bottom:1px solid var(--line)}
.edu span{color:var(--muted);font-family:var(--mono);font-size:14px}
.hello{margin-top:clamp(48px,7vw,90px);padding:clamp(28px,5vw,48px);background:var(--raise);border:1px solid var(--line)}
.hello h2{margin-top:0}
.hello a{display:block;width:fit-content;margin-top:6px;font:400 clamp(17px,2vw,22px) var(--mono);overflow-wrap:anywhere}
footer{padding:28px 0 40px;font:400 13px var(--mono);color:var(--muted)}
footer a{color:var(--muted)}`;

  let n = 0;
  const h2 = (text, id) => `<h2 id="${id}" data-n="${String(++n).padStart(2, '0')}">${text}</h2>`;
  const path = p.jobs.length
    ? `${h2('Path so far', 'h-path')}<ol class="path">${p.jobs
        .map(
          (
            j,
          ) => `<li><p class="when">${esc(j.dates)}</p><h3>${esc(j.title)}</h3><p class="at">${esc([j.employer, j.place].filter(Boolean).join(' · '))}</p>
${j.points.length ? `<ul>${j.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`,
        )
        .join('')}</ol>`
    : '';
  const tools = p.skills.length
    ? `${h2('Toolbox', 'h-tools')}<ul class="tools">${p.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';
  const education = p.education.length
    ? `${h2('Education', 'h-edu')}<ul class="edu">${p.education
        .map(
          (e) =>
            `<li><strong>${esc(e.qualification)}</strong><span>${esc([e.where, e.year].filter(Boolean).join(' · '))}</span></li>`,
        )
        .join('')}</ul>`
    : '';

  return `<!doctype html><html lang="en-GB"><head>${head(p, { css })}</head><body><div class="wrap">
<header class="bar"><span>${esc(p.name.toLowerCase().replace(/\s+/g, '.'))}</span><span>${p.town ? `<b>●</b> ${esc(p.town)}` : ''}</span></header>
<main><div class="hero"><h1 class="name">${esc(p.name)}</h1>${p.jobTitle ? `<p class="role">${esc(p.jobTitle)}</p>` : ''}
${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}</div>
${path}${tools}${education}
<section class="hello" aria-labelledby="h-hello">${h2('Say hello', 'h-hello')}
${contactItems(p)
  .map((c) => `<a href="${esc(c.href)}"${linkAttrs(c)}>${esc(c.text)}</a>`)
  .join('')}</section></main>
<footer>© ${esc(p.name)} · ${credit}</footer></div></body></html>`;
}

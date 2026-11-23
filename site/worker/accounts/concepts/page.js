/**
 * Instant portfolios are the real concept pages (public/concepts/<slug>/index.html) with the
 * customer's content put in: same CSS, structure and animations. Each design's renderer (noor.js,
 * leah.js…) loads the page with loadConcept(), swaps the parts that hold sample content with swap(),
 * and leaves out any part the customer gave nothing for. Sample words, people and photos never
 * survive: a part that can't be filled is removed, and the tests check no sample text is left.
 *
 * What changes on every design: the Hu/man badge, preview.js and the noindex line go; the page gets
 * the customer's title, description and Person structured data; the shared fonts and scripts
 * (../fonts/, ../vendor/) are copied into the site itself, so it needs nothing from our domain.
 */
import { esc } from './profile.js';

/** The concept page's HTML, read from the site's own static files. */
export async function loadConcept(env, slug) {
  const res = await env.ASSETS.fetch(
    new Request(`https://assets.local/concepts/${slug}/index.html`),
  );
  if (!res.ok) throw new Error(`The ${slug} design couldn't be loaded (${res.status}).`);
  return res.text();
}

/**
 * Replaces the part of `html` from `start` up to and including `end` (the first `end` after
 * `start`). Throws if either is missing, so a change to the concept page fails the tests instead
 * of quietly leaving sample content in a customer's site.
 */
export function swap(html, start, end, replacement) {
  const from = html.indexOf(start);
  if (from < 0) throw new Error(`Design changed: can't find ${start.slice(0, 60)}`);
  const stop = html.indexOf(end, from + start.length);
  if (stop < 0) throw new Error(`Design changed: can't find the end of ${start.slice(0, 60)}`);
  return html.slice(0, from) + replacement + html.slice(stop + end.length);
}

/** Like swap() for an exact piece of text. */
export function swapText(html, text, replacement) {
  if (!html.includes(text)) throw new Error(`Design changed: can't find ${text.slice(0, 60)}`);
  return html.replace(text, () => replacement);
}

/** Adds CSS at the end of the page's last <style>. */
export const addCss = (html, css) => {
  const at = html.lastIndexOf('</style>');
  return at < 0 ? html : html.slice(0, at) + css + html.slice(at);
};

function personLd(p) {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    ...(p.jobTitle && { jobTitle: p.jobTitle }),
    ...(p.town && { address: { '@type': 'PostalAddress', addressLocality: p.town } }),
    ...(p.links.length && { sameAs: p.links.map((l) => l.url) }),
  };
  // JSON in a script tag: "<" escaped so text can never close the tag.
  return JSON.stringify(person).replace(/</g, '\\u003c');
}

/**
 * The parts every design shares: title, description and structured data in; badge, preview
 * script and noindex out; shared fonts and scripts made local. Returns the page and the files to
 * copy next to it ({ from: path on our site, to: path in theirs }).
 */
export function finish(html, p) {
  const description = [p.jobTitle, p.town].filter(Boolean).join(' in ') || 'Portfolio';
  html = html.replace(/<meta name="robots"[^>]*>\s*/i, '');
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    () =>
      `<title>${esc(p.name)}${p.jobTitle ? ` · ${esc(p.jobTitle)}` : ''}</title>
<meta name="description" content="${esc(`${p.name}: ${description}.`)}">
<script type="application/ld+json">${personLd(p)}</script>`,
  );
  html = html.replace(/<div class="badge"[\s\S]*?<\/div>\s*/i, '');
  html = html.replace(/<script src="\.\.\/preview\.js"[^>]*><\/script>\s*/i, '');
  const assets = new Map();
  html = html.replace(/\.\.\/(vendor|fonts)\/([\w.-]+)/g, (_, dir, file) => {
    assets.set(`${dir}/${file}`, { from: `/concepts/${dir}/${file}`, to: `${dir}/${file}` });
    return `${dir}/${file}`;
  });
  return { html, assets: [...assets.values()] };
}

/** The first sentence of some text, and the rest. */
export function firstSentence(text) {
  const t = String(text ?? '').trim();
  const m = t.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  return m ? [m[1], m[3].trim()] : [t, ''];
}

/** A YYYY-MM month's year as a number, or null. */
export const yearOf = (ym) => {
  const m = String(ym ?? '').match(/^(\d{4})-\d{2}$/);
  return m ? Number(m[1]) : null;
};

/** Contact links for a page: email, phone, their links, CV. */
export function contactLinks(p) {
  return [
    ...(p.email ? [{ href: `mailto:${p.email}`, text: p.email }] : []),
    ...(p.phone ? [{ href: `tel:${p.phone.replace(/[^\d+]/g, '')}`, text: p.phone }] : []),
    ...p.links.map((l) => ({ href: l.url, text: l.label, external: true })),
    ...(p.cvUrl ? [{ href: p.cvUrl, text: 'Download my CV (PDF)' }] : []),
  ];
}

export const linkHtml = (l, cls = '') =>
  `<a${cls ? ` class="${cls}"` : ''} href="${esc(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(l.text)}</a>`;

export const credit = (year = new Date().getFullYear()) =>
  `<a href="https://humansoftwareagency.com/portfolio/" target="_blank" rel="noopener">Site by Hu/man</a> · ${year}`;

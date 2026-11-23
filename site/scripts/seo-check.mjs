/**
 * Checks the built site (dist/) for everything search engines and AI tools rely on, and fails if
 * anything is off. Run after `npm run build`; CI runs it on every push.
 *
 * Per page: title (<= 60 chars), meta description (70-160), one h1, lang="en-GB", canonical that
 * matches the page and the sitemap, robots meta, Open Graph image that exists, JSON-LD that parses
 * into a linked @graph (business, website, page) whose @id links point at real pages, every image
 * with alt text and dimensions, and every internal link and #anchor resolving.
 * Site-wide: sitemap lists exactly the indexable pages, robots.txt points at it, llms.txt links
 * work, and no placeholder domain is left anywhere.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const noindexBuild = Boolean(process.env.PUBLIC_NOINDEX);
/** Pages that are never indexed (src/data/pages.ts `noindex`). */
const NOINDEX_FILES = new Set([
  '404.html',
  'thanks/index.html',
  // The client area (worker/accounts/).
  'login/index.html',
  'account/index.html',
  'account/setup/index.html',
  'account/brief/index.html',
  'admin/index.html',
  'admin/client/index.html',
]);

async function walk(dir, prefix = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(`${dir}${entry.name}/`, `${rel}/`)));
    else out.push(rel);
  }
  return out;
}

const files = await walk(dist);
const fileSet = new Set(files);
// Concept portfolios (public/concepts/) are standalone, noindex pages with their own checks below.
const isConcept = (f) => f.startsWith('concepts/');
const conceptFiles = files.filter((f) => isConcept(f) && f.endsWith('.html'));
const htmlFiles = files.filter((f) => f.endsWith('.html') && !isConcept(f));
const html = Object.fromEntries(
  await Promise.all(htmlFiles.map(async (f) => [f, await readFile(`${dist}${f}`, 'utf8')])),
);

// The site's origin and base path, from the home page canonical (or og:url on a noindex build).
const homeUrl = (html['index.html'].match(/property="og:url" content="([^"]+)"/) ?? [])[1];
if (!homeUrl) throw new Error('No og:url on the home page.');
const origin = new URL(homeUrl).origin;
const basePath = new URL(homeUrl).pathname; // "/" or "/Hu-Man/"

/** "/about/" (site path, with base) -> "about/index.html" (dist file). */
function fileFor(pathname) {
  let p = decodeURIComponent(pathname);
  // The enquiry endpoint is served by the Worker (worker/), not a file in dist/.
  if (p === `${basePath}api/enquiry`) return 'api/enquiry';
  if (!p.startsWith(basePath)) return undefined;
  p = p.slice(basePath.length);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return fileSet.has(p) ? p : fileSet.has(`${p}/index.html`) ? `${p}/index.html` : undefined;
}

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [])[1];
const meta = (doc, key) =>
  (doc.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`)) ?? [])[1];
const idsIn = (doc) => new Set([...doc.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<');

const indexable = [];
/** Page URL -> the video URLs its schema describes (for the sitemap check). */
const pageVideos = new Map();

for (const file of htmlFiles) {
  const doc = html[file];
  const is404 = NOINDEX_FILES.has(file);
  const pagePath = `${basePath}${file.replace(/index\.html$/, '')}`;
  const where = pagePath;

  if (!/<html lang="en-GB"/.test(doc)) fail(where, 'html lang is not en-GB');

  const title = decode((doc.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '');
  if (!title) fail(where, 'no <title>');
  else if (title.length > 60) fail(where, `title is ${title.length} chars (max 60): "${title}"`);

  const description = decode(meta(doc, 'description') ?? '');
  if (!is404 && (description.length < 70 || description.length > 160)) {
    fail(where, `description is ${description.length} chars (want 70-160)`);
  }

  const h1s = (doc.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(where, `${h1s} h1 elements (want 1)`);

  const robots = meta(doc, 'robots') ?? '';
  const canonical = (doc.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
  if (is404 || noindexBuild) {
    if (!robots.includes('noindex')) fail(where, 'should be noindex');
    if (canonical) fail(where, 'noindex page should have no canonical');
  } else {
    if (!robots.startsWith('index')) fail(where, `robots meta is "${robots}"`);
    if (!canonical) fail(where, 'no canonical');
    else if (canonical !== `${origin}${pagePath}`) {
      fail(where, `canonical ${canonical} is not ${origin}${pagePath}`);
    }
    indexable.push(`${origin}${pagePath}`);
  }

  for (const key of [
    'og:title',
    'og:description',
    'og:url',
    'og:image',
    'og:image:alt',
    'twitter:card',
  ]) {
    if (!meta(doc, key)) fail(where, `no ${key}`);
  }
  const ogImage = meta(doc, 'og:image');
  if (ogImage && !fileFor(new URL(ogImage).pathname)) fail(where, `og:image ${ogImage} is missing`);

  // JSON-LD
  const ld = doc.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!is404) {
    if (!ld) fail(where, 'no JSON-LD');
    else {
      let data;
      try {
        data = JSON.parse(ld[1]);
      } catch (e) {
        fail(where, `JSON-LD does not parse: ${e.message}`);
      }
      const graph = data?.['@graph'] ?? [];
      const types = graph.map((n) => [n['@type']].flat()).flat();
      for (const t of ['ProfessionalService', 'WebSite']) {
        if (!types.includes(t)) fail(where, `JSON-LD has no ${t}`);
      }
      if (!graph.some((n) => n['@id'] === `${origin}${pagePath}#webpage`)) {
        fail(where, 'JSON-LD has no WebPage node for this URL');
      }
      // Every @id must point at a page that exists.
      const refs = JSON.stringify(data).matchAll(/"@id":"([^"]+)"/g);
      for (const [, id] of refs) {
        const u = new URL(id);
        if (u.origin !== origin || !fileFor(u.pathname))
          fail(where, `JSON-LD @id ${id} points nowhere`);
      }
      // Every URL in the schema on our own origin must exist.
      for (const [, u] of JSON.stringify(data).matchAll(/"(https?:\/\/[^"]+)"/g)) {
        const url = new URL(u);
        if (url.origin === origin && !fileFor(url.pathname))
          fail(where, `JSON-LD URL ${u} is missing`);
      }
      // Hero videos (src/data/heroVideos.ts): the schema describes exactly the videos the page
      // plays, each with what Google requires, and the sitemap lists the same ones (checked below).
      const played = [...doc.matchAll(/\sdata-hv-src="([^"]+)"/g)].map((m) => `${origin}${m[1]}`);
      const described = graph.filter((n) => n['@type'] === 'VideoObject');
      const describedUrls = described.map((v) => v.contentUrl);
      for (const u of played)
        if (!describedUrls.includes(u))
          fail(where, `plays ${u} but its schema has no VideoObject for it`);
      for (const v of described) {
        if (!played.includes(v.contentUrl))
          fail(where, `schema describes ${v.contentUrl}, which the page does not play`);
        for (const field of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'duration'])
          if (!v[field]) fail(where, `VideoObject has no ${field}`);
      }
      if (described.length) pageVideos.set(`${origin}${pagePath}`, describedUrls);
    }
  }

  // Images: alt text (empty is fine for decoration) and dimensions (no layout shift).
  for (const [tag] of doc.matchAll(/<img\s[^>]*>/g)) {
    if (attr(tag, 'alt') === undefined) fail(where, `image without alt: ${tag.slice(0, 80)}`);
    if (!attr(tag, 'width') || !attr(tag, 'height'))
      fail(where, `image without width/height: ${tag.slice(0, 80)}`);
  }

  // Internal links and anchors.
  const markup = doc.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [, href] of markup.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    if (/^(mailto:|tel:|https?:\/\/(?!localhost))/.test(href) && !href.startsWith(origin)) continue;
    const url = new URL(decode(href), `${origin}${pagePath}`);
    if (url.origin !== origin) continue;
    const target = fileFor(url.pathname);
    if (!target) {
      fail(where, `broken link ${href}`);
      continue;
    }
    if (url.pathname !== '/' && !url.pathname.endsWith('/') && target.endsWith('index.html')) {
      fail(where, `link without trailing slash ${href} (redirects)`);
    }
    const hash = url.hash.slice(1);
    if (hash && target.endsWith('.html') && !idsIn(html[target]).has(hash)) {
      fail(where, `link ${href} points at a missing #${hash}`);
    }
  }
}

// GEO: everything a visitor can read must reach crawlers and AI tools that don't run JavaScript.
const rawText = (doc) =>
  decode(
    doc.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');
for (const file of htmlFiles) {
  const doc = html[file];
  const where = `${basePath}${file.replace(/index\.html$/, '')}`;
  if (/nosnippet|data-nosnippet|noarchive|noai|noimageai/.test(doc))
    fail(where, 'limits snippets or AI use');
  if (NOINDEX_FILES.has(file)) continue;
  // A Markdown copy of the page, linked from it.
  const md = (doc.match(/<link rel="alternate" type="text\/markdown"[^>]*href="([^"]+)"/) ?? [])[1];
  if (!md) fail(where, 'no Markdown alternate link');
  else if (
    !fileSet.has(`${file}.md`) ||
    !md.endsWith(`${file.replace(/index\.html$/, '')}index.html.md`)
  ) {
    fail(where, `Markdown copy ${md} is missing`);
  }
  // Contact details in the raw HTML: the email on every page (footer), the phone on the contact
  // page only (Gurman took it out of the footer, 2026-10-27).
  const facts = ['humansoftwareagency@gmail.com'];
  if (file === 'contact/index.html') facts.push('+44 7988 450280');
  for (const fact of facts) {
    if (!rawText(doc).includes(fact)) fail(where, `"${fact}" is not in the raw HTML`);
  }
}

// The facts in llms-full.txt's tables and lists must be on the pages, as plain HTML text.
const llmsFull = await readFile(`${dist}llms-full.txt`, 'utf8');
const pricingText = rawText(html['pricing/index.html'] ?? '');
for (const [, tier, price] of llmsFull.matchAll(/^\| ([^|]+) \| (£[\d,]+) \|/gm)) {
  if (!pricingText.includes(tier.trim()) || !pricingText.includes(price)) {
    fail('pricing', `tier "${tier.trim()} ${price}" is in llms-full.txt but not in the page text`);
  }
}
const aboutText = rawText(html['about/index.html'] ?? '');
const faqBlock = llmsFull.split('## Frequently asked questions')[1]?.split('\n## ')[0] ?? '';
for (const [, q, a] of faqBlock.matchAll(/### (.+)\n\n(.+)/g)) {
  // The FAQ lives on /about/ (moved from /pricing, 2026-11-14).
  if (!aboutText.includes(q) || !aboutText.includes(a))
    fail('about', `FAQ "${q}" differs from llms-full.txt`);
}
if (!llmsFull.includes('# Every page, word for word')) fail('llms-full.txt', 'no full page text');
for (const file of htmlFiles.filter((f) => !NOINDEX_FILES.has(f))) {
  if (!llmsFull.includes(`Source: ${origin}${basePath}${file.replace(/index\.html$/, '')}\n`)) {
    fail('llms-full.txt', `has no full text for ${file}`);
  }
}

// Nothing may shut out a crawler: robots.txt rules, and the host's header file.
const headersFile = await readFile(`${dist}_headers`, 'utf8').catch(() => '');
if (/X-Robots-Tag/i.test(headersFile) && !noindexBuild)
  fail('_headers', 'sets X-Robots-Tag on the live site');

// Concept portfolios: noindex, self-hosted (no third-party host) and absent from the sitemap.
// Every concept in the data file has a page, and every page is in the data file.
const conceptSlugs = [
  ...(
    await readFile(new URL('../src/data/portfolioConcepts.ts', import.meta.url), 'utf8')
  ).matchAll(/slug: '([^']+)'/g),
].map((m) => m[1]);
if (new Set(conceptSlugs).size !== conceptSlugs.length)
  fail('concepts', 'a slug is listed twice in portfolioConcepts.ts (borrow the entry instead)');
for (const slug of conceptSlugs)
  if (!conceptFiles.includes(`concepts/${slug}/index.html`))
    fail('concepts', `no page for ${slug}`);
if (conceptFiles.length !== conceptSlugs.length)
  fail('concepts', `${conceptFiles.length} concept pages, ${conceptSlugs.length} in the data file`);
for (const f of conceptFiles) {
  const doc = await readFile(`${dist}${f}`, 'utf8');
  if (!/<meta name="robots" content="noindex,nofollow">/.test(doc)) fail(f, 'not noindex,nofollow');
  if (!/<html lang="en-GB"/.test(doc)) fail(f, 'html lang is not en-GB');
  if (/googleapis|gstatic|cdnjs|jsdelivr|unpkg|https?:\/\/(?!www\.w3\.org)/.test(doc))
    fail(f, 'references an outside host');
  if (!/href="\.\.\/\.\.\/(?:portfolio|business-websites)\/"/.test(doc))
    fail(f, 'no link back to the portfolio or business websites page');
  if (!/<script src="\.\.\/preview\.js" defer><\/script>/.test(doc)) fail(f, 'no preview script');
  for (const [, ref] of doc.matchAll(/(?:src|url)\(?=?["']?(\.\.\/(?:fonts|vendor)\/[^"')\s]+)/g)) {
    if (!fileSet.has(`concepts/${ref.slice(3)}`)) fail(f, `missing asset ${ref}`);
  }
}

// Sitemap: exactly the indexable pages.
if (!noindexBuild) {
  const sitemap = await readFile(`${dist}sitemap-0.xml`, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of indexable) if (!locs.includes(u)) fail('sitemap', `missing ${u}`);
  for (const u of locs)
    if (!indexable.includes(u)) fail('sitemap', `lists ${u}, which is not an indexable page`);
  // Dates come from git history; a build machine without it (Cloudflare's) leaves them out, which
  // is harmless, so this warns rather than fails.
  for (const [page, videos] of pageVideos) {
    const entry = sitemap.slice(sitemap.indexOf(`<loc>${page}</loc>`)).split('</url>')[0];
    for (const v of videos)
      if (!entry.includes(`<video:content_loc>${v}</video:content_loc>`))
        fail('sitemap', `${page} has no video entry for ${v}`);
  }
  if (!/<lastmod>/.test(sitemap)) console.warn('SEO check: warning: sitemap has no lastmod dates');
}

const robots = await readFile(`${dist}robots.txt`, 'utf8');
// The Worker (worker/pages.js) serves the indexable pages itself: its build manifest and
// wrangler.toml's run_worker_first must both list exactly those pages. Preview builds under a base
// path have no Worker.
if (basePath === '/' && !noindexBuild) {
  const manifest = JSON.parse(
    await readFile(new URL('../worker/pages.json', import.meta.url), 'utf8'),
  );
  const wrangler = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const firstBlock = (wrangler.match(/run_worker_first = \[([\s\S]*?)\]/) ?? [])[1] ?? '';
  const first = [...firstBlock.matchAll(/"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((path) => !['/api/*', '/admin', '/admin/*', '/preview/*'].includes(path)) // not pages
    .sort();
  if (!firstBlock.includes('"/api/*"')) fail('wrangler.toml', 'run_worker_first lacks "/api/*"');
  // The dashboard is only served after the Worker checks for an admin (gateAdminPages).
  for (const gate of ['"/admin"', '"/admin/*"', '"/preview/*"'])
    if (!firstBlock.includes(gate)) fail('wrangler.toml', `run_worker_first lacks ${gate}`);
  const want = indexable.map((u) => new URL(u).pathname).sort();
  const listed = Object.keys(manifest.pages).sort();
  if (want.join() !== listed.join())
    fail('worker/pages.json', `lists ${listed.join(' ')}, the site has ${want.join(' ')}`);
  if (want.join() !== first.join())
    fail(
      'wrangler.toml',
      `run_worker_first lists ${first.join(' ')}, the site has ${want.join(' ')}`,
    );
  for (const [path, page] of Object.entries(manifest.pages))
    for (const link of page.preload) {
      const href = (link.match(/^<([^>]+)>/) ?? [])[1];
      if (!href || !fileFor(href)) fail('worker/pages.json', `${path} preloads missing ${href}`);
    }
}

if (!robots.includes(`Sitemap: ${origin}${basePath}sitemap-index.xml`))
  fail('robots.txt', 'wrong or missing Sitemap line');
if (/^Disallow:\s*\S/m.test(robots)) fail('robots.txt', 'disallows something');
for (const agent of [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended',
]) {
  if (!robots.includes(`User-agent: ${agent}`)) fail('robots.txt', `does not name ${agent}`);
}

for (const name of ['llms.txt', 'llms-full.txt']) {
  const text = await readFile(`${dist}${name}`, 'utf8');
  for (const [, u] of text.matchAll(/\]\((https?:[^)]+)\)/g)) {
    const url = new URL(u);
    if (url.origin === origin && !fileFor(url.pathname)) fail(name, `broken link ${u}`);
  }
}

// No placeholder domain anywhere in what ships.
for (const f of files.filter((f) => /\.(html|txt|xml|json|webmanifest)$/.test(f))) {
  if ((await readFile(`${dist}${f}`, 'utf8')).includes('example.com'))
    fail(f, 'contains example.com');
}

if (errors.length) {
  console.error(
    `SEO check: ${errors.length} problem(s)\n${errors.map((e) => `  - ${e}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `SEO check: ${htmlFiles.length} pages (+${conceptFiles.length} concepts), ${indexable.length} indexable, all clear.`,
);

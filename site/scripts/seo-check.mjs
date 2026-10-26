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
const htmlFiles = files.filter((f) => f.endsWith('.html'));
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

for (const file of htmlFiles) {
  const doc = html[file];
  const is404 = file === '404.html';
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
    }
  }

  // Images: alt text (empty is fine for decoration) and dimensions (no layout shift).
  for (const [tag] of doc.matchAll(/<img\s[^>]*>/g)) {
    if (attr(tag, 'alt') === undefined) fail(where, `image without alt: ${tag.slice(0, 80)}`);
    if (!attr(tag, 'width') || !attr(tag, 'height'))
      fail(where, `image without width/height: ${tag.slice(0, 80)}`);
  }

  // Internal links and anchors.
  for (const [, href] of doc.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
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

// Sitemap: exactly the indexable pages.
if (!noindexBuild) {
  const sitemap = await readFile(`${dist}sitemap-0.xml`, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of indexable) if (!locs.includes(u)) fail('sitemap', `missing ${u}`);
  for (const u of locs)
    if (!indexable.includes(u)) fail('sitemap', `lists ${u}, which is not an indexable page`);
  if (!/<lastmod>/.test(sitemap)) fail('sitemap', 'no lastmod dates');
}

const robots = await readFile(`${dist}robots.txt`, 'utf8');
if (!robots.includes(`Sitemap: ${origin}${basePath}sitemap-index.xml`))
  fail('robots.txt', 'wrong or missing Sitemap line');
if (/Disallow: \/\s*$/m.test(robots)) fail('robots.txt', 'disallows the whole site');

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
console.log(`SEO check: ${htmlFiles.length} pages, ${indexable.length} indexable, all clear.`);

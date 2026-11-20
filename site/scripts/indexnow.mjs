/**
 * Tells IndexNow (Bing, and through it Copilot and ChatGPT search, plus Yandex, Seznam and Naver)
 * that the site's pages changed, so they recrawl in hours instead of weeks. Google doesn't use
 * IndexNow; it reads the sitemap submitted in Search Console.
 *
 * Normally this runs by itself: `npm run deploy` (scripts/deploy.mjs) sends only the pages whose
 * date changed. By hand, after a production deploy, from site/: `npm run build && npm run indexnow`
 * sends every page in dist/sitemap-0.xml. Add `-- --dry-run` to see what would be sent.
 * The key is the public/<key>.txt file, which must be live at the site root first.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Every page in the built sitemap, with its lastmod (or '' if it has none). */
export async function builtSitemap() {
  const sitemap = await readFile(`${root}dist/sitemap-0.xml`, 'utf8').catch(() => '');
  const pages = sitemapDates(sitemap);
  if (pages.size === 0)
    throw new Error('No URLs in dist/sitemap-0.xml: run `npm run build` first.');
  return pages;
}

/** A sitemap's pages as Map(url -> lastmod). */
export function sitemapDates(xml) {
  const pages = new Map();
  for (const [, entry] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (entry.match(/<loc>([^<]+)<\/loc>/) ?? [])[1];
    if (loc) pages.set(loc, (entry.match(/<lastmod>([^<]+)<\/lastmod>/) ?? [])[1] ?? '');
  }
  return pages;
}

/** Refuses anything but the live domain (previews and example builds must never be submitted). */
export function liveOrigin(urls) {
  const { host, origin } = new URL(urls[0]);
  if (host === 'example.com' || host.endsWith('github.io') || host === 'localhost') {
    throw new Error(`Refusing ${host}: IndexNow is for the live domain only.`);
  }
  return { host, origin };
}

/** Sends the URLs to IndexNow. Returns true when accepted (200, or 202 while the key is checked). */
export async function submitIndexNow(urlList, { dryRun = false } = {}) {
  const keyFile = (await readdir(`${root}public`)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex>.txt) found.');
  const key = keyFile.replace('.txt', '');
  const { host, origin } = liveOrigin(urlList);

  console.log(`IndexNow: ${urlList.length} URLs for ${host}`);
  urlList.forEach((u) => console.log(`  ${u}`));
  if (dryRun) return true;

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList }),
    signal: AbortSignal.timeout(15000),
  });
  console.log(`IndexNow answered ${res.status} ${res.statusText}`);
  return res.status === 200 || res.status === 202;
}

// Run by hand: submit every page.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const urls = [...(await builtSitemap()).keys()];
  const ok = await submitIndexNow(urls, { dryRun: process.argv.includes('--dry-run') });
  if (!ok) process.exit(1);
}

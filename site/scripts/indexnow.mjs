/**
 * Tells IndexNow (Bing, and through it Copilot and ChatGPT search, plus Yandex, Seznam and Naver)
 * that the site's pages changed, so they recrawl in hours instead of weeks. Google doesn't use
 * IndexNow; it reads the sitemap submitted in Search Console.
 *
 * Run AFTER a production deploy, from site/: `npm run build && npm run indexnow`
 * (it reads the URLs from dist/sitemap-0.xml). Add `-- --dry-run` to see what would be sent.
 * The key is the public/<key>.txt file, which must be live at the site root first.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dryRun = process.argv.includes('--dry-run');

const keyFile = (await readdir(`${root}public`)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex>.txt) found.');
const key = keyFile.replace('.txt', '');

const sitemap = await readFile(`${root}dist/sitemap-0.xml`, 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0)
  throw new Error('No URLs in dist/sitemap-0.xml: run `npm run build` first.');

const { host, origin } = new URL(urlList[0]);
if (host === 'example.com' || host.endsWith('github.io')) {
  throw new Error(`Refusing to submit ${host}: IndexNow is for the live domain only.`);
}

const body = { host, key, keyLocation: `${origin}/${key}.txt`, urlList };
console.log(`IndexNow: ${urlList.length} URLs for ${host}`);
urlList.forEach((u) => console.log(`  ${u}`));
if (dryRun) process.exit(0);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
// 200 = accepted, 202 = accepted (key check pending). Anything else is an error.
console.log(`IndexNow answered ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);

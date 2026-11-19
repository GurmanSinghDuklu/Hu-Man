/**
 * Writes worker/pages.json after each production build: what the Worker (worker/pages.js) needs
 * for the pages it serves itself.
 *
 * - `headers`: the site-wide block (`/*`) of public/_headers. Cloudflare doesn't promise to apply
 *   _headers to responses that pass through a Worker, so the Worker sets these itself; one source,
 *   so the two can't drift.
 * - `pages`: every page with a Markdown copy (written by ai-readable, so this runs after it), each
 *   with the fonts it preloads. The Worker sends those as `Link: rel=preload` headers, which is
 *   what Cloudflare Early Hints reads.
 *
 * wrangler.toml's `run_worker_first` must list the same pages; seo-check fails if it doesn't.
 * Preview builds under a base path (GitHub Pages) have no Worker, so they leave the file alone.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);

/** The `/*` rule's headers from a _headers file, as { name: value }. */
export function siteWideHeaders(text) {
  const headers = {};
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) {
      if (line.startsWith('#')) continue;
      inBlock = line.trim() === '/*';
      continue;
    }
    if (!inBlock || !line.trim()) continue;
    const [, name, value] = /^\s+([^:\s]+):\s*(.+)$/.exec(line) ?? [];
    if (name) headers[name] = value.trim();
  }
  return headers;
}

/** "<link rel="preload" href="/x.woff2" as="font" type="font/woff2" crossorigin>" -> Link value. */
function preloadLinks(html) {
  return [...html.matchAll(/<link rel="preload"([^>]*)>/g)].map(([, attrs]) => {
    const get = (name) => (attrs.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [])[1];
    const parts = [`<${get('href')}>`, 'rel=preload'];
    if (get('as')) parts.push(`as=${get('as')}`);
    if (get('type')) parts.push(`type="${get('type')}"`);
    if (/\scrossorigin\b/.test(attrs)) parts.push('crossorigin');
    return parts.join('; ');
  });
}

export default function workerManifest({ base = '/' } = {}) {
  return {
    name: 'worker-manifest',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (base !== '/') return;
        const distDir = fileURLToPath(dir);
        let sitemap;
        try {
          sitemap = await readFile(`${distDir}sitemap-0.xml`, 'utf8');
        } catch {
          return; // a throwaway build (e.g. the social cards): nothing to do
        }
        const pages = {};
        for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
          const path = new URL(loc).pathname;
          const file = `${distDir}${path.slice(1)}index.html`;
          try {
            await readFile(`${file}.md`);
          } catch {
            continue; // no Markdown copy: the Worker leaves the page to the static files
          }
          pages[path] = { preload: preloadLinks(await readFile(file, 'utf8')) };
        }
        const headers = siteWideHeaders(await readFile(new URL('public/_headers', root), 'utf8'));
        const manifest = { headers, pages };
        await writeFile(
          new URL('worker/pages.json', root),
          `${JSON.stringify(manifest, null, 2)}\n`,
        );
        logger.info(`worker/pages.json: ${Object.keys(pages).length} pages.`);
      },
    },
  };
}

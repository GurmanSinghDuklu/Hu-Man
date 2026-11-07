/**
 * Posters for the live concept wall on /portfolio: one still per concept, taken from the concept page
 * itself (served from public/). Desktop concepts at 1440x900, phone concepts at 390x844 (2x).
 *   npm run concept-posters            # every concept
 *   npm run concept-posters -- priya   # just one
 * Output: src/assets/portfolio-concepts/<slug>.jpg (Astro converts them to WebP at build).
 */
import { readFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const outDir = fileURLToPath(new URL('../src/assets/portfolio-concepts/', import.meta.url));
const dataFile = fileURLToPath(new URL('../src/data/portfolioConcepts.ts', import.meta.url));

// Read slug + device pairs straight from the data file, so the two never drift.
const src = await readFile(dataFile, 'utf8');
const concepts = [...src.matchAll(/slug: '([^']+)'[\s\S]*?device: '(desktop|phone)'/g)].map(
  ([, slug, device]) => ({ slug, device }),
);
const only = process.argv.slice(2);
const list = only.length ? concepts.filter((c) => only.includes(c.slug)) : concepts;

const port = 4399;
const server = await startServer(publicDir, port);
const browser = await chromium.launch();
try {
  for (const { slug, device } of list) {
    const phone = device === 'phone';
    const ctx = await browser.newContext({
      viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      deviceScaleFactor: phone ? 2 : 1,
    });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${port}/concepts/${slug}/`, { waitUntil: 'networkidle' });
    // Hide the back badge; let fonts and the hero's first animation settle.
    await page.addStyleTag({ content: '.badge{display:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    const path = `${outDir}${slug}.jpg`;
    await page.screenshot({ path, type: 'jpeg', quality: 82 });
    // An older WebP poster for the same slug would win the glob lookup; remove it.
    await unlink(`${outDir}${slug}.webp`).catch(() => {});
    console.log(`poster: ${slug} (${device})`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

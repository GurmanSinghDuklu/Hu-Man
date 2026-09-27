/**
 * Rasterises every concept render on /render-sheet/ to src/assets/concepts/<id>.jpg
 * (720x540) for the hero wall. Run after `npm run build`, whenever a render
 * changes, then rebuild so the new images are copied into dist/:
 *   npm run build && node scripts/generate-concept-images.mjs && npm run build
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4334;
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const outDir = fileURLToPath(new URL('../src/assets/concepts/', import.meta.url));

await mkdir(outDir, { recursive: true });
const server = await startServer(distDir, PORT);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 820, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://localhost:${PORT}/render-sheet/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  for (const el of await page.$$('[data-sheet]')) {
    const id = await el.getAttribute('data-sheet');
    await el.screenshot({ path: `${outDir}${id}.jpg`, type: 'jpeg', quality: 76 });
    console.log(`wrote concepts/${id}.jpg`);
  }
} finally {
  await browser.close();
  server.close();
}

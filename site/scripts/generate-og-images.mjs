/**
 * Builds the social-sharing images: one 1200x630 PNG per page in public/og/<key>.png, plus
 * public/og-image.png (the home card, for anything that still asks for the old name).
 *
 * It builds the site once with OG_RENDER=1 into a throwaway folder, which adds the /og-card/<key>/
 * pages (src/pages/og-card/[key].astro), photographs each with Playwright, then deletes the folder.
 * Re-run after changing a page's ogHeadline in src/data/pages.ts or the collage; commit the PNGs.
 */
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { startServer } from './serve.mjs';

const PORT = 4336;
const root = fileURLToPath(new URL('..', import.meta.url));
const tmpDir = `${root}.og-build/`;
const outDir = `${root}public/og/`;

execFileSync('npx', ['astro', 'build', '--outDir', tmpDir], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, OG_RENDER: '1' },
});

const keys = await readdir(`${tmpDir}og-card`);
await mkdir(outDir, { recursive: true });
const server = await startServer(tmpDir, PORT);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const key of keys) {
    await page.goto(`http://localhost:${PORT}/og-card/${key}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    // Palette-quantised PNG: a fraction of the size, no visible change on these flat colours.
    await sharp(png)
      .png({ palette: true, quality: 90, compressionLevel: 9 })
      .toFile(`${outDir}${key}.png`);
    console.log(`Wrote public/og/${key}.png`);
  }
} finally {
  await browser.close();
  server.close();
  await rm(tmpDir, { recursive: true, force: true });
}

await copyFile(`${outDir}index.png`, `${root}public/og-image.png`);
console.log('Wrote public/og-image.png');

/**
 * Cuts the "Our work" windows and the hero portrait pieces out of existing captures, so the
 * home page ships small images at the shapes the design uses (reference/final-designs/home.jpg).
 * Output goes to src/assets/our-work/ and src/assets/portrait/, then astro:assets resizes it.
 *
 * Run `node scripts/crop-work.mjs` after changing a region or re-capturing a site
 * (`npm run capture-sites`). Uses sharp, which Astro already installs.
 *
 * Never crop Essence's "What our clients say" section: those are Essence's reviews, not ours.
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../src/assets/', import.meta.url));

/** [output, source, left, top, width, height] in source pixels. */
const crops = [
  // Hero portrait (Gurman has the rights, 2026-10-19). The face sits whole behind the hero grid;
  // the circle shows a closer crop of one eye.
  ['portrait/eye', 'portrait/source', 330, 170, 330, 330],
  // 01 / Essence Hair
  ['our-work/essence-hair', 'work/essence-mobile', 150, 380, 480, 720],
  ['our-work/essence-headline', 'work/essence-scroll', 30, 470, 720, 720],
  ['our-work/essence-studio', 'work/essence-scroll', 60, 1080, 560, 560],
  ['our-work/essence-services', 'work/essence-scroll', 60, 1990, 560, 560],
  ['our-work/essence-copy', 'work/essence-scroll', 735, 1050, 420, 700],
  // 02 / Eldeva Candles (concept)
  ['our-work/eldeva-candle', 'projects/eldeva-sweet-plum', 380, 0, 455, 685],
  ['our-work/eldeva-hero', 'projects/eldeva-hero', 258, 0, 685, 685],
  ['our-work/eldeva-product', 'projects/eldeva-white-sands', 380, 120, 460, 460],
  ['our-work/eldeva-scents', 'projects/eldeva-scents', 300, 160, 460, 460],
  ['our-work/eldeva-ritual', 'projects/eldeva-ritual', 70, 60, 380, 625],
  // 03 / The Calculator App
  ['our-work/calculator-mobile', 'work/calculator-mobile', 0, 140, 780, 1172],
  ['our-work/calculator-projection', 'work/calculator-compound', 0, 0, 1054, 1054],
  ['our-work/calculator-breakdown', 'work/calculator-retirement', 290, 1150, 400, 400],
  ['our-work/calculator-headline', 'work/calculator-retirement', 0, 40, 420, 420],
  ['our-work/calculator-inputs', 'work/calculator-retirement', 0, 640, 600, 1000],
];

await mkdir(`${root}our-work`, { recursive: true });
await mkdir(`${root}portrait`, { recursive: true });

for (const [out, src, left, top, width, height] of crops) {
  const input = sharp(`${root}${src}.jpg`);
  const meta = await input.metadata();
  // Clamp to the source so a re-capture at a different size never throws.
  const w = Math.min(width, meta.width - left);
  const h = Math.min(height, meta.height - top);
  await input
    .extract({ left, top, width: w, height: h })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${root}${out}.jpg`);
  console.log(`${out}.jpg  ${w}x${h}`);
}

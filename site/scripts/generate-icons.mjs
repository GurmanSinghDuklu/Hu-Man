/**
 * Builds every icon the site and search engines ask for, from the brand artwork:
 *   public/favicon.ico          16, 32 and 48px (Google shows favicons in results; 48px multiples)
 *   public/favicon-96.png       the browser-tab icon for high-density screens
 *   public/apple-touch-icon.png 180px, for iPhone home screens
 *   public/icon-192.png, public/icon-512.png        for the web manifest
 *   public/icon-maskable-512.png the whole artwork, so Android's circle crop keeps the head
 *   public/logo.png             512px square wordmark on Paper, the schema's logo (Google needs
 *                               a raster logo of at least 112px)
 * Sources: src/assets/brand/icon-source.png (the fingerprint head on the lilac gradient, 1080px,
 * chosen 2026-10-26) and src/assets/brand/logo-ink.svg (the wordmark, never retyped). Re-run after
 * either changes; commit the outputs.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = (name) => `${root}public/${name}`;
const artwork = await readFile(`${root}src/assets/brand/icon-source.png`);
const wordmark = await readFile(`${root}src/assets/brand/logo-ink.svg`);
const PAPER = '#F1F2EC';

// Small icons crop in on the head (it fills about a third of the artwork), so it still reads at
// 16px; the maskable icon keeps the whole artwork because Android trims the edges itself.
const CROP = { left: 200, top: 200, width: 680, height: 680 };
const square = (size, crop = CROP) =>
  sharp(artwork).extract(crop).resize(size, size, { kernel: 'lanczos3' }).png();
const whole = { left: 0, top: 0, width: 1080, height: 1080 };

// favicon.ico: an ICO header pointing at PNG-encoded images (supported everywhere since 2010).
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => square(size).toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[i].length;
});
await writeFile(pub('favicon.ico'), Buffer.concat([header, ...pngs]));

await square(96).toFile(pub('favicon-96.png'));
await square(180).toFile(pub('apple-touch-icon.png'));
await square(192).toFile(pub('icon-192.png'));
await square(512).toFile(pub('icon-512.png'));

await square(512, whole).toFile(pub('icon-maskable-512.png'));

// Schema logo: the Ink wordmark, 420px wide, centred on Paper.
const mark = await sharp(wordmark, { density: 300 }).resize({ width: 420 }).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: PAPER } })
  .composite([{ input: mark, gravity: 'centre' }])
  .png({ compressionLevel: 9 })
  .toFile(pub('logo.png'));

console.log(
  'Wrote favicon.ico, favicon-96.png, apple-touch-icon.png, icon-192/512, icon-maskable-512, logo.png',
);

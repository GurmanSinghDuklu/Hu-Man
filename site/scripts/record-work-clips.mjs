/**
 * Records a short, silent, looping walkthrough of each live project for the Selected work preview
 * (components/SelectedWork.astro). Each frame is a screenshot at a set scroll position, so the
 * scroll is perfectly smooth: it eases down the page, rests, and eases back up, so the loop has no
 * jump. Re-run when either site changes:
 *   node scripts/record-work-clips.mjs
 * Output: public/video/<id>-walk.mp4 (H.264, no sound) and src/assets/work-clips/<id>.jpg (poster).
 *
 * Essence stops well above "What our clients say": its reviews and star ratings are never filmed
 * (CLAUDE.md: never crop that section).
 */
import { mkdir, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import ffmpeg from 'ffmpeg-static';

const W = 1280;
const H = 800;
const FPS = 30;
const DOWN_S = 7; // seconds easing down the page
const REST_S = 0.8; // seconds resting at the bottom and at the top
const UP_STEP = 2; // the way back up uses every second frame, so it takes half as long

const sites = [
  {
    id: 'essence',
    url: 'https://www.essencehairtreatment.com/',
    stopBefore: /what our clients say/i,
  },
  { id: 'calculator', url: 'https://www.thecalculatorapp.org/', maxY: 2900 },
];

const videoDir = fileURLToPath(new URL('../public/video/', import.meta.url));
const posterDir = fileURLToPath(new URL('../src/assets/work-clips/', import.meta.url));
await mkdir(videoDir, { recursive: true });
await mkdir(posterDir, { recursive: true });

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const browser = await chromium.launch();
for (const site of sites) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
  // Pass down the page once so lazy images and reveals have loaded and played.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(200);
  }
  let bottom = site.maxY ?? height - H;
  if (site.stopBefore) {
    const top = await page.evaluate((source) => {
      const re = new RegExp(source, 'i');
      const heading = [...document.querySelectorAll('h1, h2, h3')].find((h) =>
        re.test(h.textContent ?? ''),
      );
      return heading ? heading.getBoundingClientRect().top + window.scrollY : null;
    }, site.stopBefore.source);
    if (top === null) throw new Error(`${site.id}: could not find the section to stop before`);
    // The window's bottom edge stays at least 200px above that section, whatever is above it.
    bottom = Math.min(bottom, top - H - 200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const dir = await mkdtemp(join(tmpdir(), `clip-${site.id}-`));
  const frames = [];
  const down = DOWN_S * FPS;
  for (let i = 0; i <= down; i++) {
    await page.evaluate((v) => window.scrollTo(0, v), Math.round(ease(i / down) * bottom));
    await page.waitForTimeout(16);
    const file = join(dir, `down-${String(i).padStart(4, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
    frames.push(file);
  }
  const rest = Math.round(REST_S * FPS);
  const sequence = [
    ...Array(rest).fill(frames[0]),
    ...frames,
    ...Array(rest).fill(frames.at(-1)),
    ...frames.filter((_, i) => i % UP_STEP === 0).reverse(),
  ];
  for (const [i, file] of sequence.entries()) {
    await copyFile(file, join(dir, `seq-${String(i).padStart(5, '0')}.jpg`));
  }
  const out = join(videoDir, `${site.id}-walk.mp4`);
  const result = spawnSync(
    ffmpeg,
    [
      ...['-y', '-hide_banner', '-loglevel', 'error'],
      ...['-framerate', String(FPS), '-i', join(dir, 'seq-%05d.jpg')],
      ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p'],
      ...['-profile:v', 'high', '-movflags', '+faststart', '-an'],
      out,
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error(`${site.id}: ffmpeg failed`);
  await copyFile(frames[0], join(posterDir, `${site.id}.jpg`));
  await rm(dir, { recursive: true, force: true });
  await page.close();
  console.log(`${site.id}: ${sequence.length} frames, scrolls 0 to ${bottom}px -> ${out}`);
}
await browser.close();

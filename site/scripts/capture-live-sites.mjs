/**
 * Captures screenshots of Gurman's real, live projects for the "Real work"
 * section and the hero wall. Re-run when either site changes:
 *   node scripts/capture-live-sites.mjs
 * Output: src/assets/work/<id>-desktop.jpg, <id>-thumb.jpg (720px, hero wall),
 *         <id>-mobile.jpg, <id>-scroll.jpg
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const outDir = fileURLToPath(new URL('../src/assets/work/', import.meta.url));
const sites = {
  calculator: 'https://www.thecalculatorapp.org/',
  essence: 'https://www.essencehairtreatment.com/',
};
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const [id, url] of Object.entries(sites)) {
  // Desktop viewport + a tall "scroll" capture for the in-laptop scroll effect.
  let ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  let page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}${id}-desktop.jpg`, type: 'jpeg', quality: 78 });
  const height = Math.min(4200, await page.evaluate(() => document.documentElement.scrollHeight));
  // Trigger lazy content on the way down, then capture from the top.
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${outDir}${id}-scroll.jpg`,
    type: 'jpeg',
    quality: 72,
    fullPage: true,
    clip: { x: 0, y: 0, width: 1440, height },
  });
  await ctx.close();

  // Half-scale thumbnail of the first screen for the hero wall.
  ctx = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 0.5,
  });
  page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}${id}-thumb.jpg`, type: 'jpeg', quality: 76 });
  await ctx.close();

  ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: IPHONE_UA,
    isMobile: true,
    hasTouch: true,
  });
  page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}${id}-mobile.jpg`, type: 'jpeg', quality: 78 });
  await ctx.close();
  console.log(`captured ${id}`);
}
await browser.close();

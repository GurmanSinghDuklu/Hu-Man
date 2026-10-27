/**
 * Behaviour checks for the site's motion, against the built dist/ (run `npm run build` first):
 * - normal motion: the navbar logo's hue changes over time, the ticker runs and its pause button
 *   toggles, shaders mount (at most 3 per page), no console errors;
 * - reduced motion: no running animations, no shader canvases, no Lenis, every reveal visible.
 * Exits 1 on any failure.
 */
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4393;
const PAGES = ['', 'services/', 'pricing/', 'about/', 'contact/', 'terms/'];
const server = await startServer(new URL('../dist/', import.meta.url).pathname, PORT);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

for (const path of PAGES) {
  const url = `http://localhost:${PORT}/${path}`;

  // Normal motion.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  const logoColour = () =>
    page.evaluate(() => {
      const path = document.querySelector('.site-header__logo .logo path');
      return path ? getComputedStyle(path).fill : '';
    });
  const c1 = await logoColour();
  await page.waitForTimeout(1500);
  const c2 = await logoColour();
  if (!c1 || c1 === c2) fail(path || '/', `logo colour did not change (${c1} -> ${c2})`);
  const canvases = await page.locator('[data-shader] canvas').count();
  if (canvases > 3) fail(path || '/', `${canvases} shader canvases (max 3)`);
  if (path === '' && canvases < 1) fail('/', 'no shader mounted on the home page');
  if (path === '') {
    const toggle = page.locator('.ticker__toggle');
    if ((await toggle.count()) !== 1) fail('/', 'ticker pause button missing');
    else {
      await toggle.click();
      if ((await toggle.getAttribute('aria-pressed')) !== 'true') fail('/', 'ticker did not pause');
    }
  }
  if (errors.length) fail(path || '/', `console errors: ${errors.join(' | ')}`);
  await page.close();

  // Reduced motion.
  const calm = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  await calm.goto(url, { waitUntil: 'load' });
  await calm.waitForTimeout(1200);
  const state = await calm.evaluate(() => ({
    running: document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
      .length,
    canvases: document.querySelectorAll('[data-shader] canvas').length,
    lenis: document.documentElement.classList.contains('lenis'),
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(
      (el) => getComputedStyle(el).opacity === '0',
    ).length,
  }));
  if (state.running) fail(path || '/', `reduced motion: ${state.running} looping animations`);
  if (state.canvases) fail(path || '/', 'reduced motion: shader canvases mounted');
  if (state.lenis) fail(path || '/', 'reduced motion: Lenis is on');
  if (state.hidden) fail(path || '/', `reduced motion: ${state.hidden} reveals still hidden`);
  await calm.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`motion-check: ${failures.length} problem(s)\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log(`motion-check: ${PAGES.length} pages, all clear.`);

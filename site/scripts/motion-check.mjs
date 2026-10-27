/**
 * Behaviour checks for the site's motion, against the built dist/ (run `npm run build` first):
 * - normal motion: the navbar and footer logos' hue changes over time, the ticker runs and its pause button
 *   toggles, shaders mount (at most 3 per page), no console errors;
 * - reduced motion: no looping animations except the logo colour cycle, no shader canvases, no Lenis, every reveal visible.
 * Exits 1 on any failure. BROWSER=webkit|firefox picks another engine (default chromium).
 */
import { chromium, firefox, webkit } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4393;
const PAGES = ['', 'services/', 'pricing/', 'about/', 'contact/', 'terms/'];
const server = await startServer(new URL('../dist/', import.meta.url).pathname, PORT);
// BROWSER=webkit or BROWSER=firefox runs the same checks in Safari's and Firefox's engines.
const engine = { chromium, firefox, webkit }[process.env.BROWSER ?? 'chromium'];
const browser = await engine.launch(
  engine === chromium ? { args: ['--use-gl=angle', '--use-angle=swiftshader'] } : {},
);
const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

for (const path of PAGES) {
  const url = `http://localhost:${PORT}/${path}`;

  // Normal motion.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // The CSP's upgrade-insecure-requests makes WebKit fetch http://localhost files over https,
  // which this plain-http test server can't answer. Drop that one directive for WebKit here; the
  // live site is https, so it never applies there.
  if (engine === webkit) {
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const type = response.headers()['content-type'] ?? '';
      if (!type.includes('text/html')) return route.fulfill({ response });
      const body = (await response.text()).replace(/\s*upgrade-insecure-requests;?/, '');
      return route.fulfill({ response, body });
    });
  }
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
  const logoColours = () =>
    page.evaluate(() =>
      ['.site-header__logo .logo path', '.site-footer__logo path'].map((sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).fill : '';
      }),
    );
  const before = await logoColours();
  await page.waitForTimeout(1500);
  const after = await logoColours();
  ['navbar', 'footer'].forEach((where, i) => {
    if (!before[i] || before[i] === after[i])
      fail(path || '/', `${where} logo colour did not change (${before[i]} -> ${after[i]})`);
  });
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
    // The logos' colour cycle is the one loop allowed: it changes colour, it doesn't move.
    running: document
      .getAnimations()
      .filter(
        (a) =>
          a.playState === 'running' &&
          a.effect?.getTiming().iterations === Infinity &&
          a.animationName !== 'logo-hue',
      ).length,
    logo: document
      .getAnimations()
      .some((a) => a.animationName === 'logo-hue' && a.playState === 'running'),
    canvases: document.querySelectorAll('[data-shader] canvas').length,
    lenis: document.documentElement.classList.contains('lenis'),
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(
      (el) => getComputedStyle(el).opacity === '0',
    ).length,
  }));
  if (state.running) fail(path || '/', `reduced motion: ${state.running} looping animations`);
  if (!state.logo) fail(path || '/', 'reduced motion: the logo colour cycle stopped');
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

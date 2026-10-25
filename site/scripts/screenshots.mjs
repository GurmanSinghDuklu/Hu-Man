import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4333;
const SITE_URL = `http://localhost:${PORT}/`;
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const outDir = fileURLToPath(new URL('../reports/screenshots/', import.meta.url));

const widths = [360, 768, 1280];
// Every content page.
const pages = [
  ['home', ''],
  ['services', 'services/'],
  ['pricing', 'pricing/'],
  ['about', 'about/'],
  ['how-we-build', 'how-we-build/'],
  ['work', 'work/'],
];
// The Hu/man design is a single dark art direction, so one colour scheme.
const themes = ['dark'];

async function run() {
  await mkdir(outDir, { recursive: true });
  const server = await startServer(distDir, PORT);

  try {
    const browser = await chromium.launch();
    try {
      for (const theme of themes) {
        for (const width of widths) {
          const context = await browser.newContext({
            viewport: { width, height: 1000 },
            colorScheme: theme,
          });
          const page = await context.newPage();
          for (const [name, path] of pages) {
            await page.goto(SITE_URL + path, { waitUntil: 'networkidle' });
            // Walk down the page so lazy images load, then force every scroll reveal on:
            // a full-page capture never scrolls, so reveals would otherwise stay hidden.
            await page.evaluate(async () => {
              for (let y = 0; y < document.body.scrollHeight; y += 600) {
                window.scrollTo(0, y);
                await new Promise((r) => setTimeout(r, 60));
              }
              window.scrollTo(0, 0);
              document
                .querySelectorAll('[data-reveal], [data-cells]')
                .forEach((el) => el.classList.add('is-in'));
            });
            await page.waitForTimeout(1500);
            const file = `${outDir}${name}-${theme}-${width}.png`;
            await page.screenshot({ path: file, fullPage: true });
            console.log(`saved ${file}`);
          }
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

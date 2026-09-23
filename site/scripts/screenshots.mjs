import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = 4333;
const SITE_URL = `http://localhost:${PORT}/`;
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const outDir = fileURLToPath(new URL('../reports/screenshots/', import.meta.url));

const widths = [360, 768, 1280];
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
          await page.goto(SITE_URL, { waitUntil: 'networkidle' });
          const path = `${outDir}home-${theme}-${width}.png`;
          await page.screenshot({ path, fullPage: true });
          console.log(`saved ${path}`);
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

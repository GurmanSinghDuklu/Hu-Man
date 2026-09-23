import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from './serve.mjs';

const PORT = 4332;
const SITE_URL = `http://localhost:${PORT}/`;
const PAGES = ['', 'privacy/', '404.html'];

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

async function run() {
  const server = await startServer(distDir, PORT);

  try {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const path of PAGES) {
        await page.goto(SITE_URL + path, { waitUntil: 'networkidle' });
        // Scroll-reveal content starts at opacity 0 and axe skips invisible
        // elements, so force every reveal on before scanning.
        await page.evaluate(() =>
          document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in')),
        );
        await page.waitForTimeout(1000);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
          .analyze();

        const label = `/${path}`;
        if (results.violations.length === 0) {
          console.log(`axe ${label}: 0 violations`);
        } else {
          console.error(`axe ${label}: ${results.violations.length} violation(s)`);
          for (const v of results.violations) {
            console.error(`\n[${v.impact}] ${v.id}: ${v.help}`);
            for (const node of v.nodes) {
              console.error(`  - ${node.target.join(', ')}`);
            }
          }
          process.exitCode = 1;
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

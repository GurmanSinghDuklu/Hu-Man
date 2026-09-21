import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from './serve.mjs';

const PORT = 4332;
const SITE_URL = `http://localhost:${PORT}/`;
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

async function run() {
  const server = await startServer(distDir, PORT);

  try {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();

      if (results.violations.length === 0) {
        console.log('axe: 0 violations');
      } else {
        console.error(`axe: ${results.violations.length} violation(s)`);
        for (const v of results.violations) {
          console.error(`\n[${v.impact}] ${v.id}: ${v.help}`);
          for (const node of v.nodes) {
            console.error(`  - ${node.target.join(', ')}`);
          }
        }
        process.exitCode = 1;
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

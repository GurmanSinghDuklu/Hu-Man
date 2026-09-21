import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { startServer } from './serve.mjs';

const PORT = 4331;
const SITE_URL = `http://localhost:${PORT}/`;
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const reportsDir = new URL('../reports/lighthouse/', import.meta.url);

async function run() {
  await mkdir(reportsDir, { recursive: true });

  const server = await startServer(distDir, PORT);

  try {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
    try {
      const result = await lighthouse(
        SITE_URL,
        { port: chrome.port, output: ['json', 'html'], logLevel: 'error' },
        undefined,
      );

      const { categories } = result.lhr;
      const scores = Object.fromEntries(
        Object.entries(categories).map(([key, val]) => [key, Math.round(val.score * 100)]),
      );

      const jsonPath = new URL('report.json', reportsDir);
      const htmlPath = new URL('report.html', reportsDir);
      await Promise.all([
        writeFile(jsonPath, result.report[0]),
        writeFile(htmlPath, result.report[1]),
      ]);

      console.log('Lighthouse scores:', scores);
      console.log(`Full report: ${fileURLToPath(htmlPath)}`);

      const failing = Object.entries(scores).filter(([, score]) => score < 95);
      if (failing.length > 0) {
        console.warn('Below 95:', Object.fromEntries(failing));
      }
    } finally {
      await chrome.kill();
    }
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

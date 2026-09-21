/**
 * Rasterises public/og-image.svg to public/og-image.png (1200x630) using
 * the Playwright Chromium already installed for testing. Social platforms
 * (Facebook, X, LinkedIn) generally require a raster og:image, not SVG.
 * Run this whenever og-image.svg changes; the PNG is committed so the
 * build doesn't depend on a browser being available.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const svgPath = fileURLToPath(new URL('../public/og-image.svg', import.meta.url));
const pngPath = fileURLToPath(new URL('../public/og-image.png', import.meta.url));

const svg = await readFile(svgPath, 'utf-8');
const html = `<!doctype html><html><body style="margin:0">${svg}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.locator('svg').screenshot({ path: pngPath });
await browser.close();

console.log(`Wrote ${pngPath}`);

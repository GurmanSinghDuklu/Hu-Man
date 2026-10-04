import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Placeholder until docs/09-open-questions.md item 8 (domain) is decided.
  // Update here and in src/config/site.ts together.
  // Preview builds (GitHub Pages) override both via SITE_URL and SITE_BASE.
  site: process.env.SITE_URL ?? 'https://example.com',
  base: process.env.SITE_BASE ?? '/',
  output: 'static',
  compressHTML: true,
  // Inline the (small) CSS so first paint doesn't wait on stylesheet requests.
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      // Internal pages that must not be indexed.
      filter: (page) => !page.includes('/render-sheet'),
    }),
  ],
});

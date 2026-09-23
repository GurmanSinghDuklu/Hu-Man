import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Placeholder until docs/09-open-questions.md item 8 (domain) is decided.
  // Update here and in src/config/site.ts together.
  site: 'https://example.com',
  output: 'static',
  compressHTML: true,
  // Inline the (small) CSS so first paint doesn't wait on stylesheet requests.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { productionUrl } from './src/config/domain.ts';
import { lastModified, pageFile } from './src/lib/lastModified.ts';
import aiReadable from './src/integrations/ai-readable.mjs';

const base = process.env.SITE_BASE ?? '/';

/** "https://…/about/" -> "about", "https://…/" -> "index" (the page's key, with any base removed). */
function pageKeyFor(url) {
  const path = new URL(url).pathname.slice(base.replace(/\/$/, '').length).replace(/^\/|\/$/g, '');
  return path || 'index';
}

export default defineConfig({
  // Preview builds (GitHub Pages) override both via SITE_URL and SITE_BASE.
  site: process.env.SITE_URL ?? productionUrl,
  base,
  // Every page is a folder (/about/), so links, canonicals and the sitemap all end in a slash.
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  // No code blocks on the site; Shiki's inline styles would also clash with the CSP.
  markdown: { syntaxHighlight: false },
  // Inline the (small) CSS so first paint doesn't wait on stylesheet requests.
  build: { inlineStylesheets: 'always' },
  security: {
    // A Content-Security-Policy <meta> on every page: Astro hashes each inline script and style,
    // so nothing else can run. Style attributes (the layout's --vars) are allowed on their own.
    // Headers that a <meta> can't carry (frame-ancestors, HSTS...) are in public/_headers.
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' mailto:",
        'upgrade-insecure-requests',
      ],
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
        // The one <style> Paper Shaders inserts (its canvas defaults, @paper-design/shaders
        // 0.0.81). Pinned version, so the hash is stable; `npm run motion-check` reports a CSP
        // console error if an upgrade changes it.
        hashes: ['sha256-bcX2M6hOeEgeI9Ttj3KtXWZuoRsKenyQAlXswSnLakA='],
      },
    },
  },
  integrations: [
    sitemap({
      // Noindex pages (404, the form's thank-you page) stay out.
      filter: (page) => !/\/(404|thanks)\/?$/.test(page),
      serialize(item) {
        const lastmod = lastModified(pageFile(pageKeyFor(item.url)));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    // After the sitemap: Markdown copies of every page, full llms-full.txt, image sitemap.
    aiReadable(),
  ],
});

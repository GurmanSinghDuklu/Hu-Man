import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { productionUrl } from './src/config/domain.ts';
import { lastModified, pageFile } from './src/lib/lastModified.ts';

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
      },
    },
  },
  integrations: [
    sitemap({
      // The 404 page is noindex, so it stays out.
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const lastmod = lastModified(pageFile(pageKeyFor(item.url)));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});

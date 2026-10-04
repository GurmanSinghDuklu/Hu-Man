import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { withBase } from '../config/paths';

/**
 * Generated (not a static public/ file) so the sitemap URL can never drift
 * from site.url / astro.config.mjs's `site` value.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase('/sitemap-index.xml'), site.url).toString()}\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

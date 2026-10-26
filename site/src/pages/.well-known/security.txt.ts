import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { withBase } from '../../config/paths';

/**
 * /.well-known/security.txt (RFC 9116): where to report a security problem with the site.
 * Generated so `Expires` (required, under a year ahead) moves forward with every build.
 */
export const GET: APIRoute = () => {
  const expires = new Date();
  expires.setUTCMonth(expires.getUTCMonth() + 11);
  const body = [
    `Contact: mailto:${site.contact.email}`,
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, '.000Z')}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL(withBase('/.well-known/security.txt'), site.url).toString()}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

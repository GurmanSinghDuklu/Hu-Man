/**
 * The Cloudflare Worker in front of the static site (wrangler.toml). Static files are served from
 * dist/ by Cloudflare before this runs, except the pages listed in `run_worker_first`, which come
 * here first (worker/pages.js: Markdown on request, Link headers). Of the rest, the Worker only sees
 * requests that match no file, which here means /api/enquiry and the client accounts API
 * (/api/auth/*, /api/account/*, /api/admin/*: worker/accounts/); anything else falls through to the
 * site's 404 page.
 */
import { EmailMessage } from 'cloudflare:email';
import { handleEnquiry } from './enquiry.js';
import { servePage } from './pages.js';
import { handleAccounts, gateAdminPages } from './accounts/index.js';
import { servePreview } from './accounts/preview.js';
import { handlePreviewUpload } from './accounts/upload.js';
import { handleStripeWebhook } from './accounts/payments.js';
import { cleanUp } from './accounts/cleanup.js';
import { servePublished } from './accounts/instant.js';

/** The same protective headers public/_headers gives every static file. */
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

export default {
  /** Daily (wrangler.toml [triggers]): unconfirmed sign-ups and unused accounts (cleanup.js). */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(cleanUp(env).then((r) => console.log('clean-up', JSON.stringify(r))));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // A published portfolio (<name>.<our domain> or someone's own domain): nothing else applies.
    const published = await servePublished(request, env);
    if (published) return published;
    let response;
    if (url.pathname === '/api/enquiry' || url.pathname === '/api/enquiry/') {
      response = await handleEnquiry(request, env, EmailMessage, ctx);
    } else {
      response =
        (await handleStripeWebhook(request, { ...env, EmailMessage })) ??
        (await handlePreviewUpload(request, env)) ??
        (await handleAccounts(request, { ...env, EmailMessage })) ??
        (await servePreview(request, env)) ??
        (await gateAdminPages(request, env)) ??
        (await servePage(request, env.ASSETS)) ??
        (await env.ASSETS.fetch(request));
    }
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(name)) headers.set(name, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

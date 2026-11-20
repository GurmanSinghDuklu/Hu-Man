/**
 * The site's pages, when the Worker serves them (wrangler.toml `run_worker_first` lists them; every
 * other file is still served straight from dist/ without the Worker).
 *
 * - Markdown on request: a client that asks for `Accept: text/markdown` (AI assistants and agents
 *   increasingly do) gets the page's Markdown copy (<page>/index.html.md, built by
 *   src/integrations/ai-readable.mjs) at the page's own address, with a canonical link to it.
 * - Every page names its Markdown copy in a `Link` header, plus the fonts it preloads, which is
 *   what Cloudflare Early Hints reads to send a 103 before the page.
 * - The site-wide security headers from public/_headers are set here too, since Cloudflare doesn't
 *   promise to apply _headers to responses that pass through a Worker.
 *
 * pages.json is written by the build (src/integrations/worker-manifest.mjs): don't edit it by hand.
 */
import manifest from './pages.json' with { type: 'json' };

/** The q value a client gives a media type in its Accept header (0 if it doesn't name it). */
function quality(accept, type) {
  for (const range of accept.split(',')) {
    const [media, ...params] = range.trim().toLowerCase().split(';');
    if (media.trim() !== type) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    const value = q ? Number(q.slice(2)) : 1;
    return Number.isFinite(value) ? value : 0;
  }
  return 0;
}

/**
 * True when the client names text/markdown and prefers it at least as much as text/html.
 * Browsers never name it, so they always get the page.
 */
export function wantsMarkdown(accept) {
  if (!accept) return false;
  const md = quality(accept, 'text/markdown');
  return md > 0 && md >= quality(accept, 'text/html');
}

function withSiteHeaders(source) {
  const headers = new Headers(source);
  for (const [name, value] of Object.entries(manifest.headers)) headers.set(name, value);
  return headers;
}

function addVary(headers, value) {
  const vary = headers.get('Vary');
  if (!vary) headers.set('Vary', value);
  else if (
    !vary
      .toLowerCase()
      .split(/\s*,\s*/)
      .includes(value.toLowerCase())
  )
    headers.set('Vary', `${vary}, ${value}`);
}

/**
 * Serves one of the site's pages, or returns null for anything else (the caller passes those to
 * the static files as before). `assets` is the Worker's ASSETS binding.
 */
export async function servePage(request, assets) {
  const url = new URL(request.url);
  const page = manifest.pages[url.pathname];
  if (!page || (request.method !== 'GET' && request.method !== 'HEAD')) return null;
  const markdownPath = `${url.pathname}index.html.md`;

  if (wantsMarkdown(request.headers.get('Accept'))) {
    const md = await assets.fetch(
      new Request(new URL(markdownPath, url), { method: request.method }),
    );
    if (md.ok) {
      const headers = withSiteHeaders(md.headers);
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Link', `<${url.origin}${url.pathname}>; rel="canonical"`);
      addVary(headers, 'Accept');
      return new Response(md.body, { status: 200, headers });
    }
  }

  const res = await assets.fetch(request);
  const headers = withSiteHeaders(res.headers);
  if (res.status === 200 || res.status === 304) addVary(headers, 'Accept');
  if (res.status === 200) {
    headers.set(
      'Link',
      [`<${markdownPath}>; rel="alternate"; type="text/markdown"`, ...page.preload].join(', '),
    );
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

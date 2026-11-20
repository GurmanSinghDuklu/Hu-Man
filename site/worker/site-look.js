/**
 * A quick, automatic look at the website someone sends with an enquiry, added to the email so the
 * reply can start from facts: does it load, over HTTPS, how fast, its title and description, and
 * whether robots.txt shuts AI crawlers out or an llms.txt exists.
 *
 * Only public http(s) hostnames are fetched (no IP addresses, ports or local names), and every
 * redirect is checked the same way before it is followed (at most five). Each request
 * has a short timeout, and at most the first 256 kB of the page is read. It never throws: anything
 * that goes wrong comes back as `error`, and the enquiry is sent regardless.
 */

/** The AI crawlers named in the email when robots.txt blocks the whole site for them. */
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

const MAX_PAGE_BYTES = 256 * 1024;
/** Redirects followed per request, each one checked like the address itself. */
const MAX_REDIRECTS = 5;
const USER_AGENT = 'HumanSiteLook/1.0 (+https://humansoftwareagency.com/free-ai-check/)';

/** The address as a URL we may fetch, or null. */
export function siteUrl(input) {
  let text = String(input ?? '').trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.port || url.username || url.password)
    return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.startsWith('[')) return null;
  if (/(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host)) return null;
  return url;
}

/** Thrown when a redirect leads somewhere we would not fetch, or there are too many. */
class RedirectRefused extends Error {}

/**
 * Fetches with redirects followed by hand, so every hop passes the same check as the address the
 * sender typed (a public site could otherwise redirect to a local or private address). Returns
 * { response, url } with the final address.
 */
async function fetchChecked(fetch, start, init) {
  let target = start;
  for (let hop = 0; ; hop += 1) {
    const response = await fetch(target.toString(), { ...init, redirect: 'manual' });
    const location =
      response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
    if (!location) return { response, url: target.toString() };
    response.body?.cancel().catch(() => {});
    if (hop >= MAX_REDIRECTS) throw new RedirectRefused('too many redirects');
    let next;
    try {
      next = new URL(location, target);
    } catch {
      next = null;
    }
    const safe = next && ['http:', 'https:'].includes(next.protocol) ? siteUrl(next.href) : null;
    if (!safe) throw new RedirectRefused('redirected to an address that is not public');
    target = safe;
  }
}

const clean = (text, max = 160) => {
  const one = String(text ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
};

/** Reads the start of a response body as text, stopping at </head> or the size cap. */
async function readHead(response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (bytes < MAX_PAGE_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (/<\/head>/i.test(text)) break;
  }
  reader.cancel().catch(() => {});
  return text;
}

/** The AI crawlers that robots.txt keeps out of the whole site ("Disallow: /" for them). */
export function blockedAgents(robots) {
  const groups = [];
  let current = null;
  for (const line of robots.split(/\r?\n/)) {
    const [field, ...rest] = line.replace(/#.*/, '').split(':');
    const key = field.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'disallow' || key === 'allow')) {
      current.rules.push({ key, value });
    }
  }
  const blocksAll = (group) =>
    group.rules.some((r) => r.key === 'disallow' && r.value === '/') &&
    !group.rules.some((r) => r.key === 'allow' && r.value === '/');
  const star = groups.find((g) => g.agents.includes('*'));
  return AI_AGENTS.filter((agent) => {
    const own = groups.find((g) => g.agents.includes(agent.toLowerCase()));
    const group = own ?? star;
    return group ? blocksAll(group) : false;
  });
}

/**
 * Looks at the site. Returns { url, status, https, ms, title, description, robots, blocked, llms }
 * or { error } when the address can't be used or the site doesn't answer.
 *
 * A hard deadline sits over the whole look: on Cloudflare a subrequest to some sites (seen with
 * sites on Cloudflare themselves) never settled and ignored its abort signal, which held the
 * enquiry open indefinitely. Whatever the fetches do, the look gives up after timeoutMs + 500 ms.
 */
export function lookAtSite(input, options = {}) {
  const { timeoutMs = 3500 } = options;
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ error: 'timed out' }), timeoutMs + 500);
  });
  return Promise.race([look(input, options), deadline]).finally(() => clearTimeout(timer));
}

async function look(input, { fetch = globalThis.fetch, timeoutMs = 3500 } = {}) {
  const url = siteUrl(input);
  if (!url) return { error: 'not a public web address, so it was not fetched' };
  const get = (target, accept) =>
    fetchChecked(fetch, target, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
    });

  const started = Date.now();
  const [page, robots, llms] = await Promise.allSettled([
    get(url, 'text/html'),
    get(new URL('/robots.txt', url), 'text/plain'),
    get(new URL('/llms.txt', url), 'text/plain'),
  ]);

  if (page.status === 'rejected') {
    let reason = 'could not connect';
    if (page.reason instanceof RedirectRefused)
      reason = `${page.reason.message}, so it was not followed`;
    else if (page.reason?.name === 'TimeoutError') reason = 'timed out';
    return { error: `${reason} (${url.hostname})` };
  }
  const { response, url: finalUrl } = page.value;
  const ms = Date.now() - started;
  let head = '';
  try {
    head = await readHead(response);
  } catch {
    // A body that breaks off still leaves the status and headers worth reporting.
  }
  const meta = (name) =>
    head.match(
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    )?.[1] ??
    head.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'))?.[1];

  const plainText = (result) =>
    result.status === 'fulfilled' &&
    result.value.response.ok &&
    !/html/i.test(result.value.response.headers.get('content-type') ?? '');
  let blocked = [];
  if (plainText(robots)) {
    try {
      blocked = blockedAgents(await robots.value.response.text());
    } catch {
      blocked = [];
    }
  }

  return {
    url: finalUrl,
    status: response.status,
    https: finalUrl.startsWith('https:'),
    ms,
    title: clean(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    description: clean(meta('description'), 200),
    robots: plainText(robots),
    blocked,
    llms: plainText(llms),
  };
}

/** The look as lines for the plain-text email. */
export function describeLook(look) {
  if (look.error) return [`  Could not look: ${look.error}.`];
  const seconds = (look.ms / 1000).toFixed(1);
  let robots = 'not found';
  if (look.robots) {
    robots = look.blocked.length
      ? `found; blocks the whole site for ${look.blocked.join(', ')}`
      : 'found; no AI crawler shut out';
  }
  return [
    `  Address:      ${look.url}`,
    `  Answered:     ${look.status} in ${seconds} s${look.https ? '' : ' (not HTTPS)'}`,
    `  Title:        ${look.title || '(none)'}`,
    `  Description:  ${look.description || '(none)'}`,
    `  robots.txt:   ${robots}`,
    `  llms.txt:     ${look.llms ? 'found' : 'not found'}`,
  ];
}

/** Links that open the usual checks for the site, ready to click. */
export function checkLinks(input) {
  const url = siteUrl(input);
  if (!url) return [];
  const site = encodeURIComponent(url.toString());
  return [
    `  PageSpeed:    https://pagespeed.web.dev/analysis?url=${site}`,
    `  Rich results: https://search.google.com/test/rich-results?url=${site}`,
    `  Headers:      https://securityheaders.com/?q=${site}&followRedirects=on`,
    `  Indexed:      https://www.google.com/search?q=${encodeURIComponent(`site:${url.hostname}`)}`,
  ];
}

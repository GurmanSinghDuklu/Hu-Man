/**
 * POST /api/enquiry: the site's one form endpoint. Every form on the site posts here, and so can
 * an AI agent acting for someone (the fields are documented in llms.txt and by GET /api/enquiry).
 *
 * It validates the fields, drops spam quietly (a hidden honeypot field), and emails the enquiry to
 * the studio's inbox through Cloudflare's send_email binding. Nothing is stored. Replies go
 * straight to the sender (Reply-To).
 *
 * The studio's copy also says where the enquiry came from, when the reply is due and what a quick
 * look at the sender's website found. When the REPLY_EMAIL binding is set up, the sender gets an
 * automatic "we've got your message" email too (off until Cloudflare's paid sending is on).
 *
 * Kept free of Cloudflare-only imports so it can be tested in Node (worker/enquiry.test.js);
 * worker/index.js passes in Cloudflare's EmailMessage class.
 */
import { checkLinks, describeLook, lookAtSite } from './site-look.js';

export const TOPICS = {
  'ai-check': 'Free AI check',
  website: 'A new website or redesign',
  idea: 'An idea: app, software or online business',
  tier: 'A pricing tier',
  other: 'Something else',
};

/** The fields, as documented to people and agents (GET /api/enquiry returns this). */
export const API_DESCRIPTION = {
  name: 'Hu/man Software Agency enquiry',
  description:
    'Send an enquiry to Hu/man Software Agency (Leeds, UK). A person reads every message and replies by email. Free AI checks get a reply within 48 hours.',
  method: 'POST',
  accepts: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  fields: {
    name: { required: true, maxLength: 100, description: 'Who to reply to.' },
    email: { required: true, maxLength: 200, description: 'Reply address.' },
    topic: {
      required: false,
      enum: Object.keys(TOPICS),
      description: Object.entries(TOPICS)
        .map(([key, label]) => `${key}: ${label}`)
        .join('; '),
    },
    website: {
      required: 'when topic is ai-check',
      maxLength: 200,
      description: 'The website to check or redesign.',
    },
    tier: { required: false, maxLength: 60, description: 'Pricing tier name, e.g. "Launch".' },
    phone: { required: false, maxLength: 40 },
    message: {
      required: 'unless topic is ai-check',
      maxLength: 4000,
      description: 'What you need, in your own words.',
    },
  },
  responses: {
    200: '{ "ok": true } (JSON requests)',
    303: 'Redirect to /thanks/ (form posts)',
    400: '{ "ok": false, "errors": { field: message } }',
  },
};

const LIMITS = { name: 100, email: 200, phone: 40, website: 200, tier: 60, message: 4000 };

/** One line, no control characters: safe for email headers and subjects. */
const oneLine = (value) =>
  String(value ?? '')
    // Control characters are exactly what this strips (no header injection), so the rule is off.
    // eslint-disable-next-line no-control-regex
    .replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ')
    .trim();

/** The largest request body accepted: the form's limits add up to well under this. */
export const MAX_BODY_BYTES = 16 * 1024;

/** Thrown when a body is over MAX_BODY_BYTES, so the handler can answer 413. */
export class TooLarge extends Error {}

/**
 * Reads JSON, URL-encoded or multipart form data into a plain object of strings, refusing bodies
 * over MAX_BODY_BYTES before parsing them (the Content-Length header can't be trusted alone).
 */
export async function readFields(request) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new TooLarge();
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_BODY_BYTES) throw new TooLarge();

  const type = request.headers.get('content-type') ?? '';
  const flat = (entries) =>
    Object.fromEntries(
      entries
        .filter(([k]) => typeof k === 'string' && k.length <= 40)
        .slice(0, 20)
        .map(([k, v]) => [k, typeof v === 'string' || typeof v === 'number' ? String(v) : '']),
    );
  if (type.includes('application/json')) {
    let body;
    try {
      body = JSON.parse(new TextDecoder().decode(buffer));
    } catch {
      body = {};
    }
    return flat(
      Object.entries(body && typeof body === 'object' && !Array.isArray(body) ? body : {}),
    );
  }
  const form = await new Request('https://form.invalid/', {
    method: 'POST',
    headers: { 'content-type': type },
    body: buffer,
  }).formData();
  return flat([...form.entries()]);
}

/** Returns { data } when valid, { errors } when not. */
export function validate(raw) {
  const data = {
    name: oneLine(raw.name),
    email: oneLine(raw.email),
    phone: oneLine(raw.phone),
    website: oneLine(raw.website),
    tier: oneLine(raw.tier),
    topic: TOPICS[oneLine(raw.topic)] ? oneLine(raw.topic) : raw.tier ? 'tier' : 'other',
    message: String(raw.message ?? '')
      .replace(/\r\n?/g, '\n')
      // Keep line breaks, drop every other control character.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      .trim(),
  };
  const errors = {};
  if (!data.name) errors.name = 'Please add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))
    errors.email = 'Please add an email address we can reply to.';
  if (data.topic === 'ai-check' && !data.website)
    errors.website = 'Please add the website to check.';
  if (data.topic !== 'ai-check' && !data.message)
    errors.message = 'Please tell us a little about what you need.';
  for (const [field, max] of Object.entries(LIMITS)) {
    if (data[field].length > max) errors[field] = `Please keep this under ${max} characters.`;
  }
  return Object.keys(errors).length ? { errors } : { data };
}

/** RFC 2047 encoded-word, so names and subjects with any characters survive. */
const encodeHeader = (text) => `=?UTF-8?B?${toBase64(text)}?=`;

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** The reply we promise (free AI check page, FAQ, llms.txt and the auto-reply). */
export const REPLY_HOURS = 48;

const ukTime = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

/** Base64 body lines, wrapped at 76 characters as MIME requires. */
const base64Body = (text) => toBase64(text).replace(/.{76}/g, '$&\r\n');

/**
 * The email to the studio, as raw MIME (what Cloudflare's EmailMessage takes). Besides the fields
 * it says where the enquiry came from, when the reply is due, and, when a website was given, what
 * an automatic look at it found (site-look.js) plus links to the usual checks.
 */
export function buildEmail(
  data,
  { from, to, now = new Date(), id = crypto.randomUUID(), source = '', look = null },
) {
  const what = data.topic === 'tier' && data.tier ? `${data.tier} tier` : TOPICS[data.topic];
  const subject = `Website enquiry: ${what}${data.website ? ` (${data.website})` : ''} from ${data.name}`;
  const due = new Date(now.getTime() + REPLY_HOURS * 3600 * 1000);
  const links = data.website ? checkLinks(data.website) : [];
  const lines = [
    `New enquiry from the website.`,
    '',
    `Topic:    ${what}`,
    `Name:     ${data.name}`,
    `Email:    ${data.email}`,
    data.phone ? `Phone:    ${data.phone}` : null,
    data.website ? `Website:  ${data.website}` : null,
    data.tier ? `Tier:     ${data.tier}` : null,
    '',
    data.message || '(No message.)',
    '',
    '--',
    `Sent:      ${ukTime(now)} (UK time)`,
    `Reply by:  ${ukTime(due)} (${REPLY_HOURS} hours)`,
    `From:      ${source || 'unknown'}`,
    ...(look
      ? ['', 'Quick look at their site (automatic, as they sent this):', ...describeLook(look)]
      : []),
    ...(links.length ? ['', 'Checks, ready to open:', ...links] : []),
    '',
    'Reply to this email to answer them directly.',
  ].filter((line) => line !== null);
  const domain = from.split('@')[1];
  return [
    `From: ${encodeHeader('Hu/man website')} <${from}>`,
    `To: <${to}>`,
    `Reply-To: ${encodeHeader(data.name)} <${data.email}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(lines.join('\r\n')),
  ].join('\r\n');
}

/** A sender address plain enough to put in a header and email back. */
const SAFE_ADDRESS = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/**
 * The automatic "we've got your message" email to the sender, as raw MIME (text and HTML).
 *
 * Nothing the sender typed goes into it, not even their name: the form is public, so anyone could
 * enter someone else's address, and a fixed message gives a spammer nothing to deliver. It says
 * why it arrived and that no more will follow.
 */
export function buildAutoReply(
  data,
  { from, replyTo, origin, now = new Date(), id = crypto.randomUUID() },
) {
  const page = (path) => `${origin}${path}`;
  const first =
    data.topic === 'ai-check'
      ? `A person runs your free AI check by hand and emails your findings within ${REPLY_HOURS} hours.`
      : `A person reads your message and replies by email within ${REPLY_HOURS} hours.`;
  const steps = [
    first,
    'If it helps, we arrange a free call to talk it through. No cost, no obligation.',
    'If you want to go ahead, you get a fixed price before any work starts.',
  ];
  const reading = [
    ['Pricing', page('/pricing/')],
    ['Our work', page('/work/')],
    ['How we build', page('/how-we-build/')],
    ['What agentic AI-ready means', page('/agentic-ai-ready/')],
  ];
  const why = `You’re getting this one email because this address was entered on the form at ${new URL(origin).host}. If that wasn’t you, ignore it: we won’t write again unless you write to us.`;

  const text = [
    'Hello,',
    '',
    'Thanks for getting in touch with Hu/man Software Agency. Your message has reached us.',
    '',
    'What happens next',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    'While you wait',
    ...reading.map(([label, href]) => `- ${label}: ${href}`),
    '',
    'Want to add something? Reply to this email.',
    '',
    'Hu/man Software Agency',
    `Leeds, West Yorkshire · ${origin}`,
    '',
    why,
  ].join('\r\n');

  const ink = '#0b0d0a';
  const muted = '#4f514c';
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>We’ve got your message</title></head>
<body style="margin:0;padding:0;background:#f1f2ec;color:${ink};font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">
<p style="margin:0 0 24px;font:700 13px/1 'Courier New',monospace;letter-spacing:.16em;text-transform:uppercase;">Hu/man Software Agency</p>
<h1 style="margin:0 0 16px;font:800 30px/1.05 Arial,Helvetica,sans-serif;text-transform:uppercase;">We’ve got your message.</h1>
<p style="margin:0 0 28px;font-size:16px;line-height:1.55;">Thanks for getting in touch. A real person will read it.</p>
<div style="padding:24px;border:1px solid ${ink};border-top-right-radius:40px;background:#ffffff;">
<p style="margin:0 0 12px;font:700 12px/1 'Courier New',monospace;letter-spacing:.14em;text-transform:uppercase;color:${muted};">What happens next</p>
<ol style="margin:0;padding-left:20px;font-size:16px;line-height:1.55;">${steps.map((s) => `<li style="margin:0 0 8px;">${s}</li>`).join('')}</ol>
</div>
<p style="margin:28px 0 10px;font:700 12px/1 'Courier New',monospace;letter-spacing:.14em;text-transform:uppercase;color:${muted};">While you wait</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.9;">${reading.map(([label, href]) => `<a href="${href}" style="color:${ink};font-weight:700;">${label}</a>`).join('<br>')}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.55;">Want to add something? Reply to this email.</p>
<p style="margin:0;font-size:14px;line-height:1.55;"><strong>Hu/man Software Agency</strong><br>Leeds, West Yorkshire · <a href="${origin}" style="color:${ink};">${new URL(origin).host}</a></p>
<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:${muted};">${why}</p>
</div></body></html>`;

  const boundary = `hu-man-${id}`;
  const domain = from.split('@')[1];
  return [
    `From: ${encodeHeader('Hu/man Software Agency')} <${from}>`,
    `To: <${data.email}>`,
    `Reply-To: <${replyTo}>`,
    `Subject: ${encodeHeader('We’ve got your message | Hu/man')}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${domain}>`,
    // RFC 3834: an automatic reply, so mail systems don't answer it with their own auto-replies.
    'Auto-Submitted: auto-replied',
    'X-Auto-Response-Suppress: All',
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/**
 * Sends the auto-reply when the REPLY_EMAIL binding exists (wrangler.toml; it needs Cloudflare's
 * paid Email Sending, see docs/10-launch.md). Never throws: a failed auto-reply must not fail an
 * enquiry that has already reached the inbox.
 */
export async function sendAutoReply(data, env, EmailMessage, origin) {
  if (!env.REPLY_EMAIL || !SAFE_ADDRESS.test(data.email)) return false;
  const to = data.email.toLowerCase();
  if (to.endsWith(`@${env.FROM_ADDRESS.split('@')[1]}`) || to === env.TO_ADDRESS.toLowerCase())
    return false;
  try {
    // One a minute per address at most, on top of the per-IP and site-wide limits.
    const limited = await env.REPLY_PER_ADDRESS?.limit({ key: to });
    if (limited && !limited.success) return false;
    const raw = buildAutoReply(data, { from: env.FROM_ADDRESS, replyTo: env.TO_ADDRESS, origin });
    await env.REPLY_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, data.email, raw));
    return true;
  } catch (error) {
    console.error('enquiry: auto-reply failed', error instanceof Error ? error.message : error);
    return false;
  }
}

/** Where the enquiry came from: the page of ours that sent it, or the API. */
export function sourceOf(request, origin, wantsJson) {
  const referer = request.headers.get('referer') ?? '';
  if (referer.startsWith(`${origin}/`)) {
    const { pathname, search } = new URL(referer);
    return oneLine(`${pathname}${search}`).slice(0, 200);
  }
  return wantsJson ? 'the API (JSON), not a page on the site' : 'a form (no page given)';
}

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      // A data endpoint: nothing in it may run, load or be framed, and it stays out of search.
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Robots-Tag': 'noindex',
      ...extra,
    },
  });

/**
 * Rate limits (Cloudflare's rate limiting bindings, wrangler.toml): a few sends per minute from any
 * one address, and a ceiling for the whole site, so a bot can't flood the inbox. Missing bindings
 * (local tests) mean no limit.
 */
async function overLimit(env, ip) {
  const checks = [
    env.ENQUIRY_PER_IP?.limit({ key: ip }),
    env.ENQUIRY_GLOBAL?.limit({ key: 'all' }),
  ];
  const results = await Promise.all(checks);
  return results.some((r) => r && !r.success);
}

/**
 * Handles /api/enquiry. `EmailMessage` is Cloudflare's class and `ctx` the Worker's context (both
 * injected for testing, with `deps.fetch` for the look at the sender's site).
 */
export async function handleEnquiry(request, env, EmailMessage, ctx, deps = {}) {
  const url = new URL(request.url);
  if (request.method === 'GET' || request.method === 'HEAD') {
    // Says whether the spam limits are wired up, so a missing binding can't go unnoticed.
    const limits = env.ENQUIRY_PER_IP && env.ENQUIRY_GLOBAL ? 'on' : 'off';
    return json(
      200,
      { ...API_DESCRIPTION, endpoint: `${url.origin}/api/enquiry` },
      { 'X-Enquiry-Limits': limits },
    );
  }
  if (request.method !== 'POST') return json(405, { ok: false }, { Allow: 'GET, POST' });

  const wantsJson =
    (request.headers.get('accept') ?? '').includes('application/json') ||
    (request.headers.get('content-type') ?? '').includes('application/json');
  // Form posts only from our own pages; JSON (agents, scripts) may come from anywhere.
  const origin = request.headers.get('origin');
  if (!wantsJson && origin && origin !== url.origin) return json(403, { ok: false });

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (await overLimit(env, ip)) {
    const message = 'Too many messages in a short time. Please wait a minute and try again.';
    if (wantsJson)
      return json(429, { ok: false, errors: { form: message } }, { 'Retry-After': '60' });
    return Response.redirect(`${url.origin}/contact/?error=busy`, 303);
  }

  let raw;
  try {
    raw = await readFields(request);
  } catch (error) {
    if (error instanceof TooLarge) {
      return json(413, { ok: false, errors: { form: 'That message is too long.' } });
    }
    return json(400, { ok: false, errors: { form: 'Could not read the form.' } });
  }
  const done = () =>
    wantsJson ? json(200, { ok: true }) : Response.redirect(`${url.origin}/thanks/`, 303);

  // Honeypot: people never see this field. Pretend it worked so bots learn nothing.
  if (raw.company) return done();

  const { data, errors } = validate(raw);
  if (errors) {
    if (wantsJson) return json(400, { ok: false, errors });
    const back = new URL(`${url.origin}/contact/`);
    back.searchParams.set('error', '1');
    return Response.redirect(back.toString(), 303);
  }

  try {
    const look = data.website ? await lookAtSite(data.website, deps) : null;
    const raw822 = buildEmail(data, {
      from: env.FROM_ADDRESS,
      to: env.TO_ADDRESS,
      source: sourceOf(request, url.origin, wantsJson),
      look,
    });
    await env.SEND_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw822));
  } catch (error) {
    console.error('enquiry: send failed', error instanceof Error ? error.message : error);
    if (wantsJson)
      return json(502, { ok: false, errors: { form: 'Sending failed. Please email us instead.' } });
    return Response.redirect(`${url.origin}/contact/?error=send`, 303);
  }
  // After the response: the sender never waits for their own auto-reply.
  const reply = sendAutoReply(data, env, EmailMessage, url.origin);
  if (ctx?.waitUntil) ctx.waitUntil(reply);
  else await reply;
  return done();
}

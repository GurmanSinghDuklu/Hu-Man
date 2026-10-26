/**
 * POST /api/enquiry: the site's one form endpoint. Every form on the site posts here, and so can
 * an AI agent acting for someone (the fields are documented in llms.txt and by GET /api/enquiry).
 *
 * It validates the fields, drops spam quietly (a hidden honeypot field), and emails the enquiry to
 * the studio's inbox through Cloudflare's send_email binding. Nothing is stored. Replies go
 * straight to the sender (Reply-To).
 *
 * Kept free of Cloudflare-only imports so it can be tested in Node (worker/enquiry.test.js);
 * worker/index.js passes in Cloudflare's EmailMessage class.
 */

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

/** The plain-text email, as raw MIME (what Cloudflare's EmailMessage takes). */
export function buildEmail(data, { from, to, now = new Date(), id = crypto.randomUUID() }) {
  const what = data.topic === 'tier' && data.tier ? `${data.tier} tier` : TOPICS[data.topic];
  const subject = `Website enquiry: ${what}${data.website ? ` (${data.website})` : ''} from ${data.name}`;
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
    'Reply to this email to answer them directly.',
  ].filter((line) => line !== null);
  const body = toBase64(lines.join('\r\n')).replace(/.{76}/g, '$&\r\n');
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
    body,
  ].join('\r\n');
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

/** Handles /api/enquiry. `EmailMessage` is Cloudflare's class (injected for testing). */
export async function handleEnquiry(request, env, EmailMessage) {
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
    const raw822 = buildEmail(data, { from: env.FROM_ADDRESS, to: env.TO_ADDRESS });
    await env.SEND_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw822));
  } catch (error) {
    console.error('enquiry: send failed', error instanceof Error ? error.message : error);
    if (wantsJson)
      return json(502, { ok: false, errors: { form: 'Sending failed. Please email us instead.' } });
    return Response.redirect(`${url.origin}/contact/?error=send`, 303);
  }
  return done();
}

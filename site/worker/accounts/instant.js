/**
 * Instant portfolios (spec: docs/superpowers/specs/2026-11-23-self-serve-portfolios-design.md,
 * phases C and D). A "Choose design + upload CV" request is built from its answers with the
 * design's template (templates/) into R2 as a preview version (preview.js serves it with the bar).
 * Paying publishes it at https://<slug>.<domain>/ (servePublished below); a connected custom domain
 * (domains.js) serves the same files.
 */
import { json, fail, notFound, readJson, line } from './http.js';
import { projectFor } from './account.js';
import { keysUnder } from './upload.js';
import { typeFor } from './preview.js';
import { saveEnquiry } from './enquiries.js';
import { tellStudio } from './mail.js';
import { sendToPerson } from './send.js';
import { profile } from './templates/shared.js';
import { leah } from './templates/leah.js';
import { noor } from './templates/noor.js';
import { theo } from './templates/theo.js';
import { validateRequest } from '../../src/data/portfolioRequest.ts';
import { portfolioConcepts } from '../../src/data/portfolioConcepts.ts';
import { portfolioTiers } from '../../src/data/pricing.ts';
import { productionUrl } from '../../src/config/domain.ts';

const TEMPLATES = { leah, noor, theo };
export const APEX = new URL(productionUrl).hostname;
const RESERVED = new Set([
  'www',
  'api',
  'admin',
  'mail',
  'sites',
  'preview',
  'app',
  'login',
  'account',
  'static',
  'cdn',
  'hu',
  'human',
]);

/** The instant design for a concept name, with its template and price in pence, or null. */
export function instantDesign(name) {
  const concept = portfolioConcepts.find((c) => c.name === name && c.instantTier);
  const template = concept && TEMPLATES[concept.slug];
  if (!template) return null;
  const tier = portfolioTiers.find((t) => t.name === concept.instantTier);
  const pence = Math.round(Number(String(tier?.price ?? '').replace(/[£,]/g, '')) * 100);
  return {
    concept,
    template,
    tier: concept.instantTier,
    pence: Number.isFinite(pence) ? pence : null,
  };
}

/** Builds the portfolio into R2 as a new preview version and switches to it. */
export async function buildInstant(env, project, answers, origin, now = Date.now()) {
  const design = instantDesign(project.concept);
  if (!design) throw new Error('No instant template for this design.');
  // Their CV, if it's a PDF, goes on the site as a download (the Profile tier promises one).
  const cv = await env.DB.prepare(
    "SELECT r2_key FROM files WHERE project_id = ? AND field = 'cv' AND type = 'application/pdf' ORDER BY created_at DESC",
  )
    .bind(project.id)
    .first();
  const cvBytes = cv ? await env.FILES.get(cv.r2_key) : null;
  const html = design.template(profile(answers, { cvUrl: cvBytes ? 'cv.pdf' : null }), {
    fontBase: productionUrl,
  });
  const version = `v${now}-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`;
  const prefix = `preview/${project.id}/${version}/`;
  await env.FILES.put(`${prefix}index.html`, new TextEncoder().encode(html), {
    httpMetadata: { contentType: typeFor('index.html') },
  });
  if (cvBytes) {
    await env.FILES.put(`${prefix}cv.pdf`, await new Response(cvBytes.body).arrayBuffer(), {
      httpMetadata: { contentType: 'application/pdf' },
    });
  }
  await env.DB.prepare(
    'UPDATE projects SET preview_version = ?, preview_at = ?, quote_pence = COALESCE(quote_pence, ?), tier = ? WHERE id = ?',
  )
    .bind(version, now, design.pence, `Portfolio: ${design.tier}`, project.id)
    .run();
  const old = (await keysUnder(env, `preview/${project.id}/`)).filter((k) => !k.startsWith(prefix));
  for (let i = 0; i < old.length; i += 1000) await env.FILES.delete(old.slice(i, i + 1000));
  return `/preview/${project.id}/`;
}

async function ownInstant(env, user, id) {
  const project = await projectFor(env, user, id);
  return project &&
    project.user_id === user.id &&
    project.kind === 'request' &&
    project.route === 'instant'
    ? project
    : null;
}

/** POST /api/account/request/rebuild?p= { answers } : edit details, build again. */
export async function rebuild(request, url, env, user, now = Date.now()) {
  const project = await ownInstant(env, user, url.searchParams.get('p'));
  if (!project) return notFound();
  const body = (await readJson(request)) ?? {};
  const { answers, errors } = validateRequest(body.answers, { sending: true });
  if (Object.keys(errors).length)
    return fail(400, 'A few things need filling in first.', { errors });
  await env.DB.prepare('UPDATE briefs SET answers = ?, updated_at = ? WHERE project_id = ?')
    .bind(JSON.stringify(answers), now, project.id)
    .run();
  const previewPath = await buildInstant(env, project, answers, url.origin, now);
  return json({ ok: true, previewPath, live: Boolean(project.live_at) });
}

/** POST /api/account/request/talk?p= { about: 'launch' | 'change' } : "Speak with us" / "Contact us to change it". */
export async function talk(request, url, env, user, now = Date.now()) {
  const project = await projectFor(env, user, url.searchParams.get('p'));
  if (!project || project.user_id !== user.id) return notFound();
  const body = (await readJson(request)) ?? {};
  const change = body.about === 'change';
  const message = line(body.message, 1000);
  const id = await saveEnquiry(
    env,
    {
      name: user.name,
      email: user.email,
      concept: project.concept,
      via: change ? 'Portfolio: change request' : 'Portfolio: speak with us',
      message:
        message ||
        (change
          ? 'Would like a change to their live portfolio.'
          : 'Would like to talk before launching their portfolio.'),
      topic: 'website',
    },
    '/account/',
    now,
  );
  await env.DB.prepare('UPDATE enquiries SET user_id = ? WHERE id = ?').bind(user.id, id).run();
  await tellStudio(
    env,
    `[${change ? 'Change request' : 'Speak with us'}] ${project.name}`,
    `${user.name} (${user.email}) ${change ? 'would like a change to their live portfolio' : 'would like to talk before launching'}.${message ? `\n\n${message}` : ''}\n\n${url.origin}/admin/client/?id=${user.id}`,
  );
  return json({ ok: true });
}

/** A free subdomain made from their name. */
async function freeSlug(env, name) {
  const base =
    String(name ?? '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'portfolio';
  for (let i = 1; i < 100; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (RESERVED.has(slug)) continue;
    const taken = await env.DB.prepare('SELECT 1 FROM projects WHERE site_slug = ?')
      .bind(slug)
      .first();
    if (!taken) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Puts a paid instant portfolio live on its own subdomain and tells them. */
export async function publish(env, projectId, now = Date.now()) {
  const project = await env.DB.prepare(
    'SELECT projects.*, users.name AS client, users.email FROM projects JOIN users ON users.id = projects.user_id WHERE projects.id = ?',
  )
    .bind(projectId)
    .first();
  if (!project || project.route !== 'instant' || !project.preview_version || project.live_at)
    return null;
  const answers = JSON.parse(
    (await env.DB.prepare('SELECT answers FROM briefs WHERE project_id = ?')
      .bind(projectId)
      .first('answers')) ?? '{}',
  );
  const slug = await freeSlug(
    env,
    [answers.firstName, answers.surname].filter(Boolean).join(' ') || project.client,
  );
  const liveUrl = `https://${slug}.${APEX}/`;
  await env.DB.prepare('UPDATE projects SET site_slug = ?, live_url = ?, live_at = ? WHERE id = ?')
    .bind(slug, liveUrl, now, projectId)
    .run();
  await sendToPerson(env, {
    to: project.email,
    subject: 'Your portfolio is live',
    text: `Your portfolio is live at ${liveUrl}\n\nWant your own domain on it, or a change made? It's all in your account: ${productionUrl}/account/\n\nThank you for choosing Hu/man.`,
  });
  return liveUrl;
}

const PUBLISHED_HEADERS = {
  'Cache-Control': 'public, max-age=300',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; font-src ${productionUrl}; img-src 'self' data:; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
};

/**
 * A published portfolio, when the request is for <slug>.<domain> or a connected custom domain.
 * Returns null for the main site (and anything local), so worker/index.js carries on as normal.
 */
export async function servePublished(request, env) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  if (host === APEX || host === `www.${APEX}` || host === 'localhost' || host === '127.0.0.1')
    return null;
  let project;
  if (host.endsWith(`.${APEX}`)) {
    const slug = host.slice(0, -APEX.length - 1);
    project = await env.DB.prepare(
      'SELECT id, preview_version FROM projects WHERE site_slug = ? AND live_at IS NOT NULL',
    )
      .bind(slug)
      .first();
  } else {
    project = await env.DB.prepare(
      "SELECT id, preview_version FROM projects WHERE custom_domain = ? AND custom_domain_status = 'active' AND live_at IS NOT NULL",
    )
      .bind(host)
      .first();
  }
  const missing = () =>
    new Response('<!doctype html><title>Not found</title><p>There’s no page here.</p>', {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...PUBLISHED_HEADERS,
        'Cache-Control': 'no-store',
      },
    });
  if (!project?.preview_version) return missing();
  let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (path.split('/').includes('..')) return missing();
  if (path === '' || path.endsWith('/')) path += 'index.html';
  const object = await env.FILES.get(`preview/${project.id}/${project.preview_version}/${path}`);
  if (!object) return missing();
  return new Response(object.body, {
    headers: { 'Content-Type': typeFor(path), ...PUBLISHED_HEADERS },
  });
}

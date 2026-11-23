/**
 * "Connect my own domain" for a live instant portfolio (phase D). Uses Cloudflare for SaaS custom
 * hostnames on our zone: secrets CF_API_TOKEN (permission: SSL and Certificates edit) and
 * CF_ZONE_ID. The person adds one CNAME record at their domain company, pointing their address at
 * sites.<our domain> (the fallback origin); Cloudflare then issues the certificate and the Worker
 * serves their portfolio there (instant.js servePublished). First 100 custom hostnames are free.
 *
 *   POST   /api/account/domain?p= { domain }  start (or change) the connection
 *   GET    /api/account/domain?p=             check it; once Cloudflare says active, it's live there
 *   DELETE /api/account/domain?p=             disconnect; back to the <slug> address
 */
import { json, fail, notFound, readJson } from './http.js';
import { projectFor } from './account.js';
import { APEX } from './instant.js';

const HOSTNAME = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export const CNAME_TARGET = `sites.${APEX}`;

async function cf(env, method, path, body) {
  const res = await (env.CF_FETCH ?? fetch)(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/custom_hostnames${path}`,
    {
      method,
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, data };
}

async function ownLive(env, user, id) {
  const p = await projectFor(env, user, id);
  return p && p.user_id === user.id && p.live_at ? p : null;
}

const instructions = (domain) => ({
  record: 'CNAME',
  name: domain,
  target: CNAME_TARGET,
  note: 'Add this at the company you bought your domain from. It can take from a few minutes to a few hours to work.',
});

/** POST /api/account/domain?p= { domain } */
export async function connectDomain(request, url, env, user) {
  const p = await ownLive(env, user, url.searchParams.get('p'));
  if (!p) return notFound();
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    return fail(
      503,
      'Connecting your own domain isn’t switched on yet. Use “Contact us” and we’ll do it for you.',
    );
  }
  const body = (await readJson(request)) ?? {};
  const domain = String(body.domain ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
  if (!HOSTNAME.test(domain) || domain === APEX || domain.endsWith(`.${APEX}`)) {
    return fail(400, 'Please enter a domain you own, like www.yourname.co.uk.', {
      errors: { domain: 'Check the domain.' },
    });
  }
  const taken = await env.DB.prepare('SELECT id FROM projects WHERE custom_domain = ? AND id != ?')
    .bind(domain, p.id)
    .first();
  if (taken) return fail(409, 'That domain is already connected to another portfolio.');
  if (p.custom_domain_id) await cf(env, 'DELETE', `/${p.custom_domain_id}`);
  const made = await cf(env, 'POST', '', { hostname: domain, ssl: { method: 'http', type: 'dv' } });
  if (!made.ok || !made.data?.result?.id) {
    console.error('custom hostname failed', JSON.stringify(made.data?.errors ?? made.data));
    return fail(502, 'We couldn’t start connecting that domain. Please try again, or contact us.');
  }
  await env.DB.prepare(
    "UPDATE projects SET custom_domain = ?, custom_domain_id = ?, custom_domain_status = 'pending' WHERE id = ?",
  )
    .bind(domain, made.data.result.id, p.id)
    .run();
  return json({ ok: true, domain, status: 'pending', ...instructions(domain) });
}

/** GET /api/account/domain?p= : checks with Cloudflare; switches the live address once active. */
export async function checkDomain(url, env, user) {
  const p = await ownLive(env, user, url.searchParams.get('p'));
  if (!p) return notFound();
  if (!p.custom_domain) return json({ ok: true, status: 'none' });
  if (p.custom_domain_status === 'active')
    return json({ ok: true, status: 'active', domain: p.custom_domain });
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID)
    return json({
      ok: true,
      status: 'pending',
      domain: p.custom_domain,
      ...instructions(p.custom_domain),
    });
  const got = await cf(env, 'GET', `/${p.custom_domain_id}`);
  const result = got.data?.result ?? {};
  const active = result.status === 'active' && result.ssl?.status === 'active';
  if (active) {
    await env.DB.prepare(
      "UPDATE projects SET custom_domain_status = 'active', live_url = ? WHERE id = ?",
    )
      .bind(`https://${p.custom_domain}/`, p.id)
      .run();
    return json({ ok: true, status: 'active', domain: p.custom_domain });
  }
  return json({
    ok: true,
    status: 'pending',
    domain: p.custom_domain,
    ...instructions(p.custom_domain),
  });
}

/** DELETE /api/account/domain?p= */
export async function disconnectDomain(url, env, user) {
  const p = await ownLive(env, user, url.searchParams.get('p'));
  if (!p) return notFound();
  if (p.custom_domain_id && env.CF_API_TOKEN && env.CF_ZONE_ID)
    await cf(env, 'DELETE', `/${p.custom_domain_id}`);
  await env.DB.prepare(
    'UPDATE projects SET custom_domain = NULL, custom_domain_id = NULL, custom_domain_status = NULL, live_url = ? WHERE id = ?',
  )
    .bind(p.site_slug ? `https://${p.site_slug}.${APEX}/` : p.live_url, p.id)
    .run();
  return json({ ok: true });
}

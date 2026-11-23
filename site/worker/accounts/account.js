/**
 * What a logged-in client sees: themselves and their projects, each with its brief's state, money
 * and preview. `briefState` is 'not-started' (nothing saved yet), 'draft' or 'sent'. `stage` is
 * worked out from the fields: brief → building (deposit paid) → preview (a version uploaded) →
 * paid → live. Money is in whole pence.
 */
import { json, fail, clearCookie } from './http.js';
import { deleteClientData } from './admin.js';

const PROJECT_FIELDS = `projects.id, projects.user_id, projects.name, projects.type, projects.tier,
  projects.concept, projects.status, projects.created_at, projects.quote_pence,
  projects.deposit_pence, projects.deposit_paid_at, projects.preview_version, projects.preview_at,
  projects.paid_pence, projects.paid_at, projects.payment_ref, projects.live_url, projects.live_at,
  projects.kind, projects.route, projects.site_slug, projects.custom_domain,
  projects.custom_domain_status, projects.cancel_waiver_at`;

export function stageOf(p) {
  if (p.live_at) return 'live';
  if (p.paid_at) return 'paid';
  if (p.preview_version) return 'preview';
  if (p.deposit_paid_at) return 'building';
  return 'brief';
}

/** Money and preview facts for a project row (shared by the client and admin views). */
export function moneyOf(p) {
  const quote = p.quote_pence ?? null;
  const deposit = p.deposit_paid_at ? (p.deposit_pence ?? 0) : 0;
  return {
    stage: stageOf(p),
    quotePence: quote,
    depositPence: p.deposit_pence ?? null,
    depositPaidAt: p.deposit_paid_at ?? null,
    duePence: quote === null || p.paid_at ? 0 : Math.max(0, quote - deposit),
    paidPence: p.paid_pence ?? null,
    paidAt: p.paid_at ?? null,
    previewAt: p.preview_at ?? null,
    previewPath: p.preview_version ? `/preview/${p.id}/` : null,
    previewBase: `/preview/${p.id}/`,
    liveUrl: p.live_url ?? null,
    liveAt: p.live_at ?? null,
    kind: p.kind ?? 'brief',
    route: p.route ?? null,
    customDomain: p.custom_domain ?? null,
    customDomainStatus: p.custom_domain_status ?? null,
  };
}

/** The projects a user owns (or, for an admin reading a client, that client's). */
export async function projectsOf(env, userId) {
  const { results } = await env.DB.prepare(
    `SELECT ${PROJECT_FIELDS}, briefs.state, briefs.answers, briefs.updated_at, briefs.sent_at
     FROM projects LEFT JOIN briefs ON briefs.project_id = projects.id
     WHERE projects.user_id = ? ORDER BY projects.created_at`,
  )
    .bind(userId)
    .all();
  return results.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    tier: p.tier,
    concept: p.concept,
    status: p.status,
    briefState:
      p.state === 'sent' ? 'sent' : !p.answers || p.answers === '{}' ? 'not-started' : 'draft',
    updatedAt: p.updated_at,
    sentAt: p.sent_at,
    ...moneyOf(p),
  }));
}

/** DELETE /api/account/me : a client deletes their own account and everything in it. */
export async function deleteMe(env, user) {
  if (user.role !== 'client') return fail(403, 'Team accounts can’t be deleted here.');
  await deleteClientData(env, user.id);
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}

/** GET /api/account/me */
export async function me(env, user) {
  return json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role },
    projects: await projectsOf(env, user.id),
  });
}

/**
 * A project the user may act on: their own, or any project when the user is an admin.
 * Returns null otherwise (the caller answers 404, so ids can't be probed).
 */
export async function projectFor(env, user, projectId) {
  if (typeof projectId !== 'string' || !projectId || projectId.length > 64) return null;
  const project = await env.DB.prepare(`SELECT ${PROJECT_FIELDS} FROM projects WHERE id = ?`)
    .bind(projectId)
    .first();
  if (!project) return null;
  if (project.user_id !== user.id && user.role !== 'admin') return null;
  return project;
}

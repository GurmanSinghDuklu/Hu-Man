/**
 * What a logged-in client sees: themselves and their projects, each with its brief's state.
 * `briefState` is 'not-started' (nothing saved yet), 'draft' or 'sent'.
 */
import { json } from './http.js';

/** The projects a user owns (or, for an admin reading a client, that client's). */
export async function projectsOf(env, userId) {
  const { results } = await env.DB.prepare(
    `SELECT projects.id, projects.name, projects.type, projects.tier, projects.concept,
            projects.status, projects.created_at, briefs.state, briefs.answers,
            briefs.updated_at, briefs.sent_at
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
    briefState: p.state === 'sent' ? 'sent' : !p.answers || p.answers === '{}' ? 'not-started' : 'draft',
    updatedAt: p.updated_at,
    sentAt: p.sent_at,
  }));
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
  const project = await env.DB.prepare(
    'SELECT id, user_id, name, type, tier, concept, status FROM projects WHERE id = ?',
  )
    .bind(projectId)
    .first();
  if (!project) return null;
  if (project.user_id !== user.id && user.role !== 'admin') return null;
  return project;
}

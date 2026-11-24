/**
 * Admin routes: list clients, create a client with their first project and a setup link, read a
 * client's briefs and files, issue a new setup link (forgotten password), reopen a sent brief.
 * index.js only calls these for admins; everyone else gets 404 before reaching here.
 */
import { json, fail, notFound, readJson, line } from './http.js';
import { addUser, createInvite, normaliseEmail, EMAIL } from './auth.js';
import { projectsOf } from './account.js';
import { linkEnquiry } from './enquiries.js';
import { keysUnder } from './upload.js';

export const PROJECT_TYPES = ['business', 'portfolio', 'custom'];

/** GET /api/admin/clients */
export async function listClients(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, email, name, created_at, password_hash IS NOT NULL AS has_password
     FROM users WHERE role = 'client' ORDER BY created_at DESC`,
  ).all();
  const clients = [];
  for (const c of results) {
    clients.push({
      id: c.id,
      email: c.email,
      name: c.name,
      createdAt: c.created_at,
      hasPassword: Boolean(c.has_password),
      projects: await projectsOf(env, c.id),
    });
  }
  return json({ ok: true, clients });
}

/**
 * POST /api/admin/clients { name, email, project: { name, type, tier?, concept? }, enquiryId? }
 * With enquiryId (the Enquiries list's "Make client"), that enquiry is marked as now a client.
 */
export async function createClient(request, env, origin, now = Date.now()) {
  const body = await readJson(request);
  if (!body) return fail(413, 'Too large.');
  const project = body.project && typeof body.project === 'object' ? body.project : {};
  const data = {
    name: line(body.name, 100),
    email: normaliseEmail(body.email),
    type: line(project.type, 20),
    tier: line(project.tier, 60) || null,
    concept: line(project.concept, 60) || null,
  };
  data.projectName =
    line(project.name, 100) ||
    `${data.name}’s ${data.type === 'portfolio' ? 'portfolio' : data.type === 'custom' ? 'project' : 'website'}`;
  const errors = {};
  if (!data.name) errors.name = 'Add their name.';
  if (!EMAIL.test(data.email)) errors.email = 'Add a valid email address.';
  if (!PROJECT_TYPES.includes(data.type)) errors.type = 'Choose a project type.';
  if (Object.keys(errors).length) return fail(400, 'Please check the form.', { errors });

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(data.email)
    .first();
  if (existing)
    return fail(409, 'There is already an account with that email.', {
      errors: { email: 'Already has an account.' },
    });

  const user = await addUser(env, { email: data.email, name: data.name, role: 'client' }, now);
  const projectId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO projects (id, user_id, name, type, tier, concept, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(projectId, user.id, data.projectName, data.type, data.tier, data.concept, now),
    env.DB.prepare('INSERT INTO briefs (project_id, updated_at) VALUES (?, ?)').bind(
      projectId,
      now,
    ),
  ]);
  const setupUrl = await createInvite(env, user.id, origin, now);
  await linkEnquiry(env, body.enquiryId, user.id);
  return json({ ok: true, client: { id: user.id }, projectId, setupUrl }, 201);
}

/** GET /api/admin/clients/<id> : the client, each project's answers and files. */
export async function clientDetail(env, id) {
  const client = await env.DB.prepare(
    `SELECT id, email, name, role, created_at, password_hash IS NOT NULL AS has_password
     FROM users WHERE id = ?`,
  )
    .bind(id)
    .first();
  if (!client) return notFound();
  const projects = [];
  for (const p of await projectsOf(env, id)) {
    const brief = await env.DB.prepare(
      'SELECT answers, consent_at FROM briefs WHERE project_id = ?',
    )
      .bind(p.id)
      .first();
    const { results: files } = await env.DB.prepare(
      'SELECT id, field, name, type, size, created_at FROM files WHERE project_id = ? ORDER BY created_at',
    )
      .bind(p.id)
      .all();
    projects.push({
      ...p,
      answers: brief ? JSON.parse(brief.answers) : {},
      consentAt: brief?.consent_at ?? null,
      files: files.map((f) => ({
        id: f.id,
        field: f.field,
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    });
  }
  return json({
    ok: true,
    client: {
      id: client.id,
      email: client.email,
      name: client.name,
      role: client.role,
      createdAt: client.created_at,
      hasPassword: Boolean(client.has_password),
    },
    projects,
  });
}

/** POST /api/admin/clients/<id>/invite : new setup link; older links and all sessions end. */
export async function newInvite(env, id, origin) {
  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (!user) return notFound();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM invites WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
  ]);
  return json({ ok: true, setupUrl: await createInvite(env, id, origin) });
}

/**
 * DELETE /api/admin/clients/<id> : removes a client and everything about them: uploads in R2, then
 * their files, briefs, projects, setup links, sessions, the enquiries they sent (by account or
 * email) and the account itself. Child rows are deleted explicitly rather than trusting cascades.
 * Admin accounts can't be deleted here (404), so nobody locks the team out by mistake.
 */
export async function deleteClient(env, id) {
  const removed = await deleteClientData(env, id);
  return removed === null ? notFound() : json({ ok: true, removedFiles: removed });
}

/**
 * Everything about a client, gone: uploads and previews in R2, then every row. Returns how many
 * stored files went, or null if there's no such client. Used by the admin removal and by a client's
 * own "Delete my account".
 */
export async function deleteClientData(env, id) {
  const user = await env.DB.prepare("SELECT id, email FROM users WHERE id = ? AND role = 'client'")
    .bind(id)
    .first();
  if (!user) return null;
  const { results: stored } = await env.DB.prepare(
    'SELECT files.r2_key FROM files JOIN projects ON projects.id = files.project_id WHERE projects.user_id = ?',
  )
    .bind(id)
    .all();
  for (const { r2_key: key } of stored) await env.FILES.delete(key);
  const { results: own } = await env.DB.prepare('SELECT id FROM projects WHERE user_id = ?')
    .bind(id)
    .all();
  for (const { id: projectId } of own) {
    const keys = await keysUnder(env, `preview/${projectId}/`);
    for (let i = 0; i < keys.length; i += 1000) await env.FILES.delete(keys.slice(i, i + 1000));
  }
  const projects = 'SELECT id FROM projects WHERE user_id = ?';
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM files WHERE project_id IN (${projects})`).bind(id),
    env.DB.prepare(`DELETE FROM briefs WHERE project_id IN (${projects})`).bind(id),
    env.DB.prepare('DELETE FROM projects WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM invites WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM email_codes WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM oauth_identities WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM enquiries WHERE user_id = ? OR email = ?').bind(id, user.email),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
  ]);
  return stored.length;
}

/** POST /api/admin/projects/<id>/reopen : a sent brief goes back to draft. */
export async function reopenBrief(env, projectId) {
  const { meta } = await env.DB.prepare(
    "UPDATE briefs SET state = 'draft', sent_at = NULL WHERE project_id = ?",
  )
    .bind(projectId)
    .run();
  return meta.changes ? json({ ok: true }) : notFound();
}

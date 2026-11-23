/**
 * The enquiries list in /admin/: every valid form send on the site is saved here by
 * worker/enquiry.js (before its email goes out), so the team sees it even if the email doesn't
 * arrive. Admins mark each one replied or not a fit, or make it a client (admin.js links them).
 * Kept 12 months, as the privacy notice says, unless it became a client.
 */
import { json, fail, notFound, readJson } from './http.js';

const YEAR = 365 * 24 * 3600 * 1000;
export const ENQUIRY_STATUSES = ['new', 'replied', 'not-a-fit', 'client'];

/** Saves a validated enquiry (worker/enquiry.js `validate` output). Returns its id. */
export async function saveEnquiry(env, data, source, now = Date.now()) {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO enquiries (id, created_at, name, email, phone, website, topic, tier, concept,
       service, via, message, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      now,
      data.name,
      data.email,
      data.phone || null,
      data.website || null,
      data.topic || null,
      data.tier || null,
      data.concept || null,
      data.service || null,
      data.via || null,
      data.message || null,
      source || null,
    )
    .run();
  return id;
}

/** GET /api/admin/enquiries : the latest 300, newest first, after clearing out old ones. */
export async function listEnquiries(env, now = Date.now()) {
  await env.DB.prepare("DELETE FROM enquiries WHERE created_at < ? AND status != 'client'")
    .bind(now - YEAR)
    .run();
  const { results } = await env.DB.prepare(
    'SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 300',
  ).all();
  const newCount = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'",
  ).first('n');
  return json({
    ok: true,
    newCount,
    enquiries: results.map((e) => ({
      id: e.id,
      createdAt: e.created_at,
      name: e.name,
      email: e.email,
      phone: e.phone,
      website: e.website,
      topic: e.topic,
      tier: e.tier,
      concept: e.concept,
      service: e.service,
      via: e.via,
      message: e.message,
      source: e.source,
      status: e.status,
      clientId: e.user_id,
    })),
  });
}

/** POST /api/admin/enquiries/<id> { status: 'new' | 'replied' | 'not-a-fit' } */
export async function setEnquiryStatus(request, env, id) {
  const body = await readJson(request);
  const status = body?.status;
  if (!['new', 'replied', 'not-a-fit'].includes(status)) return fail(400, 'Unknown status.');
  const { meta } = await env.DB.prepare('UPDATE enquiries SET status = ? WHERE id = ?')
    .bind(status, id)
    .run();
  return meta.changes ? json({ ok: true }) : notFound();
}

/** DELETE /api/admin/enquiries/<id> */
export async function deleteEnquiry(env, id) {
  const { meta } = await env.DB.prepare('DELETE FROM enquiries WHERE id = ?').bind(id).run();
  return meta.changes ? json({ ok: true }) : notFound();
}

/** Marks an enquiry as made into a client (admin.js, after creating the account). */
export async function linkEnquiry(env, enquiryId, userId) {
  if (typeof enquiryId !== 'string' || !enquiryId || enquiryId.length > 64) return;
  await env.DB.prepare("UPDATE enquiries SET status = 'client', user_id = ? WHERE id = ?")
    .bind(userId, enquiryId)
    .run();
}

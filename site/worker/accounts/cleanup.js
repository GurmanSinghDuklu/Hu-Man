/**
 * The daily clean-up (wrangler.toml [triggers], worker/index.js `scheduled`), keeping the privacy
 * notice's promises:
 *   - sign-ups never confirmed within 7 days are deleted;
 *   - client accounts not logged into for 12 months are deleted with everything in them, unless they
 *     have paid for something or have a site live (those are kept while we look after the site);
 *   - expired sessions, setup links and codes are cleared out.
 * Enquiries clear themselves after 12 months (enquiries.js).
 */
import { deleteClientData } from './admin.js';

const DAY = 24 * 3600 * 1000;

export async function cleanUp(env, now = Date.now()) {
  const { results: unconfirmed } = await env.DB.prepare(
    "SELECT id FROM users WHERE role = 'client' AND email_verified_at IS NULL AND password_hash IS NOT NULL AND created_at < ?",
  )
    .bind(now - 7 * DAY)
    .all();
  const { results: unused } = await env.DB.prepare(
    `SELECT users.id FROM users
     WHERE users.role = 'client' AND COALESCE(users.last_login_at, users.created_at) < ?
       AND NOT EXISTS (SELECT 1 FROM projects WHERE projects.user_id = users.id
                       AND (projects.paid_at IS NOT NULL OR projects.live_at IS NOT NULL))`,
  )
    .bind(now - 365 * DAY)
    .all();
  for (const { id } of [...unconfirmed, ...unused]) await deleteClientData(env, id);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM invites WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM email_codes WHERE expires_at < ?').bind(now),
  ]);
  return { unconfirmed: unconfirmed.length, unused: unused.length };
}

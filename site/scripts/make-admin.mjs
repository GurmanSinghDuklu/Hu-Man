/**
 * Creates (or re-invites) an admin for the client area and prints their one-time setup link.
 * The site has no screen that makes admins, on purpose: this is the only way.
 *
 *   npm run make-admin -- <email> "<name>"            local D1 (wrangler dev)
 *   npm run make-admin -- <email> "<name>" --remote   the live D1 (asks wrangler to log in)
 *
 * Running it again for the same email makes a fresh link (use it for a forgotten admin password).
 * Only the link's SHA-256 hash is stored; the link itself is printed once, here.
 */
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { productionUrl } from '../src/config/domain.ts';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const [email, name] = args.filter((a) => a !== '--remote');
const EMAIL = /^[^\s@<>()[\]\\,;:"']+@[^\s@<>()[\]\\,;:"']+\.[^\s@<>()[\]\\,;:"'.]{2,}$/;

if (!email || !name || !EMAIL.test(email)) {
  console.error('Usage: npm run make-admin -- <email> "<name>" [--remote]');
  process.exit(1);
}

const sql = (text) => `'${String(text).replace(/'/g, "''")}'`;
const lower = email.trim().toLowerCase();
const token = randomBytes(32).toString('base64url');
const hash = createHash('sha256').update(token).digest('hex');
const now = Date.now();
const week = 7 * 24 * 3600 * 1000;

const command = [
  `INSERT INTO users (id, email, name, role, created_at) VALUES (${sql(randomUUID())}, ${sql(lower)}, ${sql(name.trim().slice(0, 100))}, 'admin', ${now}) ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
  `DELETE FROM invites WHERE user_id = (SELECT id FROM users WHERE email = ${sql(lower)})`,
  `INSERT INTO invites (token_hash, user_id, expires_at) SELECT ${sql(hash)}, id, ${now + week} FROM users WHERE email = ${sql(lower)}`,
].join('; ');

execFileSync(
  'npx',
  [
    'wrangler',
    'd1',
    'execute',
    'hm_accounts',
    remote ? '--remote' : '--local',
    '--command',
    command,
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);

const origin = remote ? productionUrl : 'http://localhost:8787';
console.log(`\nAdmin ${lower} is ready. Their setup link (works once, for 7 days):\n`);
console.log(`  ${origin}/account/setup/?t=${token}\n`);

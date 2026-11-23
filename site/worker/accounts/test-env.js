/**
 * Test helpers for the client accounts API. D1 is stood in for by Node's built-in SQLite running the
 * real migrations (migrations/*.sql) behind the small part of D1's API the Worker uses; R2 by a Map.
 * Nothing here is imported by the Worker itself.
 */
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

const MIGRATIONS = new URL('../../migrations/', import.meta.url);
export const ORIGIN = 'https://humansoftwareagency.com';

/** The subset of D1 the Worker uses: prepare().bind().first()/all()/run(), and batch(). */
function fakeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(file, MIGRATIONS), 'utf8'));
  }
  const statement = (sql, params = []) => ({
    bind: (...values) => statement(sql, values),
    async first(column) {
      const row = db.prepare(sql).get(...params);
      if (!row) return null;
      const plain = { ...row };
      return column ? plain[column] : plain;
    },
    async all() {
      return { results: db.prepare(sql).all(...params).map((row) => ({ ...row })) };
    },
    async run() {
      const info = db.prepare(sql).run(...params);
      return { meta: { changes: Number(info.changes) } };
    },
  });
  return {
    raw: db,
    prepare: (sql) => statement(sql),
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        db.exec('COMMIT');
        return out;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

/** The subset of R2 the Worker uses: put, get, delete. */
function fakeR2() {
  const store = new Map();
  return {
    store,
    async put(key, body, options = {}) {
      const bytes = new Uint8Array(body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer());
      store.set(key, { bytes, httpMetadata: options.httpMetadata ?? {} });
    },
    async get(key) {
      const item = store.get(key);
      if (!item) return null;
      return { body: new Blob([item.bytes]).stream(), size: item.bytes.length, httpMetadata: item.httpMetadata };
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

class FakeEmailMessage {
  constructor(from, to, raw) {
    Object.assign(this, { from, to, raw });
  }
}

export function makeEnv() {
  const sent = [];
  return {
    sent,
    EmailMessage: FakeEmailMessage,
    DB: fakeD1(),
    FILES: fakeR2(),
    FROM_ADDRESS: 'website@humansoftwareagency.com',
    TO_ADDRESS: 'humansoftwareagency@gmail.com',
    SEND_EMAIL: { send: async (msg) => sent.push(msg) },
  };
}

/** A request to the API. `origin: null` sends no Origin header. */
export function req(method, path, { body, cookie, origin = ORIGIN, headers = {} } = {}) {
  const h = new Headers(headers);
  if (origin) h.set('Origin', origin);
  if (cookie) h.set('Cookie', cookie);
  let payload = body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    h.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }
  return new Request(`${ORIGIN}${path}`, { method, headers: h, body: payload });
}

/** The `name=value` part of a response's session cookie, for the next request. */
export const cookieFrom = (res) => (res.headers.get('Set-Cookie') ?? '').split(';')[0];

/** The decoded text body of a raw MIME message. */
export const bodyOf = (raw) =>
  Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8');

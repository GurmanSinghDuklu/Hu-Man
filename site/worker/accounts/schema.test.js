import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv } from './test-env.js';

test('the migration creates every table, and emails are unique', async () => {
  const { DB } = makeEnv();
  const tables = (
    await DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all()
  ).results.map((r) => r.name);
  for (const t of ['briefs', 'files', 'invites', 'projects', 'sessions', 'users']) {
    assert.ok(tables.includes(t), `missing ${t}`);
  }
  const add = (id) =>
    DB.prepare('INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, 'a@b.co', 'A', 'client', 1)
      .run();
  await add('1');
  await assert.rejects(add('2'));
});

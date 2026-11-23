import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, newToken, sha256Hex, safeEqual } from './crypto.js';

test('a password verifies against its own hash and nothing else', async () => {
  const { hash, salt } = await hashPassword('correct horse battery');
  assert.equal(await verifyPassword('correct horse battery', hash, salt), true);
  assert.equal(await verifyPassword('correct horse batterY', hash, salt), false);
  const again = await hashPassword('correct horse battery');
  assert.notEqual(again.hash, hash, 'a fresh salt gives a different hash');
});

test('tokens are long, URL-safe and unique; sha256Hex matches the known vector', async () => {
  const a = newToken();
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, newToken());
  assert.equal(
    await sha256Hex('a'),
    'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  );
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'ab'), false);
});

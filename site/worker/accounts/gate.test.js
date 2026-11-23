import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, req, loggedIn } from './test-env.js';
import { gateAdminPages } from './index.js';

/** A stand-in for the static files: the admin shell exists; anything else is the 404 page. */
function withAssets(env) {
  env.ASSETS = {
    fetch: async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/admin/' || pathname === '/admin/client/') {
        return new Response('<h1>Clients</h1>', {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=0' },
        });
      }
      return new Response('<h1>Page not found</h1>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    },
  };
  return env;
}

test('/admin/ looks like a page that does not exist unless you are an admin', async () => {
  const env = withAssets(makeEnv());
  const admin = await loggedIn(env, 'admin@example.co.uk', 'admin');
  const client = await loggedIn(env, 'client@example.co.uk', 'client');

  for (const path of ['/admin/', '/admin', '/admin/client/?id=x', '/admin/anything']) {
    for (const cookie of [undefined, client, '__Host-hm_session=forged']) {
      const res = await gateAdminPages(req('GET', path, { cookie, origin: null }), env);
      assert.equal(res.status, 404, `${path} with ${cookie ?? 'no cookie'}`);
      assert.match(await res.text(), /Page not found/);
      assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
    }
  }
  const page = await gateAdminPages(req('GET', '/admin/', { cookie: admin, origin: null }), env);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Clients/);
  assert.equal(
    page.headers.get('Cache-Control'),
    'private, no-store',
    'never cached for someone else',
  );
  assert.equal(page.headers.get('X-Robots-Tag'), 'noindex');

  // Anything else is not this gate's business.
  assert.equal(await gateAdminPages(req('GET', '/about/', { origin: null }), env), null);
  assert.equal(
    await gateAdminPages(req('GET', '/administrator-tips/', { origin: null }), env),
    null,
  );
});

test('the admin API says "not found" to anyone who is not an admin', async () => {
  const env = makeEnv();
  const client = await loggedIn(env, 'client@example.co.uk', 'client');
  const { handleAccounts } = await import('./index.js');
  for (const cookie of [undefined, client]) {
    const res = await handleAccounts(req('GET', '/api/admin/clients', { cookie }), env);
    assert.equal(res.status, 404);
  }
});

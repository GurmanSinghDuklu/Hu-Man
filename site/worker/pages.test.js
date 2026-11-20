/**
 * Tests for the Worker's page serving (worker/pages.js), run with `npm test`. A fake ASSETS binding
 * stands in for dist/, so nothing touches the network.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { servePage, wantsMarkdown } from './pages.js';
import manifest from './pages.json' with { type: 'json' };
import { siteWideHeaders } from '../src/integrations/worker-manifest.mjs';

const ORIGIN = 'https://humansoftwareagency.com';

/** A fake ASSETS binding: one HTML page and its Markdown copy, recording what was asked for. */
function makeAssets() {
  const asked = [];
  return {
    asked,
    async fetch(request) {
      const { pathname } = new URL(request.url);
      asked.push(pathname);
      if (pathname === '/about/')
        return new Response('<!doctype html><title>About</title>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ETag: '"a1"' },
        });
      if (pathname === '/about/index.html.md')
        return new Response('# About\n', { headers: { 'Content-Type': 'text/plain' } });
      return new Response('Not found', { status: 404 });
    },
  };
}

const get = (path, accept) =>
  new Request(`${ORIGIN}${path}`, { headers: accept ? { Accept: accept } : {} });

const BROWSER_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';

test('browsers never get Markdown', () => {
  assert.equal(wantsMarkdown(BROWSER_ACCEPT), false);
  assert.equal(wantsMarkdown('*/*'), false);
  assert.equal(wantsMarkdown(null), false);
});

test('clients that ask for Markdown get it', () => {
  assert.equal(wantsMarkdown('text/markdown'), true);
  assert.equal(wantsMarkdown('text/markdown, text/html;q=0.9'), true);
  assert.equal(wantsMarkdown('text/markdown, text/html'), true);
  assert.equal(wantsMarkdown('Text/Markdown;charset=utf-8'), true);
});

test('Markdown is refused when HTML is preferred or q=0', () => {
  assert.equal(wantsMarkdown('text/html, text/markdown;q=0.5'), false);
  assert.equal(wantsMarkdown('text/markdown;q=0'), false);
});

test('a page asked for as Markdown gets its Markdown copy, with a canonical link', async () => {
  const assets = makeAssets();
  const res = await servePage(get('/about/', 'text/markdown'), assets);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '# About\n');
  assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.equal(res.headers.get('Link'), `<${ORIGIN}/about/>; rel="canonical"`);
  assert.match(res.headers.get('Vary'), /Accept/);
  assert.deepEqual(assets.asked, ['/about/index.html.md']);
});

test('a browser gets the HTML page with Link headers and the site-wide headers', async () => {
  const res = await servePage(get('/about/', BROWSER_ACCEPT), makeAssets());
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<title>About/);
  assert.equal(res.headers.get('ETag'), '"a1"');
  assert.match(res.headers.get('Vary'), /Accept/);
  const link = res.headers.get('Link');
  assert.match(link, /^<\/about\/index\.html\.md>; rel="alternate"; type="text\/markdown"/);
  for (const preload of manifest.pages['/about/'].preload) assert.ok(link.includes(preload));
  assert.match(link, /rel=preload; as=font/);
  for (const [name, value] of Object.entries(manifest.headers))
    assert.equal(res.headers.get(name), value);
});

test('a missing Markdown copy falls back to the HTML page', async () => {
  const assets = {
    async fetch(request) {
      const { pathname } = new URL(request.url);
      return pathname.endsWith('.md')
        ? new Response('Not found', { status: 404 })
        : new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } });
    },
  };
  const res = await servePage(get('/about/', 'text/markdown'), assets);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '<!doctype html>');
});

test('anything that is not a page, or not a GET or HEAD, is left to the static files', async () => {
  assert.equal(await servePage(get('/llms.txt', 'text/markdown'), makeAssets()), null);
  assert.equal(await servePage(get('/about', 'text/markdown'), makeAssets()), null);
  const post = new Request(`${ORIGIN}/about/`, { method: 'POST', body: 'x' });
  assert.equal(await servePage(post, makeAssets()), null);
});

test('the Worker sets the same site-wide headers as public/_headers', () => {
  const text = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.deepEqual(manifest.headers, siteWideHeaders(text));
  assert.ok(manifest.headers['Strict-Transport-Security']);
});

/**
 * Production deploy, then IndexNow for the pages that changed. Cloudflare Workers Builds runs it
 * as the deploy command (`npm run deploy`, after `npm run build`; docs/10-launch.md), and it works
 * the same by hand from site/.
 *
 * 1. Reads the live sitemap BEFORE deploying, to know each page's current date.
 * 2. Deploys with `npx wrangler deploy`. If that fails, it stops: nothing is submitted.
 * 3. Sends IndexNow every page whose lastmod differs from the live one, plus any new page. If the
 *    live sitemap couldn't be read (first deploy, outage), it sends every page.
 *
 * Page dates come from git (src/lib/lastModified.ts) and include shared components and data, so a
 * change to the header or prices counts for every page: that's accurate, not noise.
 * An IndexNow failure is reported but doesn't fail the deploy, which has already happened.
 *
 * `node scripts/deploy.mjs --dry-run` prints what would be deployed and sent, and does neither.
 */
import { spawnSync } from 'node:child_process';
import { builtSitemap, liveOrigin, sitemapDates, submitIndexNow } from './indexnow.mjs';

const dryRun = process.argv.includes('--dry-run');

const built = await builtSitemap();
const { origin } = liveOrigin([...built.keys()]);

// 1. The live dates, before this deploy replaces them.
let live;
try {
  const res = await fetch(`${origin}/sitemap-0.xml`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  live = sitemapDates(await res.text());
} catch (error) {
  console.warn(`Couldn't read the live sitemap (${error.message}): every page will be sent.`);
}

const changed = [...built].filter(([url, date]) => !live || live.get(url) !== date).map(([u]) => u);

// 2. Deploy.
if (dryRun) {
  console.log('Dry run: would run `npx wrangler deploy`.');
} else {
  const result = spawnSync('npx', ['wrangler', 'deploy'], { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error('Deploy failed: nothing sent to IndexNow.');
    process.exit(result.status ?? 1);
  }
}

// 3. IndexNow.
if (changed.length === 0) {
  console.log('IndexNow: no page dates changed, nothing to send.');
} else {
  try {
    const ok = await submitIndexNow(changed, { dryRun });
    if (!ok) console.warn('IndexNow did not accept the list. Re-run `npm run indexnow` later.');
  } catch (error) {
    console.warn(`IndexNow failed (${error.message}). Re-run \`npm run indexnow\` later.`);
  }
}

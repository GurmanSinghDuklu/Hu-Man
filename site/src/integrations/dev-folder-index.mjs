/**
 * Dev server only: serve `public/<folder>/index.html` for a folder address like /concepts/chloe/.
 * Every real host (Cloudflare, GitHub Pages, scripts/serve.mjs) already does this, but Astro's dev
 * server doesn't for plain files in public/, so the concept portfolios (and the live wall on
 * /portfolio, which frames them) showed the site's 404 page under `npm run dev`. The build is untouched.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function devFolderIndex() {
  return {
    name: 'dev-folder-index',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));
        const base = (process.env.SITE_BASE ?? '').replace(/\/$/, '');
        server.middlewares.use((req, _res, next) => {
          const [path, query] = (req.url ?? '').split('?');
          if (path.endsWith('/') && path.startsWith(`${base}/`)) {
            const local = path.slice(base.length);
            if (local !== '/' && existsSync(join(publicDir, local, 'index.html'))) {
              req.url = `${path}index.html${query ? `?${query}` : ''}`;
            }
          }
          next();
        });
      },
    },
  };
}

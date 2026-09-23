/**
 * Minimal static file server for dist/, used by the Lighthouse, axe and
 * screenshot scripts. Avoids `astro preview`'s singleton daemon, which
 * ignores --port when an instance is already running.
 *
 * Text responses are gzipped when the client accepts it, as every production
 * static host does, so Lighthouse measures realistic transfer sizes.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
};

export function startServer(distDir, port) {
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      let filePath = join(distDir, urlPath);

      let stats;
      try {
        stats = await stat(filePath);
      } catch {
        filePath = join(distDir, urlPath, 'index.html');
        try {
          stats = await stat(filePath);
        } catch {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
      }
      if (stats.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }

      const body = await readFile(filePath);
      const type = MIME[extname(filePath)] ?? 'application/octet-stream';
      const compressible = /^(text\/|application\/(json|xml)|image\/svg)/.test(type);
      if (compressible && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
        res.writeHead(200, {
          'Content-Type': type,
          'Content-Encoding': 'gzip',
          Vary: 'Accept-Encoding',
        });
        res.end(gzipSync(body));
        return;
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end('Server error');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

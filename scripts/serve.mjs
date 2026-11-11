// Local preview: `npm start` -> http://localhost:8080 (override with PORT=3000).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createGzip } from 'node:zlib';

const ROOT = path.resolve('dist');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Method not allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    return response.end('Bad request');
  }
  if (pathname.includes('\0')) {
    response.writeHead(400);
    return response.end('Bad request');
  }

  let file = path.resolve(ROOT, `.${pathname}`);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  // Hash-based sections stay on /; extensionless paths can preview the single-page app.
  if (pathname.endsWith('/') || !path.extname(pathname)) file = path.join(ROOT, 'index.html');
  fs.stat(file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      return response.end('404 — Not found');
    }
    const ext = path.extname(file).toLowerCase();
    const query = new URL(request.url || '/', 'http://localhost').searchParams;
    const versioned = query.has('v');
    const cacheControl = ext === '.html' || pathname.endsWith('/sw.js')
      ? 'no-cache'
      : pathname.includes('/data/')
        ? 'public, max-age=60, stale-while-revalidate=300'
        : versioned
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600';
    const compressible = /^(text\/|application\/(?:javascript|json|xml|manifest\+json)|image\/svg\+xml)/.test(TYPES[ext] || '');
    const useGzip = request.method !== 'HEAD' && compressible && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
    response.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': cacheControl,
      ...(compressible ? { Vary: 'Accept-Encoding' } : {}),
      ...(useGzip ? { 'Content-Encoding': 'gzip' } : {}),
    });
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(file);
    if (useGzip) stream.pipe(createGzip({ level: 6 })).pipe(response);
    else stream.pipe(response);
  });
}).listen(PORT, () => console.log(`Kyallan local preview: http://localhost:${PORT}`));

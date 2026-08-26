import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional argument picks the directory to serve: `node scripts/serve.mjs dist`
// previews the built output, which is what Vercel actually deploys.
const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(projectRoot, process.argv[2] || '.');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relativePath = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '');
  const filePath = join(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  // Mirror Vercel's cleanUrls: /thanks resolves to thanks.html.
  let resolved = filePath;
  let fileStat = await stat(resolved).catch(() => null);
  if (!fileStat?.isFile() && !extname(resolved)) {
    resolved = `${filePath}.html`;
    fileStat = await stat(resolved).catch(() => null);
  }

  if (!fileStat?.isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': mime[extname(resolved)] || 'application/octet-stream' });
  createReadStream(resolved).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

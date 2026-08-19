import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../projects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');

const requiredFiles = [
  'index.html',
  'styles.css',
  'main.js',
  'projects.js',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'assets/og-cover.png',
  'assets/proof/citywide-client-feedback.png',
  ...projects.map((project) => project.image)
];

for (const file of requiredFiles) {
  const fileStat = await stat(join(root, file)).catch(() => null);
  if (!fileStat?.isFile()) throw new Error(`Missing required asset: ${file}`);
}

const manifest = JSON.parse(await readFile(join(root, 'site.webmanifest'), 'utf8'));
if (!manifest.name || !manifest.icons?.length) {
  throw new Error('site.webmanifest is missing required metadata.');
}

const html = await readFile(join(root, 'index.html'), 'utf8');
const requiredMetadata = ['rel="canonical"', 'property="og:title"', 'name="twitter:card"', 'application/ld+json'];
for (const marker of requiredMetadata) {
  if (!html.includes(marker)) throw new Error(`Missing metadata marker: ${marker}`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of requiredFiles) {
  const destination = join(output, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(root, file), destination);
}

console.log(`Static build complete: ${requiredFiles.length} verified files copied to dist/.`);

import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../projects.js';
import { renderWork } from '../render.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');

const SITE_ORIGIN = 'https://euoliverg.online';
const WRONG_ORIGIN = /https?:\/\/oliver\.dev/;

const fail = (message) => { throw new Error(message); };

const copiedFiles = [
  'index.html',
  'styles.css',
  'main.js',
  'render.js',
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
  ...projects.map((project) => project.image)
];

for (const file of copiedFiles) {
  const fileStat = await stat(join(root, file)).catch(() => null);
  if (!fileStat?.isFile()) fail(`Missing required asset: ${file}`);
}

const manifest = JSON.parse(await readFile(join(root, 'site.webmanifest'), 'utf8'));
if (!manifest.name || !manifest.icons?.length) {
  fail('site.webmanifest is missing required metadata.');
}

let html = await readFile(join(root, 'index.html'), 'utf8');

const requiredMetadata = ['rel="canonical"', 'property="og:title"', 'name="twitter:card"', 'application/ld+json'];
for (const marker of requiredMetadata) {
  if (!html.includes(marker)) fail(`Missing metadata marker: ${marker}`);
}

// --- Guard: the canonical domain must be euoliverg.online everywhere. ---------
// A canonical pointing at another domain tells Google this site is a duplicate
// and breaks every link preview on WhatsApp, Messenger and LinkedIn.
for (const file of ['index.html', 'robots.txt', 'sitemap.xml', 'site.webmanifest']) {
  const contents = await readFile(join(root, file), 'utf8');
  if (WRONG_ORIGIN.test(contents)) {
    fail(`${file} still points at the old oliver.dev domain. Every URL must use ${SITE_ORIGIN}.`);
  }
}

const metaContent = (pattern) => html.match(pattern)?.[1] ?? '';
const absoluteUrls = {
  canonical: metaContent(/<link rel="canonical" href="([^"]+)"/),
  'og:url': metaContent(/<meta property="og:url" content="([^"]+)"/),
  'og:image': metaContent(/<meta property="og:image" content="([^"]+)"/),
  'twitter:image': metaContent(/<meta name="twitter:image" content="([^"]+)"/)
};

for (const [name, value] of Object.entries(absoluteUrls)) {
  if (!value) fail(`Missing ${name} meta tag.`);
  if (!value.startsWith(`${SITE_ORIGIN}/`)) fail(`${name} must be an absolute URL on ${SITE_ORIGIN}, got: ${value}`);
}

// --- Guard: og:image must resolve to a file that actually ships. --------------
// A 404ing og:image is why previews render blank.
const ogImagePath = absoluteUrls['og:image'].slice(`${SITE_ORIGIN}/`.length);
if (!copiedFiles.includes(ogImagePath)) {
  fail(`og:image points at ${ogImagePath}, which is not in the build output.`);
}
const ogImage = await readFile(join(root, ogImagePath));
if (ogImage.readUInt32BE(16) !== 1200 || ogImage.readUInt32BE(20) !== 630) {
  fail(`${ogImagePath} must be 1200x630 for link previews.`);
}

// --- Pre-render the project gallery into the HTML. ---------------------------
// Without this the gallery and case studies only exist after JavaScript runs,
// which hides the strongest proof of real work from search engines and from
// anyone opening a link without JS.
const projectsBlock = /<!-- PROJECTS:START[\s\S]*?PROJECTS:END -->/;
if (!projectsBlock.test(html)) fail('index.html is missing the PROJECTS:START / PROJECTS:END markers.');

const workMarkup = renderWork(projects);
for (const project of projects) {
  if (!workMarkup.includes(project.name.replace(/&/g, '&amp;'))) {
    fail(`Pre-rendered gallery is missing project: ${project.name}`);
  }
}

html = html.replace(projectsBlock, `<div class="work-grid" data-projects>${workMarkup}\n        </div>`);
if (html.includes('Enable JavaScript to view')) {
  fail('The no-JS gallery message survived pre-rendering — the markers did not match.');
}

// --- Write the output. -------------------------------------------------------
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of copiedFiles) {
  const destination = join(output, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(root, file), destination);
}

await writeFile(join(output, 'index.html'), html, 'utf8');

console.log(
  `Static build complete: ${copiedFiles.length} files copied to dist/, ` +
  `${projects.length} projects pre-rendered into index.html.`
);

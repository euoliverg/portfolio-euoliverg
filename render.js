// Shared project markup used by both the static build and the browser.
// Keep this file free of DOM APIs so Node can pre-render the gallery.

// Cache-busting token for /assets, which Vercel serves with a 1-year
// "immutable" cache. Because screenshots keep the same filenames, bump this
// whenever an image is replaced so browsers fetch the new version.
export const ASSET_VERSION = '20260919';

// Append the cache-busting query to a same-origin asset path.
export const withVersion = (path = '') => `${path}${path.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

// Representative primary language per project, GitHub-style. These are real
// sites Gabriel built; the dashboard/SaaS work leans on TypeScript, the rest
// are hand-built HTML/CSS/JS front-ends.
const LANG_COLORS = {
  HTML: '#e34c26',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  CSS: '#563d7c'
};
const languageFor = (project) => {
  const ts = ['Planet Builders LLC', 'Noryx Digital'];
  const js = ['City Wide Rental', 'DR Property Solutions LLC'];
  if (ts.includes(project.name)) return 'TypeScript';
  if (js.includes(project.name)) return 'JavaScript';
  return 'HTML';
};

const repoSlug = (project) => {
  try {
    return new URL(project.url).hostname.replace(/^www\./, '');
  } catch {
    return project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
};

const caseStudyBlock = (project) => {
  if (!project.caseStudy) return '';
  const services = project.caseStudy.services
    .map((service) => `<li>${escapeHtml(service)}</li>`)
    .join('');

  return `
        <div class="case-static">
          <h4>Challenge</h4>
          <p>${escapeHtml(project.caseStudy.challenge)}</p>
          <h4>Solution</h4>
          <p>${escapeHtml(project.caseStudy.solution)}</p>
          <h4>Services</h4>
          <ul>${services}</ul>
        </div>`;
};

export const projectCard = (project, position = 0) => {
  const caseButton = project.caseStudy
    ? `<button class="repo-case" type="button" data-case-open="${escapeHtml(project.name)}">Case study <svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg></button>`
    : '';
  const loading = position === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
  const lang = languageFor(project);
  const langColor = LANG_COLORS[lang] || '#6e7681';

  return `
    <article class="repo reveal" data-project-card>
      <div class="repo-top">
        <svg class="repo-ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>
        <a class="repo-name" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repoSlug(project))}</a>
        <span class="repo-badge"><span class="repo-dot"></span>Live</span>
      </div>

      <a class="repo-shot" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">
        <span class="visually-hidden">Open ${escapeHtml(project.name)} website</span>
        <img src="${escapeHtml(withVersion(project.image))}" alt="${escapeHtml(project.imageAlt)}" width="2200" height="1375" ${loading} decoding="async">
      </a>

      <h3 class="repo-title"><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h3>
      <p class="repo-desc">${escapeHtml(project.description)}</p>

      <div class="repo-foot">
        <span class="repo-lang"><i style="background:${langColor}"></i>${escapeHtml(lang)}</span>
        <span class="repo-where">${escapeHtml(project.industry)}</span>
      </div>

      <div class="repo-actions">
        <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">Visit site <svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg></a>
        ${caseButton}
      </div>
      ${caseStudyBlock(project)}
    </article>`;
};

export const renderWork = (projects) =>
  projects.map((project, position) => projectCard(project, position)).join('');

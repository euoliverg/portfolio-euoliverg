// Shared project markup used by both the static build and the browser.
// Keep this file free of DOM APIs so Node can pre-render the gallery.

// Cache-busting token for /assets, which Vercel serves with a 1-year
// "immutable" cache. Because screenshots keep the same filenames, bump this
// whenever an image is replaced so browsers fetch the new version.
export const ASSET_VERSION = '20260911';

// Append the cache-busting query to a same-origin asset path.
export const withVersion = (path = '') => `${path}${path.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

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
    ? `<button class="project-case" type="button" data-case-open="${escapeHtml(project.name)}">View case study <svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg></button>`
    : '';
  const loading = position === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

  return `
    <article class="project reveal" data-project-card>
      <a class="project-shot" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">
        <span class="visually-hidden">Open ${escapeHtml(project.name)} website</span>
        <img src="${escapeHtml(withVersion(project.image))}" alt="${escapeHtml(project.imageAlt)}" width="2200" height="1375" ${loading} decoding="async">
      </a>

      <div class="project-info">
        <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h3>
        <p class="project-meta">${escapeHtml(project.industry)} · ${escapeHtml(project.location)}</p>
        <p class="project-description">${escapeHtml(project.description)}</p>
        <div class="project-actions">
          <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">Visit site <svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg></a>
          ${caseButton}
        </div>
        ${caseStudyBlock(project)}
      </div>
    </article>`;
};

export const renderWork = (projects) =>
  projects.map((project, position) => projectCard(project, position)).join('');

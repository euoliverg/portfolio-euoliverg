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

const ARROW = '<svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/></svg>';

const domainOf = (project) => {
  try {
    return new URL(project.url).hostname.replace(/^www\./, '');
  } catch {
    return project.url;
  }
};

// Without JavaScript the case study dialog cannot open, so the same story is
// printed inline. CSS hides it once JS is running.
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

const actions = (project) => {
  const url = escapeHtml(project.url);
  const caseButton = project.caseStudy
    ? `<button class="work-case" type="button" data-case-open="${escapeHtml(project.name)}" data-cursor="Read">Case study</button>`
    : '';
  return `
        <div class="work-actions">
          <a class="work-visit" href="${url}" target="_blank" rel="noopener noreferrer">Visit ${escapeHtml(domainOf(project))} ${ARROW}</a>
          ${caseButton}
        </div>`;
};

const media = (project, className, eager = false) => {
  const url = escapeHtml(project.url);
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `
      <a class="${className}" href="${url}" target="_blank" rel="noopener noreferrer" data-cursor="Visit" data-tilt tabindex="-1">
        <span class="visually-hidden">Open the ${escapeHtml(project.name)} website</span>
        <span class="media-frame">
          <img src="${escapeHtml(withVersion(project.image))}" alt="${escapeHtml(project.imageAlt)}" width="2200" height="1375" ${loading} decoding="async">
        </span>
      </a>`;
};

// The first project opens the gallery as a large showcase that reacts to the
// pointer in perspective; the rest follow as an alternating editorial list.
const featureEntry = (project) => `
    <article class="work-feature reveal" data-project-card>
      <div class="feature-stage">${media(project, 'feature-media')}
      </div>
      <div class="feature-info">
        <h3 class="work-title"><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h3>
        <p class="work-meta">${escapeHtml(project.industry)} <span aria-hidden="true">/</span> ${escapeHtml(project.location)}</p>
        <p class="work-desc">${escapeHtml(project.description)}</p>${actions(project)}${caseStudyBlock(project)}
      </div>
    </article>`;

export const projectCard = (project) => `
      <article class="work-item" data-project-card>${media(project, 'work-media')}
        <div class="work-info reveal">
          <h3 class="work-title"><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h3>
          <p class="work-meta">${escapeHtml(project.industry)} <span aria-hidden="true">/</span> ${escapeHtml(project.location)}</p>
          <p class="work-desc">${escapeHtml(project.description)}</p>${actions(project)}${caseStudyBlock(project)}
        </div>
      </article>`;

export const renderWork = (projects) => {
  if (!projects.length) return '';
  const [feature, ...rest] = projects;
  return `${featureEntry(feature)}
    <div class="work-list">${rest.map((project) => projectCard(project)).join('')}
    </div>`;
};

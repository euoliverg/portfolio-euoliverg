// Shared project markup used by both the static build and the browser.
// Keep this file free of DOM APIs so Node can pre-render the gallery.

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const displayHost = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
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
    ? `<button class="project-case" type="button" data-case-open="${escapeHtml(project.name)}">View case study <span aria-hidden="true">↗</span></button>`
    : '';
  const loading = position === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

  return `
    <article class="project reveal" data-project-card>
      <a class="project-shot" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">
        <span class="visually-hidden">Open ${escapeHtml(project.name)} website</span>
        <span class="project-bar" aria-hidden="true">
          <i></i><i></i><i></i>
          <em>${escapeHtml(displayHost(project.url))}</em>
        </span>
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="2200" height="1236" ${loading} decoding="async">
      </a>

      <div class="project-info">
        <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h3>
        <p class="project-meta">${escapeHtml(project.industry)} · ${escapeHtml(project.location)}</p>
        <p class="project-description">${escapeHtml(project.description)}</p>
        <div class="project-actions">
          <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">Visit site <span aria-hidden="true">↗</span></a>
          ${caseButton}
        </div>
        ${caseStudyBlock(project)}
      </div>
    </article>`;
};

export const renderWork = (projects) =>
  projects.map((project, position) => projectCard(project, position)).join('');

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
          <h5>Challenge</h5>
          <p>${escapeHtml(project.caseStudy.challenge)}</p>
          <h5>Solution</h5>
          <p>${escapeHtml(project.caseStudy.solution)}</p>
          <h5>Services</h5>
          <ul>${services}</ul>
        </div>`;
};

export const projectCard = (project, options = {}) => {
  const { globalPosition = 1, groupPosition = 0, groupKey = '' } = options;
  const isFeatured = groupKey === 'client' && groupPosition === 0;
  const caseButton = project.caseStudy
    ? `<button class="project-case" type="button" data-case-open="${escapeHtml(project.name)}">View case study <span aria-hidden="true">↗</span></button>`
    : '';
  const loading = globalPosition === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

  return `
    <article class="project ${isFeatured ? 'project-featured' : ''} reveal" data-project-card>
      <a class="project-scene" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">
        <span class="visually-hidden">Open ${escapeHtml(project.name)} website</span>
        <div class="project-device">
          <div class="project-browser">
            <span aria-hidden="true"><i></i><i></i><i></i></span>
            <p>${escapeHtml(displayHost(project.url))}</p>
            <strong><i aria-hidden="true"></i>Live</strong>
          </div>
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="2200" height="1236" ${loading} decoding="async">
        </div>
        <span class="project-monogram" aria-hidden="true">${escapeHtml(project.monogram)}</span>
        <span class="project-visit" aria-hidden="true">Open project ↗</span>
      </a>

      <div class="project-info">
        <div class="project-index"><span>${escapeHtml(project.index)}</span><i></i><em>${groupKey === 'client' ? 'Client work' : 'Selected'}</em></div>
        <h4><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a></h4>
        <p class="project-meta">${escapeHtml(project.industry)} · ${escapeHtml(project.location)}</p>
        <p class="project-description">${escapeHtml(project.description)}</p>
        <div class="project-actions">
          <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">Visit live website <span aria-hidden="true">↗</span></a>
          ${caseButton}
        </div>
        ${caseStudyBlock(project)}
      </div>
    </article>`;
};

export const renderWork = (groups, projects) => {
  let globalPosition = 0;

  return groups.map((group) => {
    const groupProjects = projects.filter((project) => project.group === group.key);
    if (!groupProjects.length) return '';

    const cards = groupProjects.map((project, groupPosition) => projectCard(project, {
      globalPosition: globalPosition++,
      groupPosition,
      groupKey: group.key
    })).join('');

    return `
    <section class="work-group work-group-${escapeHtml(group.key)}" aria-labelledby="group-${escapeHtml(group.key)}">
      <div class="work-group-head reveal">
        <h3 id="group-${escapeHtml(group.key)}">${escapeHtml(group.label)}</h3>
        <span>${String(groupProjects.length).padStart(2, '0')}</span>
      </div>
      <div class="work-group-grid">${cards}</div>
    </section>`;
  }).join('');
};

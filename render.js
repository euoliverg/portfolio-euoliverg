// Shared markup for the project gallery.
// Imported by scripts/build.mjs (to pre-render static HTML into dist/index.html)
// and by main.js (to render in dev, where index.html ships an empty container).
// Keep this file free of DOM APIs so it runs in Node.

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

// Real case study content, present in the page source so crawlers and no-JS
// visitors can read it. Hidden by CSS only when JavaScript is available, where
// the dialog takes over. See `.js .case-static` in styles.css.
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

export const projectCard = (project, position = 1) => {
  const caseButton = project.caseStudy
    ? `<button class="project-case" type="button" data-case-open="${escapeHtml(project.name)}">Case study ↗</button>`
    : '';
  const loading = position === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

  return `
    <article class="project reveal">
      <a class="project-visual" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(project.name)} live website">
        <div class="project-browser">
          <span aria-hidden="true"><i></i><i></i><i></i></span>
          <p>${escapeHtml(displayHost(project.url))}</p>
          <strong><i aria-hidden="true"></i>Live</strong>
        </div>
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="1100" height="618" ${loading} decoding="async">
      </a>

      <div class="project-info">
        <a class="project-name" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)} <span aria-hidden="true">↗</span></a>
        <p class="project-sub">${escapeHtml(project.industry)} · ${escapeHtml(project.location)}</p>
        <p class="project-description">${escapeHtml(project.description)}</p>
        ${caseButton}${caseStudyBlock(project)}
      </div>
    </article>`;
};

export const renderWork = (groups, projects) => {
  let position = 0;

  return groups.map((group) => {
    const groupProjects = projects.filter((project) => project.group === group.key);
    if (!groupProjects.length) return '';

    const cards = groupProjects.map((project) => projectCard(project, position++)).join('');

    return `
    <section class="work-group" aria-labelledby="group-${escapeHtml(group.key)}">
      <div class="work-group-head reveal">
        <h3 id="group-${escapeHtml(group.key)}">${escapeHtml(group.label)}</h3>
        <span>${String(groupProjects.length).padStart(2, '0')}</span>
      </div>
      <div class="work-group-grid work-group-${escapeHtml(group.key)}">${cards}</div>
    </section>`;
  }).join('');
};

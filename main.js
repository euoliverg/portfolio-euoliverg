import { groups, projects } from './projects.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderedCount = 0;

const projectCard = (project) => {
  const isFirst = renderedCount === 0;
  renderedCount += 1;

  return `
    <article class="project reveal">
      <a class="project-visual" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${project.name} live website">
        <img
          src="${project.image}"
          alt="${project.imageAlt}"
          width="1440"
          height="900"
          ${isFirst ? 'fetchpriority="high"' : 'loading="lazy"'}
          decoding="async"
        >
        <span class="project-open" aria-hidden="true">View live ↗</span>
      </a>

      <div class="project-info">
        <div class="project-heading">
          <p><span>${project.index}</span>${project.category}</p>
          <h3>${project.name}</h3>
        </div>
        <p class="project-description">${project.description}</p>
        <ul class="project-stack" aria-label="Technology used for ${project.name}">
          ${project.stack.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <a class="project-link" href="${project.url}" target="_blank" rel="noopener noreferrer">Open live project <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `;
};

const groupBlock = (group) => {
  const groupProjects = projects.filter((project) => project.group === group.key);
  if (!groupProjects.length) return '';

  return `
    <div class="work-group reveal">
      <div class="work-group-head">
        <div>
          <h3>${group.label}</h3>
          <p>${group.description}</p>
        </div>
        <span class="work-group-count">${String(groupProjects.length).padStart(2, '0')} project${groupProjects.length === 1 ? '' : 's'}</span>
      </div>
      <div class="work-group-grid">
        ${groupProjects.map(projectCard).join('')}
      </div>
    </div>
  `;
};

if (projectGrid) {
  projectGrid.innerHTML = groups.map(groupBlock).join('');
}

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.08
  });

  revealItems.forEach((item) => revealObserver.observe(item));
}

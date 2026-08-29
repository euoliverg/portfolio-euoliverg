import { projects } from './projects.js';
import { escapeHtml, renderWork } from './render.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const caseDialog = document.querySelector('[data-case-dialog]');
const reviewsSection = document.querySelector('[data-reviews-section]');
const reviewsGrid = document.querySelector('[data-reviews-grid]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The production build pre-renders the gallery into the HTML, so only render
// here when the container arrived empty (dev server, or an unbuilt index.html).
if (projectGrid && !projectGrid.children.length) {
  projectGrid.innerHTML = renderWork(projects);
}

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

let dialogTrigger = null;

const openCaseStudy = (project) => {
  if (!caseDialog || !project.caseStudy) return;
  const setText = (selector, value) => {
    const element = caseDialog.querySelector(selector);
    if (element) element.textContent = value;
  };

  setText('[data-case-title]', project.name);
  setText('[data-case-client]', project.name);
  setText('[data-case-industry]', project.industry);
  setText('[data-case-location]', project.location);
  setText('[data-case-challenge]', project.caseStudy.challenge);
  setText('[data-case-solution]', project.caseStudy.solution);

  const image = caseDialog.querySelector('[data-case-image]');
  if (image) {
    image.src = project.image;
    image.alt = project.imageAlt;
  }

  const services = caseDialog.querySelector('[data-case-services]');
  if (services) {
    services.innerHTML = project.caseStudy.services
      .map((service) => `<li>${escapeHtml(service)}</li>`)
      .join('');
  }

  const link = caseDialog.querySelector('[data-case-link]');
  if (link) link.href = project.url;

  dialogTrigger = document.activeElement;
  document.body.classList.add('dialog-open');
  caseDialog.showModal();
};

const closeDialog = (dialog) => {
  if (dialog?.open) dialog.close();
};

const handleDialogClosed = () => {
  document.body.classList.remove('dialog-open');
  if (dialogTrigger instanceof HTMLElement) dialogTrigger.focus();
  dialogTrigger = null;
};

document.querySelectorAll('[data-case-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projects.find((item) => item.name === button.dataset.caseOpen);
    if (project) openCaseStudy(project);
  });
});
caseDialog?.querySelector('[data-case-close]')?.addEventListener('click', () => closeDialog(caseDialog));
caseDialog?.addEventListener('click', (event) => {
  if (event.target === caseDialog) closeDialog(caseDialog);
});
caseDialog?.addEventListener('close', handleDialogClosed);

const renderReviews = (reviews) => {
  if (!reviewsGrid || !reviewsSection || !reviews.length) return;
  reviewsGrid.innerHTML = reviews.map((review) => `
    <article class="client-review">
      <div class="client-review-head">
        <p class="client-review-stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}</p>
        <span>Verified client</span>
      </div>
      <blockquote>“${escapeHtml(review.review)}”</blockquote>
      <footer><strong>${escapeHtml(review.name)}</strong><span>${escapeHtml(review.company)}</span></footer>
    </article>
  `).join('');
  reviewsSection.hidden = false;
};

if (reviewsSection && reviewsGrid) {
  fetch('/api/reviews', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Reviews unavailable')))
    .then((result) => renderReviews(Array.isArray(result.reviews) ? result.reviews : []))
    .catch(() => {});
}

document.querySelectorAll('[data-current-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

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
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

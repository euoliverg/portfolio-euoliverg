import { projects } from './projects.js';
import { escapeHtml, renderWork } from './render.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const caseDialog = document.querySelector('[data-case-dialog]');
const reviewDialog = document.querySelector('[data-review-dialog]');
const reviewForm = document.querySelector('[data-review-form]');
const reviewStatus = document.querySelector('[data-review-status]');
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

document.querySelector('[data-review-open]')?.addEventListener('click', (event) => {
  if (!reviewDialog) return;
  dialogTrigger = event.currentTarget;
  document.body.classList.add('dialog-open');
  reviewDialog.showModal();
});
reviewDialog?.querySelector('[data-review-close]')?.addEventListener('click', () => closeDialog(reviewDialog));
reviewDialog?.addEventListener('click', (event) => {
  if (event.target === reviewDialog) closeDialog(reviewDialog);
});
reviewDialog?.addEventListener('close', handleDialogClosed);

const reviewSubmit = reviewForm?.querySelector('.review-submit');
const reviewSubmitLabel = reviewSubmit?.innerHTML ?? '';

const showReviewStatus = (message, state) => {
  if (!reviewStatus) return;
  reviewStatus.hidden = false;
  reviewStatus.textContent = message;
  reviewStatus.classList.toggle('is-error', state === 'error');
};

reviewForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (reviewSubmit?.disabled) return;

  const payload = Object.fromEntries(new FormData(reviewForm).entries());
  payload.subject = `New ${payload.rating || ''} client review — ${payload.company || 'Unknown company'} / ${payload.project || 'Project'}`;

  if (reviewSubmit) {
    reviewSubmit.disabled = true;
    reviewSubmit.textContent = 'Sending…';
  }
  showReviewStatus('Sending your review…', 'pending');

  try {
    const response = await fetch(reviewForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    reviewForm.reset();
    showReviewStatus('Thank you. Your review was received and is pending verification.', 'success');
  } catch (error) {
    console.error('Review submission failed:', error);
    showReviewStatus('The review could not be sent. Please try again or contact me by email.', 'error');
  } finally {
    if (reviewSubmit) {
      reviewSubmit.disabled = false;
      reviewSubmit.innerHTML = reviewSubmitLabel;
    }
  }
});

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

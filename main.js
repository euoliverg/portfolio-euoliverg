import { groups, projects } from './projects.js';
import { escapeHtml, renderWork } from './render.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const caseDialog = document.querySelector('[data-case-dialog]');
const proofDialog = document.querySelector('[data-proof-dialog]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The production build pre-renders the gallery into the HTML, so only render
// here when the container arrived empty (dev server, or an unbuilt index.html).
if (projectGrid && !projectGrid.children.length) {
  projectGrid.innerHTML = renderWork(groups, projects);
}

document.querySelectorAll('[data-project-count]').forEach((el) => {
  el.textContent = String(projects.length).padStart(2, '0');
});

const setNavigation = (open) => {
  document.body.classList.toggle('nav-open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  const label = navToggle?.querySelector('.visually-hidden');
  if (label) label.textContent = open ? 'Close navigation' : 'Open navigation';
};

navToggle?.addEventListener('click', () => setNavigation(navToggle.getAttribute('aria-expanded') !== 'true'));
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNavigation(false)));
window.addEventListener('resize', () => { if (window.innerWidth > 820) setNavigation(false); });

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
  if (image) { image.src = project.image; image.alt = project.imageAlt; }
  const services = caseDialog.querySelector('[data-case-services]');
  if (services) services.innerHTML = project.caseStudy.services.map((service) => `<li>${escapeHtml(service)}</li>`).join('');
  const link = caseDialog.querySelector('[data-case-link]');
  if (link) link.href = project.url;

  dialogTrigger = document.activeElement;
  document.body.classList.add('dialog-open');
  caseDialog.showModal();
};

const closeDialog = (dialog) => {
  if (!dialog?.open) return;
  dialog.close();
};

const handleDialogClosed = () => {
  document.body.classList.remove('dialog-open');
  if (dialogTrigger instanceof HTMLElement) dialogTrigger.focus();
  dialogTrigger = null;
};

document.querySelectorAll('[data-case-open]').forEach((button) => button.addEventListener('click', () => {
  const project = projects.find((item) => item.name === button.dataset.caseOpen);
  if (project) openCaseStudy(project);
}));
caseDialog?.querySelector('[data-case-close]')?.addEventListener('click', () => closeDialog(caseDialog));
caseDialog?.addEventListener('click', (event) => { if (event.target === caseDialog) closeDialog(caseDialog); });
caseDialog?.addEventListener('close', handleDialogClosed);

document.querySelector('[data-proof-open]')?.addEventListener('click', (event) => {
  if (!proofDialog) return;
  dialogTrigger = event.currentTarget;
  document.body.classList.add('dialog-open');
  proofDialog.showModal();
});
proofDialog?.querySelector('[data-proof-close]')?.addEventListener('click', () => closeDialog(proofDialog));
proofDialog?.addEventListener('click', (event) => { if (event.target === proofDialog) closeDialog(proofDialog); });
proofDialog?.addEventListener('close', handleDialogClosed);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setNavigation(false); });

// Contact form — posts to Web3Forms.
// Without JavaScript the form falls back to a native POST to the same endpoint,
// which redirects to /thanks. mailto: is never used: it fails silently on mobile
// and for anyone without a configured desktop mail client.
const projectForm = document.querySelector('[data-project-form]');
const formStatus = document.querySelector('[data-form-status]');
const submitButton = projectForm?.querySelector('.form-submit');
const submitLabel = submitButton?.innerHTML ?? '';

const showStatus = (message, state) => {
  if (!formStatus) return;
  formStatus.hidden = false;
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', state === 'error');
};

projectForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitButton?.disabled) return;

  const payload = Object.fromEntries(new FormData(projectForm).entries());
  delete payload.redirect;
  payload.subject = `[Project request] ${payload.company || 'Unknown company'} — ${payload.service || 'General'}`;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
  }
  showStatus('Sending your request…', 'pending');

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    projectForm.reset();
    showStatus('Thanks — your request was sent. I\'ll reply by email shortly.', 'success');
  } catch (error) {
    console.error('Contact form submission failed:', error);
    showStatus('Something went wrong sending the form. Please call +1 (470) 297-2385 or email directly instead.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = submitLabel;
    }
  }
});

document.querySelectorAll('[data-current-year]').forEach((element) => { element.textContent = String(new Date().getFullYear()); });

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
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

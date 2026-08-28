import { groups, projects } from './projects.js';
import { escapeHtml, renderWork } from './render.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const caseDialog = document.querySelector('[data-case-dialog]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (projectGrid && !projectGrid.children.length) {
  projectGrid.innerHTML = renderWork(groups, projects);
}

const setNavigation = (open) => {
  document.body.classList.toggle('nav-open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  const label = navToggle?.querySelector('.visually-hidden');
  if (label) label.textContent = open ? 'Close navigation' : 'Open navigation';
};

navToggle?.addEventListener('click', () => {
  setNavigation(navToggle.getAttribute('aria-expanded') !== 'true');
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNavigation(false)));
window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setNavigation(false);
});

const updateChrome = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
  const progress = document.querySelector('[data-scroll-progress]');
  if (!progress) return;
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = available > 0 ? Math.min(1, window.scrollY / available) : 0;
  progress.style.transform = `scaleX(${percentage})`;
};
updateChrome();
window.addEventListener('scroll', updateChrome, { passive: true });

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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setNavigation(false);
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

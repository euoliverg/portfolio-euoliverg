import { groups, projects } from './projects.js';

const projectGrid = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const caseDialog = document.querySelector('[data-case-dialog]');
const proofDialog = document.querySelector('[data-proof-dialog]');
const heroProof = document.querySelector('[data-hero-proof]');
const heroFrame = document.querySelector('.browser-frame');
const heroGlare = document.querySelector('.browser-glare');
const heroBrandCard = document.querySelector('.hero-brand-card');
const heroStatChip = document.querySelector('.hero-stat-chip');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-project-count]').forEach((el) => {
  el.textContent = String(projects.length).padStart(2, '0');
});

if (heroProof && heroFrame && !reduceMotion) {
  let rafId = null;

  heroProof.addEventListener('mousemove', (event) => {
    const rect = heroProof.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      heroFrame.style.transform = `rotate(1deg) rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 22).toFixed(2)}deg) translateZ(50px)`;
      if (heroGlare) {
        heroGlare.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        heroGlare.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      }
      if (heroBrandCard) {
        heroBrandCard.style.transform = `rotate(-4deg) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg) translate(${(x * 14).toFixed(1)}px, ${(y * 10).toFixed(1)}px) translateZ(-70px)`;
      }
      if (heroStatChip) {
        heroStatChip.style.transform = `translate(${(x * -12).toFixed(1)}px, ${(y * -10).toFixed(1)}px) translateZ(90px)`;
      }
    });
  });

  heroProof.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    heroFrame.style.transform = '';
    if (heroBrandCard) heroBrandCard.style.transform = '';
    if (heroStatChip) heroStatChip.style.transform = '';
  });
}

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const projectCard = (project, position) => {
  const caseLink = project.caseStudy
    ? `<button class="project-case" type="button" data-case-open="${escapeHtml(project.name)}">Case study ↗</button>`
    : '';

  return `
    <article class="project reveal">
      <a class="project-visual" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(project.name)} live website">
        <div class="project-browser">
          <span aria-hidden="true"><i></i><i></i><i></i></span>
          <p>${escapeHtml(new URL(project.url).hostname.replace('www.', ''))}</p>
          <strong><i aria-hidden="true"></i>Live</strong>
        </div>
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="1440" height="900" ${position === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
      </a>

      <div class="project-info">
        <a class="project-name" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)} <span aria-hidden="true">↗</span></a>
        <p class="project-sub">${escapeHtml(project.industry)} · ${escapeHtml(project.location)}</p>
        ${caseLink}
      </div>
    </article>`;
};

const groupBlock = (group) => {
  const groupProjects = projects.filter((project) => project.group === group.key);
  if (!groupProjects.length) return '';

  return `
    <section class="work-group" aria-labelledby="group-${escapeHtml(group.key)}">
      <div class="work-group-head reveal">
        <h3 id="group-${escapeHtml(group.key)}">${escapeHtml(group.label)}</h3>
        <span>${String(groupProjects.length).padStart(2, '0')}</span>
      </div>
      <div class="work-group-grid">${groupProjects.map((project) => projectCard(project, projects.indexOf(project))).join('')}</div>
    </section>`;
};

if (projectGrid) projectGrid.innerHTML = groups.map(groupBlock).join('');

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

const projectForm = document.querySelector('[data-project-form]');
projectForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(projectForm);
  const lines = [
    `Name: ${data.get('name')}`, `Company: ${data.get('company')}`, `Email: ${data.get('email')}`,
    `Phone: ${data.get('phone') || 'Not provided'}`, `Current website: ${data.get('website') || 'Not provided'}`,
    `Service: ${data.get('service')}`, '', 'Project details:', String(data.get('details') || '')
  ];
  const subject = `[Noryx Project Request] ${data.get('company')} — ${data.get('service')}`;
  const status = document.querySelector('[data-form-status]');
  if (status) {
    status.hidden = false;
    status.textContent = 'Your email application has opened with the project details. Send the email to complete your request.';
  }
  window.location.href = `mailto:oliveirabtq@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
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

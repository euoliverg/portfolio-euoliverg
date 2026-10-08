import { projects } from './projects.js';
import { escapeHtml, renderWork, withVersion } from './render.js';

window.__booted = true;

const root = document.documentElement;
const projectGallery = document.querySelector('[data-projects]');
const header = document.querySelector('[data-header]');
const caseDialog = document.querySelector('[data-case-dialog]');
const reviewsSection = document.querySelector('[data-reviews-section]');
const reviewsGrid = document.querySelector('[data-reviews-grid]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const smallScreen = window.matchMedia('(max-width: 860px)').matches;

// The production build pre-renders the gallery into the HTML, so only render
// here when the container arrived empty (dev server, or an unbuilt index.html).
if (projectGallery && !projectGallery.children.length) {
  projectGallery.innerHTML = renderWork(projects);
}

/* ---- Header: scrolled state, hide on scroll down, active section -------- */
let lastScrollY = window.scrollY;
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const updateHeader = () => {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  const menuOpen = header?.querySelector('.nav-links.is-open');
  header?.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight * .8 && y > lastScrollY + 2);
  if (y < lastScrollY - 2) header?.classList.remove('is-hidden');
  lastScrollY = y;
};

if ('IntersectionObserver' in window && navLinks.length) {
  const sections = navLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((entry) => entry.section);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const match = sections.find((item) => item.section === entry.target);
      if (match) match.link.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((item) => spy.observe(item.section));
}

/* ---- Mobile menu --------------------------------------------------------- */
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const setMenu = (open) => {
  navToggle?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
};
navToggle?.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
nav?.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
    setMenu(false);
    navToggle?.focus();
  }
});

/* ---- Reveals ------------------------------------------------------------- */
// Stagger siblings that share a parent so groups cascade instead of popping.
document.querySelectorAll('.channels, .about-copy, .contact-intro').forEach((group) => {
  [...group.querySelectorAll('.reveal')].forEach((item, index) => item.style.setProperty('--i', String(index)));
});

const revealTargets = document.querySelectorAll('.reveal, .split, .work-item');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((item) => item.classList.add('is-in'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  revealTargets.forEach((item) => revealObserver.observe(item));
}

/* ---- Scroll-linked motion (parallax, hero exit, showcase scale) ---------- */
const heroCopy = document.querySelector('[data-hero-copy]');
const featureMedia = document.querySelector('.feature-media');
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
let scrollTicking = false;

const updateScrollMotion = () => {
  scrollTicking = false;
  const vh = window.innerHeight;
  updateHeader();
  if (reduceMotion) return;

  if (heroCopy) {
    const p = Math.min(1, window.scrollY / vh);
    heroCopy.style.transform = `translate3d(0, ${(p * -70).toFixed(1)}px, 0)`;
    heroCopy.style.opacity = String(Math.max(0, 1 - p * 1.25).toFixed(3));
  }

  if (featureMedia) {
    const rect = featureMedia.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh * .85)));
    featureMedia.style.setProperty('--s', (.86 + p * .14).toFixed(4));
  }

  if (!smallScreen) {
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const offset = (rect.top + rect.height / 2 - vh / 2) * Number(item.dataset.parallax || 0);
      item.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  }
};
const requestScrollMotion = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollMotion);
};
updateScrollMotion();
window.addEventListener('scroll', requestScrollMotion, { passive: true });
window.addEventListener('resize', requestScrollMotion, { passive: true });

/* ---- Perspective tilt on project media ----------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-tilt]').forEach((element) => {
    const strength = element.classList.contains('feature-media') ? 7 : 5;
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      element.classList.add('is-tracking');
      element.style.setProperty('--rx', `${((.5 - y) * strength).toFixed(2)}deg`);
      element.style.setProperty('--ry', `${((x - .5) * strength).toFixed(2)}deg`);
      element.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      element.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    element.addEventListener('pointerleave', () => {
      element.classList.remove('is-tracking');
      element.style.setProperty('--rx', '0deg');
      element.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---- Magnetic buttons ----------------------------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate3d(${(x * .18).toFixed(1)}px, ${(y * .28).toFixed(1)}px, 0)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

/* ---- Custom cursor (desktop only) ---------------------------------------- */
const cursorRoot = document.querySelector('[data-cursor-root]');
if (cursorRoot && finePointer && !reduceMotion) {
  root.classList.add('has-cursor');
  const dot = cursorRoot.querySelector('.cursor-dot');
  const ring = cursorRoot.querySelector('.cursor-ring');
  const label = cursorRoot.querySelector('[data-cursor-label]');
  const target = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  let cursorRaf = 0;

  const loop = () => {
    ringPos.x += (target.x - ringPos.x) * .2;
    ringPos.y += (target.y - ringPos.y) * .2;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    cursorRaf = Math.abs(target.x - ringPos.x) + Math.abs(target.y - ringPos.y) > .1 ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    target.x = event.clientX;
    target.y = event.clientY;
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    cursorRoot.classList.remove('is-hidden');
    if (!cursorRaf) cursorRaf = requestAnimationFrame(loop);

    const media = event.target.closest('[data-cursor]');
    const interactive = event.target.closest('a, button, input, textarea, select, label');
    cursorRoot.classList.toggle('is-media', Boolean(media));
    cursorRoot.classList.toggle('is-link', !media && Boolean(interactive));
    if (media) label.textContent = media.dataset.cursor;
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursorRoot.classList.add('is-hidden'));
  window.addEventListener('pointerdown', () => cursorRoot.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursorRoot.classList.remove('is-down'));
}

/* ---- Hero 3D (progressive) ------------------------------------------------ */
const heroCanvas = document.querySelector('[data-hero-canvas]');
const supportsWebGL = () => {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
};
const capable3D = () => {
  if (reduceMotion || !heroCanvas) return false;
  if (navigator.connection?.saveData) return false;
  const memory = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (memory < 3 || cores < 4) return false;
  return supportsWebGL();
};

if (capable3D()) {
  const boot = () => {
    import('./hero3d.js')
      .then(({ initHero3D }) => initHero3D(heroCanvas, { mobile: smallScreen || !finePointer }))
      .then(() => root.classList.add('has-3d'))
      .catch(() => {});
  };
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 });
  else setTimeout(boot, 300);
}

/* ---- Case study dialog ---------------------------------------------------- */
let dialogTrigger = null;
let sourceRect = null;

const openCaseStudy = (project, trigger) => {
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
    image.src = withVersion(project.image);
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

  dialogTrigger = trigger || document.activeElement;
  const card = trigger?.closest('[data-project-card]');
  sourceRect = card?.querySelector('.media-frame')?.getBoundingClientRect() || null;

  document.body.classList.add('dialog-open');
  caseDialog.showModal();
  caseDialog.scrollTop = 0;

  // Grow the dialog out of the project's screenshot.
  if (!reduceMotion && caseDialog.animate) {
    const box = caseDialog.getBoundingClientRect();
    const from = sourceRect
      ? `inset(${Math.max(0, sourceRect.top - box.top)}px ${Math.max(0, box.right - sourceRect.right)}px ${Math.max(0, box.bottom - sourceRect.bottom)}px ${Math.max(0, sourceRect.left - box.left)}px round 16px)`
      : 'inset(12% 12% 12% 12% round 16px)';
    caseDialog.animate(
      [{ clipPath: from, opacity: .4 }, { clipPath: 'inset(0 0 0 0 round 22px)', opacity: 1 }],
      { duration: 820, easing: 'cubic-bezier(.16, 1, .3, 1)' }
    );
    caseDialog.querySelector('.case-visual img')?.animate(
      [{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
      { duration: 1200, easing: 'cubic-bezier(.16, 1, .3, 1)' }
    );
    caseDialog.querySelector('.case-content')?.animate(
      [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
      { duration: 900, delay: 220, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }
    );
  }
};

let closing = false;
const closeDialog = (dialog) => {
  if (!dialog?.open || closing) return;
  if (reduceMotion || !dialog.animate) {
    dialog.close();
    return;
  }
  closing = true;
  const animation = dialog.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.98)' }],
    { duration: 320, easing: 'cubic-bezier(.65, 0, .35, 1)' }
  );
  animation.onfinish = () => {
    closing = false;
    dialog.close();
  };
};

const handleDialogClosed = () => {
  document.body.classList.remove('dialog-open');
  if (dialogTrigger instanceof HTMLElement) dialogTrigger.focus();
  dialogTrigger = null;
};

document.querySelectorAll('[data-case-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projects.find((item) => item.name === button.dataset.caseOpen);
    if (project) openCaseStudy(project, button);
  });
});
caseDialog?.querySelector('[data-case-close]')?.addEventListener('click', () => closeDialog(caseDialog));
caseDialog?.addEventListener('click', (event) => {
  if (event.target === caseDialog) closeDialog(caseDialog);
});
caseDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog(caseDialog);
});
caseDialog?.addEventListener('close', handleDialogClosed);

/* ---- Approved client reviews ---------------------------------------------- */
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

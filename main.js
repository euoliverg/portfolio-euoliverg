import { projects } from './projects.js';
import { escapeHtml, renderWork, withVersion } from './render.js';

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

const progressBar = document.querySelector('[data-scroll-progress]');
const onScroll = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.width = `${(pct * 100).toFixed(2)}%`;
  }
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Scroll-spy: light up the nav link for the section in view.
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const spyTargets = navLinks
  .map((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    return section ? { link, section } : null;
  })
  .filter(Boolean);
if (spyTargets.length && 'IntersectionObserver' in window) {
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const match = spyTargets.find((target) => target.section === entry.target);
      if (match) navLinks.forEach((link) => link.classList.toggle('is-active', link === match.link));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  spyTargets.forEach((target) => spyObserver.observe(target.section));
}

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

// Ambient background: faint code glyphs drifting upward behind the content.
// Deliberately subtle — it signals "developer" without competing with the work.
// Off for reduced-motion and small screens (where it would just cost battery).
const initCodeBackground = (canvas) => {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const glyphs = ['{ }', '( )', '=>', '</>', '&&', '||', '::', '$', 'fn', '[]', ';', '01', '==', '++', '#', 'const', 'let', 'async', 'npm'];
  const palette = ['107, 209, 160', '240, 189, 61', '162, 167, 174'];
  const rand = (min, max) => min + Math.random() * (max - min);

  let width = 0;
  let height = 0;
  let items = [];
  let raf = 0;
  let last = 0;

  const build = () => {
    const count = Math.min(30, Math.round(window.innerWidth / 55));
    items = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: rand(11, 17),
      speed: rand(4, 14),
      drift: rand(-6, 6),
      phase: Math.random() * Math.PI * 2,
      text: glyphs[Math.floor(Math.random() * glyphs.length)],
      color: `rgba(${palette[Math.floor(Math.random() * palette.length)]}, ${rand(0.04, 0.11).toFixed(3)})`
    }));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = 'middle';
    for (const item of items) {
      item.y -= item.speed * dt;
      item.phase += dt * 0.5;
      if (item.y < -24) {
        item.y = height + 24;
        item.x = Math.random() * width;
      }
      ctx.font = `${item.size}px "IBM Plex Mono", Consolas, monospace`;
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, item.x + Math.sin(item.phase) * item.drift, item.y);
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  resize();
  start();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
};

const bgCanvas = document.querySelector('[data-bg]');
if (bgCanvas && !reduceMotion && window.matchMedia('(min-width: 760px)').matches) {
  initCodeBackground(bgCanvas);
}

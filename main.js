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

/* ---- Terminal preloader -------------------------------------------------- */
const preloader = document.querySelector('[data-preloader]');
const preloaderBar = document.querySelector('[data-preloader-bar]');
if (preloader && preloaderBar && !reduceMotion) {
  requestAnimationFrame(() => {
    preloaderBar.style.transition = 'width 1100ms cubic-bezier(.3, .8, .3, 1)';
    preloaderBar.style.width = '100%';
  });
  setTimeout(() => {
    preloader.classList.add('is-done');
    setTimeout(() => preloader.remove(), 560);
  }, 1250);
} else if (preloader) {
  preloader.remove();
}

/* ---- Scroll progress + header shadow ------------------------------------ */
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

/* ---- Scroll-spy tabs with a sliding ink underline ----------------------- */
const tabs = [...document.querySelectorAll('.gh-tabs a[href^="#"]')];
const tabInk = document.querySelector('[data-tab-ink]');
const moveInk = (link) => {
  if (!tabInk || !link) return;
  tabInk.style.width = `${link.offsetWidth}px`;
  tabInk.style.transform = `translateX(${link.offsetLeft}px)`;
};
let activeTab = tabs[0] || null;
const setActiveTab = (link) => {
  if (!link) return;
  activeTab = link;
  tabs.forEach((tab) => tab.classList.toggle('is-active', tab === link));
  moveInk(link);
};
if (tabs.length) {
  const tabTargets = tabs
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((entry) => entry.section);

  tabs.forEach((link) => link.addEventListener('click', () => setActiveTab(link)));

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = tabTargets.find((entryTarget) => entryTarget.section === entry.target);
        if (match) setActiveTab(match.link);
      });
    }, { rootMargin: '-50% 0px -45% 0px', threshold: 0 });
    tabTargets.forEach((entry) => spy.observe(entry.section));
  }

  const initInk = () => setActiveTab(activeTab || tabs[0]);
  window.addEventListener('load', initInk);
  window.addEventListener('resize', () => moveInk(activeTab));
  initInk();
}

/* ---- Animated stat counters --------------------------------------------- */
if (!reduceMotion) {
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const target = Number(el.dataset.countTo);
    if (!target) return;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(k * target)).padStart(2, '0');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---- Case study dialog --------------------------------------------------- */
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

/* ---- Approved client reviews -------------------------------------------- */
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

/* ---- Reveal on scroll --------------------------------------------------- */
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

/* ---- 3D code background reacting to scroll ------------------------------ */
// A perspective-projected field of code glyphs flying toward the camera, with
// a receding floor grid. Scrolling accelerates the flight (parallax depth).
// Pure 2D canvas — no WebGL, no library — so it stays light on every device.
const initBackground = (canvas) => {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const glyphs = ['{ }', '( )', '=>', '</>', '&&', '||', '::', '$', 'fn', '[]', ';', '01', '==', '++', '#', 'const', 'let', 'async', 'npm', 'git'];
  const colors = ['63, 185, 80', '88, 166, 255', '188, 140, 255', '247, 129, 102', '139, 148, 158'];
  const F = 340;
  const NEAR = 26;
  const FAR = 1100;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let points = [];
  let raf = 0;
  let last = 0;
  let scrollY = window.scrollY;
  let boost = 0;

  const makePoint = (z) => ({
    x: (Math.random() * 2 - 1) * 900,
    y: (Math.random() * 2 - 1) * 600,
    z: z ?? (NEAR + Math.random() * (FAR - NEAR)),
    size: 12 + Math.random() * 11,
    text: glyphs[(Math.random() * glyphs.length) | 0],
    color: colors[(Math.random() * colors.length) | 0],
    a: 0.45 + Math.random() * 0.55
  });

  const build = () => {
    const count = Math.min(140, Math.round((w * h) / 14000));
    points = Array.from({ length: count }, () => makePoint());
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    cx = w / 2;
    cy = h * 0.46;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };

  const drawGrid = (shift) => {
    const groundY = 320;
    ctx.strokeStyle = 'rgba(63, 185, 80, .09)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const z = NEAR + ((i * 56 + shift) % (FAR - NEAR));
      const s = F / z;
      const y = cy + groundY * s;
      const span = 1500 * s;
      ctx.globalAlpha = Math.max(0, 1 - z / FAR) * 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - span, y);
      ctx.lineTo(cx + span, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.05;
    for (let gx = -6; gx <= 6; gx++) {
      const near = F / NEAR;
      const far = F / FAR;
      ctx.beginPath();
      ctx.moveTo(cx + gx * 190 * near, cy + groundY * near);
      ctx.lineTo(cx + gx * 190 * far, cy + groundY * far);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const sy = window.scrollY;
    const velocity = Math.abs(sy - scrollY);
    scrollY = sy;
    const targetBoost = Math.min(620, velocity * 15);
    boost += (targetBoost - boost) * Math.min(1, dt * 6);
    const speed = 58 + boost;
    const shift = sy * 0.5;

    ctx.clearRect(0, 0, w, h);
    drawGrid(shift);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const p of points) {
      p.z -= speed * dt;
      if (p.z < NEAR) {
        Object.assign(p, makePoint(FAR));
        continue;
      }
      const s = F / p.z;
      const sx = cx + p.x * s;
      const py = cy + p.y * s;
      if (sx < -80 || sx > w + 80 || py < -80 || py > h + 80) continue;
      const depth = 1 - (p.z - NEAR) / (FAR - NEAR);
      const alpha = p.a * Math.min(1, depth * 1.7) * Math.min(1, (FAR - p.z) / 130) * 0.5;
      if (alpha <= 0.012) continue;
      ctx.font = `${Math.max(8, p.size * s)}px "IBM Plex Mono", Consolas, monospace`;
      ctx.fillStyle = `rgba(${p.color}, ${alpha.toFixed(3)})`;
      ctx.fillText(p.text, sx, py);
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
if (bgCanvas && !reduceMotion) {
  initBackground(bgCanvas);
}

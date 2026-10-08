# PRODUCT.md — euoliverg.online

## What this is
The personal portfolio of **Gabriel Oliveira** (handle **@euoliverg**, "Oliver"),
a frontend / web developer who builds fast, modern, production websites and
landing pages for real businesses. Single static site, deployed on Vercel at
**https://euoliverg.online/**.

## Unique mechanism
Every project shown is a **live, in-production website for a paying client** —
public URLs anyone can open and inspect, with real screenshots. The proof is
the shipped work, not claims.

## Audience & scene
Primarily **US small-business owners** evaluating whether to hire Gabriel to
build their site, plus the occasional recruiter / collaborator. They view on a
mix of desktop and phones. They must come away thinking "this person can
clearly build high-end web experiences" and trust him with their business.

## Mode
**Experience** — a portfolio; the work leads, the interface recedes.

## Must stay true (content & function — never invent, never remove)
- **Name / role:** Gabriel Oliveira · Frontend Developer.
- **10 live projects** (exact names, descriptions, live URLs and real
  screenshots in `projects.js` / `assets/projects/`): City Wide Rental,
  Goldwheel Rental, Alfa Cleaning WA, GSN Construction LLC, Botequim Arretado, Restaurante
  Veranda, LRC Empire Construction, Planet Builders LLC, DR Property
  Solutions LLC, Noryx Digital. Several carry a case study (challenge /
  solution / services) shown in a dialog.
- **Tech stack:** HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js,
  PostgreSQL, Git, Vercel.
- **Contacts (real, do not alter):** email `Noryxdigitalllc@outlook.com`,
  phone `+1 (470) 297-2385`, GitHub `github.com/euoliverg`, LinkedIn
  `/in/gabriel-oliveira-45056a324`, Instagram `@euoliverg`.
- **Client review flow:** `review.html` (Web3Forms submission, moderated) +
  `moderate.html` + `/api/reviews`; approved reviews render on the site.
  The build guards this flow — keep it intact.
- **Photo:** `assets/gabriel-oliveira.webp` (real headshot).
- **SEO:** canonical, Open Graph / Twitter meta, Person JSON-LD, sitemap.

## Constraints
- Vanilla static site: hand-written HTML/CSS/ES-module JS + `scripts/build.mjs`
  (copies files, pre-renders the project gallery into `index.html`). No React,
  no bundler. Keep it that way — add only ESM libraries loaded progressively.
- Must stay fast and accessible; honor `prefers-reduced-motion`; real mobile
  experience, not a shrunk desktop.

# Gabriel Oliveira Portfolio

Professional portfolio website for Gabriel Oliveira, built as a fast static site with a client review workflow and moderation flow.

## Live site

- Production: https://euoliverg.online

## Overview

This project showcases selected work, professional background, contact information, and a moderated client review system. The site is optimized for performance and SEO and is designed for easy deployment on Vercel.

## Features

- Responsive portfolio landing page
- Pre-rendered project gallery
- Case study modal experience
- Client review submission flow
- Private moderation page for review approval/rejection
- SEO metadata and social preview tags
- Static build pipeline for production deployment

## Tech stack

- HTML
- CSS
- JavaScript
- Node.js
- Vercel Blob storage
- Vercel hosting

## Project structure

```text
portfolio-site/
├── api/
│   ├── _lib/
│   ├── moderate-review.js
│   ├── review.js
│   └── reviews.js
├── assets/
├── scripts/
│   ├── build.mjs
│   ├── serve.mjs
│   └── test-review-flow.mjs
├── .env.example
├── .gitignore
├── index.html
├── main.js
├── moderate.html
├── moderate.js
├── package.json
├── projects.js
├── render.js
├── review.html
├── review.js
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── styles.css
├── vercel.json
├── LICENSE
├── README.md
└── dist/
```

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env.local
```

3. Run the local server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Environment variables

Create a `.env.local` file using the example below:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token
PORT=4173
```

This token is used for the client review storage and moderation workflow.

## Deployment

This project is configured for Vercel. The app uses the `vercel.json` configuration and a static build output from `dist/`.

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # build static site into dist/
npm run preview  # build and serve dist/
npm run test:reviews  # validate review flow
```

## Notes

- Keep `.env.local` out of version control.
- Do not commit API tokens or secret keys.
- The site uses a production domain configured for `https://euoliverg.online`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

Gabriel Oliveira  
Email: Noryxdigitalllc@outlook.com  
LinkedIn: https://www.linkedin.com/in/gabriel-oliveira-45056a324/

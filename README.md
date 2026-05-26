# erdemkosk.com

Personal website for **Mustafa Erdem Köşk** — built with Astro, Tailwind CSS, and GitHub Pages.

## Features

- Minimal, fast, SEO-focused layout
- JSON-LD Person + WebSite schema
- Auto-generated sitemap
- GitHub repositories synced at build time
- Projects, photography, and contact pages

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```bash
npm run build
npm run preview
```

## Deploy

This project is ready for GitHub Pages. Set the repository Pages source to **GitHub Actions** or deploy the `dist/` folder.

## Customize

- Site metadata: `src/config/site.ts`
- Photography sync: `src/lib/px500.ts` (500px GraphQL, build time)
- GitHub username: `src/config/site.ts`

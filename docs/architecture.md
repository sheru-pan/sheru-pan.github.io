# Architecture

A one-page mental model so you can navigate the codebase without re-reading the source.

## The 30-second model

Astro builds **static HTML** from:
1. **Content collections** (markdown with typed frontmatter) — writeups + projects + resume.
2. **Pages** (`.astro` files in `src/pages/`) — each one becomes a URL.
3. **Layouts and components** — reused across pages.

Then Puppeteer renders the built `/resume` page to PDF in a separate step.

GitHub Actions runs build + PDF + publish on every push to `main`.

## Folder map

```
sheru-pan.github.io/
├── astro.config.mjs          ← Astro config (site URL, integrations, image opts)
├── package.json              ← deps + scripts (dev/build/pdf)
├── tsconfig.json
├── public/                   ← static, passed through as-is
│   └── favicon.svg
├── src/
│   ├── assets/               ← images processed by Astro's image pipeline
│   │   └── himangshupansocanalyst.png
│   ├── content/
│   │   ├── config.ts         ← Zod schemas for the collections
│   │   ├── writeups/<slug>/index.md     ← one folder per post
│   │   ├── projects/<slug>/index.md
│   │   └── resume.md         ← single resume source-of-truth
│   ├── data/profile.ts       ← bio, skills, certs, contact (used by Home + Contact + Footer)
│   ├── layouts/
│   │   └── BaseLayout.astro  ← shell: <html>, <head>, Nav, Footer, slot
│   ├── components/           ← Nav, Footer, cards, AllPostsSidebar, TerminalPrompt
│   ├── pages/                ← URL routes
│   │   ├── index.astro       ← /
│   │   ├── 404.astro         ← /404
│   │   ├── contact.astro     ← /contact
│   │   ├── resume.astro      ← /resume (renders src/content/resume.md)
│   │   ├── writeups/
│   │   │   ├── index.astro          ← /writeups (list)
│   │   │   └── [...slug].astro      ← /writeups/<slug> (dynamic)
│   │   └── projects/{index, [...slug]}.astro
│   └── styles/
│       ├── globals.css       ← theme tokens, prose styles, Tailwind import
│       └── resume-print.css  ← loaded only by /resume?print=1
├── scripts/
│   └── build-resume-pdf.mjs  ← starts a local server over dist/, hits /resume?print=1, prints to PDF
├── Dockerfile.builder        ← Node 22 + Chromium — image used by the `builder` compose service
├── docker-compose.yml        ← builder (one-shot) + web (nginx on :80) for Docker-only workflow
├── nginx.conf                ← MIME types, cache headers, 404 → /404.html
├── docs/                     ← these docs
├── legacy/                   ← old Jekyll site, preserved for reference
└── .github/workflows/deploy.yml
```

## Data flow

```
src/content/writeups/*/index.md
       │
       ▼ (Zod-validated by src/content/config.ts)
       │
       ▼
src/pages/writeups/index.astro     → /writeups
src/pages/writeups/[...slug].astro → /writeups/<slug>
                  │
                  └─> AllPostsSidebar queries the same collection,
                      filters out the current entry,
                      renders the cross-link list.
```

Same flow for `projects`. Resume is similar but `src/pages/resume.astro` reads `resume.md` directly with `gray-matter` because we want a different (single-document) rendering path.

## Docker-only workflow (no host npm)

The project ships a `Dockerfile.builder` and a two-service `docker-compose.yml` so the site can be built and served without installing anything beyond Docker:

```
┌─────────────────────────────┐          ┌─────────────────────────┐
│ builder (one-shot)          │          │ web                     │
│ FROM node:22-bookworm-slim  │          │ FROM nginx:alpine       │
│ + chromium for Puppeteer    │          │                         │
│                             │          │ serves ./dist on :80    │
│ npm ci && build && pdf      │──exit──▶ │ depends_on:             │
│ writes to ./dist (bind mt)  │  ok      │   builder: completed_ok │
└─────────────────────────────┘          └─────────────────────────┘
```

`docker compose up -d --build` runs the whole flow. After content changes, `docker compose run --rm builder` rebuilds; nginx picks up the new files instantly via the read-only bind mount.

**Crucial design choice:** the application's `package.json` has no Docker references. Docker is the build/deploy environment, not part of the app. If you ever want to drop Docker and use plain `npm`, nothing in `src/` has to change.

## The two-stage build

```
┌────────────────┐     ┌──────────────────┐
│ npm run build  │ ──▶ │ dist/*.html      │
└────────────────┘     │ dist/resume/...  │
                       └────────┬─────────┘
                                │
                       ┌────────▼─────────┐
                       │ npm run pdf      │ (Puppeteer)
                       │ visits /resume   │
                       │ ?print=1         │
                       └────────┬─────────┘
                                ▼
                       dist/ResumeHimangshuPan.pdf
```

The resume page's behavior depends on the `?print=1` query parameter:
- Without it: dark theme, nav + footer, "Download PDF" button visible.
- With it: `BaseLayout` is told `hideChrome={true}`, `resume-print.css` is loaded, white background + Inter body + JetBrains Mono headings.

Same Astro page, two output modes. One markdown source.

## Why Astro

- Outputs pure static HTML → perfect for GitHub Pages.
- Content collections give typed, validated frontmatter (catches broken posts at build).
- First-class image optimization (the hero PNG goes from 2MB to ~30KB on phones).
- Zero JavaScript by default — adds only what each page needs.
- MDX support means I can embed components inside posts when I want richer callouts.

## Why Tailwind v4

- Inline `@theme` tokens in CSS — no separate config file.
- Used as a Vite plugin (`@tailwindcss/vite`), no `@astrojs/tailwind` integration needed.
- Mobile-first responsive utilities map well to the multi-breakpoint requirements.

## Where to start when changing something

| Want to change… | Edit… |
|---|---|
| The nav, footer, favicon | `src/components/Nav.astro`, `Footer.astro`, `public/favicon.svg` |
| Colors / fonts globally | `src/styles/globals.css` (the `@theme` block) |
| Bio / skills / certs / contact | `src/data/profile.ts` |
| Resume content | `src/content/resume.md` |
| Add a writeup or project | new folder under `src/content/<collection>/` |
| Home page structure | `src/pages/index.astro` |
| How writeups render | `src/pages/writeups/[...slug].astro` + `src/styles/globals.css` (`.prose-blue`) |
| Deploy pipeline | `.github/workflows/deploy.yml` |

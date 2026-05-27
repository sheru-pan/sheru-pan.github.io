# Portfolio Site — Maintainer's Handbook

This is the documentation for [sheru-pan.github.io](https://sheru-pan.github.io). It's written for *future-you* coming back six months later having forgotten how it works.

## Quick links

| Task | Doc |
|------|-----|
| First-time setup, run locally | [getting-started.md](./getting-started.md) |
| Publish a new writeup / CTF / detection post | [adding-a-writeup.md](./adding-a-writeup.md) |
| Add a project / home-lab entry | [adding-a-project.md](./adding-a-project.md) |
| Update resume (markdown + PDF) | [updating-resume.md](./updating-resume.md) |
| Change bio, skills, certifications, contact info | [updating-profile.md](./updating-profile.md) |
| Add images, screenshots, diagrams to a post | [images-and-media.md](./images-and-media.md) |
| Tweak colors, fonts, layout | [styling-and-theme.md](./styling-and-theme.md) |
| How deploy works, how to re-run / roll back | [deployment.md](./deployment.md) |
| Something broke — common fixes | [troubleshooting.md](./troubleshooting.md) |
| One-page mental model of the codebase | [architecture.md](./architecture.md) |

## The 30-second version

**Docker (no host npm):**

```bash
docker compose up -d --build      # → http://localhost
docker compose run --rm builder   # rebuild after editing content
docker compose down               # stop
```

**Native Node (for hot reload while editing):**

```bash
npm ci
npm run dev                       # → http://localhost:4321
```

Push to `main`. The GitHub Actions workflow builds, generates the PDF, and deploys to GitHub Pages.

## Where everything lives

```
src/
├── content/
│   ├── writeups/<slug>/index.md     ← blog posts
│   ├── projects/<slug>/index.md     ← project / lab entries
│   └── resume.md                    ← single source of truth for the resume
├── data/profile.ts                  ← bio, skills, certs, contact info
├── pages/                           ← URL routes
├── layouts/                         ← page shells
├── components/                      ← reusable pieces
└── styles/globals.css               ← theme tokens + prose styles

public/                              ← static assets (favicon, etc.)
scripts/build-resume-pdf.mjs         ← Puppeteer → ResumeHimangshuPan.pdf
.github/workflows/deploy.yml         ← CI/CD
legacy/                              ← old Jekyll site, preserved
```

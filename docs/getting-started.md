# Getting Started

You can work on this site **two ways**:

1. **Docker-only** — no Node, npm, or anything else installed on your machine. Just Docker. Recommended for non-dev machines, fresh laptops, and production parity.
2. **Native Node** — install Node 22 locally. Useful for fast hot-reload while editing.

You only need one. They produce the same output.

---

## Path 1 — Docker only (no host npm)

Prerequisites: Docker Engine + Docker Compose v2.

The repo ships two services in `docker-compose.yml`:

- **`builder`** — Node 22 + Chromium image (built from `Dockerfile.builder`). Runs `npm ci`, `npm run build`, `npm run pdf` and writes the static site + resume PDF into `./dist/`. Exits when done.
- **`web`** — nginx serving `./dist/` on port 80. Depends on `builder` finishing successfully.

### First time

```bash
docker compose up -d --build
```

This builds the builder image (one-time ~2 min — Chromium and apt deps), runs the builder (~30s — npm install + Astro build + Puppeteer PDF), then starts nginx.

Open **http://localhost** — site is live.

### Rebuild after editing content / config

```bash
docker compose run --rm builder
```

This re-runs only the builder. nginx picks up the new `dist/` immediately (read-only bind mount, no restart needed).

### Stop everything

```bash
docker compose down
```

The named volume holding `node_modules` is kept, so the next build is fast. To purge it: `docker compose down -v`.

### View nginx logs

```bash
docker compose logs -f web
```

### Notes

- The app itself has no Docker dependency — Docker is purely the build/run environment. `Dockerfile.builder` is the only place Docker appears in the project.
- Files written by the builder are owned by UID 1000 on the host (matches your `sheru` user). No `chown` needed afterwards.
- If port 80 is taken on your host, edit `docker-compose.yml` and change `"80:80"` to `"8080:80"` (then open http://localhost:8080).

---

## Path 2 — Native Node (hot reload while editing)

Prerequisites: Node 22+, npm 10+.

```bash
npm ci
npm run dev      # → http://localhost:4321 (hot reload)
```

Day-to-day:

| Command | What it does |
|---|---|
| `npm run dev` | Hot-reload dev server on http://localhost:4321 |
| `npm run build` | Static site → `dist/` |
| `npm run pdf` | Render resume page → `dist/ResumeHimangshuPan.pdf` (requires `npm run build` first) |
| `npm run build:all` | `build` + `pdf` chained |
| `npm run preview` | Astro's built-in static preview server |

First install downloads Chromium for Puppeteer (~150MB, once).

---

## URLs to know

| Route | Purpose |
|---|---|
| `/` | Home — hero, about, skills, certs, latest writeups |
| `/writeups/` | Index of blog posts |
| `/writeups/<slug>/` | Individual writeup |
| `/projects/` | Index of projects |
| `/projects/<slug>/` | Individual project |
| `/resume` | Resume page (rendered from `src/content/resume.md`) |
| `/resume?print=1` | Print-mode preview — what Puppeteer renders to PDF |
| `/contact` | Email + WhatsApp buttons, social links |
| `/ResumeHimangshuPan.pdf` | The generated PDF |

## Sanity check after install

Docker path:

```bash
docker compose up -d --build
curl -sI http://localhost/ | head -1               # → 200 OK
curl -sI http://localhost/ResumeHimangshuPan.pdf   # → 200 OK
```

Native path:

```bash
npm run build:all
ls dist/ResumeHimangshuPan.pdf                     # → exists
```

If both work you're set.

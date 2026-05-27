# Troubleshooting

Common errors and what to do about them. Add new entries as you encounter them.

## Build fails: "Cannot find module 'astro:content'"

You haven't run `npm ci` (or `npm install`) since cloning. Run it.

## Build fails: "Invalid frontmatter in src/content/writeups/..."

Your post's frontmatter doesn't match the schema in `src/content/config.ts`. The error message tells you which field. Common causes:

- `date` isn't a real date: must be `YYYY-MM-DD`.
- `tags` is a string instead of an array: write `tags: [a, b]` not `tags: "a, b"`.
- `difficulty` is misspelled: must be one of `easy | medium | hard | insane`.
- `repo` (projects) isn't a valid URL: include `https://`.

## "Image not found" during build

Path is wrong, or the file isn't where you think.

- For markdown in `src/content/<collection>/<slug>/index.md`, image paths must be relative starting with `./`.
- Check the file actually exists with `ls src/content/writeups/<slug>/`.
- File extensions are case-sensitive on Linux: `Foo.PNG` ≠ `foo.png`.

## PDF is blank / missing content

Run `npm run build` first — `npm run pdf` reads from `dist/`, so you need a fresh build.

If still blank:

1. Open `http://localhost:4321/resume?print=1` in a browser.
2. If the page is blank there too, the bug is in the resume page — likely `src/content/resume.md` is missing or malformed.
3. If the page renders fine but the PDF is blank, check `scripts/build-resume-pdf.mjs`. Puppeteer's `waitUntil: "networkidle0"` may be timing out; bump the timeout or switch to `domcontentloaded`.

## PDF has the dark site theme bleeding through

The `?print=1` parameter wasn't applied. Verify:

- The URL Puppeteer hits ends in `?print=1` (check `scripts/build-resume-pdf.mjs`).
- `src/pages/resume.astro` is reading `Astro.url.searchParams.get("print")` correctly.
- `src/styles/resume-print.css` is being copied into `dist/`.

## Puppeteer fails in CI: "no usable sandbox"

Already handled — the script launches with `--no-sandbox --disable-setuid-sandbox`. If you've edited that line out, put it back.

## WhatsApp button opens "invalid number"

The `wa.me/` URL must contain digits only — no `+`, no spaces, no dashes. Edit `src/data/profile.ts`:

```ts
whatsapp: {
  display: "+91 9332943989",        // pretty version
  url: "https://wa.me/919332943989", // digits only
}
```

## Email button opens nothing (Linux)

You don't have a default mailto handler set. Run `xdg-mime default thunderbird.desktop x-scheme-handler/mailto` (or your client of choice). The button itself is fine — it's the OS default that's missing.

## `docker compose up` fails: "port is already allocated"

Something else is bound to port 80 on the host (often a system nginx or Apache).

```bash
sudo ss -ltnp | grep ':80 '
```

Either stop the other service, or edit `docker-compose.yml` to map a free port on the `web` service:

```yaml
ports:
  - "8080:80"
```

Then open http://localhost:8080.

## `docker compose up` shows the site, but new content isn't there

The `builder` service only runs once per `docker compose up`. After editing content, re-run **just** the builder:

```bash
docker compose run --rm builder
```

nginx picks up the new `dist/` files instantly — no restart needed (read-only bind mount).

## Builder container fails: "permission denied" writing to /app

The host directory ownership doesn't match the container's `node` user (uid 1000). Run:

```bash
ls -la /home/sheru/Documents/SOC/sheru-pan.github.io
```

If the repo isn't owned by your user (uid 1000), `chown -R $USER:$USER .` and re-run. If you cloned the repo with a non-1000 user, edit `Dockerfile.builder` to match: change `USER node` to a custom user with the right UID.

## Builder finishes but `dist/ResumeHimangshuPan.pdf` is missing

Puppeteer failed inside the container. Most common cause: missing Chromium dependencies in the image. Check the builder logs:

```bash
docker compose logs builder
```

If you see "Failed to launch the browser process" or similar, a `libfoo.so.1` is missing — add it to the `apt-get install` block in `Dockerfile.builder` and rebuild: `docker compose build builder`.

## Builder is slow on every run

The `node_modules` named volume is the cache — first run is slow (a few minutes), later runs are seconds because the volume already has the install.

Did you do `docker compose down -v`? That `-v` flag deleted the volume. Avoid it unless you want to force a clean reinstall.

## Builder rebuilds the Chromium layer on every `docker compose up`

The `Dockerfile.builder` image only rebuilds when one of its instructions changes. If you're seeing it rebuild every time:

- Did you edit `Dockerfile.builder`? That invalidates the cache from that line down.
- Are you running `docker compose up --build` every time? Drop `--build` after the first run — it forces a rebuild even when nothing changed.

## `npm run dev` shows "Port 4321 already in use"

Another dev server is running. Either kill it:

```bash
lsof -ti:4321 | xargs kill
```

…or run dev on a different port: `npm run dev -- --port 4322`.

## Site is live but new post / project isn't showing

1. Did the GitHub Actions run go green? Repo → Actions.
2. Is the post's `draft: false`? Default is `false`, but explicit doesn't hurt.
3. Is the file named `index.md` (not e.g. `post.md`)? The glob pattern looks for that name.
4. Hard-refresh (Ctrl+Shift+R) — your browser is caching the old page.

## CI build works but locally `npm run pdf` fails

Most likely: Chromium wasn't downloaded during `npm ci` because you had `PUPPETEER_SKIP_DOWNLOAD=true` set, or your network blocked the download. Force a re-download:

```bash
npx puppeteer browsers install chrome
```

## Build is suddenly very slow

Image optimization is the usual culprit. Check `dist/_astro/` for huge files. Compress source images before committing — Astro can only optimize *from* what you give it.

## Something else

Open an issue in the repo with:
- The exact command you ran
- The full error
- `node --version` and `npm --version`
- `cat package.json | grep version`

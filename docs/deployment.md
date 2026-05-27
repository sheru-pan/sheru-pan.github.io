# Deployment

The site auto-deploys to GitHub Pages on every push to `main`.

## Pipeline overview

`.github/workflows/deploy.yml` does this on every push to `main`:

1. **Checkout** the repo
2. **Setup Node 22** + npm cache
3. **`npm ci`** — exact-version install
4. **`npm run build`** — Astro static build into `dist/`
5. **`npm run pdf`** — Puppeteer renders `/resume?print=1` → `dist/ResumeHimangshuPan.pdf`
6. **`actions/configure-pages`** + **`actions/upload-pages-artifact`** point at `dist/`
7. **`actions/deploy-pages`** publishes to GitHub Pages

End-to-end takes about 2 minutes.

## GitHub Pages settings

Repository → **Settings → Pages**:

- **Source**: "GitHub Actions" (NOT "Deploy from a branch")

If it's still set to a branch, the workflow won't be allowed to publish.

## Verifying a deploy

After pushing to `main`:

1. Go to repo → **Actions** tab.
2. Latest run titled "Build & Deploy to GitHub Pages" should be green.
3. The `deploy` job's output includes a URL — usually `https://sheru-pan.github.io`.
4. Hard-refresh the live site (Ctrl+Shift+R) to bypass cache.

## Manual redeploy

Two options:

1. Push any commit (even just a docs typo).
2. **Actions → Build & Deploy → Run workflow** dropdown — manual trigger via `workflow_dispatch`.

## Rolling back

```bash
git log --oneline -10                # find the last good commit
git revert <bad-commit-sha>          # creates a NEW commit that undoes the bad one
git push origin main
```

The next deploy goes live in ~2 minutes.

Prefer revert over `git reset --hard + force push` — revert keeps history honest and other clones don't break.

## Why GitHub Actions instead of `gh-pages` branch

The Jekyll-era site published from `Site/_site/`. We use the modern Pages flow (artifact-based, GitHub Actions source). Benefits:

- The repo doesn't need to contain built HTML — `dist/` is `.gitignore`d.
- Build environment is controlled (Node version, deps).
- The Puppeteer PDF step fits naturally in the build job.

## Cache notes

Two caches at play:

1. `actions/setup-node`'s npm cache — fast `npm ci` on subsequent runs. Invalidated by `package-lock.json` changes.
2. Puppeteer Chromium — downloaded fresh each CI run unless you add a custom cache step. ~150MB and ~30s; not worth caching unless build times become a problem.

## What is NOT deployed

- `legacy/` — not in `src/` or `public/`, so Astro ignores it entirely. The folder lives in the repo for historical reference but isn't part of the published site.
- `docs/` — same, not built into the site.
- `node_modules/`, `.astro/`, `dist/` — ignored by `.gitignore`.

## Custom domain (when you're ready)

1. Add a `CNAME` file to `public/` containing your domain (one line, no protocol): `pan.dev`
2. In the domain's DNS provider, add a CNAME record pointing to `sheru-pan.github.io`.
3. Repo → Settings → Pages → "Custom domain" field → enter the same domain.
4. Enforce HTTPS once GitHub provisions the certificate (a few minutes).

Update `site:` in `astro.config.mjs` to the new domain too, so absolute URLs in the sitemap are correct.

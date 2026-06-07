#!/bin/sh
# Build entrypoint for the portfolio builder container.
# Goals: fast repeat builds (don't reinstall deps every run) and an optional
# PDF step for quick content iterations.
set -e

# 1) Install dependencies only when needed.
#    node_modules lives in a persistent named volume (see docker-compose.yml),
#    so we can skip the ~50s clean install when the lockfile hasn't changed.
#    Re-install when: node_modules is empty/missing, or package-lock.json
#    changed since the last successful install.
HASH_FILE="node_modules/.deps-lock-hash"
CUR_HASH="$(sha1sum package-lock.json | cut -d ' ' -f 1)"
PREV_HASH="$(cat "$HASH_FILE" 2>/dev/null || true)"

if [ ! -f node_modules/astro/package.json ] || [ "$PREV_HASH" != "$CUR_HASH" ]; then
  echo "→ Installing dependencies (node_modules empty or lockfile changed)…"
  npm ci --no-audit --no-fund
  # npm ci can flakily drop platform-specific OPTIONAL deps (npm/cli#4828),
  # which omits Tailwind v4's native binary and breaks the build. Force-install
  # the matching native binary for this linux-x64 image, without touching
  # package.json or the lockfile.
  OXVER="$(node -p "require('@tailwindcss/oxide/package.json').version")"
  npm install --no-save --no-package-lock --no-audit --no-fund "@tailwindcss/oxide-linux-x64-gnu@$OXVER"
  echo "$CUR_HASH" > "$HASH_FILE"
else
  echo "→ Dependencies already up to date — skipping install."
fi

# 2) Build the static site.
npm run build

# 3) Render the résumé PDF, unless SKIP_PDF=1 (skip for quick content iterations).
#    The PDF launches headless Chromium via Puppeteer, which is the slowest step.
if [ "${SKIP_PDF:-0}" = "1" ]; then
  echo "→ SKIP_PDF=1 — skipping résumé PDF render."
else
  npm run pdf
fi

echo "✓ Build complete."

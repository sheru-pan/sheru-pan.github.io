# syntax=docker/dockerfile:1
#
# Self-contained PRODUCTION image for the portfolio site.
# Multi-stage: a heavy Node + Chromium stage compiles the static site and renders
# the résumé PDF; the final stage is a tiny nginx that serves the built output.
# Everything in the build stage (node, npm, chromium, node_modules) is discarded —
# the shipped image is just nginx:alpine-slim + ~5 MB of static files.
#
#   docker build -t sheru-portfolio .
#   docker run --rm -p 8080:80 sheru-portfolio   # → http://localhost:8080

# ---- Build stage: compile dist/ (+ résumé PDF) --------------------------------
FROM node:22-bookworm-slim AS build

# Bump npm to the latest while still root (matches the dev builder image).
RUN npm install -g npm@latest

# Chromium + the headless deps Puppeteer needs to render the résumé PDF.
# These live only in this stage and never reach the final image.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates \
      fonts-liberation \
      libnss3 \
      libxss1 \
      libasound2 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdbus-1-3 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libgbm1 \
      libpango-1.0-0 \
      libxshmfence1 \
      libdrm2 \
      libxkbcommon0 \
      libxfixes3 \
    && rm -rf /var/lib/apt/lists/*

# Use the system Chromium instead of letting Puppeteer download its own.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install deps first, from the lockfile only, so this layer caches across source
# edits (it re-runs only when package.json / package-lock.json change).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
    # npm ci can flakily drop platform-specific OPTIONAL deps (npm/cli#4828),
    # omitting Tailwind v4's native binary and breaking the build. Force-install
    # the matching linux-x64 binary without touching package.json / lockfile.
    && npm install --no-save --no-package-lock --no-audit --no-fund \
       "@tailwindcss/oxide-linux-x64-gnu@$(node -p "require('@tailwindcss/oxide/package.json').version")"

# Build the static site and render the résumé PDF into dist/.
COPY . .
RUN npm run build && npm run pdf

# ---- Runtime stage: minimal static server -------------------------------------
FROM nginx:alpine-slim AS runtime

# Site-specific server config (mime tweaks, cache headers, custom 404).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The only thing we keep from the build: the compiled site.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

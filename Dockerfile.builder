# Build container for the portfolio site.
# Runs `npm ci && npm run build && npm run pdf` — produces ./dist/ + ./dist/ResumeHimangshuPan.pdf.
# Intentionally not used at runtime: the application has no Docker dependency.
FROM node:22-bookworm-slim

# Chromium + the headless deps Puppeteer needs.
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

# Tell Puppeteer to use the system Chromium instead of downloading its own.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Pre-create the working dir owned by the existing node user (uid 1000),
# so the named node_modules volume inherits the right ownership.
WORKDIR /app
RUN mkdir -p /app/node_modules /app/.astro /app/dist \
    && chown -R node:node /app

USER node

# Default command: install, build the static site, then render the resume PDF.
CMD ["sh", "-c", "npm ci --no-audit --no-fund && npm run build && npm run pdf"]

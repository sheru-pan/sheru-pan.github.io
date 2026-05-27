#!/usr/bin/env node
/**
 * Renders /resume?print=1 from the built dist/ to dist/ResumeHimangshuPan.pdf
 * using Puppeteer headless Chromium. Run AFTER `astro build`.
 */
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");

if (!fs.existsSync(distDir)) {
  console.error("✗ dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url.endsWith("/")) url += "index.html";
  let filePath = path.join(distDir, url);
  if (!filePath.startsWith(distDir)) {
    res.statusCode = 403;
    res.end("forbidden");
    return;
  }
  if (!fs.existsSync(filePath)) {
    const alt = path.join(distDir, url, "index.html");
    if (fs.existsSync(alt)) filePath = alt;
  }
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/resume/`;
console.log(`→ rendering ${url}`);

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

  // Wait until paged.js finishes paginating (sets body.paged-done).
  await page.waitForSelector("body.paged-done, body.paged-failed", { timeout: 60_000 });
  // Settle delay for fonts / final layout.
  await new Promise((r) => setTimeout(r, 600));
  await page.emulateMediaType("print");

  const outPath = path.join(distDir, "ResumeHimangshuPan.pdf");
  // Paged.js (and the @page CSS) already define A4 size + margins.
  // Pass margin: 0 here so Puppeteer doesn't double them up.
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });
  console.log(`✓ wrote ${path.relative(repoRoot, outPath)}`);
} finally {
  await browser.close();
  server.close();
}

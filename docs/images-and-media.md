# Images & Media

## Where images live

Two options depending on what the image is for:

| Type | Location | How to reference |
|---|---|---|
| Screenshot in a writeup / project | `src/content/<collection>/<slug>/foo.png` | `![alt](./foo.png)` in markdown |
| Site-wide hero / brand image | `src/assets/foo.png` | `import foo from "../assets/foo.png"` + `<Image src={foo} ...>` |
| Truly static (favicon, robots.txt, downloadable PDFs) | `public/foo.svg` | `<img src="/foo.svg">` (path is final, no processing) |

## Why the distinction matters

- `src/assets/` and content-folder images go through **Astro's image pipeline**: automatic resizing, WebP/AVIF conversion, responsive `srcset`, lazy loading. A 2MB PNG becomes a 30KB WebP on phones.
- `public/` is passed through as-is, byte-for-byte. Use it only for files that need a stable public URL or that shouldn't be touched (favicon, the resume PDF, etc.).

## Recommended formats

| Use case | Format |
|---|---|
| Screenshots (terminal, dashboard, UI) | **PNG** — lossless, sharp text |
| Photos / hero images | **JPG** or original PNG → pipeline outputs WebP |
| Diagrams, logos, icons | **SVG** — vector, infinitely scalable |
| Animations | **WebM** or **GIF** (prefer WebM for size) |

## Practical limits

- Source images: under 4MB. Larger than that, resize or compress before committing — Git history matters.
- Don't commit RAW or PSD files.

## Alt text

Every image needs alt text. Always.

```markdown
![Suricata IDS dashboard showing 12 alerts of type ET SCAN NMAP](./suricata-dashboard.png)
```

If the image is purely decorative (a divider, a vibe), use empty alt: `![](./divider.svg)`.

## Linking images inside markdown — gotchas

✅ Relative path: `./screenshot.png` — Astro processes it.
❌ Absolute path: `/screenshot.png` — Astro does NOT process; only works if the file is in `public/`.
❌ External URL: `https://...` — works but no optimization; consider caching the image locally.

## Hero / branding images

The home page hero uses `src/assets/himangshupansocanalyst.png`. To swap it:

1. Drop the new image into `src/assets/`.
2. Update the import in `src/pages/index.astro`:
   ```astro
   import heroImage from "../assets/<your-new-file>.png";
   ```
3. The `<Image>` component handles everything else (responsive sizes, format conversion).

## Per-post hero image (optional)

A writeup can declare a `heroImage` in its frontmatter:

```markdown
---
title: ...
heroImage: ./cover.png
---
```

Currently the layout doesn't render this — it's stored for future use. If you want it visible, edit `src/pages/writeups/[...slug].astro` and drop an `<Image src={entry.data.heroImage} ...>` into the header section.

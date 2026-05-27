# Adding a Writeup

Writeups are blog posts: CTF walkthroughs, detection-engineering notes, IR exercises, lab journals. Each one is a folder under `src/content/writeups/` containing an `index.md` and any images.

## 1. Create the folder

```bash
mkdir src/content/writeups/my-new-post
touch src/content/writeups/my-new-post/index.md
```

The folder name becomes the URL slug: `/writeups/my-new-post/`. Use kebab-case (lowercase, hyphens).

## 2. Add frontmatter

Open `index.md` and paste this template at the top:

```markdown
---
title: "Your Post Title"
description: "One-sentence summary that shows up on the cards and in search results."
date: 2026-05-25
platform: TryHackMe        # optional — "TryHackMe", "HackTheBox", "Lab notes", etc.
difficulty: medium         # optional — easy | medium | hard | insane
tags: [detection, sigma, sysmon]
draft: false               # set to true to hide from the live site while drafting
---
```

### Frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Post title — appears as the `<h1>`. Quote if it contains a colon. |
| `description` | yes | One-line summary, used on cards and as the meta description. Aim for 100–160 chars. |
| `date` | yes | `YYYY-MM-DD`. The cards sort by this. |
| `platform` | no | Short label rendered as a badge. |
| `difficulty` | no | One of `easy`, `medium`, `hard`, `insane`. |
| `tags` | no | Array of short tags, displayed under the title. Default: `[]`. |
| `draft` | no | `true` hides the post entirely from builds. Default: `false`. |

## 3. Write the body

Below the closing `---`, write the body in markdown. Standard markdown works:

- Headings `##`, `###`
- Lists, bold, italics
- Links `[label](https://example.com)`
- Tables
- Blockquotes for callouts

Code blocks with a language hint get syntax-highlighted automatically:

````markdown
```bash
nmap -sV 10.10.10.10
```
````

Supported languages include `bash`, `python`, `powershell`, `yaml`, `json`, `sql`, `kql`, `spl`, and many more (full list: [shiki languages](https://shiki.style/languages)).

## 4. Add screenshots / images

Drop image files in the same folder as `index.md`:

```
src/content/writeups/my-new-post/
├── index.md
├── nmap-output.png
└── kibana-detection.png
```

Reference them with relative paths:

```markdown
![Nmap output showing two open ports](./nmap-output.png)
```

Astro auto-generates responsive variants (WebP, multiple sizes) at build time. See [images-and-media.md](./images-and-media.md) for sizing tips and advanced options.

## 5. Preview locally

```bash
npm run dev
```

Open http://localhost:4321/writeups/my-new-post/ — your post should be rendering. Hot reload picks up edits as you save.

Check:
- All images load (broken-image icons mean the path is wrong)
- Code blocks are highlighted
- The post shows up at `/writeups` and on the home-page "recent writeups" strip
- The sidebar on the post page lists every *other* writeup (cross-linking)

## 6. Publish

```bash
git add src/content/writeups/my-new-post/
git commit -m "writeup: my new post"
git push
```

GitHub Actions rebuilds and deploys. Live in ~2 minutes.

## Common pitfalls

| Symptom | Fix |
|---|---|
| Build fails: "image not found" | Make sure the image path is relative (`./foo.png`), not absolute (`/foo.png`). |
| Frontmatter validation error | Check the [content schema](../src/content/config.ts). `date` must be a real date. |
| Post doesn't appear | `draft: true`? Or in a folder that doesn't have an `index.md`? |
| Tags show as one big string | `tags` must be an array: `[a, b, c]`, not `"a, b, c"`. |

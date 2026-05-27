# Adding a Project

Projects are home-lab builds, detection-rule repos, security scripts, or any longer-form artifact you want to show off. Same pattern as [adding a writeup](./adding-a-writeup.md), but the collection is `projects`.

## 1. Create the folder

```bash
mkdir src/content/projects/my-lab
touch src/content/projects/my-lab/index.md
```

The folder name is the URL slug: `/projects/my-lab/`.

## 2. Frontmatter

```markdown
---
title: "My SOC Lab"
description: "What it is and why it exists, in one sentence."
date: 2026-05-25
stack: [ELK, Wazuh, Docker, Sysmon]   # tech stack — rendered as badges
repo: https://github.com/sheru-pan/my-lab     # optional, adds a "↗ repo" link
draft: false
---
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `description` | yes | |
| `date` | yes | Sort key. |
| `stack` | no | Array of tech labels. Default: `[]`. |
| `repo` | no | GitHub URL. Must be a valid URL or Zod will reject. |
| `draft` | no | Default: `false`. |

## 3. Body

Write the body in markdown — same support as writeups: code blocks, images alongside `index.md`, tables, links.

Good structure for a project entry:

- **Goal** — what problem does it solve / what are you trying to learn
- **Architecture** — diagram if useful (ASCII works great in `pre` blocks)
- **Stack / Services**
- **What I use it for** — actual workflows
- **What's next** — roadmap

## 4. Cross-link to writeups

If a writeup demos something built on this project, link them:

```markdown
See [the Sigma detection post](/writeups/detection-engineering-sigma-101/) for the rule
I wrote against this lab's telemetry.
```

And vice versa. The cross-linking sidebar already handles "all other projects" automatically.

## 5. Publish

Same git flow as a writeup:

```bash
git add src/content/projects/my-lab/
git commit -m "project: my lab"
git push
```

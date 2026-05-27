# sheru-pan.github.io

Personal portfolio + writeup site for **Himangshu Pan** — SOC analyst, blue-team / defensive security research.

Live: [https://sheru-pan.github.io](https://sheru-pan.github.io)

## Stack

- [Astro 5](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com)
- MDX + Shiki for writeups
- Puppeteer for resume PDF generation
- GitHub Actions → GitHub Pages

## Quick start

### With Docker (no host npm needed)

```bash
docker compose up -d --build     # builds → serves
# → http://localhost
```

Re-run only the builder after content edits: `docker compose run --rm builder`.
Stop everything: `docker compose down`.

### With native Node (for hot reload while editing)

```bash
npm ci
npm run dev                       # → http://localhost:4321 (hot reload)
```

## Adding content

- **New writeup**: see [docs/adding-a-writeup.md](./docs/adding-a-writeup.md)
- **New project**: see [docs/adding-a-project.md](./docs/adding-a-project.md)
- **Update resume**: see [docs/updating-resume.md](./docs/updating-resume.md)
- **Change bio / skills / contact info**: see [docs/updating-profile.md](./docs/updating-profile.md)

Full maintainer's handbook in [docs/](./docs/).

## Deploy

Push to `main`. GitHub Actions builds, generates the resume PDF, and publishes.

```bash
git push origin main
```

See [docs/deployment.md](./docs/deployment.md) for details.

## License

Content (writeups, resume text, images) © Himangshu Pan. All rights reserved.
Code (theme, components, build scripts) is MIT-licensed — feel free to adapt for your own portfolio.

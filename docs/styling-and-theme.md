# Styling & Theme

Colors, fonts, and shared styles live in **`src/styles/globals.css`**. That one file controls the whole site's look.

## Color palette

Defined in the `@theme` block at the top — these become Tailwind utility classes automatically (e.g. `bg-bg-card`, `text-accent`).

```css
@theme {
  --color-bg:           #0a0e14;   /* page background */
  --color-bg-elev:      #11161e;   /* sticky nav / footer */
  --color-bg-card:      #161c26;   /* cards, code blocks */
  --color-border:       #1f2733;
  --color-border-strong:#2a3445;
  --color-muted:        #6b7785;   /* secondary text, dates */
  --color-text:         #c5cdd9;   /* body */
  --color-text-strong:  #e6edf3;   /* headings */
  --color-accent:       #73d0ff;   /* primary action — defensive blue */
  --color-accent-strong:#4dbfff;
  --color-teal:         #7fd1b9;   /* secondary highlights */
  --color-warn:         #f0c674;
  --color-ioc:          #f07178;   /* IoC red, used sparingly */
}
```

Swap any of these to retheme. The teal/blue duo is the **blue-team** identity — keep both if you change one; together they read defensive, not aggressive.

## Fonts

Two faces, both self-hosted via `@fontsource/*`:

- **JetBrains Mono** — code, prompts, nav, headings
- **Inter** — long-form body text

To change, update the `@import` lines at the top of `globals.css` and the two `--font-*` tokens.

## Responsive breakpoints

Tailwind defaults — set by the `@tailwindcss/vite` plugin, not overridden:

| Prefix | Width |
|---|---|
| (none) | 0–639px (mobile-first base) |
| `sm:` | ≥ 640px |
| `md:` | ≥ 768px |
| `lg:` | ≥ 1024px |
| `xl:` | ≥ 1280px |

If you need a custom breakpoint, configure it in `globals.css` via `@theme { --breakpoint-2xl: 1536px; }`.

## Prose styling for markdown

The `.prose-blue` class (in `globals.css`) styles every markdown post: headings, code blocks, tables, blockquotes, images, links. To change how *all* writeups and projects look, edit that block.

Sections inside `.prose-blue`:

- Headings — `font-mono`, colored, with bottom borders on `h2`
- Code (`<code>`) — teal, boxed
- `<pre>` — dark card background, scroll-on-overflow
- Tables — striped header, scrollable on small screens
- Images — rounded, bordered, centered

## Adding a custom utility

Tailwind v4 supports inline `@theme` extensions. To add a new color:

```css
@theme {
  --color-purple-haze: #b48ead;
}
```

Now `bg-purple-haze`, `text-purple-haze`, `border-purple-haze` all work.

## Visual identity guardrails

- Keep accent on **blue/teal** — it signals defensive. Pure neon green reads red-team.
- Headings stay monospace. Body text stays sans. Don't mix.
- Status indicators use the `.status-dot` class — there's already a pulse animation defined.
- Decorative SIEM grid: `.bg-grid` (faint blue lines, used on hero sections).

## Where the home-page hero gradient is

`src/pages/index.astro`, look for `bg-gradient-to-br from-[var(--color-accent)]/20 ... blur-2xl`. That's the soft glow around the AI image.

# Updating Bio / Skills / Certs / Contact

All "about me" data lives in **one file**: `src/data/profile.ts`. Editing it updates:

- The home-page hero, about block, skills grid, and certifications grid
- The contact page (email, WhatsApp, LinkedIn, GitHub)
- The footer's social links
- All `<meta>` author tags

## The fields

```ts
export const profile = {
  name: "Himangshu Pan",
  handle: "sheru-pan",
  role: "SOC Analyst",
  tagline: "Blue-team research · Detection · Incident response",
  location: "India",

  bio: [ /* array of paragraphs — supports **bold** markdown */ ],

  contact: {
    email: "researchersheru@gmail.com",
    whatsapp: {
      display: "+91 9332943989",
      url: "https://wa.me/919332943989?text=...",
    },
    linkedin: "https://www.linkedin.com/in/sheru-pan/",
    github: "https://github.com/sheru-pan",
  },

  skills: [
    { group: "SIEM & Log Analysis", items: ["Splunk", "ELK", ...] },
    /* ...more groups */
  ],

  certifications: [
    { name: "CEH", issuer: "EC-Council", year: 2018, url: "" },
    /* add new certs as earned */
  ],

  navLinks: [ /* nav bar entries — usually no need to touch */ ],
} as const;
```

## Adding a new skill group

Append a new object to the `skills` array:

```ts
{
  group: "Cloud Security",
  items: ["AWS GuardDuty", "Azure Sentinel", "CloudTrail", "IAM analysis"],
},
```

The home page automatically renders it in the next slot of the grid.

## Adding a new certification

Append to the `certifications` array:

```ts
{ name: "Blue Team Level 1 (BTL1)", issuer: "Security Blue Team", year: 2026, url: "https://credentials.securityblue.team/..." },
```

If `url` is non-empty the card becomes a link to the verifier; if empty the card is plain.

## Changing your WhatsApp number

Edit `profile.contact.whatsapp`. The `display` field is what's shown on the page. The `url` is the actual link — must be `https://wa.me/<country-code><number>` with **no `+`, no spaces, no dashes** in the number. Optionally append `?text=<urlencoded message>` to pre-fill a greeting.

Example for `+44 7700 900000` (UK):

```ts
whatsapp: {
  display: "+44 7700 900000",
  url: "https://wa.me/447700900000",
},
```

## Changing the bio

`bio` is an array of paragraph strings. Each string is one `<p>`. You can use `**bold**` inside — the home page expands it to `<strong>`. No other markdown is processed here; for richer formatting, move it into a markdown file instead.

## After editing

Just save. `npm run dev` hot-reloads. No build needed to preview.

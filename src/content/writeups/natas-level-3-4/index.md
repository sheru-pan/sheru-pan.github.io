---
title: "OverTheWire Natas Level 3 → 4: robots.txt and Hidden Directories"
description: "Natas Level 3 uses robots.txt to hide a secret directory from search engines — which is exactly how you find it. A lesson in security through obscurity and web server enumeration."
date: 2026-06-05
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, robots-txt, hidden-directories, enumeration]
series: "OverTheWire Natas"
order: 3
seriesLabel: "Level 3 → 4"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 3 is a neat puzzle built around a fundamental misunderstanding about `robots.txt`. The HTML comment in this level boasts "not even Google will find it this time" — which is a dead giveaway. The only way to hide something from Google's crawler is to put it in `robots.txt`. And `robots.txt` is a public file that every web security professional checks as a matter of routine. By listing a path in `robots.txt` you are telling search engine crawlers "please ignore this" — but you are simultaneously publishing the path for anyone who bothers to look. It is security through obscurity at its most self-defeating.

## Official Challenge Objective

> **There is nothing on this page** *(but the HTML comment hints that something is hidden from search engines).*

## Skills Covered

- Web server enumeration starting points: `robots.txt`
- Understanding what `robots.txt` does and does not protect
- Following directory paths found in robots.txt
- Recognising security through obscurity as a failed strategy

## My Approach

The HTML comment is the entire solve hint: "Not even Google will find it this time." I read that and went straight to `/robots.txt` — it is the canonical mechanism for controlling what crawlers index. The file listed a disallowed path, I hit that path, directory listing was enabled again (same as Level 2), and there was another `users.txt` waiting for me.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas3:3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH@natas3.natas.labs.overthewire.org/
```

### Explanation

The page body says "There is nothing on this page." but the HTML source has a comment worth reading:

```html
<html>
<head>
<link rel="stylesheet" type="text/css" href="http://natas.labs.overthewire.org/css/level.css">
</head>
<body>
<h1>natas3</h1>
<div id="content">
There is nothing on this page
<!-- No more information leaks!! Not even Google will find it this time... -->
</div>
</body>
</html>
```

"Not even Google" → `robots.txt`. That is the immediate inference. Google's crawler (Googlebot) respects the Robots Exclusion Protocol, which is defined by the `robots.txt` file at the root of a web server. If you want to hide a path from Google, you put it in `robots.txt`. If you want to *find* what is being hidden, you read `robots.txt`.

### Why It Matters

HTML comments give away the developer's thinking. "Not even Google will find it" is a comment that reveals both the mechanism (robots.txt) and the false sense of security ("will find it" implies nobody else can either). In real assessments, reading comments for intent — not just for data — is a useful analyst habit.

---

### Command

```bash
curl http://natas3:3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH@natas3.natas.labs.overthewire.org/robots.txt
```

### Explanation

`robots.txt` is a plain text file at the web root that communicates with automated crawlers. The file for this level:

```
User-agent: *
Disallow: /s3cr3t/
```

This tells every crawler (`*` is a wildcard for all user-agents) to not index anything under `/s3cr3t/`. The path is now known.

### Why It Matters

`robots.txt` is publicly accessible to everyone — not just search engine crawlers. The Robots Exclusion Protocol is a convention, not a security control. A malicious bot, an attacker, a pentester, or anyone else can read `robots.txt` and get a hand-curated list of paths the site owner does not want publicised. In real assessments, `robots.txt` is checked immediately because it often lists admin panels, backup directories, internal APIs, and staging environments.

---

### Command

```bash
curl http://natas3:3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH@natas3.natas.labs.overthewire.org/s3cr3t/
```

### Explanation

Visiting the disallowed path reveals — again — a directory with listing enabled:

```html
<title>Index of /s3cr3t</title>
...
<tr><td><a href="users.txt">users.txt</a></td>...</tr>
```

Same structure as Level 2: a directory, listing enabled, a `users.txt` inside.

### Why It Matters

The combination here is worse than Level 2. In Level 2, you had to find the directory by noticing an image path. In Level 3, the directory is actively listed in `robots.txt` as something the developer specifically wanted hidden — yet it is still publicly accessible because no server-side access control was applied to it. Listing it in `robots.txt` just made it easier to find.

---

### Command

```bash
curl http://natas3:3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH@natas3.natas.labs.overthewire.org/s3cr3t/users.txt
```

### Explanation

The file contents:

```
natas4:QryZXc2e0zahULdHrtHxzyYkj59kUxLQ
```

One entry. The natas4 password is `QryZXc2e0zahULdHrtHxzyYkj59kUxLQ`.

### Why It Matters

Again a plaintext credential file, again web-accessible. No authentication required beyond the level's own Basic Auth (which the attacker has already bypassed by being on this level). The file's location in a "secret" directory and its robots.txt exclusion provided zero additional protection.

## Deep Dive: Cyber Security Concept

**Security through obscurity — why hiding a thing is not the same as protecting a thing.**

Security through obscurity is the practice of relying on secrecy of design or implementation as the main security mechanism. The classic example: "nobody will find this admin panel at `/xD3gT9/admin`." The counter: any path scanner with a wordlist will enumerate it, and if it is in `robots.txt` it is already published.

In cryptography there is a principle called Kerckhoffs's principle: a system should be secure even if everything about the system, except the key, is public knowledge. The corollary for web security: a path should be protected even if the path itself is known. Access control (authentication, authorisation) is the actual protection. The path's secrecy is a supplement, not a substitute.

The robots.txt approach fails on two counts:
1. `robots.txt` is public — it tells attackers exactly what to look for.
2. Even if the path were not listed in `robots.txt`, a directory scanner would find it anyway.

> [!IMPORTANT]
> Hiding a resource's URL does not protect it. If a resource should not be publicly accessible, apply authentication and authorisation controls on the server. "Nobody knows the URL" is not access control.

## Offensive Security Perspective

`robots.txt` is one of the first files every web pentester and bug bounty hunter checks on a new target. Automated tools like `whatweb`, `nikto`, and `gobuster` all check it by default. In real engagements I have found staging environments, admin panels, internal APIs, and backup directories listed in `robots.txt` — put there by developers trying to keep them out of Google's index, not realising they were publishing a map of their sensitive assets.

The broader reconnaissance pattern: `robots.txt` → `sitemap.xml` → JavaScript files (which often contain hardcoded API endpoint paths) → error pages (which sometimes reveal server paths). Every piece of metadata the server offers is a recon opportunity.

## Common Beginner Mistakes

- Not immediately connecting "not even Google" to `robots.txt` — this is a skill you build through experience.
- Assuming `Disallow` in robots.txt means inaccessible — it means "do not crawl," not "cannot access."
- Treating the `robots.txt` content as a dead end rather than a lead to follow.
- Not trying directory listing on the discovered path after accessing it.

## Key Takeaways

- `robots.txt` is a public file. Anything listed as `Disallow` is a tip-off to attackers, not a protection.
- "Not visible to search engines" and "inaccessible to attackers" are completely different things.
- Always check `/robots.txt` and `/sitemap.xml` as part of web recon — they often contain paths the site owner wants to keep low-profile.
- Access control must be applied at the server level; obscurity of the URL provides no meaningful protection.
- The pattern repeats from Level 2: directory listing + sensitive file = data exposure.

## How This Helps Build Cyber Security Expertise

- **Web recon methodology:** `robots.txt` is a standard target in the reconnaissance phase of any web assessment; this level teaches why.
- **Security through obscurity recognition:** identifying when a developer has relied on "nobody will find this" instead of real access control is a critical analyst skill.
- **OWASP alignment:** this is a Security Misconfiguration finding (A05:2021) compounded by information exposure via `robots.txt`.
- **Bug bounty:** checking `robots.txt` on any new target is a reflex every bug bounty hunter develops early — it sometimes surfaces critical internal paths immediately.

## Additional Reading

- [Google — robots.txt specification](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [OWASP — Test robots.txt for Sensitive Information](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/01-Conduct_Search_Engine_Discovery_Reconnaissance_for_Information_Leakage)
- [CWE-693 — Protection Mechanism Failure](https://cwe.mitre.org/data/definitions/693.html)
- [Kerckhoffs's Principle — Wikipedia](https://en.wikipedia.org/wiki/Kerckhoffs%27s_principle)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

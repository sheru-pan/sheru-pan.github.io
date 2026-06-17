---
title: "OverTheWire Natas Level 0 → 1: Information Disclosure via HTML Comment"
description: "The very first Natas level hides its password in an HTML comment. A one-command curl solve that teaches why page source inspection is step one of every web assessment."
date: 2026-06-02
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, information-disclosure, html-comments, curl, basic-auth]
series: "OverTheWire Natas"
order: 0
seriesLabel: "Level 0 → 1"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 0 is Natas saying hello. The page tells you the password is somewhere on it. That sounds trivially obvious — and it is — but only if you know to look at the *source*, not the rendered page. The password is sitting in an HTML comment, invisible to the naked eye in a browser but immediately visible in the source or in a curl response. It is a one-command solve, and that is exactly the point: before you learn anything fancy, you need to learn to read HTML source as your default first move on any web target.

## Official Challenge Objective

> **You can find the password for the next level on this page.**

## Skills Covered

- HTTP Basic Authentication with embedded URL credentials
- Fetching raw HTTP responses with `curl`
- Reading HTML source to find hidden content
- Recognizing HTML comments as an information disclosure vector

## My Approach

I loaded the level with curl rather than a browser, because curl gives me the raw HTML immediately without any rendering. One look at the output and the comment is right there. I did not need DevTools, I did not need a proxy — just curl and a basic understanding that HTML comments are part of the server response even though browsers hide them from the rendered view.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas0:natas0@natas0.natas.labs.overthewire.org/
```

### Explanation

This sends a GET request to the Level 0 page using the starting credentials (both username and password are `natas0`). The full HTML response is printed to the terminal. The relevant section of the output:

```html
<html>
<head>
<!-- This stuff in the header has nothing to do with the level -->
<link rel="stylesheet" type="text/css" href="http://natas.labs.overthewire.org/css/level.css">
</head>
<body>
<h1>natas0</h1>
<div id="content">
You can find the password for the
next level on this page.

<!--The password for natas1 is 0nzCigAq7t2iALyvU9xcHlYN4MlkIwlq -->
</div>
</body>
</html>
```

The password for natas1 — `0nzCigAq7t2iALyvU9xcHlYN4MlkIwlq` — is in the HTML comment.

### Why It Matters

HTML comments (`<!-- ... -->`) are stripped by the browser renderer but are transmitted in full by the server. They are part of the HTTP response body. Developers use them during development to leave notes and debug hints, and they frequently forget to remove them before deploying to production. On a real web application you might find database table names, internal IP addresses, API endpoint names, or even credentials in comments exactly like this.

---

### Command

```bash
# Alternatively with verbose output to see headers too
curl -v http://natas0:natas0@natas0.natas.labs.overthewire.org/
```

### Explanation

Adding `-v` shows the full request and response headers alongside the body. This is good practice even when you do not need the headers for a particular level, because it builds the habit of inspecting both. The Authorization header curl sends looks like this:

```
> Authorization: Basic bmF0YXMwOm5hdGFzMA==
```

Decoding that Base64 string: `echo bmF0YXMwOm5hdGFzMA== | base64 -d` gives `natas0:natas0` — confirming exactly what I said in the intro post about Basic Auth being encoding, not encryption.

### Why It Matters

Inspecting both headers and body as a default habit means you never miss a `Set-Cookie`, a server version disclosure, a redirect, or a custom header that the challenge (or a real target) is using to communicate something. Levels later in this series are solved entirely by reading response headers.

## Deep Dive: Cyber Security Concept

**Information Disclosure — the vulnerability class that gives attackers their roadmap.**

Information disclosure (also called "sensitive data exposure") is when an application unintentionally reveals information that an attacker can use to plan a deeper attack or directly access sensitive data. HTML comments are one of the most common forms.

In a real penetration test, source code review — both client-side (JavaScript, HTML) and server-side (when you can get it) — is a standard part of the assessment. Tools like `curl`, browser DevTools, and web scrapers automate the collection, but the human analyst has to know what looks meaningful. A comment saying `<!-- TODO: remove hardcoded admin bypass before launch -->` is a massive finding. So is `<!-- DB host: 10.0.0.5 -->` or `<!-- v2 API at /api/v2/internal/users -->`.

> [!IMPORTANT]
> Never assume that because something is invisible in a browser it is hidden from an attacker. Everything the server sends to the client is accessible to anyone who can intercept or inspect the HTTP response — and that includes every user of the application.

## Offensive Security Perspective

HTML source inspection is the literal first step of web application reconnaissance. After spidering a target, a pentester runs the collected pages through grep patterns looking for comments, hardcoded credentials, internal hostnames, API keys, and debug output. Automated scanners do this too — but manual inspection often catches context-aware findings that scanners miss, like a comment referencing an internal system that only makes sense if you know the organization's naming conventions.

On bug bounty programs, HTML comments containing internal paths or endpoint names regularly lead to critical findings: you browse to the commented-out URL and find an unprotected admin panel or a forgotten debug route that was never disabled.

## Common Beginner Mistakes

- Looking only at the rendered browser page and thinking "there is nothing there" — the rendered view and the source are not the same thing.
- Using `Ctrl+U` in a browser to view source but not reading all of it — comments can appear anywhere in the document.
- Not running curl at all and instead clicking around the page hoping something will appear.
- Missing the comment because you skimmed past the HTML boilerplate.

## Key Takeaways

- HTML comments are transmitted in the HTTP response and are part of the attack surface, even though browsers hide them in the rendered view.
- `curl` is the fastest way to get raw HTML — no browser needed, no rendering, no JavaScript execution.
- The URL format `http://user:pass@host/` handles HTTP Basic Auth inline.
- Information disclosure vulnerabilities give attackers context they can chain into deeper attacks.
- Always read source before trying anything else — it is the cheapest and most reliable recon step.

## How This Helps Build Cyber Security Expertise

- **Web application pentesting:** source inspection is step one of every web assessment and the starting point for any manual review.
- **Bug bounty hunting:** HTML comments exposing internal paths, version numbers, or endpoint names regularly appear in disclosed critical reports.
- **Secure development:** knowing how attackers read source teaches developers to review their own output before shipping, and to use server-side rendering to strip debug artifacts.
- **Tool fluency:** building `curl` into your muscle memory here pays off in every subsequent level and on every real engagement.

## Additional Reading

- [OWASP — Information Exposure Through Comments (CWE-615)](https://cwe.mitre.org/data/definitions/615.html)
- [OWASP Testing Guide — Information Gathering from Web Page Content](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/05-Review_Web_Page_Content_for_Information_Leakage)
- [curl manpage — basic usage](https://curl.se/docs/manpage.html)
- [MDN — Comments in HTML](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started#html_comments)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

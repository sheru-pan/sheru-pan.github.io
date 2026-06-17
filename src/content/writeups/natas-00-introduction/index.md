---
title: "OverTheWire Natas — Introduction & Getting Started"
description: "The opening post of a complete, level-by-level Natas series: what the wargame is, how it differs from Bandit, how to access each level in your browser or with curl, and the web enumeration methodology that carries you through every challenge."
date: 2026-06-01
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, web-security]
series: "OverTheWire Natas"
order: -1
seriesLabel: "Intro & Setup"
draft: false
---

> The first post in a complete, level-by-level Natas series. This one sets the stage: what Natas is, why it is the best on-ramp to server-side web security, how to access each level, and the *methodology* that will carry you through all the challenges.

## Introduction

If Bandit taught you Linux and the command line, **Natas** is where you learn to break the web. It is OverTheWire's web-security wargame — a series of progressively harder challenges, each one hosted at its own URL, each one teaching a distinct server-side vulnerability class that you will encounter on real targets.

The core idea is the same as Bandit: each level holds the password for the next. But where Bandit speaks SSH and file systems, Natas speaks HTTP. You are not logging into a shell — you are loading web pages, inspecting HTML, manipulating headers, injecting into query strings, and generally doing the things a web pentester does on day one of an engagement.

I worked through the series with a terminal, curl, and browser DevTools open at all times. This blog series turns those session notes into a proper walkthrough: every vulnerability explained from first principles, mapped to the OWASP Top 10, and connected to real-world offensive techniques.

## What Makes Natas Different from Bandit

Bandit is a Linux wargame. You SSH into a box and poke around the file system. Natas is a **web** wargame. There is no SSH. Each level is a small web application running at a dedicated subdomain, protected by HTTP Basic Authentication. Your interaction is entirely over HTTP — GET requests, POST requests, cookies, and headers.

That shift has consequences for your toolset:

- **Browser DevTools** replace `ls` and `cat` — you view source, inspect the network tab, and read response headers.
- **curl** replaces SSH — it sends arbitrary HTTP requests with whatever credentials, headers, cookies, and body data you specify.
- **w3m** (a terminal browser) is sometimes handy for pulling pages when you want the HTML without JavaScript interference.
- **Proxy tools** like OWASP ZAP or Burp Suite let you intercept, inspect, and replay requests in a GUI.

The vulnerability classes are also fundamentally different: information disclosure via HTML comments, directory listing, HTTP header manipulation, cookie forgery, source code exposure, local file inclusion, command injection, and encoding puzzles. This is the OWASP Top 10 in wargame form.

## Official Challenge Objective

> **Natas teaches the basics of server-side web security. Each level consists of a website at http://natasX.natas.labs.overthewire.org. Contrary to Bandit, there are no instructions. Use your knowledge to inspect the pages and find the password for the next level.**

## Skills Covered

- HTTP Basic Authentication
- Browser source inspection and DevTools usage
- `curl` for HTTP requests from the command line
- Reading and manipulating HTTP request and response headers
- Cookie inspection and modification
- PHP source code analysis
- URL encoding and parameter manipulation
- Web enumeration methodology: robots.txt, directory listing, hidden paths

## My Approach

My methodology for every Natas level follows the same loop a real web pentester uses: **enumerate, then exploit.** Before trying anything clever, I check the obvious places — the page source, the response headers, the URL structure, `robots.txt`, and any linked files. More often than not, the answer is already visible if you know where to look. This series documents exactly what I looked at, what I found, and why it matters beyond just "winning the level."

## Step-by-Step Walkthrough

### Command

```
http://natas0:natas0@natas0.natas.labs.overthewire.org/
```

### Explanation

This is the URL format for every Natas level. Breaking it down:

- `natas0` (first field) — the username for HTTP Basic Auth
- `natas0` (second field, after the colon) — the password
- `natas0.natas.labs.overthewire.org` — the per-level subdomain

Every level follows the same pattern: `natasX:PASSWORD@natasX.natas.labs.overthewire.org/`. Most browsers accept credentials embedded in the URL like this. You can also load the URL without the credentials and enter them in the Basic Auth dialog the browser pops up.

### Why It Matters

HTTP Basic Authentication transmits credentials as a Base64-encoded `Authorization` header. It is **not** encryption — it is trivially reversible encoding. On a real site you must use HTTPS (TLS) to protect Basic Auth credentials in transit, because anyone who can see your packets can decode them in seconds.

---

### Command

```bash
curl http://natas0:natas0@natas0.natas.labs.overthewire.org/
```

### Explanation

`curl` is the workhorse of this entire series. The `user:password@host` syntax tells curl to send an HTTP Basic Auth header automatically. The response is the raw HTML of the page, printed to your terminal — exactly what a browser would receive before rendering it.

For later levels where you already have the password from a previous level, the pattern becomes:

```bash
curl http://natasX:PREVIOUS_PASSWORD@natasX.natas.labs.overthewire.org/
```

### Why It Matters

curl lets you craft HTTP requests that a browser would never send on its own. You can add arbitrary headers, send custom cookies, manipulate the request body, and bypass every client-side restriction a browser might impose. This makes it the single most powerful tool in your Natas kit.

---

### Command

```bash
curl -v http://natas0:natas0@natas0.natas.labs.overthewire.org/
```

### Explanation

The `-v` flag (verbose) is essential. It dumps the full HTTP conversation: the request line, every request header curl sent (including `Authorization`), the response status code, and every response header the server sent back. Example output:

```
* Connected to natas0.natas.labs.overthewire.org
> GET / HTTP/1.1
> Host: natas0.natas.labs.overthewire.org
> Authorization: Basic bmF0YXMwOm5hdGFzMA==
>
< HTTP/1.1 200 OK
< Content-Type: text/html; charset=UTF-8
< Set-Cookie: loggedin=0
```

### Why It Matters

Response headers are a gold mine. Cookies, server version banners, custom headers, redirects — all of it shows up in `-v` output and would be invisible if you only looked at the page body. Many Natas levels are solved purely by reading the headers.

---

### Command

```bash
curl http://natasX:PASSWORD@natasX.natas.labs.overthewire.org/
# or equivalently:
curl -u natasX:PASSWORD http://natasX.natas.labs.overthewire.org/
```

### Explanation

`-u user:pass` is an alternate syntax for Basic Auth in curl. Both forms send the same `Authorization` header. The `user:pass@host` form is more convenient for copy-paste; `-u` is cleaner in scripts where the password might contain special characters.

### Why It Matters

Knowing both forms matters when passwords contain `@`, `/`, or other URL-special characters that break the inline syntax. This comes up in real engagements when credentials are generated rather than human-chosen.

## Deep Dive: Cyber Security Concept

**HTTP Basic Authentication and why it is not access control by itself.**

HTTP Basic Auth is a standard mechanism defined in RFC 7617. When a browser or curl sends a Basic Auth request, it Base64-encodes the string `username:password` and adds it to the `Authorization` request header. The server decodes it and checks it against a credential store. That is the entire mechanism.

The critical point is that Base64 is **encoding**, not **encryption**. Anyone who can intercept the request can decode the header in one command:

```bash
echo bmF0YXMwOm5hdGFzMA== | base64 -d
# natas0:natas0
```

This means Basic Auth over plain HTTP (no TLS) sends your password in what is effectively cleartext. Over HTTPS, the TLS layer encrypts the entire request including headers, so interception does not help an attacker — but the server-side credential store is still a target.

> [!IMPORTANT]
> HTTP Basic Authentication provides identity verification only. It does not provide confidentiality (credentials travel in reversible Base64), it does not protect against replay attacks, and it has no session management. Always pair it with HTTPS on real applications.

## Offensive Security Perspective

From an offensive standpoint, HTTP Basic Auth challenges are interesting for a few reasons. First, many embedded devices (routers, printers, IP cameras) use Basic Auth and ship with well-known default credentials — the OverTheWire/Natas pattern of `natas0:natas0` mirrors exactly the `admin:admin` or `admin:password` defaults that get entire botnets compromised. Second, Basic Auth credentials can sometimes be found in logs, browser history, and `~/.netrc` files because they are part of the URL. Third, if an application relies on Basic Auth for "security" on top of insecure logic (trusting client-sent cookies, not filtering file paths), the Basic Auth layer gives false confidence.

## Common Beginner Mistakes

- Trying to SSH into Natas — there is no SSH. Everything is HTTP.
- Not viewing page source — the browser's rendered view hides HTML comments, which are a major hint source in the early levels.
- Ignoring response headers — `curl -v` is non-negotiable.
- Forgetting to URL-encode special characters in passwords or payloads when building curl commands.
- Stopping at the page body — always check `/robots.txt`, linked files, and directory paths.

## Key Takeaways

- Natas is a web-only wargame; all interaction happens over HTTP Basic Auth.
- The URL format is `http://natasX:PASSWORD@natasX.natas.labs.overthewire.org/`.
- `curl` is your primary tool; add `-v` to see headers.
- Passwords for completed levels are stored server-side in `/etc/natas_webpass/natasX`.
- The methodology is enumerate first: source, headers, robots.txt, linked files, hidden params.

## How This Helps Build Cyber Security Expertise

- **Web application pentesting:** every technique in Natas maps directly to a real vulnerability class you will encounter on bug bounties and professional assessments.
- **OWASP Top 10 familiarity:** the series is practically a hands-on tour of the most critical web security risks.
- **HTTP fluency:** understanding the request/response cycle at the raw header level is the foundation of all web offensive work.
- **Tool proficiency:** `curl` is used by every penetration tester; mastering it here pays dividends on every future engagement.

## Additional Reading

- [OverTheWire Natas — official wargame](https://overthewire.org/wargames/natas/)
- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [curl documentation](https://curl.se/docs/manpage.html)
- [HTTP Basic Authentication — RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617)
- [OWASP Testing Guide — Authentication Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

---
title: "OverTheWire Natas Level 4 → 5: HTTP Referer Header Manipulation"
description: "Natas Level 4 grants access only to visitors coming from natas5's site. The Referer header is client-controlled — so we just set it to whatever we want."
date: 2026-06-06
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, http-headers, referer-header, header-manipulation]
series: "OverTheWire Natas"
order: 4
seriesLabel: "Level 4 → 5"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 4 introduces HTTP header manipulation. The application checks the `Referer` header to decide whether you are an "authorised" visitor — it only wants to serve users who just came from `http://natas5.natas.labs.overthewire.org/`. The logic, presumably, is that only someone logged into natas5 would have that page in their browser history. The critical flaw: the `Referer` header is sent by the client. We are the client. We can set it to anything we want. curl makes this a two-second solve.

## Official Challenge Objective

> **Access disallowed. You are visiting from "" while authorized users should come only from "http://natas5.natas.labs.overthewire.org/".**

## Skills Covered

- Understanding the HTTP `Referer` header and what it communicates
- Setting custom HTTP headers with curl (`--referer` / `-e` flags)
- Recognising that any client-controlled header cannot be trusted for access control
- Header-based access control as a broken authentication pattern

## My Approach

The error message on the page is the complete specification for the attack. It tells me exactly what value the `Referer` header needs to be. I passed that value to curl with `--referer` and the application opened right up. The concept is more interesting than the technique here — understanding *why* this is exploitable matters for recognising the same pattern on real targets where it is less obvious.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas4:QryZXc2e0zahULdHrtHxzyYkj59kUxLQ@natas4.natas.labs.overthewire.org/
```

### Explanation

The default curl request does not send a `Referer` header (empty string), so the server rejects us:

```
Access disallowed. You are visiting from "" while authorized users should come only from
"http://natas5.natas.labs.overthewire.org/"
```

The application is checking `$_SERVER['HTTP_REFERER']` in PHP (or the equivalent in whatever backend handles the logic) and comparing it to the expected value. Because we did not send a Referer, the check fails. The application helpfully tells us exactly what value it expects.

### Why It Matters

The error message is overly informative — a security mistake in itself. In a real application, the error should say "access denied" without specifying the expected input. Here it hands us the attack payload: "the Referer header must be `http://natas5.natas.labs.overthewire.org/`."

---

### Command

```bash
curl --referer http://natas5.natas.labs.overthewire.org/ \
     http://natas4:QryZXc2e0zahULdHrtHxzyYkj59kUxLQ@natas4.natas.labs.overthewire.org/
```

### Explanation

The `--referer` flag (long form) sets the `Referer` request header. curl sends:

```
Referer: http://natas5.natas.labs.overthewire.org/
```

And the server, seeing the expected value, grants access:

```
Access granted. The password for natas5 is 0n35PkggAPm2zbEpOU802c0x0Msn1ToK
```

The natas5 password is `0n35PkggAPm2zbEpOU802c0x0Msn1ToK`.

### Why It Matters

The `Referer` header is sent by the browser to tell the server which page the user came from. It is entirely up to the browser (or client) to set it. A browser follows the real navigation path, so in normal browsing the Referer reflects reality. But there is nothing enforcing that — any HTTP client can set the Referer to any value. Access control based solely on the Referer header is completely bypassable.

---

### Command

```bash
# Shorthand: -e is the same as --referer
curl -e http://natas5.natas.labs.overthewire.org/ \
     http://natas4:QryZXc2e0zahULdHrtHxzyYkj59kUxLQ@natas4.natas.labs.overthewire.org/
```

### Explanation

`-e` is the abbreviated form of `--referer`. Both produce the same request. The `-e` form is quicker to type in an interactive session.

### Why It Matters

Knowing both forms matters because `--referer` is self-documenting (clear what it does in a script), while `-e` is faster in an interactive terminal. In a real engagement you might use `-H "Referer: ..."` if you want to be explicit about header injection rather than using the curl shortcut:

```bash
curl -H "Referer: http://natas5.natas.labs.overthewire.org/" \
     http://natas4:QryZXc2e0zahULdHrtHxzyYkj59kUxLQ@natas4.natas.labs.overthewire.org/
```

All three approaches produce identical requests.

## Deep Dive: Cyber Security Concept

**HTTP headers are client-controlled — the Referer is not a trust boundary.**

HTTP defines a set of standard request headers that the client (browser, curl, Burp, etc.) includes with each request. These headers provide contextual information: what Content-Type the body is, what the client's preferred language is, where the user came from (`Referer`), what software the client is (`User-Agent`). They are all sent by the client. The server receives them and can read them, but it cannot verify that they are truthful. Any of them can be set to any value by any HTTP client.

The `Referer` header specifically is supposed to indicate the URL of the page that linked to the current resource. Browsers send it automatically when you click a link or submit a form. It is used legitimately for analytics (knowing which pages drive traffic) and for CSRF protection in some older schemes. But as an access control mechanism, it fails because:

1. Any client can forge it.
2. Some browsers and privacy extensions strip it.
3. It is not included in requests typed directly into the address bar.

Using Referer as the primary access control check is broken authentication — OWASP A07:2021.

> [!IMPORTANT]
> Never use client-controlled HTTP headers (`Referer`, `X-Forwarded-For`, `User-Agent`, custom headers) as the basis for access control decisions. An attacker controls every header in their request. Real access control uses server-side session tokens or cryptographic proofs that the client cannot forge.

## Offensive Security Perspective

Header manipulation is a common and productive technique in web pentesting. Beyond Referer, the classic targets are:

- **`X-Forwarded-For`:** applications that restrict access to certain IP ranges sometimes trust this header to determine the client's real IP — but it is also client-controlled, so you can claim to be `127.0.0.1` (localhost) or any internal IP to bypass IP-based access restrictions.
- **`X-Original-URL` / `X-Rewrite-URL`:** some reverse proxies pass these headers to backend applications, and if the backend uses them for routing, an attacker can access different paths than the proxy would normally allow.
- **`Host`:** host header injection can break virtual hosting, password reset flows, and cache poisoning scenarios.

In any engagement, testing custom header values against any endpoint that behaves differently based on the requester's identity is standard practice.

## Common Beginner Mistakes

- Not recognising the Referer header as the mechanism from reading the error message.
- Trying to forge the Referer by manipulating the browser (opening the natas5 page first and then navigating to natas4) — this might work incidentally, but curl is the intentional tool.
- Confusing `Referer` (the HTTP header, which has always had a typo — the correct English word is "referrer" with two r's) with something else.
- Thinking you need to actually have access to the natas5 page to forge the header.

## Key Takeaways

- The `Referer` HTTP header tells the server where the user "came from," but it is completely controlled by the client.
- curl's `--referer` flag (or `-e` shorthand, or `-H "Referer: ..."`) lets you set any Referer value you want.
- Access control based solely on the Referer header is broken because it can be trivially forged.
- The error message on this level is also a finding: it discloses the expected input value, which makes exploitation easier.
- All HTTP request headers are client-controlled and untrusted; real access control must use server-side session validation.

## How This Helps Build Cyber Security Expertise

- **Broken access control:** Referer-based access control is a textbook example of OWASP A01:2021 (Broken Access Control), appearing in real applications that have not been properly reviewed.
- **X-Forwarded-For bypass:** the same logic — client-controlled header — applies to IP-restriction bypasses with `X-Forwarded-For`, a more common real-world finding.
- **HTTP fluency:** understanding what each request header does and who controls it is prerequisite knowledge for web security work.
- **Burp Suite workflow:** manipulating headers in Burp's Repeater tab is how pentesters test header-based access controls on real targets.

## Additional Reading

- [MDN — HTTP Referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
- [OWASP — Testing for Bypassing Authorization Schema](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/02-Testing_for_Bypassing_Authorization_Schema)
- [PortSwigger — HTTP Host header attacks](https://portswigger.net/web-security/host-header)
- [CWE-807 — Reliance on Untrusted Inputs in a Security Decision](https://cwe.mitre.org/data/definitions/807.html)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

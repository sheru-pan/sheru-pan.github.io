---
title: "OverTheWire Natas Level 1 → 2: Bypassing Client-Side Restrictions with curl"
description: "Natas Level 1 blocks right-clicking to prevent source inspection. curl doesn't care — it bypasses every client-side restriction because it talks directly to the server."
date: 2026-06-03
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, information-disclosure, html-comments, curl, client-side-bypass]
series: "OverTheWire Natas"
order: 1
seriesLabel: "Level 1 → 2"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 1 introduces one of the most important mental models in web security: the distinction between **client-side** and **server-side** security controls. The page has disabled right-clicking with a JavaScript `oncontextmenu` handler, presumably to prevent you from choosing "View Page Source" from the context menu. It is a paper-thin defence — and curl walks straight through it, because curl is not a browser. It does not execute JavaScript. It does not render pages. It just sends an HTTP request and shows you exactly what the server returned. The password is in the same place as Level 0: an HTML comment. The only difference is that the level is testing whether you understand *why* client-side restrictions are meaningless against a determined attacker.

## Official Challenge Objective

> **You can find the password for the next level on this page, but right clicking has been blocked!**

## Skills Covered

- Understanding the client-server distinction in web security
- Bypassing JavaScript-based restrictions with curl
- Reinforcing HTML comment enumeration from Level 0
- Recognising the difference between "the browser can't do it" and "an attacker can't do it"

## My Approach

I ran the exact same curl command as Level 0, substituting the Level 1 URL and the password I just found. There was nothing to figure out here in terms of technique — the lesson is conceptual. Once I saw the right-click block in the page source (the `oncontextmenu` attribute), I spent a moment reading it to confirm the mechanism, and then just read the comment directly from the curl output. Understanding *why* the block is useless matters more than the solve itself.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas1:0nzCigAq7t2iALyvU9xcHlYN4MlkIwlq@natas1.natas.labs.overthewire.org/
```

### Explanation

Same pattern as Level 0 — embed credentials in the URL, hit the endpoint, read the HTML. The raw output shows both the restriction mechanism and the password:

```html
<html>
<head>
<!-- This stuff in the header has nothing to do with the level -->
<link rel="stylesheet" type="text/css" href="http://natas.labs.overthewire.org/css/level.css">
</head>
<body oncontextmenu="javascript:alert('right clicking has been blocked!');return false;">
<h1>natas1</h1>
<div id="content">
You can find the password for the
next level on this page, but rightclicking has been blocked!

<!--The password for natas2 is TguMNxKo1DSa1tujBLuZJnDUlCcUAPlI -->
</div>
</body>
</html>
```

The `oncontextmenu` attribute on the `<body>` tag is what fires the alert and returns `false` (which prevents the browser's default context menu from opening). The password for natas2 is right there in the comment: `TguMNxKo1DSa1tujBLuZJnDUlCcUAPlI`.

### Why It Matters

The `oncontextmenu` handler is a JavaScript event listener. JavaScript runs in the browser. curl does not run JavaScript — it does not have a JavaScript engine. It sends an HTTP GET request and prints the response body. The server has no idea whether the client is a browser or curl, so it returns the same HTML either way, right-click block and all. The JavaScript-based restriction is a browser-level feature, and since the password is in the server's response, curl gets it without any resistance.

---

### Command

```bash
# Browser alternative: Ctrl+U opens View Source in most browsers regardless of right-click blocks
# Or navigate directly to: view-source:http://natas1:PASSWORD@natas1.natas.labs.overthewire.org/
```

### Explanation

Even in a browser, right-click restrictions are easily bypassed. `Ctrl+U` (or `Cmd+Option+U` on Mac) opens the page source directly, bypassing the context menu entirely. The `view-source:` URL scheme also works. Browser DevTools (`F12`) give you the source too. There are literally dozens of ways to read page source even with right-click blocked in the browser — and curl is just the cleanest approach from the terminal.

### Why It Matters

This demonstrates that any restriction implemented purely in the browser (client-side) can be bypassed by an attacker who controls their own client. You cannot trust the client. Access control, authentication checks, input validation, and security logic must live on the **server**.

## Deep Dive: Cyber Security Concept

**Client-side vs. server-side security — the most fundamental distinction in web security.**

When a browser loads a web page, the server sends HTML, CSS, and JavaScript to the browser. The browser then executes the JavaScript and renders the page. A client-side security control is one that lives in this JavaScript — it runs in the user's browser, on the user's machine, under the user's control. The user can modify it, disable it, or bypass it entirely by using a different client.

A server-side security control is one that runs on the web server, under the application developer's control. The attacker's browser never touches it. These are the controls that actually protect an application.

Examples of client-side "controls" that are trivially bypassed:

- Disabling right-click (as here)
- Using JavaScript to hide a "Download" button
- Validating form input only in JavaScript before submission
- Hiding a section of the page with CSS (`display: none`)
- Encoding a sensitive value in JavaScript

Any of these can be bypassed with curl, Burp Suite, browser DevTools, or even just `Ctrl+U`.

> [!IMPORTANT]
> Client-side restrictions improve user experience and catch honest mistakes — they are not security controls. Every enforcement decision that matters must happen on the server, after the request arrives, before the sensitive data is returned.

## Offensive Security Perspective

Web application penetration testers specifically look for misplaced trust in client-side logic. Common real-world findings include: JavaScript that checks whether a user is an admin before showing a button, but the API endpoint the button calls does not verify the same thing on the server; front-end input validation that enforces a maximum file size, but the server accepts any size upload; hidden form fields that set a price or a role, with no server-side check that the value is legitimate.

The curl / Burp Suite bypass mindset — "what does this look like to the server without any browser-side code running?" — is the exact mental model that finds these vulnerabilities. You are essentially asking: if I strip out all the client-side scaffolding and talk to the server directly, what can I do?

## Common Beginner Mistakes

- Trying to find a way to right-click inside the browser rather than stepping outside it entirely.
- Not understanding that the restriction is JavaScript and therefore browser-specific.
- Overlooking `Ctrl+U` as an even simpler browser bypass when you do not have a terminal handy.
- Assuming that because the developer "blocked" something in the browser, the server enforces it too.

## Key Takeaways

- `oncontextmenu` and other JavaScript event handlers are client-side — they run in the browser and have no effect on curl or any other non-browser HTTP client.
- curl talks to the server directly; it does not execute JavaScript, render CSS, or trigger event handlers.
- The password is still in an HTML comment, same as Level 0 — the "restriction" changes nothing about the server's response.
- Security controls must be enforced server-side; client-side restrictions are a UI feature, not a security boundary.
- There is always more than one way to read page source in a browser (DevTools, `Ctrl+U`, `view-source:` URL scheme) even without curl.

## How This Helps Build Cyber Security Expertise

- **Web pentesting:** distinguishing client-side from server-side logic is the foundational skill for finding broken access control, the #1 risk in OWASP Top 10 2021.
- **Source code review:** knowing where to look for misplaced trust in JavaScript validation guides manual code review on real engagements.
- **Developer security awareness:** understanding this distinction makes a developer think twice before relying on JavaScript for any security decision.
- **Burp Suite workflow:** the habit of using curl to strip client-side logic maps directly to using the Repeater and Intruder tabs in Burp to send raw requests.

## Additional Reading

- [OWASP — Client-Side Security Controls (Testing Guide)](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-Side_Testing/)
- [OWASP A01:2021 — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [MDN — oncontextmenu event](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event)
- [PortSwigger — Client-side vs server-side vulnerabilities](https://portswigger.net/web-security/learning-paths)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

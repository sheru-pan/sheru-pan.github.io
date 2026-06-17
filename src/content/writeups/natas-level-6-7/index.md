---
title: "OverTheWire Natas Level 6 → 7: Source Code Disclosure and PHP Include Files"
description: "Natas Level 6 includes a secret from a PHP file. The file is web-accessible. We read the secret directly, then POST it to get the password."
date: 2026-06-08
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, source-code-disclosure, php, include-files, post-request]
series: "OverTheWire Natas"
order: 6
seriesLabel: "Level 6 → 7"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 6 introduces a form — the first one in the series — and a "View sourcecode" link. That link is the key. The PHP source code shows that the application includes a secret from a separate file (`includes/secret.inc`) and compares it against whatever the user submits in the form. The `secret.inc` file is web-accessible, so we just fetch it directly and read the secret. Then we POST it to the form. Two curl commands, and the level is done.

The lesson is **source code disclosure**: when application code or configuration files are accessible via the web, attackers can read the server-side logic, extract hardcoded values, and construct attacks that would be impossible if the source were private.

## Official Challenge Objective

> **Input the secret and unlock the password for the next level. [View sourcecode]**

## Skills Covered

- Reading PHP source code to understand application logic
- Finding and fetching web-accessible include files
- Sending HTTP POST requests with curl using `-d`
- Understanding how PHP `include` works and what goes wrong when include files are web-accessible
- Using w3m to fetch pages that require a text browser

## My Approach

I clicked "View sourcecode" (or rather, fetched `index-source.html` via curl) first. The PHP source immediately told me two things: what file the secret comes from (`includes/secret.inc`) and what it is compared against (`$secret`). I fetched the `.inc` file directly, got the secret string, and then POSTed it to the form. One more curl call to fetch the password.

## Step-by-Step Walkthrough

### Command

```bash
# Fetch the page first to see the form structure
curl http://natas6:0RoJwHdSKWFTYR5WuiAewauSuNaBXned@natas6.natas.labs.overthewire.org/
```

### Explanation

The page has a form with an `<input>` named `secret` and a submit button, plus a link to view the source code. The action points back to `index.php` with `method="post"`. Before touching the form, I check the sourcecode link the level provides.

### Why It Matters

Always read the source code when it is offered. The level is essentially showing you a real misconfiguration: application source files exposed via the web. In a real assessment, you might find the source via a `/backup` directory, a `.php.bak` file, a git repository left in the web root, or a "View Source" debug feature that was never removed before deployment.

---

### Command

```bash
# The "View sourcecode" link points to index-source.html
curl http://natas6:0RoJwHdSKWFTYR5WuiAewauSuNaBXned@natas6.natas.labs.overthewire.org/index-source.html
```

### Explanation

The source code reveals the PHP logic:

```php
<?

include "includes/secret.inc";

    if(array_key_exists("submit", $_POST)) {
        if($secret == $_POST['secret']) {
            print "Access granted. The password for natas7 is <censored>";
        } else {
            print "Wrong secret";
        }
    }
?>
```

The application `include`s `includes/secret.inc` (which sets a `$secret` variable) and then compares `$_POST['secret']` against `$secret`. We need to know what `$secret` contains. And we can find out by fetching `includes/secret.inc` directly.

### Why It Matters

PHP `include` files typically set variables, define functions, or contain configuration. They are meant to be included by PHP scripts, not served directly to users. But if the web server serves them, their raw contents are exposed. A `.inc` file might contain database credentials, API keys, or secrets — exactly like this one.

---

### Command

```bash
curl http://natas6:0RoJwHdSKWFTYR5WuiAewauSuNaBXned@natas6.natas.labs.overthewire.org/includes/secret.inc
```

### Explanation

Fetching the include file directly returns its raw PHP content:

```php
<?
$secret = "FOEIUWGHFEEUHOFUOIU";
?>
```

The secret is `FOEIUWGHFEEUHOFUOIU`. Now we POST it to the form.

### Why It Matters

The `.inc` extension is not a protected file type in Apache by default. Unless the server is configured to either block access to `.inc` files or require PHP processing for them, they are served as plain text. This is a well-known misconfiguration. Properly configured PHP environments should ensure that all PHP include files are either outside the web root or configured to always be processed by PHP (so the raw source is never served).

---

### Command

```bash
curl -d "secret=FOEIUWGHFEEUHOFUOIU" -d "submit=submit" \
     http://natas6:0RoJwHdSKWFTYR5WuiAewauSuNaBXned@natas6.natas.labs.overthewire.org/
```

### Explanation

The `-d "key=value"` flag sends a POST body with form-encoded data. Using two `-d` flags lets us send multiple fields (equivalent to a form with two inputs). The `submit` field is required because the PHP code checks `array_key_exists("submit", $_POST)` before processing. The response:

```
Access granted. The password for natas7 is bmg8SvU1LizuWjx3y7xkNERkHxGre0GS
```

The natas7 password is `bmg8SvU1LizuWjx3y7xkNERkHxGre0GS`.

### Why It Matters

`-d` is how curl sends POST data — the equivalent of filling out and submitting a form. This is the tool for any form-based interaction in Natas (and in real-world web testing). When values need to be URL-safe you can use `--data-urlencode "key=value"` instead, which handles encoding automatically.

---

### Command

```bash
# Alternative using -u for credentials and --data-urlencode for safe encoding
curl -u natas6:0RoJwHdSKWFTYR5WuiAewauSuNaBXned \
     --data-urlencode "secret=FOEIUWGHFEEUHOFUOIU" \
     --data-urlencode "submit=submit" \
     http://natas6.natas.labs.overthewire.org/
```

### Explanation

`--data-urlencode` automatically percent-encodes the value, which is important when the data contains special characters (`&`, `=`, `+`, etc.) that would break simple `-d` parsing. For this particular secret the values are safe either way, but making `--data-urlencode` the default habit means your commands work correctly even when secrets contain special characters.

### Why It Matters

In real engagements, POST data often contains values with special characters (SQL payloads, file paths, base64 strings). Using `--data-urlencode` instead of raw `-d` avoids accidental payload corruption.

## Deep Dive: Cyber Security Concept

**Source code disclosure — when the application's own logic becomes the attack surface.**

Source code disclosure occurs when server-side code or configuration files are accessible to unauthenticated users. This is dangerous because server-side code often contains:

- Hardcoded credentials (database passwords, API keys, as we see here with `$secret`)
- Business logic that reveals how to bypass authentication or authorisation
- Internal infrastructure details (database hosts, internal service URLs)
- Cryptographic keys used for signing or encrypting data

The root cause is usually a misconfiguration: files placed inside the web root that should not be served, or file extensions not associated with PHP processing.

Common ways source code gets exposed in the wild:
- `.php.bak`, `.php~`, `.php.old` backup files created by editors
- `.git` directories left in production web roots
- PHP include files (`.inc`, `.php.inc`) with incorrect server configuration
- Debug or "view source" features left enabled in production
- Source archives (`source.zip`, `app.tar.gz`) in the web root

> [!IMPORTANT]
> Application source code, configuration files, and included PHP files must never be directly accessible via the web server. Place include files outside the document root, configure the web server to deny access to sensitive file extensions, and never commit secrets to source code.

## Offensive Security Perspective

Source code disclosure is consistently one of the highest-value early findings in a web assessment. Reading the application's own logic tells you exactly where to probe: which parameters are checked, what the valid range of values is, where SQL queries are constructed, and where credentials are hardcoded. Tools like `dirsearch` and `ffuf` test for common backup file extensions automatically. The discovery of a `.git` directory in a web root means you can often reconstruct the entire source repository with `git-dumper`.

On bug bounty platforms, source code disclosure findings with hardcoded credentials regularly rate as Critical — because the credential extracted from the source typically grants database access, payment processor access, or admin panel access directly.

## Common Beginner Mistakes

- Not reading the source code link the level provides — jumping straight to the form and guessing.
- Fetching `index-source.html` but not reading all of it carefully enough to spot the `include` statement.
- Forgetting to include the `submit` field in the POST data, causing the PHP check to short-circuit.
- Not trying to fetch `includes/secret.inc` directly — assuming include files must be server-only.

## Key Takeaways

- When an application offers "View sourcecode," read every line — include statements reveal additional files to check.
- PHP include files (`.inc`, etc.) may be web-accessible if the server is not configured to block them.
- `-d "key=value"` in curl sends POST data; use multiple `-d` flags for multiple fields.
- `--data-urlencode` handles URL encoding automatically, which matters when values contain special characters.
- Hardcoded secrets in server-side code are a critical vulnerability — but only exploitable if you can read the code.

## How This Helps Build Cyber Security Expertise

- **Source code analysis:** reading PHP (or JavaScript, Python, Java) source to understand logic and extract secrets is a core skill for web pentesting and code review.
- **Exposed file enumeration:** checking for `.bak`, `.old`, `.inc`, and other backup/include file extensions is standard web recon technique.
- **POST request crafting:** `curl -d` is used constantly in web testing; every form-based challenge and real web endpoint needs this skill.
- **Secure coding:** understanding how these disclosures happen teaches developers to keep secrets out of source code and to verify their web server file serving configuration.

## Additional Reading

- [OWASP — Review Old Backup and Unreferenced Files](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information)
- [OWASP A02:2021 — Cryptographic Failures (hardcoded secrets)](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [git-dumper — tool for dumping exposed .git directories](https://github.com/arthaud/git-dumper)
- [curl — POST data documentation](https://curl.se/docs/manpage.html#-d)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

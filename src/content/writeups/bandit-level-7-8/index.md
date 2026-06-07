---
title: "OverTheWire Bandit Level 7 → 8: Content Search with grep"
description: "The file is handed to you by name but holds thousands of lines. grep turns 'search a huge text file' into a one-liner — the same motion behind log triage and secret hunting."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, grep, log-analysis, text-processing]
---

## Introduction

So far you located files by their *attributes*. This level pivots: the file is handed to you by name, but its *contents* are enormous and the password is buried next to a single keyword. This is your introduction to `grep` — the tool that turns "search a huge text file" into a one-liner.

If `find` locates files, `grep` locates *content inside* files. It is one of the most-used commands in all of security work: triaging logs, searching code for hardcoded secrets, combing wordlists. Reaching for it reflexively is a career skill.

## Official Challenge Objective

> **The password for the next level is stored in the file `data.txt` next to the word `millionth`.**

**In plain English:** `data.txt` has a huge number of lines, each pairing a word with a random-looking string. Exactly one line begins with `millionth`; the string next to it is the password for `bandit8`. Search for that line instead of scrolling.

## Skills Covered

- Pattern searching with `grep`
- Triaging large text/log files without opening them fully
- Reading whitespace-separated columns
- Choosing "search inside a file" vs "find a file"

## My Approach

The objective is a giveaway: the password sits "next to the word `millionth`," which maps directly onto `grep` — whose job is to print the lines matching a pattern. Rather than `cat` thousands of lines and hunt visually, I let `grep` print only the relevant line; the string after the keyword is the password.

I sized up the file first (`ls -la` / `wc -l`) — clearly too big to read by eye, confirming `grep` is the right tool.

> [!TIP]
> When a challenge says the answer is "next to," "after," or "containing" a word, that is a flashing sign for `grep`. Match the keyword, read the line.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit7@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit7` on port `2220`. You land in `/home/bandit7`, which contains `data.txt`.

### Why It Matters

Standard loop — authenticate, then orient. The interesting part is what you do once in.

---

### Command

```bash
wc -l data.txt
```

### Explanation

Counts the file's lines (thousands), confirming it is far too big to read by eye.

### Why It Matters

Sizing up a file before reading it tells you whether to `cat`, `less`, or search it — and stops you from accidentally `cat`-ing a multi-gigabyte log on a production box.

---

### Command

```bash
grep millionth data.txt
```

### Explanation

`grep` scans `data.txt` line by line and prints every line containing `millionth`. One line matches:

```
millionth	[REDACTED]
```

The second column — the string separated from `millionth` by whitespace — is the password for `bandit8`.

### Why It Matters

This is the core use of `grep`: find the line(s) you care about in a large file instantly. The same motion greps an auth log for a username, a codebase for `API_KEY`, or a config dump for `password`.

## Deep Dive: Cyber Security Concept

**Content search and log triage.**

Security work consumes text at scale: web/auth/firewall logs, stack traces, source code, config dumps. The fundamental operation is always *find the lines matching what I care about*, and `grep`'s regex engine expresses far more than a literal word:

- `grep -i` — case-insensitive.
- `grep -r` — recurse a directory tree.
- `grep -n` — show line numbers.
- `grep -v` — invert: print non-matching lines.
- `grep -E 'foo|bar'` — extended regex alternation.
- `grep -c` — count matches.

Almost any investigative question over text reduces to "what lines match this pattern?": failed logins (`grep "Failed password" /var/log/auth.log`), hardcoded secrets (`grep -rni "password\|api_key" .`), suspicious user-agents (`grep sqlmap access.log`).

> [!IMPORTANT]
> `grep` searches *content*; `find` searches *file metadata*. Pairing them is one of the most powerful command-line combos: `find . -name '*.log' -exec grep pattern {} +`.

## Offensive Security Perspective

For an attacker, `grep` turns a filesystem into a short list of secrets:

```bash
grep -rniE "password|passwd|api[_-]?key|secret|token" / 2>/dev/null
grep -rni "jdbc\|mysql_connect" /var/www 2>/dev/null
grep -i pass ~/.bash_history
```

In bug bounty and code review, the first pass over a leaked archive is a `grep` for secret-shaped strings. Bandit's `data.txt` is a tame stand-in for a log or config blob where the one line you need is drowned in thousands.

## Defensive Perspective

- **Log analysis:** the front line of detection is grepping auth/web/system logs for indicators, e.g. `grep "Failed password" /var/log/auth.log | awk '{print $NF}' | sort | uniq -c`.
- **Detection content:** Sigma/SIEM rules are formalized pattern matches over log fields — `grep`, expressed declaratively and run continuously.
- **Secret scanning:** the defensive counter to grep-for-secrets is automated scanning in CI (gitleaks, trufflehog) before code ships.
- **Centralized logging:** attackers can grep and delete local logs, so ship logs off-host to a tamper-resistant SIEM.

## Common Beginner Mistakes

- `cat`-ing the whole file and hunting by eye.
- Wrong argument order — it is `grep PATTERN FILE`.
- Unquoted multi-word/special patterns — wrap them in quotes.
- Copying the keyword instead of the *second* field (the password).
- Reaching for `find` (locates files) when you need `grep` (searches contents).
- Case-sensitivity surprises — use `-i` when unsure.

## Key Takeaways

- `grep PATTERN FILE` prints every matching line.
- Use it to triage large files instead of reading them whole.
- Size up a file (`wc -l`) before deciding how to read it.
- The password is the field *next to* the keyword.
- `grep` (content) and `find` (metadata) are complementary.

## How This Helps Build Cyber Security Expertise

- **SOC / blue team:** log triage is daily detection work and the root of SIEM queries.
- **AppSec:** grepping for dangerous functions and secrets is a standard code-audit pass.
- **DFIR:** investigators grep logs and artifacts for IOCs.
- **Pentesting:** credential harvesting is a disciplined `grep` campaign across the filesystem.

## Additional Reading

- [`man grep`](https://man7.org/linux/man-pages/man1/grep.1.html)
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html)
- [gitleaks — secret scanning](https://github.com/gitleaks/gitleaks)
- [MITRE ATT&CK — T1552.001: Credentials In Files](https://attack.mitre.org/techniques/T1552/001/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

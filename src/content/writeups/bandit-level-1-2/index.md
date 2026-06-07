---
title: "OverTheWire Bandit Level 1 → 2: Dash Filenames & Argument Parsing"
description: "A file literally named '-' breaks the obvious cat command and introduces the gap between what you type and what the shell and program actually parse — the seam where argument injection lives."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, shell, argument-injection, enumeration]
---

## Introduction

On the surface this level is identical to the last one: read a file, get a password. But the file has a name that breaks the most natural command you would reach for. The filename is a single dash — `-`. The instant you type `cat -`, the shell hands `cat` an argument that *looks like* an option/stdin marker rather than a filename, and the program quietly waits for keyboard input instead of reading your file.

That tiny friction is the entire lesson: the gap between **what you mean** and **what the shell and the program actually parse**. That seam is where an enormous class of attacks lives — argument injection, option smuggling, and path-traversal tricks.

## Official Challenge Objective

> **The password for the next level is stored in a file called `-` located in the home directory.**

**In plain English:** there is a file whose entire name is a single hyphen, `-`. Most tools treat a leading `-` as the start of an *option*, and `cat -` specifically means "read from standard input." You must tell the tool, unambiguously, that `-` is a *filename*.

## Skills Covered

- Reading files with awkward/hostile names
- How the shell and `argv` parse leading-dash arguments
- Disambiguating filenames with a `./` path prefix
- The `--` end-of-options separator
- The argument/option-injection mindset

## My Approach

Same opening move: `ls` to see the home directory. There was the file, `-`. My first reflex — `cat -` — did nothing: the terminal just sat there, because `cat -` means "read from stdin." That hang is the clue. The fix is to give `cat` a path that *contains* the dash but does not *start* with it, so the parser sees a normal filename: `./-`.

## Step-by-Step Walkthrough

### Command

```bash
ls
```

### Explanation

A plain `ls` lists the home directory and shows a single entry: `-`.

### Why It Matters

Enumeration first. Before crafting a command, confirm the file exists and see its exact name — here, the exact name *is* the problem.

---

### Command

```bash
cat ./-
```

### Explanation

The trick is the argument `./-`: `.` is the current directory, `/` the separator, `-` the filename. Because the argument now *starts with* `.`, neither the shell nor `cat` mistakes it for an option, and `cat` prints the bandit2 password:

```
[REDACTED]
```

> [!TIP]
> Other reliable reads: `cat -- -` (the `--` token ends option parsing in most GNU tools), or `cat < -` (shell redirection feeds the file on stdin, bypassing argv entirely).

### Why It Matters

`./` is the go-to habit for any filename that starts with a dash or could be read as a flag. It is also why you run local scripts as `./script.sh` — the shell will not search `$PATH` for a name containing a slash.

## Deep Dive: Cyber Security Concept

**Argument parsing and the leading-dash problem.**

The shell splits your line into words and hands them to the program as `argv`. The program then decides which entries are *options* and which are *operands*. The near-universal convention (POSIX, GNU `getopt`): **a word starting with `-` is an option.** So `cat -` is not "cat the file named dash" — `cat` defines `-` as "use standard input," which is why the terminal hung.

Two robust escapes:

1. **Change the spelling, not the target:** `./-` or `/home/bandit1/-` refer to the same file without starting with `-`.
2. **Disable option parsing:** `--` tells a well-behaved program to stop looking for options.

> [!IMPORTANT]
> The shell does mechanical word-splitting and globbing; the *program* interprets the results. Bugs and exploits live in the mismatch between those two stages.

## Offensive Security Perspective

This is a baby version of **argument / option injection**. An app builds a command line from user input; the attacker supplies a value starting with a dash so it parses as an option instead of data:

- A web app runs `tar` on a user filename → an attacker names a file `--checkpoint-action=exec=sh shell.sh` and gets code execution.
- `git clone <user_url>` → a URL starting `--upload-pack=...` injects a git option that runs a command.

The mindset you practiced — "this string is parsed as a flag, not data, and I can use that" — is exactly the attacker's.

## Common Beginner Mistakes

- Running `cat -` and thinking the file is empty or the terminal froze — it waits on stdin (`Ctrl+C`/`Ctrl+D` to escape).
- Trying `cat "-"` / `cat '-'` / `cat \-` — quoting and escaping do not help; the program still sees `-` first.
- Forgetting that the `./` prefix, not the quoting, is what fixes this.

## Key Takeaways

- A leading `-` collides with option syntax; the *program*, not the shell, gets confused.
- `./filename` is the fix for any dash-prefixed or option-looking filename.
- `--` is the standard end-of-options separator and a security best practice for untrusted operands.
- Quoting does **not** solve the leading-dash problem; changing the path spelling does.
- This is the entry point to argument/option injection.

## How This Helps Build Cyber Security Expertise

- **AppSec & code review:** spotting unsafe `subprocess`/`exec` calls that concatenate user input is a daily task.
- **Exploit development:** option injection is a real primitive in CVEs against `git`, `tar`, `find` — you now understand its root cause.
- **Secure coding:** the `--` and array-`argv` habits prevent command-injection findings in audits.

## Additional Reading

- [`man cat`](https://man7.org/linux/man-pages/man1/cat.1.html), [`man bash`](https://man7.org/linux/man-pages/man1/bash.1.html)
- [POSIX Utility Argument Syntax — `--` and operands](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [OWASP — Command Injection](https://owasp.org/www-community/attacks/Command_Injection)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

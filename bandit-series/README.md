# OverTheWire Bandit — The Complete Learning Series

> A level-by-level walkthrough of OverTheWire's **Bandit** wargame, rewritten as a structured cybersecurity training course. Every article goes beyond "how to get the password" and into *why the challenge exists*, *what real-world security concept it demonstrates*, and *how that concept shows up in offensive and defensive security work*.

This is not a spoiler dump. **All level passwords are redacted** (`[REDACTED]`). The goal is to teach the methodology, not to hand you the answers — and per OverTheWire's own rules, posting passwords/spoilers is discouraged.

---

## What is OverTheWire Bandit?

[OverTheWire](https://overthewire.org/wargames/bandit/) is a collection of free, browser-and-SSH-accessible "wargames" designed to teach security concepts in a safe, legal, gamified environment. **Bandit** is the entry-level game: 33 levels (Level 0 through Level 33), each accessed over SSH, each gated by a password you must discover on the previous level.

There is nothing to install and nothing to break. You connect to a shared server, hunt for a password using Linux tools, then use that password to log in as the next user. Repeat 33 times.

```
bandit.labs.overthewire.org : 2220   (SSH)
Level 0 credentials: bandit0 / bandit0
```

## Why beginners should start with Bandit

- **Zero setup.** No VMs, no Kali, no broken dependencies. Just SSH.
- **Linux is the foundation of everything.** Servers, containers, cloud, embedded devices, and most security tooling run on Linux. Bandit forces you to live on the command line.
- **It builds the right reflexes.** Enumerate first. Read error messages. Check permissions. Read the manual. These habits transfer directly to penetration testing, incident response, and CTFs.
- **It is a confidence on-ramp.** Each level is small and self-contained, so you get a steady drip of "I solved it" moments while genuinely learning.

> [!TIP]
> Treat each level as a *concept*, not a puzzle. The password is just proof you understood the concept. If you copy a solution without understanding it, you have learned nothing — and Bandit's later levels will punish that.

## Skills learned throughout the series

| Category | Skills |
| --- | --- |
| **Linux fundamentals** | Navigation (`cd`, `ls`, `pwd`), reading files (`cat`, `more`, `file`), filtering text (`grep`, `sort`, `uniq`, `cut`, `strings`, `diff`), redirection & pipes, working with `/tmp`, file permissions |
| **Encoding & data** | Base64, ROT13, hexdumps (`xxd`), compression formats (`gzip`, `bzip2`, `tar`), `file`-based identification |
| **Remote access** | SSH passwords vs. keys, `scp` file transfer, `~/.ssh/config`, key permissions (`chmod 600`) |
| **Networking** | Ports & services, `nc`/`netcat`, `telnet`, TLS with `openssl s_client`, port scanning with `nmap`, service/version detection |
| **Privilege & access control** | SUID binaries, `setuid`, privilege boundaries, restricted shells and shell escapes |
| **Automation abuse** | Cron jobs, scheduled-task abuse, writable-directory exploitation |
| **Source control** | Git enumeration, commit history, branches, tags, stash, hooks, secrets in repos |
| **Offensive concepts** | Information disclosure, enumeration, brute forcing, credential management, privilege escalation |

## Linux fundamentals covered

By the end of the series you will be fluent in: filesystem navigation, file inspection and identification, text processing pipelines, file permissions and ownership, the `/tmp` working-directory pattern, environment variables, job control, and reading man pages to solve problems independently.

## Cybersecurity concepts covered

- Information disclosure & sensitive data exposure
- Enumeration as the core of all offensive work
- Weak file permissions & insecure access control
- Authentication mechanisms (passwords vs. keys)
- Secure communications (TLS/SSL)
- Network reconnaissance & service discovery
- Privilege escalation (SUID, cron, restricted shells)
- Credential management & secret sprawl
- Source code & git history review
- Brute forcing and rate-limiting failures

## Recommended progression after Bandit

Once Bandit feels comfortable, continue with:

1. **OverTheWire — [Natas](https://overthewire.org/wargames/natas/)** (web application security) and **[Leviathan](https://overthewire.org/wargames/leviathan/)** / **[Narnia](https://overthewire.org/wargames/narnia/)** (binary exploitation basics).
2. **[picoCTF](https://picoctf.org/)** — beginner-friendly, broad CTF categories.
3. **[TryHackMe](https://tryhackme.com/)** — guided learning paths (Pre-Security, Jr Penetration Tester, SOC Level 1).
4. **[Hack The Box](https://www.hackthebox.com/)** — less guided, more realistic boxes.
5. **Linux privilege escalation deep-dives** — [GTFOBins](https://gtfobins.github.io/), [HackTricks](https://book.hacktricks.xyz/), and tools like `linpeas`.

---

## The Series

| # | Level | Core concept |
| --- | --- | --- |
| 00 | [Introduction & Getting Started](./00-bandit-introduction.md) | SSH, game setup, methodology |
| 01 | [Level 0 → 1](./01-bandit-level-0-1.md) | Reading files, basic enumeration |
| 02 | [Level 1 → 2](./02-bandit-level-1-2.md) | Awkward filenames, path handling |
| 03 | [Level 2 → 3](./03-bandit-level-2-3.md) | Filenames with spaces |
| 04 | [Level 3 → 4](./04-bandit-level-3-4.md) | Hidden files |
| 05 | [Level 4 → 5](./05-bandit-level-4-5.md) | File type identification |
| 06 | [Level 5 → 6](./06-bandit-level-5-6.md) | File enumeration by attributes |
| 07 | [Level 6 → 7](./07-bandit-level-6-7.md) | System-wide file search by owner/size |
| 08 | [Level 7 → 8](./08-bandit-level-7-8.md) | `grep` for a known string |
| 09 | [Level 8 → 9](./09-bandit-level-8-9.md) | `sort` + `uniq` to find anomalies |
| 10 | [Level 9 → 10](./10-bandit-level-9-10.md) | `strings` on binary data |
| 11 | [Level 10 → 11](./11-bandit-level-10-11.md) | Base64 decoding |
| 12 | [Level 11 → 12](./12-bandit-level-11-12.md) | ROT13 / classical ciphers |
| 13 | [Level 12 → 13](./13-bandit-level-12-13.md) | Hexdumps & nested compression |
| 14 | [Level 13 → 14](./14-bandit-level-13-14.md) | SSH key authentication |
| 15 | [Level 14 → 15](./15-bandit-level-14-15.md) | Talking to a port with `nc` |
| 16 | [Level 15 → 16](./16-bandit-level-15-16.md) | TLS with `openssl s_client` |
| 17 | [Level 16 → 17](./17-bandit-level-16-17.md) | Port scanning & service discovery |
| 18 | [Level 17 → 18](./18-bandit-level-17-18.md) | `diff` to spot changes |
| 19 | [Level 18 → 19](./19-bandit-level-18-19.md) | Non-interactive SSH command execution |
| 20 | [Level 19 → 20](./20-bandit-level-19-20.md) | SUID binaries |
| 21 | [Level 20 → 21](./21-bandit-level-20-21.md) | Local daemons & job control |
| 22 | [Level 21 → 22](./22-bandit-level-21-22.md) | Cron jobs (world-readable output) |
| 23 | [Level 22 → 23](./23-bandit-level-22-23.md) | Cron jobs (predictable filenames) |
| 24 | [Level 23 → 24](./24-bandit-level-23-24.md) | Cron jobs (writable script directory) |
| 25 | [Level 24 → 25](./25-bandit-level-24-25.md) | Brute forcing a PIN |
| 26 | [Level 25 → 26](./26-bandit-level-25-26.md) | Restricted shell escape (`more` → `vi`) |
| 27 | [Level 26 → 27](./27-bandit-level-26-27.md) | SUID after the escape |
| 28 | [Level 27 → 28](./28-bandit-level-27-28.md) | Git: cloning a repo |
| 29 | [Level 28 → 29](./29-bandit-level-28-29.md) | Git: commit history |
| 30 | [Level 29 → 30](./30-bandit-level-29-30.md) | Git: branches |
| 31 | [Level 30 → 31](./31-bandit-level-30-31.md) | Git: tags |
| 32 | [Level 31 → 32](./32-bandit-level-31-32.md) | Git: hooks & `.gitignore` bypass |
| 33 | [Level 32 → 33](./33-bandit-level-32-33.md) | Restricted "uppercase" shell escape |
| 34 | [Level 33 (final)](./34-bandit-level-33.md) | Series wrap-up |

---

*Series by Himangshu Pan. Written for educational purposes. Passwords redacted in accordance with OverTheWire's no-spoilers policy.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

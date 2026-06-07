---
title: "OverTheWire Bandit Level 0 → 1: Reading Files & Information Disclosure"
description: "The first real Bandit level looks trivial — log in, read a file — but it seeds the two most-used reflexes in security and a lesson in plaintext credential exposure."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, ssh, bandit, information-disclosure, enumeration]
---

## Introduction

This is the first "real" level of Bandit, and it looks almost insultingly simple: log in, read a file, done. But that simplicity is deliberate. Level 0 → 1 is where you build the two most-used reflexes in all of security work — **list what is there**, then **read it** — and where you first confront the idea that a secret is only as safe as the file permissions and the place you stored it.

The skill being taught is basic file inspection on the Linux command line. The lesson hiding underneath it is **information disclosure**: a sensitive value (a password) is sitting in plaintext in a readable file, and anyone with access to that account can simply read it.

## Official Challenge Objective

> **The password for the next level is stored in a file called `readme` located in the home directory. Use this password to log into `bandit1` using SSH.**

**In plain English:** when you log in as `bandit0`, there is a file named `readme` in your home folder. Open it. The text inside is the password for the next user, `bandit1`. Then SSH back in as `bandit1`.

## Skills Covered

- Linux navigation (`pwd`, `ls`)
- File enumeration (`ls -la`)
- Reading files (`cat`)
- SSH authentication with a password
- The concept of a *home directory*

## My Approach

My instinct on any new machine — game or real — is the same: figure out *where I am* and *what is around me* before touching anything. So I listed the contents of the home directory, spotted the `readme` file the level promised, and read it. The whole level is two commands, but I made a point of doing it the "enumeration-first" way rather than blindly `cat readme`, because that habit is what later levels (and real targets) demand.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

### Explanation

Opens an SSH session to the Bandit server as `bandit0` on port `2220` (Bandit does not use default port 22). The password is `bandit0`. Terminals do not echo password characters — the blank prompt is expected.

### Why It Matters

SSH is *the* remote-administration protocol for Linux. Knowing how to specify a non-standard port (`-p 2220`) and a username (`user@host`) is fundamental — in real engagements services rarely sit on default ports, and a non-standard SSH port is itself a piece of recon.

---

### Command

```bash
pwd
ls -la
```

### Explanation

`pwd` confirms you are in `/home/bandit0`. `ls -la` lists **all** files including hidden dotfiles (`-a`) in **long** format (`-l`), showing permissions, owner, group, size, and modification time. You should see `readme`.

### Why It Matters

`ls -la` is the single most valuable orientation command in Linux security work. It answers "what is here, who owns it, and who can read/write/execute it?" in one line.

---

### Command

```bash
cat readme
```

### Explanation

`cat` prints the file to your screen. The contents of `readme` is the password for `bandit1`:

```
The password you are looking for is: [REDACTED]
```

### Why It Matters

The deeper point: this password lives in **plaintext** in a **readable** file. No encryption, no access control beyond "be logged in as this user." That is exactly how real credential leaks happen.

## Deep Dive: Cyber Security Concept

**Information Disclosure (Sensitive Data Exposure).**

This level is a miniature model of a very common real-world finding: secrets stored in plaintext where they should not be. In production the `readme` file becomes a database password in `config.php`, API keys committed to a repo, a `credentials.txt` on a shared drive, or cloud keys in `~/.aws/credentials` on a compromised workstation.

The failure is always the same shape: **a sensitive value is readable by a principal who should not be trusted with it.** Attackers don't need an exploit for this — they need *read access* and the discipline to look.

> [!IMPORTANT]
> A secret in a plaintext file is protected only by the file's permissions and the secrecy of its location. "Nobody knows it's there" is not security.

## Offensive Security Perspective

The moment a pentester or red teamer gets a foothold, the first move is **local enumeration** — and "read the obvious files" is step one: home directories, `.bash_history`, `~/.ssh/`, config files, and `grep`-ing the filesystem for `password`/`secret`/`token`/`api_key`. Bug bounty hunters find the web equivalent constantly — an exposed `.env`, a `backup.sql` in a web root, a connection string in a verbose error page.

## Common Beginner Mistakes

- Forgetting `-p 2220` → "Connection refused."
- Expecting the password field to echo characters.
- Blindly `cat`-ing files without `ls -la`/`file` first.
- Trying to `cd` into `readme` (it is a file).
- Typos copying the long, case-sensitive password.

## Key Takeaways

- The home directory is the first place to look on any account.
- `ls -la` then `cat` is the bread-and-butter inspection workflow.
- SSH needs a username, host, and (here) a non-default port.
- Plaintext secrets in readable files are an information-disclosure problem.
- Enumeration before action is the habit that wins every later level.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** post-exploitation begins with reading files; `linpeas` automates exactly this instinct.
- **Red team operations:** harvesting plaintext credentials from a foothold drives lateral movement and deeper access.
- **Cloud pentesting:** the cloud `readme` is an over-permissive S3 bucket or a key in instance metadata — identical failure mode.

## Additional Reading

- [`man ssh`](https://man7.org/linux/man-pages/man1/ssh.1.html), [`man ls`](https://man7.org/linux/man-pages/man1/ls.1.html), [`man cat`](https://man7.org/linux/man-pages/man1/cat.1.html)
- [OWASP — Cryptographic Failures (A02:2021)](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [MITRE ATT&CK — T1552: Unsecured Credentials](https://attack.mitre.org/techniques/T1552/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

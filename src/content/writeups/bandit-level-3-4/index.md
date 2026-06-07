---
title: "OverTheWire Bandit Level 3 → 4: Hidden Dotfiles & Security Through Obscurity"
description: "The password hides in a dot-prefixed file that a plain ls omits. The dotfile convention is visibility, not protection — and it is one of the oldest places attackers stash secrets."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, hidden-files, enumeration, obscurity]
---

## Introduction

This level moves from "the file has a weird name" to "the file is *hidden*." The password sits in a subdirectory called `inhere`, but a plain `ls` shows it as empty. Nothing was deleted — the file's name begins with a dot, and every standard Linux tool treats dot-prefixed names as **hidden** by default.

The lesson is the **dotfile convention** and the habit that defeats it: `ls -la`. Hidden files are a *visibility* convention, not a security mechanism — yet one of the oldest and most common places to stash things you do not want noticed.

## Official Challenge Objective

> **The password for the next level is stored in a hidden file in the `inhere` directory.**

**In plain English:** enter `inhere`. A normal `ls` looks empty because the file starts with `.`. List *all* files, find the dotfile, and read it.

## Skills Covered

- The Unix hidden-file (dotfile) convention
- Thorough enumeration with `ls -la` / `ls -a`
- Navigating directories (`cd`)
- Reading dot-prefixed files safely
- Why "hidden" ≠ "secure"

## My Approach

The note here was short: *hidden file*. After `cd inhere`, a plain `ls` came back empty — the tell that the file is hidden. `ls -la` revealed the dot-prefixed file, which I then `cat`-ed. Note: some Bandit instances name it with leading dots *and* dashes (e.g. `...Hiding-From-You`), so the `./` habit from Level 1 → 2 returns.

## Step-by-Step Walkthrough

### Command

```bash
ls -la inhere
```

### Explanation

`ls -la inhere` lists the directory directly: `-l` long format, `-a` **all** entries including those starting with `.`. This reveals the hidden file alongside `.` (current dir) and `..` (parent). The file is named something like `.hidden` or `...Hiding-From-You`.

### Why It Matters

`ls -la` is the difference between "empty directory" and "directory full of secrets." Default `ls` omits dotfiles — which is why hurried operators miss `.ssh/`, `.bash_history`, and `.aws/`.

---

### Command

```bash
cd inhere
cat ./.hidden_file
```

### Explanation

`cd inhere` enters the directory; `cat ./.hidden_file` reads it. The `./` prefix keeps the path explicit and protects you if the real name starts with a dash. The contents are the bandit4 password:

```
[REDACTED]
```

> [!TIP]
> If the name is awkward (dots and dashes), tab-complete it: type `cat ./` + `Tab`. To glob hidden files without matching `.`/`..`, use `cat ./.[!.]*`.

### Why It Matters

Combining hidden-file awareness, the `./` prefix, and careful reading is the layered care real enumeration demands — no single trick, the right *combination* of habits.

## Deep Dive: Cyber Security Concept

**The dotfile convention and security through obscurity.**

A file is "hidden" purely because its name starts with `.`, and tools like `ls` and shell globbing simply *choose by default* not to show such names. (Historically this was an accident — early `ls` filtered out `.` and `..` and ended up hiding everything dot-prefixed.)

There is **no access control** involved. `ls -la`, `find`, `echo .*`, a file manager with "show hidden" on, or any program opening the path by name reads it fine. Naming a secret `.secret` is textbook **security through obscurity** — it slows a casual observer and stops a deliberate one for zero seconds.

> [!IMPORTANT]
> Obscurity can be a *layer* (it slows recon) but never a *control*. If discovering the file is the only thing protecting it, it is not protected.

## Offensive Security Perspective

Dotfiles are prime post-exploitation hunting ground:

- **Credential harvesting:** `~/.ssh/id_rsa`, `~/.aws/credentials`, `~/.git-credentials`, `~/.netrc`, `~/.kube/config`.
- **History mining:** `~/.bash_history`, `~/.mysql_history` often contain inline passwords.
- **Persistence & hiding:** attackers drop backdoors with dot-prefixed names and use hidden staging dirs like `/tmp/...` or `/dev/shm/.x`.

Enumeration scripts (`linpeas`, `LinEnum`) always list hidden files — the first thing a thorough operator does is `ls -la` everywhere.

## Common Beginner Mistakes

- Running plain `ls`, seeing nothing, and assuming the directory is empty.
- Forgetting `-a` — `ls -l` alone still hides dotfiles.
- Hitting a file that is hidden *and* dash-prefixed, then forgetting the `./` fix.
- Using `cat .*` and getting confused by `.`/`..` matches.

## Key Takeaways

- A leading `.` makes a file *hidden by convention*, not protected.
- `ls -la` reveals everything; make it your default reflex.
- `.` and `..` are entries too — account for them when globbing.
- Hidden files are where real secrets (SSH keys, histories, cloud creds) live.
- Hiding ≠ securing: this is security through obscurity.

## How This Helps Build Cyber Security Expertise

- **Post-exploitation & privesc:** thorough hidden-file enumeration is step one of every local assessment — the manual version of `linpeas`.
- **Red team & persistence:** the same conventions let an operator drop dot-prefixed backdoors and stage payloads in hidden directories, under a casual `ls`.
- **AD & cloud pentest:** harvested dotfiles (`.aws/credentials`, `.kube/config`) pivot into wider cloud and domain compromise.

## Additional Reading

- [`man ls`](https://man7.org/linux/man-pages/man1/ls.1.html), [`man find`](https://man7.org/linux/man-pages/man1/find.1.html)
- [MITRE ATT&CK — T1564.001: Hidden Files and Directories](https://attack.mitre.org/techniques/T1564/001/)
- [MITRE ATT&CK — T1552: Unsecured Credentials](https://attack.mitre.org/techniques/T1552/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

---
title: "OverTheWire Bandit Level 5 → 6: Multi-Attribute File Search with find"
description: "The password hides in a directory full of decoys. Picking it out means treating find as a query language — stacking type, exact byte size, and a permission filter until only one file survives."
date: 2026-05-10
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, find, enumeration, file-discovery]
series: "OverTheWire Bandit"
order: 5
seriesLabel: "Level 5 → 6"
---

## Introduction

You have met `find` for locating a file by name or a single attribute. Level 5 → 6 raises the bar: the password is hidden under a directory tree full of decoys, and the only way to pick it out is to describe it precisely using **several attributes at once** — its type, its exact size in bytes, and the fact that it is *not* executable.

Real filesystems are noisy. When you are a pentester hunting a config file, SSH key, or credential store from a foothold, the win usually comes from **stacking constraints** until only the thing you want survives. This level teaches you to think of `find` as a query language.

## Official Challenge Objective

> **The password for the next level is stored in a file somewhere under the `inhere` directory and has all of these properties:**
> - **human-readable**
> - **1033 bytes in size**
> - **not executable**

**In plain English:** the `inhere` folder contains many subdirectories full of decoy files. Exactly one is a normal text file, precisely 1033 bytes, with no executable bit. Find and read it to get the password for `bandit6`.

## Skills Covered

- Recursive search with `find`
- Filtering by type (`-type f`)
- Filtering by exact byte size (`-size 1033c`)
- Negating a permission test (`! -executable`)
- Combining predicates into one precise query
- Piping matches into an action (`-exec ... +`)

## My Approach

The level hands you a search specification, so the job is translating each property into a `find` predicate:

- "under `inhere`" → search starting there.
- "human-readable" → a regular file, `-type f` (the size filter does most of the real work).
- "1033 bytes" → `-size 1033c`. The `c` suffix is what beginners miss — without it, `find` counts 512-byte blocks.
- "not executable" → `! -executable`.

AND those together and exactly one file matches, so I let `find` print it with `-exec cat {} +`.

> [!TIP]
> When a challenge spells out a file's attributes as a list, treat that list as a checklist of `find` predicates. Translate each line, AND them together, done.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit5@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit5` on port `2220` with the previous level's password. You land in `/home/bandit5`, which contains `inhere`.

### Why It Matters

The interesting work starts after you have a foothold. The non-default port is a small reminder that services rarely sit where you expect.

---

### Command

```bash
cd inhere
ls -la
```

### Explanation

Listing reveals a swarm of `maybehere00`, `maybehere01`, … subdirectories, each full of files. This is the haystack.

### Why It Matters

Seeing dozens of nested directories immediately rules out reading files by hand and justifies a recursive tool like `find`.

---

### Command

```bash
find . -type f ! -executable -size 1033c -exec cat {} +
```

### Explanation

The whole solution in one line:

- `find .` — search recursively from `inhere`.
- `-type f` — only regular files.
- `! -executable` — exclude executables; `!` negates the test.
- `-size 1033c` — exactly 1033 bytes; the trailing `c` means bytes (without it, blocks).
- `-exec cat {} +` — `cat` every match, batched into one efficient call.

Only one file matches, so the output is the password for `bandit6`:

```
[REDACTED]
```

> [!NOTE]
> The official wording says "human-readable"; `-type f` plus the strict size and permission filters isolates it here. If multiple files matched, you could pipe through `file` or `grep` to confirm which is real text.

### Why It Matters

This command is a template you will reuse forever: *start point, a chain of ANDed predicates, then an action.* The `-size Nc` byte suffix and the `!` negation are two of the most commonly fumbled `find` details — getting them right here means getting them right under pressure later.

## Deep Dive: Cyber Security Concept

**Attribute-based file discovery.**

A file is more than its name. Its inode records type, exact size, owner, group, permission bits, and timestamps. `find` is a query engine over that metadata.

From a foothold, you use this metadata to locate high-value targets without reading every file: config files of a known size, SSH keys, setuid binaries, world-writable files, and recently changed credential stores. A single attribute is rarely specific enough — the signal lives in the *combination*.

Knowing a target's exact size collapses a search from thousands of candidates to a handful instantly, which is why operators pivot on size and hashes when sifting a noisy host.

> [!IMPORTANT]
> `-size 1033c` (bytes) and `-size 1033` (512-byte blocks) are completely different searches. Always specify the unit suffix.

## Offensive Security Perspective

Operators describe what they want and let `find` surface it:

```bash
find / -type f -name "id_*" ! -name "*.pub" 2>/dev/null   # private keys
find /var/www -type f -mmin -60 2>/dev/null               # fresh artifacts
```

The `inhere` haystack is a sanitized web root or `/opt` bloated with files, where the target is distinguished only by a couple of attributes. Tools like `linpeas` are batteries of exactly these queries run automatically.

## Common Beginner Mistakes

- Omitting the `c` in `-size 1033c` (searches blocks, returns nothing/wrong files).
- Forgetting `-type f`, cluttering results with directories.
- Running `find` from home instead of `inhere` (works, but searches more).
- Forgetting `-exec` ends with `{} +` (or escaped `{} \;`).
- Expecting a single flag for "human-readable" — there isn't one; approximate with `-type f` plus a content check.

## Key Takeaways

- `find` is a query language: stack predicates to describe a file precisely.
- `-size Nc` means bytes; bare `N` means 512-byte blocks.
- `!` (or `-not`) negates a test.
- `-exec cat {} +` reads every match in one efficient pass.
- Multi-attribute search is the universal pattern for finding artifacts on noisy filesystems.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** "find setuid binaries" is the same skill aimed at another attribute.
- **Red team & post-exploitation:** sweeping a foothold by size, timestamp, ownership, and permission surfaces credentials, keys, and misconfigured files.
- **Cloud pentest:** locating exposed credential files and tokens on compromised instances reuses the same multi-attribute queries.
- **Scripting fluency:** `find ... -exec` is the gateway to your own looting tooling.

## Additional Reading

- [`man find`](https://man7.org/linux/man-pages/man1/find.1.html)
- [GNU findutils — Size tests](https://www.gnu.org/software/findutils/manual/html_node/find_html/Size.html)
- [MITRE ATT&CK — T1083: File and Directory Discovery](https://attack.mitre.org/techniques/T1083/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

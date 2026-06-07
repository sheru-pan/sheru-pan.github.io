---
title: "OverTheWire Bandit Level 6 → 7: System-Wide Search by Ownership"
description: "The password could be anywhere on the server. Finding it means searching from / and filtering by owning user and group — plus the essential trick of silencing permission-denied noise with 2>/dev/null."
date: 2026-05-11
platform: OverTheWire
difficulty: medium
tags: [ctf, linux, bandit, find, file-ownership, enumeration]
series: "OverTheWire Bandit"
order: 6
seriesLabel: "Level 6 → 7"
---

## Introduction

The previous level confined the search to one directory. This one removes the fence: the password could be **anywhere on the server**. You will search the whole filesystem from root (`/`) and narrow results by **ownership** — and meet one of the most practical tricks in the toolkit: redirecting error output to `/dev/null` so the signal isn't buried under "Permission denied" noise.

A server-wide `find` is a rite of passage — the exact move an attacker makes after a foothold, when the file you want is somewhere on the box but you do not yet know where.

## Official Challenge Objective

> **The password for the next level is stored somewhere on the server and has all of these properties:**
> - **owned by user bandit7**
> - **owned by group bandit6**
> - **33 bytes in size**

**In plain English:** the file is somewhere on the entire system. Its owning user is `bandit7`, its owning group is `bandit6`, and it is exactly 33 bytes. Search from root, filter on those three properties, and read the one match to get the password for `bandit7`.

## Skills Covered

- System-wide search from `/`
- Filtering by owner (`-user`) and group (`-group`)
- Filtering by exact byte size (`-size 33c`)
- Suppressing stderr with `2>/dev/null`
- Understanding Unix user/group ownership

## My Approach

Same structure as before — translate properties into predicates — but two things change:

1. **Search root is `/`, not `.`** because the file could be anywhere.
2. **A server-wide search hits directories I can't enter,** so `find` prints "Permission denied" to **stderr** (fd 2). Matches go to **stdout** (fd 1). Appending `2>/dev/null` throws away the error stream and keeps the real results.

The properties map to `-user bandit7`, `-group bandit6`, `-size 33c`. One file matches, so I append `-exec cat {} +`.

> [!TIP]
> `2>/dev/null` is one of the highest-value habits you can build. It turns a screen full of permission-denied spam into a clean list of matches. Those errors are expected — you simply lack access to those paths.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit6@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit6` on port `2220`. You land in `/home/bandit6`, but the target file is *not* here — it is out on the wider filesystem.

### Why It Matters

Recognizing the answer lives outside your home directory is the mental shift this level forces. Post-exploitation often means searching territory you do not own.

---

### Command

```bash
find / -type f -size 33c -user bandit7 -group bandit6 2>/dev/null -exec cat {} +
```

### Explanation

- `find /` — start at the filesystem **root** and recurse everywhere.
- `-type f` — only regular files.
- `-size 33c` — exactly 33 bytes (`c` = bytes).
- `-user bandit7` — owning **user** must be `bandit7`.
- `-group bandit6` — owning **group** must be `bandit6`.
- `2>/dev/null` — redirect **stderr (fd 2)** to the null device, discarding permission-denied messages. Matches still print via stdout (fd 1).
- `-exec cat {} +` — read every match in one batched call.

The single match's contents is the password for `bandit7`:

```
[REDACTED]
```

> [!NOTE]
> `2>/dev/null` is a shell redirection applied to the whole `find` command. Written before or after `-exec`, the shell strips it out and attaches it to the process; the predicates still all apply.

### Why It Matters

This is the canonical "find a file you know three facts about, anywhere on the box" command. Ownership filters add a metadata axis name and size can't capture, and `2>/dev/null` is the difference between a usable result and a wall of errors.

## Deep Dive: Cyber Security Concept

**Unix ownership: user, group, and why it matters.**

Every file has an owning **user** and owning **group**. With the permission bits, they form the classic Unix access-control model. The combination here — owned by user `bandit7` but group `bandit6` — is deliberate: a file can be owned by one principal while granting a *different* principal access via its group.

- A file **owned by a privileged user** but **readable by a less-privileged group** is a classic information-leak vector. You (as `bandit6`) read a file `bandit7` owns precisely because its group is `bandit6`.
- The same mechanic on writable files or scripts is a staple of **privilege escalation**: if a low-privileged group can write a file a higher-privileged process runs, that's an escalation path.

> [!IMPORTANT]
> A file's *owner* is not the only one who can access it — the *group* and *other* bits matter just as much. Cross-ownership is where access-control surprises hide.

## Offensive Security Perspective

A server-wide ownership search is core post-exploitation. After landing low-privileged, operators ask "what can I reach that belongs to someone more interesting?":

```bash
find / -type f -group "$(id -gn)" -user root 2>/dev/null   # root files my group can reach
find / -writable -type f 2>/dev/null                       # anything I can write
find / -user postgres -type f 2>/dev/null                  # a target service account
```

The `2>/dev/null` habit is essential: noisy output is slow to read and clutters the terminal you are working in. Combining ownership, permissions, and size pinpoints the misconfigured file that bridges a trust boundary — exactly what this level demonstrates.

## Common Beginner Mistakes

- Searching from `.` or home instead of `/`, never finding the file.
- Forgetting `2>/dev/null` and missing the match amid permission-denied spam.
- Confusing `-user` and `-group`.
- Dropping the `c` from `-size 33c` (byte vs block search).
- Using `2>&1` (merges errors into output) instead of `2>/dev/null` (discards them).
- Expecting an instant result — walking the whole filesystem takes a moment.

## Key Takeaways

- Start system-wide searches from `/` when location is unknown.
- `-user` and `-group` filter by owning user and group.
- `2>/dev/null` discards stderr noise and keeps real matches.
- Cross-ownership is a deliberate access-control pattern and a common leak vector.
- Combine ownership + size + type to pinpoint a single file anywhere.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** finding readable/writable files owned by higher-privileged accounts is a primary technique.
- **Red team & post-exploitation:** mapping ownership across a foothold exposes trust boundaries you can pivot through.
- **Multi-user & AD attacks:** group membership is the key to reading another principal's files — this query finds those cross-ownership leaks directly.
- **Operational discipline:** mastering redirection (`2>/dev/null`, `2>&1`, `>>`) underpins clean offensive tooling.

## Additional Reading

- [`man find`](https://man7.org/linux/man-pages/man1/find.1.html) — `-user`, `-group`, `-size`
- [Linux file permissions explained](https://www.redhat.com/sysadmin/linux-file-permissions-explained)
- [Bash redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [MITRE ATT&CK — T1083: File and Directory Discovery](https://attack.mitre.org/techniques/T1083/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

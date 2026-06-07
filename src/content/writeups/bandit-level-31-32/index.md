---
title: "OverTheWire Bandit Level 31 → 32: .gitignore Bypass & Server-Side Git Hooks"
description: "This time you push instead of pull. .gitignore silently swallows your file, git add -f forces past it, and a server-side pre-receive hook hands you the password — then rejects the push on purpose."
date: 2026-06-07
platform: OverTheWire
difficulty: hard
tags: [ctf, linux, bandit, git, gitignore, git-hooks, devsecops]
---

## Introduction

So far the Git levels have been about *reading*. Level 31 → 32 flips it: **you have to write to the repository**, and the server decides whether your contribution earns the password.

Two ideas collide. First, `.gitignore`: the repo's own ignore rules try to stop you committing the file the README demands — proof that `.gitignore` is a *convenience*, not a *security control*. Second, **server-side Git hooks**: the remote runs a `pre-receive` hook that inspects your push, prints the password if you got it right, then *rejects the push anyway*. That rejection is the intended behavior.

## Official Challenge Objective

> **There is a git repository at `ssh://bandit31-git@localhost/home/bandit31-git/repo` via the port `2220`. The password for the user `bandit31-git` is the same as for the user `bandit31`. Clone the repository and find the password for the next level.**

**In plain English:** clone the repo. Its README says to create `key.txt` containing `May I come in?` and push it to `master`. But `.gitignore` ignores `key.txt`, so you must force-add it. On push, a server hook checks the file, prints the password, and refuses the push by design.

## Skills Covered

- Cloning a Git repo and reading its instructions
- `.gitignore` and its limits
- Force-adding ignored files with `git add -f`
- Committing and pushing over SSH
- Recognizing server-side `pre-receive` hook behavior

## My Approach

I cloned and read the README: make `key.txt` with `May I come in?` and push to `master`. I created the file and ran `git add key.txt` — Git silently did nothing. `cat .gitignore` explained it: `*.txt` is ignored. The fix is `git add -f`. After commit and push, the server hook printed the next password, then bounced the push with `pre-receive hook declined` — exactly as intended. The password was on screen before the rejection.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit31@bandit.labs.overthewire.org -p 2220
mkdir -p /tmp/b31 && cd /tmp/b31
git clone ssh://bandit31-git@localhost/home/bandit31-git/repo
cd repo
```

### Explanation

Log in, make a writable scratch dir, clone (the `bandit31-git` password equals `bandit31`'s), and `cd` in.

### Why It Matters

This level is interactive in both directions — you push back to this clone — so a clean writable copy in `/tmp` matters.

---

### Command

```bash
cat README.md
```

### Explanation

The README spells out the task:

```
File name: key.txt
Content: 'May I come in?'
Branch: master
```

### Why It Matters

Read it literally — filename, *exact* content (with the question mark), and target branch all matter; the hook checks them precisely.

---

### Command

```bash
echo 'May I come in?' > key.txt
git add key.txt
```

### Explanation

We create the file, then try to stage it — but `git add key.txt` stages **nothing** and `git status` shows no change.

> [!NOTE]
> `echo` adds a trailing newline, which this hook accepts. A stricter server might need `printf 'May I come in?'`. Match the brief when unsure.

### Why It Matters

A silent "add" that does nothing is a classic trap. When `git add` succeeds but `git status` is empty, suspect `.gitignore`.

---

### Command

```bash
cat .gitignore
```

### Explanation

The obstacle:

```
*.txt
```

Every `.txt` is excluded from normal staging — exactly what the README told you to create.

### Why It Matters

The central irony: the instructions and `.gitignore` contradict each other on purpose, to teach you that ignore rules are advisory, not protective.

---

### Command

```bash
git add -f key.txt
git commit -m "add key.txt"
```

### Explanation

`-f` (`--force`) overrides `.gitignore` and stages the file; `git commit` records it.

### Why It Matters

`-f` is the explicit "I know it's ignored, do it anyway" switch — proof that anyone with write access can put an ignored file into history at will.

---

### Command

```bash
git push origin master
```

### Explanation

The push runs the server's `pre-receive` hook:

```
remote: Well done! Here is the password for the next level:
remote: [REDACTED]
...
 ! [remote rejected] master -> master (pre-receive hook declined)
```

The password is in the `remote:` lines; the rejection is **expected**.

### Why It Matters

Two lessons: (1) a "failed" push can still deliver what you wanted — read all remote output; (2) the server enforces policy with a hook, not by trusting the client.

---

### Command

```bash
ssh bandit32@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log out and log in as `bandit32` with the password the hook printed.

### Why It Matters

You've now exercised the *write* side of Git over SSH.

## Deep Dive: Cyber Security Concept

**`.gitignore` is not security, and server-side hooks are the real gatekeeper.**

`.gitignore` exists so artifacts and cruft don't get committed via `git add .`. It does nothing to stop a determined user (`git add -f`), remove already-committed data, or protect secrets — ironically, listing `secrets.env` in `.gitignore` advertises that the file exists.

**Git hooks** are scripts Git runs at lifecycle points:

- **Client-side** (`pre-commit`, `pre-push`) live in your `.git/hooks/` and are trivially bypassed (`--no-verify`). Ergonomics, not enforcement.
- **Server-side** (`pre-receive`, `update`, `post-receive`) run on the remote at push time and cannot be skipped by the client. This is where real policy lives.

```mermaid
sequenceDiagram
    participant C as Client (you)
    participant S as Git Server
    C->>C: git add -f key.txt; git commit
    C->>S: git push origin master
    S->>S: run pre-receive hook (inspect key.txt)
    S-->>C: remote: "password: [REDACTED]"
    S-->>C: ! [remote rejected] (pre-receive declined)
    Note over C,S: Push refused on purpose; secret delivered
```

> [!IMPORTANT]
> Security controls must live where the attacker cannot reach the off switch. A client-side check is a suggestion; a server-side hook is enforcement — the same reason you never trust client-side input validation.

## Offensive Security Perspective

- **`.gitignore` as a treasure map:** auditors read it first — `.env`, `*.pem`, `config/secrets.yml` name exactly the sensitive files the developer worried about, hinting at what to hunt for in backups and old commits.
- **Hook abuse:** write access to server-side hooks (or a push-triggered CI pipeline) gives code execution and persistence via `post-receive` — a recurring supply-chain pattern.
- The `git add -f` move itself is a routine way to plant an arbitrary tracked file regardless of ignore rules.

## Common Beginner Mistakes

- Assuming `git add key.txt` worked because it printed no error.
- Not reading `.gitignore` and missing the `*.txt` rule.
- Panicking at `pre-receive hook declined` and missing the password above it.
- Getting the content wrong (`May I come in?` exactly).
- Pushing to the wrong branch instead of `master`.
- Editing/deleting `.gitignore` instead of using `-f` (works, but `-f` is cleaner).

## Key Takeaways

- `.gitignore` filters convenience commands; `git add -f` bypasses it.
- The names in `.gitignore` themselves leak what's sensitive.
- Server-side hooks enforce policy the client cannot skip.
- A rejected push can still deliver what you wanted — read all remote output.
- Enforcement must live where the attacker can't disable it.

## How This Helps Build Cyber Security Expertise

- **DevSecOps:** server-side hooks and CI gates are how secret scanning, signing, and review are actually enforced.
- **Supply-chain security:** hook/CI execution on push is foundational to reasoning about pipeline compromise.
- **Web app parallel:** "client checks are suggestions, server checks are enforcement."
- **Repo auditing:** reading `.gitignore` for sensitive-file hints is standard recon.

## Additional Reading

- [Pro Git — Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [`gitignore` documentation](https://git-scm.com/docs/gitignore)
- [`git add` documentation](https://git-scm.com/docs/git-add)
- [OWASP — CI/CD Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

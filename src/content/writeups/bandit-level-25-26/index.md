---
title: "OverTheWire Bandit Level 25 → 26: Escaping a Restricted Shell via more and vi"
description: "bandit26's login shell isn't bash — it's a script that runs more and exits. Shrink the terminal to force pagination, press v to jump into vi, then escape vi to a real shell. A textbook GTFOBins pager/editor breakout."
date: 2026-06-07
platform: OverTheWire
difficulty: hard
tags: [ctf, linux, bandit, restricted-shell, shell-escape, gtfobins, privilege-escalation, vi]
---

## Introduction

Most Bandit levels hand you a file and ask you to read it. This one fights back. The instant you log in as `bandit26`, your session *ends* — back to a logout, no prompt, no command. The level that looks broken is the lesson: `bandit26`'s login shell is not `/bin/bash` but a tiny script that shows you a text file and quits.

This is your first encounter with a **restricted shell** and the art of **escaping** it. The technique — coaxing `more` into interactive mode, jumping from `more` into `vi`, then from `vi` into a shell — is a textbook *editor/pager escape*, the same class of trick catalogued on [GTFOBins](https://gtfobins.github.io/). Misconfigured restricted shells and SUID editors are a recurring real-world privilege-escalation path.

## Official Challenge Objective

> **Logging in to bandit26 from bandit25 should be fairly easy… The shell for user bandit26 is not `/bin/bash`, but something else. Find out what it is, how it works, and how to break out of it.** *(PowerShell users should use Command Prompt instead.)*

**In plain English:** authenticating is trivial, but `bandit26` does not get a normal shell — something else runs and exits immediately. Discover *what* runs, *why* it terminates, and *how* to wrestle a real shell out of it.

## Skills Covered

- Reading `/etc/passwd` to identify a user's login shell
- Recognising and analysing a custom/restricted login shell
- How `more` decides whether to paginate
- Forcing interactive pagination by resizing the terminal
- Pager-to-editor escape (`v` in `more` → `vi`)
- Editor-to-shell escape (`:set shell` / `:shell` in vi)
- GTFOBins-style "living off the land" breakout thinking

## My Approach

My first reaction was that the level was bugged — password accepted, then instant logout. That "instant logout" is the biggest clue, so I went back to `bandit25` and asked: *what shell does `bandit26` run?* `/etc/passwd` pointed at `/usr/bin/showtext`, which just runs `more` on a text file and exits — so the session dies the moment `more` finishes.

The key realisation: `more` only quits instantly when the file fits on screen. If it *doesn't* fit, `more` stops at a `--More--` prompt and waits — and while waiting it is interactive. From there `v` opens `vi`, and `vi` can spawn a shell. So I shrank my terminal *before* logging in to force paging, then walked the `more → vi → bash` chain.

## Step-by-Step Walkthrough

### Command

```bash
grep bandit26 /etc/passwd
```

### Explanation

Run this as `bandit25`. The last field of each `/etc/passwd` line is the login shell. For `bandit26` it is **not** bash:

```
bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext
```

### Why It Matters

`/etc/passwd` is world-readable and the login-shell field is a goldmine. An account whose shell is `showtext`, `rbash`, `lshell`, or `nologin` is deliberately constrained — which raises "constrained how, and can I break out?"

---

### Command

```bash
cat /usr/bin/showtext
```

### Explanation

```sh
#!/bin/sh
export TERM=linux
exec more ~/text.txt
```

Three lines. It `exec`s `more` on `text.txt`. `exec` *replaces* the script process, so when `more` exits there is nothing to return to — the session ends. No bash, no prompt, no fallback.

### Why It Matters

The entire "jail" is one call to `more` — a *pager* with interactive features (search, edit-this-file) never meant for an untrusted user. The author assumed `more` would dump the file and quit. That assumption is the vulnerability.

> [!NOTE]
> `exec` matters: without it the parent `/bin/sh` would survive `more` and might give you a shell. Because of `exec`, the only way out is *through* `more`.

---

### Command

```bash
# Resize your terminal to be VERY SMALL (a few lines tall) FIRST, then:
ssh bandit26@bandit.labs.overthewire.org -p 2220
```

### Explanation

`more` only paginates when the file is taller than the terminal. A large window means `more` prints everything and exits instantly — dead end. Shrink the window so `text.txt` cannot fit; now `more` halts at a `--More--` prompt and waits for input. A waiting `more` is an interactive `more`.

### Why It Matters

The same binary, file, and command behave differently purely because of the *environment*. Attackers manipulate `TERM`, `LINES`, `COLUMNS`, terminal size, and locale to push programs into untested states all the time.

> [!TIP]
> PowerShell breaks this; use Command Prompt or any normal Unix terminal so the resize actually constrains `more`.

---

### Command

```text
# At the --More-- prompt, press the single key:
v
```

### Explanation

`v` is a built-in `more`/`less` command: **edit the current file** in `$VISUAL`/`$EDITOR`, defaulting to `vi`. You are now inside `vi` on `text.txt` — a full editor that can run external commands. The pager is escaped.

### Why It Matters

A "read-only" pager just handed you a fully interactive editor. This is exactly why pagers are on GTFOBins: reach `more`/`less`/`man` and you may be one keystroke from a shell.

---

### Command

```vim
:set shell=/bin/bash
:shell
```

### Explanation

Press `Esc` to ensure normal mode, then run these two `:` commands. The first sets vi's shell to bash; `:shell` drops you into an interactive `/bin/bash` as `bandit26`. (On vanilla `vi`, use `:set shell=/bin/sh`.)

```bash
bandit26@bandit:~$
```

### Why It Matters

`:shell` / `:!cmd` / `:set shell` are documented vi features — reasonable for a developer, catastrophic for an untrusted user. This is the canonical [GTFOBins `vi`](https://gtfobins.github.io/gtfobins/vi/) escape.

---

### Command

```bash
cat /etc/bandit_pass/bandit26
```

### Explanation

With a normal shell as `bandit26`, the level reduces to the familiar read:

```
[REDACTED]
```

### Why It Matters

The breakout was the challenge; the read is the reward. Once you hold an unconstrained shell as a user, every file that user can read is yours.

## Deep Dive: Cyber Security Concept

**Restricted shells and shell-escape (jail-break) techniques.**

A *restricted shell* confines a user to a narrow set of actions instead of a general shell — `rbash`, `lshell`, custom wrappers like `showtext`, or forced-command SSH keys. Restriction is hard to do right: it delegates to a "safe" helper, and almost every helper has a feature that reaches the outside:

- **Pagers** (`more`, `less`): `v` to edit, `!cmd` to run a command.
- **Editors** (`vi`, `vim`, `nano`, `ed`): `:!cmd`, `:shell`, `:set shell`.
- **Accidental interpreters** (`awk`, `find -exec`, `man`, `git` pager): each can spawn a shell.

[GTFOBins](https://gtfobins.github.io/) catalogues these. The mental model: **a jail is only as strong as the weakest program reachable from inside it.**

```mermaid
flowchart TD
    A[SSH login as bandit26] --> B[/usr/bin/showtext runs/]
    B --> C[exec more ~/text.txt]
    C --> D{File fits on screen?}
    D -- Yes, big terminal --> E[prints all + exits<br/>DEAD END]
    D -- No, tiny terminal --> F[--More-- pause<br/>interactive]
    F --> G[press v -> vi]
    G --> H[":set shell=/bin/bash" then ":shell"]
    H --> I[bash as bandit26]
    I --> J[cat /etc/bandit_pass/bandit26]
```

## Offensive Security Perspective

Restricted-shell escapes are bread-and-butter for pentesters:

- **Foothold expansion:** breaking out of an `rbash`/menu on a jump host or appliance is the difference between "stuck" and "owned."
- **SUID editors:** a SUID `vi`/`less`/`more`/`man` (or a `sudo` rule for one) escalates to the file owner — often root — via the same `v`/`:shell` trick.
- **Forced-command SSH keys:** an `authorized_keys` `command="..."` is a restricted shell; if it's a pager/editor, the escape applies.
- **Network appliances & IoT:** custom CLIs frequently embed a pager/editor you can punch out of.

The reusable instinct: when dropped into something that isn't a normal shell, enumerate exactly which program runs and which sub-programs it reaches — then check GTFOBins.

## Defensive Perspective

- **Don't treat a wrapper script as a security boundary.** Avoid `exec`-ing an interactive pager; prefer `cat` or non-interactive output.
- **Disable pager escapes.** `less` honours `LESSSECURE=1` (disables `!`, `v`, pipes). `more` has no robust equivalent — another reason to avoid it in restricted contexts.
- **Use a real jail:** containers, `seccomp`/AppArmor/SELinux, `ForceCommand` with a vetted binary, or minimal `chroot`. Strip `vi`/`vim`/`more`/`less`/`man`/`awk`/`find` from restricted environments.
- **Audit SUID/sudo grants:** `find / -perm -4000 -type f 2>/dev/null`; cross-check every hit against GTFOBins. No editor/pager/interpreter should be SUID-root.
- **Monitoring:** alert on a `bash` parented by `vi` parented by `more` in `execve`/`auditd` logs — a screaming shell-escape indicator.

## Common Beginner Mistakes

- Giving up after the instant logout instead of checking `/etc/passwd`.
- Not shrinking the terminal first — `more` exits before you see `--More--`.
- Resizing *after* login (too late; resize before the SSH command).
- Pressing `v` from the wrong state (must be at the `--More--` prompt).
- Forgetting `Esc` in vi, so `:set shell` lands in the buffer.
- Using PowerShell, which breaks the terminal-size trick.

## Key Takeaways

- A user's login shell is the last field of `/etc/passwd`.
- A restricted shell is only as strong as the weakest program it reaches.
- `more`/`less` paginate only when content exceeds the terminal.
- Pagers launch editors (`v`); editors launch shells (`:shell`).
- GTFOBins is the reference for "which innocent binary gives me a shell."

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** the editor/pager escape is a high-yield Linux privesc primitive to recognise on sight.
- **Appliance/IoT testing:** breaking out of custom constrained CLIs is a specialised, valuable skill.
- **Detection engineering:** the `more → vi → bash` process tree teaches you what shell escapes look like in telemetry.
- **Secure design:** building a real sandbox instead of a wrapper script is a lesson for every hardening project.

## Additional Reading

- [GTFOBins — `vi`](https://gtfobins.github.io/gtfobins/vi/), [`more`](https://gtfobins.github.io/gtfobins/more/), [`less`](https://gtfobins.github.io/gtfobins/less/)
- [`man more`](https://man7.org/linux/man-pages/man1/more.1.html), [`man less`](https://man7.org/linux/man-pages/man1/less.1.html)
- [GNU `rbash` — Restricted Shell](https://www.gnu.org/software/bash/manual/html_node/The-Restricted-Shell.html)
- [MITRE ATT&CK — T1548: Abuse Elevation Control Mechanism](https://attack.mitre.org/techniques/T1548/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

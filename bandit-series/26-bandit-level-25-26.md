# OverTheWire Bandit Level 25 → Level 26

## Introduction

Most Bandit levels hand you a file and ask you to read it. This one fights back. The instant you log in as `bandit26`, your session *ends* — you are kicked straight back to a logout. There is no shell prompt, no chance to type a command, nothing. The level that looks broken is actually the lesson: `bandit26`'s login shell is not `/bin/bash` at all, but a tiny script that shows you a text file and quits.

This is your first encounter with a **restricted shell** (or, more precisely, a constrained login program) and the art of **escaping** it. The technique you will use — coaxing the pager `more` into interactive mode, then jumping from `more` into `vi`, then from `vi` into a real shell — is a textbook example of an *editor/pager escape*, the same class of trick catalogued on [GTFOBins](https://gtfobins.github.io/). It is one of the most genuinely useful skills in the whole series, because misconfigured restricted shells and SUID editors are a recurring real-world privilege-escalation path.

## Official Challenge Objective

> **Logging in to bandit26 from bandit25 should be fairly easy… The shell for user bandit26 is not `/bin/bash`, but something else. Find out what it is, how it works, and how to break out of it.**
>
> *(Note: Windows PowerShell users should use command prompt instead, as PowerShell breaks the intended solution.)*

**In plain English:** you already have the `bandit26` password sitting in `/home/bandit25/`, so authenticating is trivial. The catch is that `bandit26` does not get a normal interactive shell when it logs in. Something else runs instead, and it exits immediately. Your job is to discover *what* program runs, *why* it terminates the session, and *how* to wrestle a real shell out of it so you can read the next password.

## Skills Covered

- Reading `/etc/passwd` to identify a user's login shell
- Recognising and analysing a custom/restricted login shell
- How the `more` pager decides whether to paginate
- Forcing interactive pagination by resizing the terminal
- Pager-to-editor escape (`v` in `more` → `vi`)
- Editor-to-shell escape (`:set shell` / `:shell` in vi/vim)
- GTFOBins-style "living off the land" breakout thinking

## My Approach

My first reaction was that the level was bugged — I typed the password, the banner flashed, and I was immediately back at my own terminal. That "instant logout" is the single biggest clue, so instead of fighting it I went back to `bandit25` and asked the obvious question: *what shell does `bandit26` actually run?* `/etc/passwd` answers that in one grep, and it pointed at `/usr/bin/showtext`. Reading that script showed it just runs `more` on a text file and exits — so the session dies the moment `more` finishes.

The key realisation: `more` only quits instantly when the whole file fits on screen. If the file *doesn't* fit, `more` has to stop and wait at a `--More--` prompt for me to page through it — and while it is waiting, it is interactive. From an interactive `more` you can press `v` to open the file in `vi`, and from `vi` you can spawn a shell. So I shrank my terminal window to just a few lines tall *before* logging in, which forced `more` into paging mode, then walked the `more → vi → bash` escape chain.

## Step-by-Step Walkthrough

### Command

```bash
grep bandit26 /etc/passwd
```

### Explanation

Run this while still logged in as `bandit25`. `/etc/passwd` is the world-readable account database; each line is `username:x:UID:GID:comment:home:login-shell`. The last field is the program executed when that user logs in. For `bandit26` it is **not** `/bin/bash`:

```
bandit26:x:11026:11026:bandit level 26:/home/bandit26:/usr/bin/showtext
```

### Why It Matters

`/etc/passwd` being world-readable is by design (it predates shadow passwords), and the login-shell field is a goldmine during enumeration. An account whose shell is `/usr/bin/showtext`, `/bin/rbash`, `/usr/bin/lshell`, `/sbin/nologin`, or `/bin/false` is telling you it has been *deliberately constrained* — which immediately raises the question "constrained how, and can I break out?"

---

### Command

```bash
cat /usr/bin/showtext
```

### Explanation

Read the custom shell to understand exactly what happens at login:

```sh
#!/bin/sh
export TERM=linux
exec more ~/text.txt
```

Three lines. It sets `TERM`, then `exec`s `more` on `text.txt`. `exec` *replaces* the script process with `more`, so when `more` exits there is nothing left to return to — the SSH session simply ends. There is no `bash`, no prompt, nothing else to fall back on.

### Why It Matters

This is the heart of the level. A restricted login program is only as strong as the programs it hands control to. Here, the whole "jail" is a single call to `more` — and `more` is a *pager*, an interactive program with features (search, and crucially, "edit this file") that were never meant to be reachable by an untrusted user. The script's author assumed `more` would just dump the file and quit. That assumption is the vulnerability.

> [!NOTE]
> `exec` matters here. Without it, `more` would run as a child process and the parent `/bin/sh` script would continue — potentially giving you a `/bin/sh`. Because of `exec`, there is no parent left, so the only way out is *through* `more`.

---

### Command

```bash
# 1. Resize your terminal window to be very SMALL (a few lines tall)
#    BEFORE running the next command.
# 2. Then log in:
ssh bandit26@bandit.labs.overthewire.org -p 2220
```

### Explanation

This is the non-obvious step. `more` only stops to paginate when the file is longer than the terminal can display at once. If your window is 50 lines tall and `text.txt` is 20 lines, `more` prints everything and exits instantly — game over. So you shrink the terminal first (drag it down to ~5 lines, or reduce font/rows) so that `text.txt` *cannot* fit on one screen. Now `more` is forced to halt at a `--More--` prompt and wait for input — and a waiting `more` is an interactive `more`.

### Why It Matters

This is a beautiful illustration of how *environmental conditions* change a program's behaviour. The same binary, the same file, the same command — but a smaller window flips `more` from "fire and forget" into "interactive session." Attackers manipulate environment (`TERM`, `LINES`, `COLUMNS`, terminal size, locale) all the time to push programs into states their authors never tested.

> [!TIP]
> Windows PowerShell mangles the terminal handling and breaks this; use the classic Command Prompt (or any normal Linux/macOS terminal) so the resize actually constrains `more`.

---

### Command

```text
# At the --More-- prompt inside more, press the single key:
v
```

### Explanation

`v` is a built-in `more`/`less` command meaning **"edit the current file in your editor."** It launches the editor named by the `$VISUAL`/`$EDITOR` environment variables, defaulting to `vi`. You are now inside `vi`, viewing `text.txt` — and `vi` is a full-featured editor with the ability to run external commands. You have just escaped the pager.

### Why It Matters

This is the pivot the whole level hinges on. A "read-only" pager handed you a fully interactive editor. This exact behaviour is why pagers are listed on GTFOBins: any time a restricted context lets you reach `more`/`less`/`man` (which itself uses a pager) on a file, you may be one keystroke (`v` or `!`) away from a shell.

---

### Command

```vim
:set shell=/bin/bash
:shell
```

### Explanation

Inside `vi` (press `Esc` first to be sure you are in normal/command mode), type these two `:` commands. The first sets vi's shell to bash; the second (`:shell`) suspends the editor and drops you into an interactive `/bin/bash`. You now have a real shell running as `bandit26`. (On vanilla `vi` you may need `:set shell=/bin/sh` instead — the principle is identical.)

```bash
bandit26@bandit:~$ 
```

### Why It Matters

`:shell`, `:!cmd`, and `:set shell=…` are documented vi/vim features for running commands without leaving the editor — perfectly reasonable for a developer, catastrophic when an untrusted user can reach `vi` with elevated context. This is the canonical [GTFOBins `vi`/`vim`](https://gtfobins.github.io/gtfobins/vi/) escape, and it shows up constantly against restricted shells and SUID-editor misconfigurations.

---

### Command

```bash
cat /etc/bandit_pass/bandit26
```

### Explanation

With a normal bash shell as `bandit26`, the level reduces to the familiar pattern: read the password file. `/etc/bandit_pass/bandit26` is readable only by the `bandit26` user, which you now are.

```
[REDACTED]
```

### Why It Matters

The breakout was the whole challenge; reading the password is the reward. The takeaway is that once you have an unconstrained shell as a user, *every* file that user can read is yours — the restricted shell was the only thing standing between an attacker and that account's full privileges.

## Deep Dive: Cyber Security Concept

**Restricted shells and shell-escape (jail-break) techniques.**

A *restricted shell* is an attempt to confine a user to a narrow set of actions — show one file, run one menu, expose a limited command set — instead of giving them a general-purpose shell. Common implementations include `rbash` (restricted bash), `lshell`, custom wrapper scripts (like `showtext`), and forced-command SSH keys.

The trouble is that restriction is hard to do correctly. The confinement usually delegates to some "safe" helper program — a pager, an editor, a backup tool, a network utility — and almost every such helper has a feature that can reach the outside:

- **Pagers** (`more`, `less`): `v` to edit, `!cmd` to run a command, `:e` to open arbitrary files.
- **Editors** (`vi`, `vim`, `nano`, `ed`): `:!cmd`, `:shell`, `:set shell`, or `^R^X` style escapes.
- **Interpreters reachable by accident** (`awk`, `find -exec`, `man`, `git` with its pager): each can spawn a shell.

[GTFOBins](https://gtfobins.github.io/) is the community catalogue of exactly these "this innocent binary can give you a shell" tricks. The mental model: **a jail is only as strong as the weakest program reachable from inside it.**

```mermaid
flowchart TD
    A[SSH login as bandit26] --> B[/usr/bin/showtext runs/]
    B --> C[exec more ~/text.txt]
    C --> D{Does file fit on screen?}
    D -- Yes, large terminal --> E[more prints all + exits<br/>session ends - DEAD END]
    D -- No, tiny terminal --> F[more pauses at --More--<br/>interactive]
    F --> G[press v -> opens vi]
    G --> H[":set shell=/bin/bash" then ":shell"]
    H --> I[Interactive bash as bandit26]
    I --> J[cat /etc/bandit_pass/bandit26]
```

## Offensive Security Perspective

Restricted-shell escapes are bread-and-butter for penetration testers and red teamers:

- **Foothold expansion:** you phish your way onto a jump host or appliance that drops you into a constrained menu or `rbash`. Breaking out to a full shell is the difference between "stuck" and "owned."
- **SUID editors:** find a `vi`/`vim`/`less`/`more`/`man` binary with the SUID bit set (or runnable via a `sudo` rule), and the same `v`/`:shell` trick escalates you to the file owner — often root. This is one of the first things `linpeas`/`GTFOBins` lookups check.
- **Forced-command SSH keys:** an `authorized_keys` entry with `command="..."` is a restricted shell by another name; if the forced command is a pager or editor, the escape applies.
- **Network appliances & embedded gear:** routers, switches, and IoT devices love to expose a custom CLI. Punching out of it via an embedded pager/editor is a classic embedded-pentest move.

The reusable instinct from this level: when you are dropped into something that *isn't* a normal shell, enumerate exactly which program is running and which sub-programs it can reach — then look each up on GTFOBins.

## Common Beginner Mistakes

- **Giving up after the instant logout**, assuming the level is broken instead of reading `/etc/passwd`.
- **Not shrinking the terminal first** — with a large window `more` exits immediately and you never get the `--More--` prompt.
- **Resizing *after* logging in** — too late; you must constrain `more` before it runs, so resize before the SSH command.
- **Pressing `v` from the wrong state** — it must be pressed at the `--More--` pager prompt.
- **Forgetting `Esc`** in vi, so `:set shell` gets typed into the buffer instead of executed as a command.
- **Using PowerShell**, which breaks the terminal-size trick — use Command Prompt or a normal Unix terminal.

## Key Takeaways

- A user's login shell lives in the last field of `/etc/passwd` — always check it.
- A restricted shell is only as strong as the weakest program it lets you reach.
- `more`/`less` paginate only when content exceeds the terminal; shrinking the window forces interactivity.
- Pagers can launch editors (`v`), and editors can launch shells (`:shell`).
- GTFOBins is your reference for "which innocent binary gives me a shell."

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** the editor/pager escape is one of the highest-yield Linux privesc primitives; recognising it on sight is a core pentest skill.
- **Embedded & appliance testing:** custom CLIs and constrained shells are everywhere in network and IoT gear; breaking out of them is a specialised, valuable discipline.
- **Red-team craft:** "living off the land" by abusing a trusted binary (GTFOBins) to spawn a shell is a stealthy, signature-light technique you'll lean on constantly.
- **Cloud & CI pentesting:** locked-down web shells, kiosk menus, and constrained build runners are just restricted shells in new clothes — the same enumerate-the-helper-then-escape instinct applies.

## Additional Reading

- [GTFOBins — `vi`](https://gtfobins.github.io/gtfobins/vi/) and [`more`](https://gtfobins.github.io/gtfobins/more/) / [`less`](https://gtfobins.github.io/gtfobins/less/)
- [`man more`](https://man7.org/linux/man-pages/man1/more.1.html), [`man less`](https://man7.org/linux/man-pages/man1/less.1.html)
- [GNU `rbash` — Restricted Shell](https://www.gnu.org/software/bash/manual/html_node/The-Restricted-Shell.html)
- [MITRE ATT&CK — T1548: Abuse Elevation Control Mechanism](https://attack.mitre.org/techniques/T1548/)
- [MITRE ATT&CK — T1059: Command and Scripting Interpreter](https://attack.mitre.org/techniques/T1059/)

---

*Next up: [Level 26 → 27](./27-bandit-level-26-27.md) — you have a shell at last, and a familiar SUID helper hands you the next password.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

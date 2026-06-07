# OverTheWire Bandit Level 31 → Level 32

## Introduction

So far the Git levels have been about *reading* — clone, then dig through branches, history, and tags for a secret someone left behind. Level 31 → 32 flips the direction entirely: this time **you have to write to the repository**, and the server decides whether your contribution is good enough to hand over the password.

Two ideas collide here. First, `.gitignore`: the repo's own ignore rules try to stop you from committing the file the README demands — a great lesson that `.gitignore` is a *convenience*, not a *security control*. Second, **server-side Git hooks**: the remote runs a `pre-receive` hook that inspects your push, prints the next password if you got it right, and then *rejects the push anyway*. That rejection is not a failure — it's the intended behavior.

The skill being taught: forcing past `.gitignore` with `git add -f`, and understanding how Git servers validate (and react to) pushes via hooks.

## Official Challenge Objective

> **There is a git repository at `ssh://bandit31-git@localhost/home/bandit31-git/repo` via the port `2220`. The password for the user `bandit31-git` is the same as for the user `bandit31`. Clone the repository and find the password for the next level.**

**In plain English:** clone the repo. Its README tells you to create a file called `key.txt` containing the exact text `May I come in?` and push it to the `master` branch. The catch: `.gitignore` will silently ignore `key.txt`, so you must force-add it. When you push, a server-side hook checks your file, prints the password, and refuses the push (by design).

## Skills Covered

- Cloning a Git repo and reading its instructions
- Understanding `.gitignore` and its limits
- Force-adding ignored files with `git add -f`
- Committing and pushing over SSH
- Recognizing server-side `pre-receive` hook behavior and output

## My Approach

I cloned the repo and read the README, which gave precise instructions: make `key.txt` with the contents `May I come in?` and push it to `master`. I created the file and ran `git add key.txt` — and Git silently did nothing. A quick `cat .gitignore` explained why: it ignores `*.txt`. The fix is `git add -f` to override the ignore list. After committing and pushing, the server's hook printed the next password and then bounced the push with `pre-receive hook declined` — exactly what's supposed to happen. The password was already on my screen before the rejection.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit31@bandit.labs.overthewire.org -p 2220
mkdir -p /tmp/b31 && cd /tmp/b31
git clone ssh://bandit31-git@localhost/home/bandit31-git/repo
cd repo
```

### Explanation

Log in as `bandit31`, make a writable scratch directory, and clone the repo (the `bandit31-git` password is the same as `bandit31`'s). Move into `repo/`.

### Why It Matters

This level is interactive in both directions — you'll be pushing back to this clone — so a clean, writable working copy in `/tmp` matters more than ever.

---

### Command

```bash
cat README.md
```

### Explanation

The README spells out the task:

```
This time your task is to create a file and push it to the remote repository.

Details:
    File name: key.txt
    Content: 'May I come in?'
    Branch: master
```

### Why It Matters

Read the brief literally — the filename, the *exact* content (`May I come in?`, including the question mark), and the target branch all matter. The server-side hook checks them precisely.

---

### Command

```bash
echo 'May I come in?' > key.txt
git add key.txt
```

### Explanation

We create `key.txt` with the required content, then try to stage it. But `git add key.txt` produces **no output and stages nothing** — and if you'd been verbose, Git would warn the path is ignored. A `git status` confirms there's nothing to commit.

> [!NOTE]
> `echo 'May I come in?'` adds a trailing newline. The hook in this level accepts the line; if a strict server didn't, you'd use `printf 'May I come in?'` to avoid the newline. Match the brief exactly when in doubt.

### Why It Matters

A silent "add" that does nothing is a classic trap. When `git add` appears to succeed but `git status` shows no staged change, suspect `.gitignore`.

---

### Command

```bash
cat .gitignore
```

### Explanation

The ignore file reveals the obstacle:

```
*.txt
```

Every `.txt` file is excluded from normal staging — which is exactly the extension the README told you to create.

### Why It Matters

This is the level's central irony: the repo's instructions and its own `.gitignore` contradict each other on purpose, to teach you that ignore rules are advisory. They keep clutter out of commits; they do not *protect* anything and they can be bypassed at will.

---

### Command

```bash
git add -f key.txt
git commit -m "add key.txt"
```

### Explanation

`git add -f` (`--force`) overrides `.gitignore` and stages the file anyway. Now `git commit` records it. `git status` finally shows your branch ahead by one commit.

### Why It Matters

`-f` is the explicit "I know this is ignored, do it anyway" switch. It proves the point in one flag: anyone with write access can put an ignored file into history whenever they choose. `.gitignore` is not a gate.

---

### Command

```bash
git push origin master
```

### Explanation

Pushing sends your commit to the server, which runs its `pre-receive` hook. The hook validates your file and responds:

```
...
remote: Well done! Here is the password for the next level:
remote: [REDACTED]
remote:
...
To ssh://localhost/home/bandit31-git/repo
 ! [remote rejected] master -> master (pre-receive hook declined)
error: failed to push some refs to 'ssh://...'
```

The password is in the `remote:` lines. The `pre-receive hook declined` rejection that follows is **expected** — the server hands you the secret and then refuses to actually accept the commit.

### Why It Matters

Two things to internalize: (1) a "failed" push can still be a success in terms of what you were after — read all the remote output before reacting to the error; (2) the server enforces policy with a hook, not by trusting the client. Anything the client could do (force-add, edit `.gitignore`) is checked again server-side.

---

### Command

```bash
ssh bandit32@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log out and SSH in as `bandit32` with the password the hook printed.

### Why It Matters

You've now exercised the *write* side of Git over SSH, not just the read side.

## Deep Dive: Cyber Security Concept

**Two lessons in one: `.gitignore` is not security, and server-side hooks are the real gatekeeper.**

`.gitignore` exists so build artifacts, logs, and editor cruft don't accidentally get committed. It is a *filter on the convenience path* (`git add .`). It does nothing to:

- stop a determined user (`git add -f` bypasses it instantly),
- remove data already committed (an ignored-today file committed yesterday stays in history),
- protect secrets (ironically, putting `secrets.env` in `.gitignore` documents that the file *exists* and is interesting).

Treating `.gitignore` as access control is a category error — like assuming nobody will scroll past the fold of a web page.

**Git hooks** are scripts the Git binary runs at defined lifecycle points. They split into two camps:

- **Client-side hooks** (`pre-commit`, `commit-msg`, `pre-push`) live in *your* `.git/hooks/` and are trivially bypassed (`git commit --no-verify`, or just delete them). Useful for developer ergonomics; useless as enforcement against a hostile client.
- **Server-side hooks** (`pre-receive`, `update`, `post-receive`) run on the remote when you push. The client cannot skip them. This is where real policy lives: reject pushes that fail secret scanning, enforce signed commits, run CI gates — or, as here, validate a submitted file and respond.

```mermaid
sequenceDiagram
    participant C as Client (you)
    participant S as Git Server
    C->>C: git add -f key.txt; git commit
    C->>S: git push origin master
    S->>S: run pre-receive hook<br/>(inspect incoming key.txt)
    S-->>C: remote: "Well done! password: [REDACTED]"
    S-->>C: ! [remote rejected] (pre-receive declined)
    Note over C,S: Push refused on purpose;<br/>secret already delivered
```

> [!IMPORTANT]
> Security controls must live where the attacker cannot reach the off switch. A client-side check is a suggestion; a server-side hook is enforcement. The same principle is why you never trust client-side input validation in a web app.

## Offensive Security Perspective

For an attacker, this level models two everyday realities:

- **`.gitignore` as a treasure map.** When auditing a repo, an attacker reads `.gitignore` *first* — the listed paths (`.env`, `*.pem`, `config/secrets.yml`, `*.sqlite`) name precisely the sensitive files the developer was anxious about. Even if those files aren't in the repo now, the names hint at what to look for on the server, in backups, or in older commits where someone force-added one.
- **Hook abuse.** If an attacker gains write access to a repo's server-side hooks (or a CI pipeline that runs on push), a `post-receive` hook is a code-execution and persistence primitive — it runs server-side on every push. Compromised CI/CD via Git hooks is a recurring supply-chain attack pattern.

The `git add -f` move itself is a routine operator skill: getting an arbitrary file into a repo regardless of ignore rules, e.g. to plant a tracked payload or test file.

## Defensive Perspective

- **Never rely on `.gitignore` for secrets.** Keep secrets out of the repo entirely; use a secrets manager and inject at runtime. Pair with server-side `pre-receive` secret scanning so a force-added secret is *rejected at push time*.
- **Enforce policy server-side.** Branch protection, required reviews, signed-commit enforcement, and secret scanning belong on the server/forge, not in client hooks a developer can `--no-verify` past.
- **Lock down hook integrity.** Treat server-side hooks and CI pipeline definitions as privileged code: restrict who can modify them, review changes, and monitor for unexpected `post-receive`/CI edits — they're an execution and persistence vector.
- **Audit pushes.** Log push events, including rejected ones; a flurry of rejected pushes can indicate someone probing your hook logic.

## Common Beginner Mistakes

- **Assuming `git add key.txt` worked** because it printed no error — it silently did nothing.
- **Not reading `.gitignore`** and never discovering the `*.txt` rule.
- **Panicking at `pre-receive hook declined`** and missing the password printed just above it.
- **Getting the content wrong** — it must match `May I come in?` (capital M, the spaces, the question mark).
- **Pushing to the wrong branch** instead of `master`.
- **Editing/deleting `.gitignore` instead of using `-f`** — that works too, but `-f` is the intended, cleaner move.

## Key Takeaways

- `.gitignore` filters convenience commands; it is not a security boundary and `git add -f` bypasses it.
- The names inside `.gitignore` themselves leak what's sensitive.
- Server-side hooks (`pre-receive`) enforce policy the client cannot skip.
- A rejected push can still deliver exactly what you wanted — read all remote output.
- Enforcement must live where the attacker can't disable it (server, not client).

## How This Helps Build Cyber Security Expertise

- **Secure SDLC & DevSecOps:** server-side hooks and CI gates are the real mechanism for enforcing secret scanning, signing, and review — this level is a hands-on intro.
- **Supply-chain security:** understanding hook/CI execution on push is foundational to reasoning about pipeline compromise.
- **Web app security parallel:** "client checks are suggestions, server checks are enforcement" is the exact lesson behind never trusting client-side validation.
- **Repo auditing:** reading `.gitignore` for sensitive-file hints is a standard recon move.

## Additional Reading

- [Pro Git — Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [`gitignore` documentation](https://git-scm.com/docs/gitignore)
- [`git add` documentation (`-f`/`--force`)](https://git-scm.com/docs/git-add)
- [OWASP — CI/CD Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)

---

*Next up: [Level 32 → 33](./33-bandit-level-32-33.md) — the git is over; you're dropped into a shell that SHOUTS everything back at you, and you have to break out of it.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

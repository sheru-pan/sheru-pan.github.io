# OverTheWire Bandit Level 0 → Level 1

## Introduction

This is the first "real" level of Bandit, and it looks almost insultingly simple: log in, read a file, done. But that simplicity is deliberate. Level 0 → 1 is where you build the two most-used reflexes in all of security work — **list what is there**, then **read it** — and where you first confront the idea that a secret is only as safe as the file permissions and the place you stored it.

The skill being taught is basic file inspection on the Linux command line. The lesson hiding underneath it is **information disclosure**: a sensitive value (a password) is sitting in plaintext in a readable file, and anyone with access to that account can simply read it.

## Official Challenge Objective

> **The password for the next level is stored in a file called `readme` located in the home directory. Use this password to log into `bandit1` using SSH. Whenever you find a password for a level, use SSH (on port 2220) to log into that level and continue the game.**

**In plain English:** when you log in as `bandit0`, there is a file named `readme` sitting right in your home folder. Open it. The text inside is the password for the next user, `bandit1`. Then disconnect and SSH back in as `bandit1` using that password.

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

This opens an SSH session to the Bandit server as user `bandit0` on port `2220` (Bandit does not use the default SSH port 22). When prompted, the password is `bandit0`. Terminals do not echo password characters as you type — the blank prompt is expected.

### Why It Matters

SSH (Secure Shell) is *the* remote-administration protocol for Linux/Unix systems. Knowing how to specify a non-standard port (`-p 2220`) and a username (`user@host`) is fundamental — in real engagements services rarely sit on default ports, and recognizing a non-standard SSH port is itself a small piece of reconnaissance.

---

### Command

```bash
pwd
ls -la
```

### Explanation

`pwd` ("print working directory") confirms you are in `/home/bandit0`. `ls -la` lists **all** files — including hidden dotfiles (`-a`) — in **long** format (`-l`), which shows permissions, owner, group, size, and modification time. You should see `readme` listed.

### Why It Matters

`ls -la` is the single most valuable orientation command in Linux security work. It answers "what is here, who owns it, and who can read/write/execute it?" in one line. Hidden files (which you will exploit in Level 3 → 4) and permission bits (Level 19 → 20 and beyond) are invisible without it.

---

### Command

```bash
cat readme
```

### Explanation

`cat` concatenates a file to standard output — in practice, "print this file to my screen." The contents of `readme` is the password for `bandit1`:

```
The password you are looking for is: [REDACTED]
```

### Why It Matters

`cat` is the fastest way to read a small text file, and reading files is what you will spend most of a pentest doing. The deeper point: this password lives in **plaintext** in a **readable** file. There is no encryption, no access control beyond "be logged in as this user." That is exactly how real credential leaks happen.

---

### Command

```bash
ssh bandit1@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log out (`exit`) and reconnect as the next user, `bandit1`, using the password you just read. You are now in Level 1.

### Why It Matters

This is the core game loop, and it mirrors **lateral movement / privilege progression** in real attacks: use a credential found on one account to authenticate as the next.

## Deep Dive: Cyber Security Concept

**Information Disclosure (Sensitive Data Exposure).**

This level is a miniature model of one of the most common real-world findings: secrets stored in plaintext where they should not be. In production environments the `readme` file becomes:

- A database password hardcoded in a config file (`config.php`, `application.yml`, `.env`).
- API keys committed to a repository or left in a build artifact.
- A `credentials.txt` on a shared drive "just for the team."
- Cloud keys in `~/.aws/credentials` on a compromised workstation.

The technical failure is always the same shape: **a sensitive value is readable by a principal who should not be trusted with it.** Encryption is absent, access control is too broad, or the data is simply in the wrong place. Attackers don't need an exploit for any of this — they need *read access* and the discipline to look.

> [!IMPORTANT]
> A secret in a plaintext file is protected only by the file's permissions and the secrecy of its location. Both are weak controls. "Nobody knows it's there" is not security.

## Offensive Security Perspective

In a real engagement, the moment a penetration tester or red teamer lands an initial foothold on a host, the very first move is **local enumeration** — and "read the obvious files" is step one. Operators routinely:

- Read the current user's home directory, history files (`.bash_history`), SSH keys (`~/.ssh/`), and config files.
- Grep the filesystem for the words `password`, `passwd`, `secret`, `token`, `api_key`.
- Pull credentials out of web app config files to pivot into databases.

Bug bounty hunters find this constantly too — an exposed `.env` file, a `backup.sql` left in a web root, a verbose error page leaking a connection string. The `readme` in this level is the training-wheels version of all of them.

## Common Beginner Mistakes

- **Forgetting `-p 2220`** and getting "Connection refused" because SSH tried port 22.
- **Expecting the password field to show characters** as you type, then assuming the keyboard is broken.
- **Blindly `cat`-ing files** without running `ls -la`/`file` first — harmless here, but it forms a bad habit that bites you on binary-data levels.
- **Trying to `cd` into `readme`** (it is a file, not a directory).
- **Typos when copying the password** — copy/paste the exact string; these passwords are long and case-sensitive.

## Key Takeaways

- The home directory is the first place to look on any account.
- `ls -la` then `cat` is the bread-and-butter inspection workflow.
- SSH needs a username, host, and (here) a non-default port.
- Plaintext secrets in readable files are an information-disclosure problem, full stop.
- Enumeration before action is the habit that wins every later level.

## How This Helps Build Cyber Security Expertise

This trivially small level is the seed of several advanced offensive disciplines:

- **Linux internals & privilege escalation:** post-exploitation always begins with reading files and understanding who can read what. Tools like `linpeas` automate exactly the "look at the obvious files" instinct you just practiced.
- **Red team operations:** harvesting plaintext credentials from a foothold is a core step toward lateral movement and deeper access across an environment.
- **Cloud pentesting:** the cloud equivalent of `readme` is an over-permissive S3 bucket or a key in instance metadata; the failure mode (readable secret) is identical.
- **Active Directory attacks:** the same "read the obvious files" reflex surfaces credentials in scripts, shares, and config files that fuel domain compromise.

## Additional Reading

- [`man ssh`](https://man7.org/linux/man-pages/man1/ssh.1.html) and [`man ls`](https://man7.org/linux/man-pages/man1/ls.1.html), [`man cat`](https://man7.org/linux/man-pages/man1/cat.1.html)
- [OWASP — Sensitive Data Exposure / Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [Linux Filesystem Hierarchy — home directories](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [MITRE ATT&CK — T1552: Unsecured Credentials](https://attack.mitre.org/techniques/T1552/)

---

*Next up: [Level 1 → 2](./02-bandit-level-1-2.md), where a file with an awkward name teaches you that the shell is not always your friend.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

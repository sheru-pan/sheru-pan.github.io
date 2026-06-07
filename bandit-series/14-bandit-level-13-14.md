# OverTheWire Bandit Level 13 → Level 14

## Introduction

Up to this point every Bandit level has handed you a *password* — a string you typed (or pasted) at an SSH prompt. Level 13 → 14 breaks that pattern in a way that trips up almost everyone the first time: instead of a password, your home directory contains a **private SSH key**. The challenge is no longer "find the secret string" but "understand how the secret you already have is actually *used*."

That shift is the whole point. This level teaches **public-key (asymmetric) authentication** — the mechanism that protects essentially every production Linux server on the planet — along with two operational gotchas that bite real engineers daily: SSH **refuses private keys with loose file permissions**, and access can be **restricted by source host**, so the same key that is valid can still be rejected depending on *where* you connect from.

## Official Challenge Objective

> **The password for the next level is stored in `/etc/bandit_pass/bandit14` and can only be read by user `bandit14`. For this level you don't get the next password, but you get a private SSH key to log into the next level. Look at how previous logins worked and find out how to use the key. A hint file is in the home directory. Read error messages carefully.**

**In plain English:** there is no password to copy this time. In your home directory sits a file containing a *private key*. That key is the credential `bandit14` uses to log in. Your job is to use the key to authenticate as `bandit14` over SSH. Once you are `bandit14`, you could read `/etc/bandit_pass/bandit14` yourself — because that file is readable only by `bandit14`.

## Skills Covered

- SSH **public-key authentication** and the concept of a key *pair*
- Using a private key with `ssh -i`
- Why SSH enforces strict **private-key file permissions** (`chmod 600`)
- Copying files off a remote host with `scp`
- **Host-based access restrictions** (`AllowUsers`/`Match` in `sshd_config`, or `from=` in `authorized_keys`)
- Reading SSH error messages diagnostically

## My Approach

This level was genuinely interesting, and it was the first one where the "obvious" path didn't work and I had to actually *think about the infrastructure* rather than just the file in front of me.

My first move was the obvious one: I found `sshkey.private` in the home directory and tried to use it to SSH to `bandit14` directly from inside the Bandit box. SSH happily accepted the key — but the connection was rejected. That was the lightbulb moment: the key was *correct*, but logins as `bandit14` were not permitted **from localhost** (i.e. from the Bandit machine itself). So I pivoted: I copied the private key down to **my own local machine** with `scp`, fixed its permissions, and SSH'd to `bandit14` from there instead. That worked immediately.

The lesson stuck with me precisely because the failure wasn't about *me* — it was about *where I was connecting from*.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit13@bandit.labs.overthewire.org -p 2220
ls -la
```

### Explanation

Log in as `bandit13` (using the password from the previous level), then enumerate the home directory. You will find a file named `sshkey.private` — an OpenSSH **private key**, not a password.

### Why It Matters

Recognizing a private key on sight is a core skill. A file that begins with `-----BEGIN RSA PRIVATE KEY-----` (or `-----BEGIN OPENSSH PRIVATE KEY-----`) is a credential at least as valuable as a password — often more, because keys are frequently reused and rarely rotated. In real post-exploitation, finding a private key in `~/.ssh/` or a backup is a direct ticket to lateral movement.

---

### Command

```bash
scp bandit13@bandit.labs.overthewire.org:/home/bandit13/sshkey.private .
```

### Explanation

`scp` (secure copy) transfers a file over SSH. Run this **from your own local machine**, not from inside the Bandit box. It connects as `bandit13`, reads `/home/bandit13/sshkey.private` from the server, and writes it into your current local directory (`.`). You will be asked for the `bandit13` password.

> [!NOTE]
> Bandit listens on port `2220`, not the default `22`. With `scp` the port flag is **capital `-P`** (lowercase `-p` means "preserve timestamps"). If your `scp` complains about the port, the full form is:
> ```bash
> scp -P 2220 bandit13@bandit.labs.overthewire.org:/home/bandit13/sshkey.private .
> ```
> The shorthand `bndt` you may see in notes is just an SSH config alias for `bandit.labs.overthewire.org` on port 2220.

### Why It Matters

You copied the key *off* the box because of the host restriction described below. More generally, exfiltrating a discovered key to an attacker-controlled machine is exactly how operators use stolen credentials — the key is only useful from somewhere you are allowed to connect from.

---

### Command

```bash
chmod 600 sshkey.private
```

### Explanation

This sets the file's permissions to `rw-------` — readable and writable **only by you**, no access for group or others. SSH **deliberately refuses** to use a private key that is readable by anyone else, and will print a warning like:

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for 'sshkey.private' are too open.
```

### Why It Matters

This is not bureaucratic nagging — it is a security control. A private key is the *entire* secret behind your identity; if other local users can read it, your identity is compromised. SSH refuses to proceed rather than let you accidentally leak it. Knowing the `chmod 600` fix on sight saves you from a confusing error every time you handle a key.

> [!TIP]
> The same rule applies to the whole `~/.ssh` directory (mode `700`) and to `authorized_keys` (mode `600`). When key auth "silently fails," loose permissions are the first thing to check.

---

### Command

```bash
ssh bandit14@bandit.labs.overthewire.org -i sshkey.private -p 2220
```

### Explanation

`-i sshkey.private` tells SSH to use this specific **identity file** (private key) for authentication instead of (or in addition to) the default keys in `~/.ssh/`. Run from your local machine, this authenticates you as `bandit14` with no password prompt — the key *is* the credential.

(Using the alias: `ssh bandit14@bndt -i sshkey.private`.)

### Why It Matters

This is the canonical way to authenticate with a key file you control. The same `-i` flag is how you use any harvested or issued key during an engagement, and how administrators log in to cloud servers (AWS/GCP hand you a `.pem` and you connect with `ssh -i key.pem user@host`).

---

### Command (verification — optional)

```bash
cat /etc/bandit_pass/bandit14
```

### Explanation

Now that you are `bandit14`, you can read your own password file. It contains the Level 14 password:

```
[REDACTED]
```

### Why It Matters

It closes the loop: the objective said this file is readable *only by `bandit14`*, and now that you *are* `bandit14`, the file's access control grants you the read. This is permission-based confidentiality working exactly as designed.

## Deep Dive: Cyber Security Concept

**Asymmetric (public-key) authentication.**

Password authentication relies on a shared secret: both sides know the same string. Public-key auth uses a mathematically linked **key pair**:

- A **private key**, kept secret on the client, that can produce signatures.
- A **public key**, placed on the server (in `~/.ssh/authorized_keys`), that can *verify* those signatures but cannot produce them.

```mermaid
sequenceDiagram
    participant C as Client (has private key)
    participant S as Server (has public key in authorized_keys)
    C->>S: I want to log in as bandit14
    S->>C: Challenge (random nonce)
    C->>C: Sign nonce with PRIVATE key
    C->>S: Signed response
    S->>S: Verify signature with PUBLIC key
    S-->>C: Signature valid → access granted
```

The private key never crosses the network, which is the central advantage over passwords. But that strength comes with responsibilities: the private key is a bearer credential. Anyone who holds the file (and can satisfy any extra restrictions) *is* you. That is why permissions matter (`chmod 600`) and why losing a key is as serious as losing a password — arguably worse, since keys are long-lived and seldom rotated.

The second concept this level quietly teaches is **host-based access restriction**. A valid key is necessary but not always sufficient. Administrators can constrain *where* a key (or user) may connect from:

- In `sshd_config`: `AllowUsers bandit14@!localhost` style rules, or a `Match Address` block.
- In `authorized_keys`: a `from="..."` option prefixing the key, restricting it to specific source addresses.

That is exactly why logging in as `bandit14` failed from *inside* the Bandit box but succeeded from your own machine: the same key, rejected from one source and accepted from another.

> [!IMPORTANT]
> Authentication has two questions: *"Is this credential valid?"* and *"Are you allowed to use it from here, now?"* A correct key can still be refused by policy. When a key is rejected, read the error — "Permission denied (publickey)" after the key was *offered* often points to a server-side restriction, not a bad key.

## Offensive Security Perspective

Private keys are one of the highest-value loot items in any compromise:

- **Lateral movement.** A key found on host A often unlocks hosts B, C, and D — especially in environments that reuse a single deployment key across a fleet. MITRE ATT&CK tracks this as **T1552.004 (Unsecured Credentials: Private Keys)**.
- **Where operators look:** `~/.ssh/id_rsa`, `id_ed25519`, `*.pem`, backup archives, CI/CD runners, Terraform state, and developer laptops. A quick `find / -name "id_rsa" 2>/dev/null` or grepping for `BEGIN.*PRIVATE KEY` is standard practice.
- **Exfiltrate, then connect from your box.** Just like this level, attackers copy a key to infrastructure they control and authenticate remotely — partly for tooling, partly because the target host may itself be restricted as a source.
- **Persistence:** dropping their *own* public key into a victim's `authorized_keys` gives an attacker durable, password-less re-entry. Hunting for unexpected `authorized_keys` entries is a key detection.

## Defensive Perspective

- **Protect private keys with a passphrase.** An encrypted key (`ssh-keygen -p`) is useless to a thief who only has the file, buying you time to rotate.
- **Enforce permissions.** Configuration management should assert `~/.ssh` = `700` and key files = `600`; SSH's own refusal of loose keys is a backstop, not a strategy.
- **Restrict by source.** Use `from="10.0.0.0/8"` in `authorized_keys`, `Match Address`/`AllowUsers` in `sshd_config`, and disable direct login for sensitive accounts from untrusted networks — precisely the control that blocked the localhost login here.
- **Prefer short-lived certificates.** SSH certificate authorities (or solutions like Teleport / HashiCorp Vault SSH) issue keys that expire in minutes/hours, drastically shrinking the value of a stolen key.
- **Centralize and audit.** Inventory which public keys are authorized where. Alert on new `authorized_keys` entries and on `Accepted publickey` events for sensitive accounts in `/var/log/auth.log`.

## Common Beginner Mistakes

- **Skipping `chmod 600`** and getting "UNPROTECTED PRIVATE KEY FILE!" — then assuming the key is broken.
- **Using `scp -p` instead of `-P 2220`** for the port (lowercase `-p` preserves timestamps; the port flag is uppercase).
- **Trying to log in as `bandit14` from inside the Bandit box** and concluding the key is invalid, when it is actually a *host restriction*. Read the error carefully, as the level instructs.
- **Forgetting `-i`** and wondering why SSH still asks for a password (it fell back to password auth).
- **Copying the public key by mistake** — you authenticate with the *private* key (`-i sshkey.private`).
- **Pasting the key into the wrong file / corrupting it** by editing — keep the exact bytes intact.

## Key Takeaways

- A private SSH key is a credential — treat a `BEGIN ... PRIVATE KEY` file like a password, only more so.
- `ssh -i <keyfile>` is how you authenticate with a specific key.
- SSH refuses keys with loose permissions; `chmod 600` is the fix.
- A valid key can still be rejected by **host-based restrictions** — *where* you connect from matters.
- "Read the error messages" is real advice: `Permission denied (publickey)` vs a permissions warning point to different root causes.

## How This Helps Build Cyber Security Expertise

- **Pentest / red team:** harvesting and reusing SSH keys is a primary lateral-movement technique; this is the hands-on version of T1552.004.
- **Cloud & DevOps security:** every cloud VM you ever touch uses `ssh -i key.pem` — and key sprawl across CI/CD is a top real-world risk you now understand from the inside.
- **Blue team / detection:** knowing how key auth and source restrictions work lets you write meaningful alerts on `Accepted publickey`, new `authorized_keys` entries, and logins from unexpected sources.
- **Systems hardening:** you now know *why* `sshd_config` and `authorized_keys` options exist and how to use them to constrain access.

## Additional Reading

- [`man ssh`](https://man7.org/linux/man-pages/man1/ssh.1.html), [`man scp`](https://man7.org/linux/man-pages/man1/scp.1.html), [`man ssh-keygen`](https://man7.org/linux/man-pages/man1/ssh-keygen.1.html)
- [`man sshd_config`](https://man7.org/linux/man-pages/man5/sshd_config.5.html) — see `AllowUsers`, `Match`
- [`man authorized_keys`](https://man7.org/linux/man-pages/man8/sshd.8.html) — `from=` and other key options
- [MITRE ATT&CK — T1552.004: Unsecured Credentials: Private Keys](https://attack.mitre.org/techniques/T1552/004/)
- [SSH.com — Public Key Authentication](https://www.ssh.com/academy/ssh/public-key-authentication)

## Personal Reflection

This level was very interesting — it was the first one that punished a too-literal reading of the problem. My key worked. My permissions (after `chmod 600`) were fine. And it *still* refused me, because I was logging in from the wrong place. The fix wasn't more technique; it was changing my vantage point: copy the key down to my own machine and connect from there. That tiny pivot reframed how I think about authentication. A credential isn't a magic word that works everywhere — it works *under a policy*, and the policy includes context like source host. Internalizing that early made every later "why is this denied?" moment much faster to diagnose, because now my reflex is to separate "is the credential valid?" from "am I allowed to use it from here?"

---

*Next up: [Level 14 → 15](./15-bandit-level-14-15.md) — talking to a raw TCP service by hand with netcat.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

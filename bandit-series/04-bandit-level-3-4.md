# OverTheWire Bandit Level 3 → Level 4

## Introduction

This level moves you from "the file has a weird name" to "the file is *hidden*." The password sits inside a subdirectory called `inhere`, but a plain `ls` shows it as empty. Nothing was deleted — the file's name begins with a dot, and by convention every standard Linux tool treats dot-prefixed names as **hidden** and omits them from default listings.

The lesson is the **dotfile convention** and the enumeration habit that defeats it: `ls -la`. Hidden files are not a security mechanism — they are a *visibility* convention — yet they are one of the oldest and most common places to stash things you do not want a casual observer to notice. Attackers exploit that all the time.

## Official Challenge Objective

> **The password for the next level is stored in a hidden file in the `inhere` directory.**

**In plain English:** change into the `inhere` directory. A normal `ls` will look empty because the file you want has a name starting with `.`, which hides it. List *all* files, including hidden ones, find the dotfile, and read it.

## Skills Covered

- The Unix hidden-file (dotfile) convention
- Thorough enumeration with `ls -la` / `ls -a`
- Navigating directories (`cd`)
- Reading dot-prefixed files safely
- Understanding why "hidden" ≠ "secure"

## My Approach

My note for this one was short: *hidden file, `...filename`*. After `cd inhere`, a plain `ls` came back empty, which is the tell — when a directory you *know* contains a file looks empty, the file is almost certainly hidden. I ran `ls -la` to reveal everything, spotted the dot-prefixed file, and `cat`-ed it. Worth flagging: some Bandit instances name this file with leading dots and dashes (e.g. `...Hiding-From-You`), which is hidden *and* starts with a dash, so the `./` habit from Level 1 → 2 comes back into play.

## Step-by-Step Walkthrough

### Command

```bash
ls -la inhere
```

### Explanation

Instead of `cd`-ing first, you can list the target directory directly. `ls -la inhere`:

- `-l` long format (permissions, owner, size, mtime)
- `-a` **all** entries, including those beginning with `.`

This reveals the hidden file along with the always-present `.` (current dir) and `..` (parent dir) entries. Depending on your Bandit instance the file is named something like `.hidden` or `...Hiding-From-You`.

### Why It Matters

`ls -la` is the difference between "this directory is empty" and "this directory has secrets." Default `ls` omits dotfiles, which is exactly why so many people miss SSH keys (`.ssh/`), shell history (`.bash_history`), and credential caches (`.aws/`, `.docker/config.json`) during a hurried look.

---

### Command

```bash
cd inhere
cat ./.hidden_file
```

### Explanation

`cd inhere` enters the directory; `cat ./.hidden_file` reads the hidden file. The `./` prefix is good hygiene here — it makes the path explicit and protects you if the real filename starts with a dash (as `...Hiding-From-You` effectively does). The file's contents are the bandit4 password:

```
[REDACTED]
```

> [!TIP]
> If the filename is awkward (leading dots *and* dashes), let the shell help: type `cat ./` then press `Tab` to complete it, or glob it with `cat ./.*` (note: `.*` also matches `.` and `..`, so prefer `cat ./.[!.]*` to skip them, or just tab-complete the exact name).

### Why It Matters

Combining everything so far — hidden-file awareness, the `./` prefix, and careful reading — is exactly the layered care real enumeration demands. No single trick; the right *combination* of habits.

## Deep Dive: Cyber Security Concept

**The dotfile convention and security-through-obscurity.**

On Unix-like systems there is nothing magical about a hidden file. A file is "hidden" purely because its name starts with `.`, and tools like `ls` and shell globbing simply *choose by default* not to show dot-prefixed names. (Fun history: this behavior was an accident — early `ls` authors added a filter to hide `.` and `..`, and it happened to hide everything starting with a dot.)

There is **no access control** involved. The hidden file has whatever permissions it has; `ls -la`, `find`, `echo .*`, a file manager with "show hidden" enabled, or any program opening the path by name will read it just fine. Hiding a secret by naming it `.secret` is a textbook case of **security through obscurity** — it raises the bar for a *casual* observer but stops a deliberate one for exactly zero seconds.

> [!IMPORTANT]
> Obscurity can be a *layer* (it slows reconnaissance), but it is never a *control*. If discovering the file is the only thing protecting it, it is not protected.

## Offensive Security Perspective

Dotfiles are prime hunting ground in post-exploitation:

- **Credential harvesting:** `~/.ssh/id_rsa`, `~/.aws/credentials`, `~/.git-credentials`, `~/.netrc`, `~/.docker/config.json`, `~/.kube/config` — almost all the juicy local secrets live in dotfiles.
- **History mining:** `~/.bash_history`, `~/.mysql_history`, `~/.python_history` frequently contain passwords typed inline.
- **Persistence & hiding:** attackers drop malware and backdoors with dot-prefixed names, sometimes with trailing spaces or unusual Unicode, to slip past a hurried `ls`. Hidden directories like `/tmp/...` or `/dev/shm/.x` are classic staging spots.

Standard enumeration scripts (`linpeas`, `LinEnum`) always recurse into and list hidden files for precisely this reason — the first thing a thorough operator does is `ls -la` everywhere.

## Defensive Perspective

- **Do not rely on hidden names to protect data.** Enforce permissions (`chmod 600`), ownership, and proper secret storage; the dot is cosmetic.
- **File integrity monitoring (FIM):** tools like AIDE, Tripwire, or `auditd` watches on home/temp directories detect newly created hidden files — a strong indicator of malware staging.
  ```bash
  auditctl -w /tmp -p wa -k tmp_writes
  ```
- **Hunt for hidden artifacts:** periodically run `find / -name '.*' -type f -newer <baseline>` or hunt for hidden files in `/tmp`, `/dev/shm`, `/var/tmp`, and web roots — common attacker hiding spots.
- **Detection engineering:** alert on creation of dot-prefixed executables in world-writable directories, or on reads of sensitive dotfiles (`~/.ssh/id_rsa`) by unexpected processes.
- **User hardening:** keep `.bash_history` clean of secrets (`HISTCONTROL=ignorespace`, and never type passwords on the command line).

## Common Beginner Mistakes

- Running plain `ls`, seeing nothing, and concluding the directory is empty or the level is broken.
- Forgetting the `-a` flag — `ls -l` alone still hides dotfiles.
- Stumbling on filenames that are hidden *and* start with a dash, then forgetting the `./` fix from Level 1 → 2.
- Using `cat .*` and getting confused output because `.*` also matches `.` and `..`.
- Not quoting/escaping if the hidden filename also contains spaces.

## Key Takeaways

- A leading `.` makes a file *hidden by convention*, not protected.
- `ls -la` (or `ls -a`) reveals everything; make it your default reflex.
- `.` and `..` are entries too — account for them when globbing.
- Hidden files are where real-world secrets (SSH keys, histories, cloud creds) live.
- Hiding ≠ securing: this is security through obscurity.

## How This Helps Build Cyber Security Expertise

- **Post-exploitation & privesc:** thorough hidden-file enumeration is step one of every local assessment; you just practiced the manual version of what `linpeas` automates.
- **DFIR & threat hunting:** investigators routinely uncover attacker persistence by finding rogue dotfiles and hidden directories — the same `ls -la`/`find` muscle.
- **Malware analysis:** understanding common hiding conventions helps you locate dropped payloads quickly.
- **Secure system design:** internalizing "obscurity is not a control" shapes how you architect real defenses.

## Additional Reading

- [`man ls`](https://man7.org/linux/man-pages/man1/ls.1.html), [`man find`](https://man7.org/linux/man-pages/man1/find.1.html)
- [The origin of "dot files are hidden" — Rob Pike / Unix history](https://linux-audit.com/linux-history-how-dot-files-became-hidden-files/)
- [MITRE ATT&CK — T1564.001: Hide Artifacts: Hidden Files and Directories](https://attack.mitre.org/techniques/T1564/001/)
- [MITRE ATT&CK — T1552: Unsecured Credentials](https://attack.mitre.org/techniques/T1552/)

---

*Next up: [Level 4 → 5](./05-bandit-level-4-5.md) — ten lookalike files, only one readable; the `file` command teaches you to judge a file by its bytes, not its name.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

# OverTheWire Bandit Level 6 → Level 7

## Introduction

The previous level confined the search to a single directory. This one removes the fence entirely: the password could be **anywhere on the server**. To find it you will search the whole filesystem from the root (`/`) and narrow the results using a new axis of metadata — **ownership**. You will also meet one of the most practical tricks in the entire toolkit: redirecting error output to `/dev/null` so the signal isn't buried under a flood of "Permission denied" noise.

A server-wide `find` is a rite of passage. It is the exact move an attacker makes after gaining a foothold and the exact move a defender makes when hunting for an artifact whose location is unknown. Doing it cleanly — getting only the lines that matter — is a skill in itself.

## Official Challenge Objective

> **The password for the next level is stored somewhere on the server and has all of these properties:**
> - **owned by user bandit7**
> - **owned by group bandit6**
> - **33 bytes in size**

**In plain English:** the file is not in your home directory this time — it is somewhere on the entire system. You know three things about it: its owning *user* is `bandit7`, its owning *group* is `bandit6`, and it is exactly 33 bytes. Search from the root of the filesystem, filter on those three properties, and read the one file that matches to get the password for `bandit7`.

## Skills Covered

- System-wide search starting from `/`
- Filtering by file owner (`-user`)
- Filtering by owning group (`-group`)
- Filtering by exact byte size (`-size 33c`)
- Suppressing stderr noise with `2>/dev/null`
- Understanding Unix user/group ownership

## My Approach

The structure is identical to the previous level — translate each property into a `find` predicate — but two things change:

1. **The search root is `/`, not `.`.** Because the file could be anywhere, I have to start from the top of the filesystem and let `find` walk the entire tree.
2. **A server-wide search hits directories I'm not allowed to enter,** so `find` prints a "Permission denied" line for each one. Those errors go to **stderr** (file descriptor 2), while the actual matches go to **stdout** (fd 1). By appending `2>/dev/null` I throw away the error stream and keep only the real results.

The three properties map cleanly to `-user bandit7`, `-group bandit6`, and `-size 33c`. Only one file on the system satisfies all three, so I again append `-exec cat {} +` to print it directly.

> [!TIP]
> `2>/dev/null` is one of the highest-value habits you can build. It turns a screen full of permission-denied spam into a clean list of exactly the matches you care about. The errors are expected and irrelevant here — you simply lack access to those paths.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit6@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit6` over SSH on port `2220` using the password from the previous level. You land in `/home/bandit6`, but this time the target file is *not* here — it is somewhere out on the wider filesystem.

### Why It Matters

Recognizing that the answer lives outside your home directory is the mental shift this level forces. Post-exploitation often means searching territory you do not own.

---

### Command

```bash
find / -type f -size 33c -user bandit7 -group bandit6 2>/dev/null -exec cat {} +
```

### Explanation

The complete solution. Breaking it down:

- `find /` — begin the search at the **root** of the filesystem and recurse through everything.
- `-type f` — only regular files.
- `-size 33c` — exactly 33 bytes (the `c` suffix = bytes, not 512-byte blocks).
- `-user bandit7` — the file's owning **user** must be `bandit7`.
- `-group bandit6` — the file's owning **group** must be `bandit6`.
- `2>/dev/null` — redirect **file descriptor 2 (stderr)** to the null device, discarding all "Permission denied" messages from directories you cannot enter. Your matches still print normally because they go to stdout (fd 1).
- `-exec cat {} +` — read every matching file in one batched `cat` call.

The single matching file's contents is the password for `bandit7`:

```
[REDACTED]
```

> [!NOTE]
> Placement of `2>/dev/null` is forgiving here, but conceptually it is a shell redirection applied to the whole `find` command. Whether you write it before or after `-exec`, the shell strips it out and attaches it to the process; the predicates still all apply.

### Why It Matters

This is the canonical "find a file you know three facts about, anywhere on the box" command. The ownership filters introduce a metadata axis that name and size alone cannot capture, and the `2>/dev/null` redirection is the difference between a usable result and an unreadable wall of errors.

## Deep Dive: Cyber Security Concept

**Unix ownership: user, group, and why it matters.**

Every file on a Unix system has two ownership attributes: an owning **user** and an owning **group**. Together with the permission bits (read/write/execute for user, group, and other), they form the entire classic Unix access-control model. The combination in this level — owned by user `bandit7` but group `bandit6` — is deliberate and instructive: a file can be owned by one principal while granting a *different* principal access through its group.

This cross-ownership is the seed of a hugely important real-world pattern:

- A file **owned by a privileged user** but **readable by a less-privileged group** is a classic information-leak vector. You (as `bandit6`) can read a file that `bandit7` owns precisely because the group is set to `bandit6`.
- The same mechanic, applied to writable files or executable scripts, is a staple of **privilege escalation**: if a low-privileged group can *write* to a file that a higher-privileged process *runs*, that's a path to escalation.

Searching by ownership lets you map these relationships across a whole system: "what files does the database service account own?", "what is group-readable by the `www-data` group?" — questions that reveal exactly where trust boundaries are crossed.

> [!IMPORTANT]
> Ownership and permissions together define who can do what. A file's *owner* is not the only one who can access it — the *group* and *other* bits matter just as much. Cross-ownership (owned by one user, grouped to another) is where access-control surprises hide.

## Offensive Security Perspective

A server-wide ownership search is a core post-exploitation move. After landing as a low-privileged user, operators ask "what can I reach that belongs to someone more interesting?":

```bash
# files owned by root but group-readable by my group
find / -type f -group "$(id -gn)" -user root 2>/dev/null
# files writable by my user or group anywhere on the box
find / -writable -type f 2>/dev/null
# files owned by a target service account
find / -user postgres -type f 2>/dev/null
```

The `2>/dev/null` habit is essential operationally: noisy output is slow to read and can hint to a watchful defender that you are enumerating. Combining ownership, permissions, and size lets an operator pinpoint exactly the misconfigured file that bridges a trust boundary — the same logic this level demonstrates with a single planted file.

## Defensive Perspective

- **Audit cross-ownership and over-permissive files** as part of routine hardening. A scheduled job can sweep for risky combinations:
  ```bash
  # group-readable files owned by sensitive accounts
  find / -xdev -type f -user root -perm -040 2>/dev/null
  ```
- **File integrity monitoring (AIDE, Tripwire, Wazuh)** baselines ownership and permissions, alerting when a file's owner or group changes — a strong indicator of tampering or a misconfigured deploy.
- **Detection engineering:** a low-privileged account running a recursive `find /` is a hallmark of enumeration. auditd `execve` rules or EDR can flag `find /` invocations, especially from service accounts that should never run interactive commands.
- **Least privilege:** the root cause of this level is a sensitive file being group-accessible to a less-trusted account. Set the narrowest possible owner/group and `chmod 600`/`640` on credential files so only the intended principal can read them.

## Common Beginner Mistakes

- **Searching from `.` or the home directory** instead of `/`, so the file (which lives elsewhere) is never found.
- **Forgetting `2>/dev/null`,** then scrolling through hundreds of permission-denied lines and missing the one real match.
- **Confusing `-user` and `-group`** — owner-by-user and owner-by-group are distinct tests; swap them and you get nothing.
- **Dropping the `c` from `-size 33c`,** turning a byte search into a block search.
- **Using `2>&1` instead of `2>/dev/null`** — that *merges* errors into your output rather than discarding them, making things worse.
- **Expecting the search to be instant** — walking the whole filesystem takes a moment; be patient.

## Key Takeaways

- Start system-wide searches from `/` when the location is unknown.
- `-user` and `-group` filter by owning user and owning group respectively.
- `2>/dev/null` discards stderr (the permission-denied noise) and keeps real matches.
- Cross-ownership (owned by one user, grouped to another) is a deliberate access-control pattern — and a common leak vector.
- Combine ownership + size + type to pinpoint a single file anywhere on a host.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** finding files you can read or write that belong to higher-privileged accounts is a primary escalation technique; this is the foundational query.
- **DFIR:** investigators trace which account owns a suspicious artifact to attribute activity and scope an incident.
- **System administration / hardening:** ownership audits are a standard part of securing multi-user systems and meeting compliance baselines.
- **Operational discipline:** mastering stream redirection (`2>/dev/null`, `2>&1`, `>>`) is fundamental to building clean, scriptable tooling.

## Additional Reading

- [`man find`](https://man7.org/linux/man-pages/man1/find.1.html) — see `-user`, `-group`, and `-size`
- [Linux file ownership and permissions](https://www.redhat.com/sysadmin/linux-file-permissions-explained)
- [Bash redirections explained](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [MITRE ATT&CK — T1083: File and Directory Discovery](https://attack.mitre.org/techniques/T1083/)
- [MITRE ATT&CK — T1222: File and Directory Permissions Modification](https://attack.mitre.org/techniques/T1222/)

---

*Next up: [Level 7 → 8](./08-bandit-level-7-8.md) — pulling a single answer out of a large text file with surgical `grep`.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

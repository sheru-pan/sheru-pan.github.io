# OverTheWire Bandit Level 5 → Level 6

## Introduction

By now you have met `find` as a way to locate a file by name or by a single attribute. Level 5 → 6 raises the bar: the password is hidden somewhere under a directory tree full of decoys, and the only way to pick it out is to describe it precisely using **several attributes at once** — its type, its exact size in bytes, and the fact that it is *not* executable.

This is a deceptively important skill. Real filesystems are noisy. When you are a pentester hunting for a config file, SSH key, or credential store on a compromised host, the win usually comes not from one clever filter but from **stacking constraints** until only the thing you want survives. This level teaches you to think of `find` as a query language.

## Official Challenge Objective

> **The password for the next level is stored in a file somewhere under the `inhere` directory and has all of these properties:**
> - **human-readable**
> - **1033 bytes in size**
> - **not executable**

**In plain English:** inside your home directory there is a folder called `inhere`. It contains many subdirectories stuffed with files of all shapes and sizes — most are noise. Exactly one matches all three properties: it is a normal text (human-readable) file, it is precisely 1033 bytes, and it does not have the executable permission bit set. Find that one file and read it; its contents are the password for `bandit6`.

## Skills Covered

- Recursive search with `find`
- Filtering by file type (`-type f`)
- Filtering by exact size in bytes (`-size 1033c`)
- Negating a permission test (`! -executable`)
- Combining multiple predicates into a single precise query
- Piping `find` results into an action (`-exec ... +`)

## My Approach

The level basically hands you a search specification, so my job was just to translate each English property into a `find` predicate and chain them together:

- "somewhere under the `inhere` directory" → run `find` starting from `inhere` (or `cd` into it and search from `.`).
- "human-readable" → in practice this means a regular file, not a device, pipe, or directory, so `-type f`. (Bandit's decoys also include zero-byte and oddly-sized files; the size filter does most of the real work here.)
- "1033 bytes in size" → `-size 1033c`. The `c` suffix is the part beginners miss — without it, `find` measures in 512-byte blocks, not bytes.
- "not executable" → `! -executable`.

Once those four predicates are stacked, exactly one file matches, so I let `find` print it straight to the screen with `-exec cat {} +` instead of hunting for the path manually.

> [!TIP]
> When a challenge spells out a file's attributes in a list, treat that list as a checklist of `find` predicates. Translate each line, AND them together, and you have your command.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit5@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit5` over SSH on port `2220` using the password you recovered in the previous level. You land in `/home/bandit5`, where you will find the `inhere` directory.

### Why It Matters

Every level begins with authenticated access, mirroring the post-exploitation reality that the interesting work starts *after* you have a foothold. The non-default port (`-p 2220`) is a small reminder that services rarely sit where you expect.

---

### Command

```bash
ls -la
cd inhere
ls -la
```

### Explanation

`ls -la` in the home directory confirms `inhere` exists. After `cd inhere`, listing again reveals a swarm of subdirectories (`maybehere00`, `maybehere01`, …), each full of files. This is the haystack.

### Why It Matters

Orienting yourself before searching tells you the *shape* of the problem. Seeing dozens of nested directories immediately rules out reading files by hand and justifies reaching for a recursive tool like `find`.

---

### Command

```bash
find . -type f ! -executable -size 1033c -exec cat {} +
```

### Explanation

This is the whole solution in one line. Reading it left to right:

- `find .` — search recursively starting from the current directory (`inhere`).
- `-type f` — only consider **regular files**, skipping directories and other special file types.
- `! -executable` — exclude any file the current user could execute; the `!` negates the `-executable` test.
- `-size 1033c` — match files whose size is **exactly 1033 bytes**. The trailing `c` means "characters/bytes." Without it, `1033` would mean 1033 × 512-byte blocks.
- `-exec cat {} +` — for every file that survived all the filters, run `cat` on it. The `{}` is replaced by the matched paths and `+` batches them into a single efficient `cat` invocation.

Because only one file satisfies all four conditions, the output is the password for `bandit6`:

```
[REDACTED]
```

> [!NOTE]
> The official wording says "human-readable," and `-type f` plus the strict size and permission filters is enough to isolate it here. If multiple regular files had matched, you could add a content check (for example piping through `file` or `grep`) to confirm which one is actual text.

### Why It Matters

This single command is a template you will reuse forever. The pattern — *start point, then a chain of ANDed predicates, then an action* — is exactly how you locate a needle in any filesystem. The `-size Nc` byte suffix and the `!` negation are two of the most commonly fumbled details in `find`, and getting them right here means you will get them right under pressure later.

## Deep Dive: Cyber Security Concept

**Attribute-based file discovery.**

A file on a Unix system is far more than its name. The inode behind it records its type, exact size, owner, group, permission bits, and timestamps. `find` is essentially a query engine over that metadata, and learning to compose predicates against it is a core investigative skill.

Why does multi-attribute search matter so much offensively?

From a foothold, you use this metadata to locate high-value targets without reading every file: config files of a known size, SSH keys (`-name id_rsa`), setuid binaries, world-writable files, or recently changed credential stores. A single attribute is rarely specific enough; the signal lives in the *combination*.

The exact-byte-size filter in this level is a small lesson in **precision**. Knowing a target's exact size collapses a search from thousands of candidates to a handful instantly — which is exactly why operators pivot on file size (and hashes) when sifting a noisy host for the one file that matters.

> [!IMPORTANT]
> `-size 1033c` (bytes) and `-size 1033` (512-byte blocks) are completely different searches. Always specify the unit suffix (`c` = bytes, `k` = KiB, `M` = MiB) so your filter means what you think it means.

## Offensive Security Perspective

After landing on a host, an operator rarely reads files one by one. They describe what they want and let `find` surface it:

```bash
# config files of interest
find / -type f \( -name "*.conf" -o -name "*.env" -o -name "*.ini" \) 2>/dev/null
# private keys
find / -type f -name "id_*" ! -name "*.pub" 2>/dev/null
# recently modified files (possible fresh creds or dropped configs)
find /var/www -type f -mmin -60 2>/dev/null
```

The Bandit `inhere` haystack is a sanitized version of a real web root or `/opt` directory bloated with thousands of files, where the file you actually want is distinguished only by a couple of attributes. Tools like `linpeas` are, under the hood, large batteries of exactly these attribute-based `find` queries run automatically.

## Common Beginner Mistakes

- **Omitting the `c` in `-size 1033c`,** so `find` searches in 512-byte blocks and returns nothing (or the wrong files).
- **Forgetting `-type f`,** letting directories or special files clutter the results.
- **Writing `-not -executable` vs `! -executable`** inconsistently — both work, but mixing styles causes confusion; pick one.
- **Running `find` from the wrong directory** (home instead of `inhere`), which still works but searches a larger tree than necessary.
- **Quoting issues with `-exec`** — remember the command ends with `{} +` (or `{} \;`), and the `;` form must be escaped.
- **Assuming "human-readable" needs a special flag** — there is no single `find` predicate for it; you approximate it with `-type f` and, if needed, a content check.

## Key Takeaways

- `find` is a query language: stack predicates to describe a file precisely.
- `-size Nc` means bytes; without a suffix the unit is 512-byte blocks.
- `!` (or `-not`) negates a test, e.g. `! -executable`.
- `-exec cat {} +` reads every match in one efficient pass.
- Multi-attribute search is the universal pattern for finding artifacts on noisy filesystems.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** the classic "find setuid binaries" enumeration step is the same `find` skill aimed at a different attribute.
- **Red team & post-exploitation:** sweeping a foothold by size, timestamp, ownership, and permission surfaces credentials, keys, and misconfigured files — exactly the predicate-stacking you practiced here.
- **Cloud pentest:** locating exposed credential files, tokens, and metadata caches on compromised instances reuses the same multi-attribute queries.
- **Scripting fluency:** comfort with `find ... -exec` is the gateway to building your own enumeration and looting tooling.

## Additional Reading

- [`man find`](https://man7.org/linux/man-pages/man1/find.1.html) — read the `SIZE`, `-type`, and `-perm`/`-executable` sections
- [GNU findutils manual — File size tests](https://www.gnu.org/software/findutils/manual/html_node/find_html/Size.html)
- [MITRE ATT&CK — T1083: File and Directory Discovery](https://attack.mitre.org/techniques/T1083/)
- [HackTricks — Linux Privilege Escalation (file enumeration)](https://book.hacktricks.xyz/linux-hardening/privilege-escalation)

---

*Next up: [Level 6 → 7](./07-bandit-level-6-7.md) — searching the entire server by file ownership, and learning to silence the permission-denied noise.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

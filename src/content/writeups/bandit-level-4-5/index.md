---
title: "OverTheWire Bandit Level 4 → 5: The file Command, Magic Bytes & Type Detection"
description: "Ten lookalike files, only one readable. The file command judges a file by its bytes, not its name — a foundational skill for forensics, malware triage, and beating upload filters."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, file-type, magic-bytes, forensics]
---

## Introduction

The `inhere` directory is back, full this time: ten files `-file00` through `-file09`. Only one holds the password — the single **human-readable** text file among nine binary blobs. `cat`-ing all ten would spray garbage across your terminal. The clean solution is to ask Linux *what each file actually is* before opening it.

That tool is `file`, and the lesson is foundational: **identify a file by its content, not its name or extension.** On Linux an extension is decoration; a file's true type is its bytes — its *magic numbers*.

## Official Challenge Objective

> **The password for the next level is stored in the only human-readable file in the `inhere` directory.**

**In plain English:** nine files are binary garbage; exactly one is ordinary readable text with the password. Use `file` to identify it, then read it.

## Skills Covered

- Identifying file types by content with `file`
- Magic numbers vs. file extensions
- Filtering output with `grep`
- Globbing (`./*`) and the leading-dash gotcha
- Safe inspection before blindly `cat`-ing

## My Approach

The note was direct: *find the human-readable file — `file` and filter `grep` to text*. Rather than open ten files by hand, I ran `file` against every file via a glob and piped through `grep` for the text entry. The names start with a dash, so `./*` keeps `file` from treating them as options (the Level 1 → 2 habit again). Then `cat ./<that-file>` revealed the password.

## Step-by-Step Walkthrough

### Command

```bash
cd inhere
file ./*
```

### Explanation

`file ./*` runs `file` against every entry. The `./` matters: a bare `file *` expands to `file -file00 ...` and `file` parses `-file00` as options. `./*` makes each a safe path. Output classifies each file:

```
./-file00: data
...
./-file07: ASCII text
...
```

The one labeled `ASCII text` is your target.

### Why It Matters

`file` inspects the *bytes* (magic number and structure), not the name. This is how you distinguish a real PNG from a renamed executable, or text from binary — a constant need in forensics and malware work.

---

### Command

```bash
file ./* | grep -i text
```

### Explanation

Piping into `grep -i text` filters to only lines containing "text" (case-insensitive). With ten files it saves eyeballing; with hundreds it is the only sane way. The surviving line names the readable file (e.g. `./-file07`).

### Why It Matters

Composing small tools with pipes — `file | grep` — is the essence of the Unix philosophy and daily command-line investigation.

---

### Command

```bash
cat ./-file07
```

### Explanation

Read the text file. The `./` again neutralizes the leading dash. The contents are the bandit5 password:

```
[REDACTED]
```

> [!TIP]
> Fully automated: `cat $(file ./* | awk -F: '/text/{print $1}')` — but verify; picking the wrong file just prints garbage.

### Why It Matters

Going from "ten unknown blobs" to "the one readable file, read" using type-detection and filtering is exactly the triage workflow for a directory of evidence or dropped files.

## Deep Dive: Cyber Security Concept

**Magic numbers and content-based file typing.**

Most formats begin with a fixed signature — a **magic number** — in their first bytes: PNG `89 50 4E 47`, PDF `25 50 44 46` (`%PDF`), ELF `7F 45 4C 46`, ZIP/DOCX `50 4B 03 04` (`PK..`), gzip `1F 8B`.

`file` consults a magic database (via `libmagic`) plus heuristics and **ignores the extension** — which is why it can tell you `invoice.pdf` is actually a Windows executable, or that `-file07` (no extension) is ASCII text. **Extensions lie**; nothing enforces that `.jpg` contains a JPEG. "Human-readable" means the bytes are printable ASCII/UTF-8 with no binary noise — what `file` reports as `ASCII text`.

> [!IMPORTANT]
> Never trust a file's extension to tell you what it is. The bytes are the truth; the name is a hint at best, a lie at worst.

## Offensive Security Perspective

Content-vs-extension mismatch is a two-way street:

- **Upload filter bypass:** an app checking only the extension accepts `shell.php.jpg` or a polyglot. Weak content checks can be fooled by a prepended magic header.
- **Masquerading (T1036):** malware renames itself to mimic a document/image; the counter is `file`/`libmagic`.
- **Triage:** on a target, `file *` quickly separates configs, scripts, keys, and binaries from noise — this level, scaled up.

## Defensive Perspective

- **Validate uploads by content, not extension.** Use `libmagic`, parse-and-re-encode media, store uploads outside the web root, non-executable.
- **Defense in depth:** combine magic-byte checks, MIME sniffing, size limits, and a type allow-list.
- **Detection / hunting:** flag files whose detected type mismatches their extension, and double-extension names (`*.pdf.exe`):
  ```bash
  find /var/www/uploads -type f -name '*.jpg' -exec sh -c 'file "$1" | grep -qi executable && echo "MISMATCH: $1"' _ {} \;
  ```
- **Logging:** AV/EDR and YARA scan by content signature, not name — the same principle as `file`.
- **Hardening:** mount upload dirs `noexec`, drop execute bits, sandbox processing.

## Common Beginner Mistakes

- `cat`-ing every file blindly, flooding (and sometimes breaking) the terminal — recover with `reset`.
- Running `file *` without `./` and hitting option-parsing errors.
- Grepping for the wrong word — match `text`/`ASCII`, not `data` (what the binaries report).
- Forgetting `grep -i` and missing a differently-cased match.

## Key Takeaways

- `file` identifies type by *content* (magic numbers), not extension or name.
- Extensions are cosmetic and routinely lie; verify by bytes.
- `file ./* | grep -i text` is a clean triage one-liner.
- The `./` glob form keeps dash-prefixed names from being parsed as options.
- Composing small tools with pipes is the core investigation skill.

## How This Helps Build Cyber Security Expertise

- **Digital forensics:** identifying unknown files by content is bread-and-butter triage; `file`, magic bytes, and `binwalk` extend from here.
- **Malware analysis:** the first question about a sample is "what is it really?" — answered by content.
- **Web AppSec:** magic-byte vs extension validation is key to file-upload vulnerabilities.
- **Detection engineering:** content-based detection (YARA, AV) is the grown-up `file | grep`.

## Additional Reading

- [`man file`](https://man7.org/linux/man-pages/man1/file.1.html), [`man grep`](https://man7.org/linux/man-pages/man1/grep.1.html)
- [List of file signatures (magic numbers)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [OWASP — Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [MITRE ATT&CK — T1036: Masquerading](https://attack.mitre.org/techniques/T1036/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

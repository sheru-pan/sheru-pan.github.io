# OverTheWire Bandit Level 4 → Level 5

## Introduction

The `inhere` directory is back, and this time it is full: ten files named `-file00` through `-file09`. Only one of them holds the password — and the only thing distinguishing it is that it is the single **human-readable** (plain text) file among nine bins of random binary junk. `cat`-ing all ten would spray garbage across your terminal (and possibly mangle it). The clean solution is to ask Linux *what each file actually is* before you open it.

The tool for that is `file`, and the lesson is a foundational one: **identify a file by its content, not its name or extension.** On Linux a file's extension is decoration; its true type is determined by its bytes — its *magic numbers*. Learning to read type from content is essential for forensics, malware triage, and any time you cannot trust a filename.

## Official Challenge Objective

> **The password for the next level is stored in the only human-readable file in the `inhere` directory.**

**In plain English:** the `inhere` directory contains several files. Nine are binary/non-text garbage; exactly one is ordinary readable text and contains the password. Use the `file` command to identify the text file, then read it.

## Skills Covered

- Identifying file types by content with `file`
- Magic numbers / magic bytes vs. file extensions
- Filtering output with `grep`
- Globbing (`./*`) and the leading-dash gotcha (again)
- Safe inspection before blindly `cat`-ing

## My Approach

My note was direct: *find the human-readable file — `file` and filter `grep` to text*. Rather than open ten files by hand, I ran `file` against every file in the directory at once with a glob, then piped that through `grep` to surface only the entry described as text. The filenames start with a dash (`-file00`), so I used the `./*` form to keep `file` from treating them as options — the Level 1 → 2 habit paying off yet again. Once `grep` pointed at the ASCII-text file, a simple `cat ./<that-file>` gave up the password.

## Step-by-Step Walkthrough

### Command

```bash
cd inhere
file ./*
```

### Explanation

`cd inhere` enters the directory. `file ./*` runs the `file` utility against every entry. The `./` in front of the glob is important: because the filenames begin with `-`, a bare `file *` would expand to `file -file00 -file01 ...` and `file` would try to parse `-file00` as a stack of options. `./*` expands to `./-file00 ./-file01 ...`, each safely a path. The output classifies each file, e.g.:

```
./-file00: data
./-file01: data
...
./-file07: ASCII text
...
./-file09: data
```

The one labeled `ASCII text` is your target.

### Why It Matters

`file` inspects the *bytes* of each file (its magic number and structure) rather than trusting the name. This is how you distinguish a real PNG from a renamed executable, a text file from a binary, or a gzip stream from random data — a skill you use constantly in forensics and malware work.

---

### Command

```bash
file ./* | grep -i text
```

### Explanation

Piping `file`'s output into `grep -i text` filters to only the line(s) containing "text" (case-insensitively, thanks to `-i`). With ten files this saves you from eyeballing the list; with hundreds it is the only sane way. The surviving line names the human-readable file (here, `./-file07`).

### Why It Matters

Composing small tools with pipes — `file | grep` — is the essence of the Unix philosophy and the daily reality of command-line investigation. You will chain `find | file | grep`, `strings | grep`, and friends constantly.

---

### Command

```bash
cat ./-file07
```

### Explanation

Now that you know which file is text, read it. The `./` prefix again neutralizes the leading dash so `cat` treats `-file07` as a filename, not options. The contents are the bandit5 password:

```
[REDACTED]
```

> [!TIP]
> One-liner to do it all and print the password directly:
> ```bash
> file ./* | grep -i text
> # then cat the named file, e.g. cat ./-file07
> ```
> Or fully automated: `cat $(file ./* | awk -F: '/text/{print $1}')` — but type it carefully; automation that picks the wrong file just prints garbage.

### Why It Matters

Going from "ten unknown blobs" to "the one readable file, read" using only type-detection and filtering is exactly the triage workflow you apply to an unknown directory of evidence or dropped files.

## Deep Dive: Cyber Security Concept

**Magic numbers and content-based file typing.**

Most file formats begin with a fixed signature — a **magic number** — in their first bytes. A few examples:

- `PNG` → `89 50 4E 47` (`.PNG`)
- `PDF` → `25 50 44 46` (`%PDF`)
- ELF executable → `7F 45 4C 46` (`.ELF`)
- ZIP/JAR/DOCX → `50 4B 03 04` (`PK..`)
- gzip → `1F 8B`

The `file` command consults a database of these signatures (the "magic" database, typically `/usr/share/misc/magic` or via `libmagic`) plus heuristics to decide a file's type. Crucially, it **ignores the extension** — which is why `file` can tell you that `invoice.pdf` is actually a Windows executable, or that `-file07` (no extension at all) is ASCII text.

This matters because **extensions lie**. They are just part of the name; nothing enforces that `.jpg` contains a JPEG. Attackers rename payloads to look benign; defenders and forensic analysts must verify type by content. "Human-readable" specifically means the bytes fall in the printable ASCII/UTF-8 range with no binary noise — which is exactly what `file` reports as `ASCII text`.

> [!IMPORTANT]
> Never trust a file's extension to tell you what it is. The bytes are the truth; the name is a hint at best and a lie at worst.

## Offensive Security Perspective

Content-vs-extension mismatch is a two-way street attackers exploit:

- **Upload filter bypass:** a web app that only checks the *extension* of an upload can be tricked into accepting `shell.php.jpg`, a polyglot file, or a file whose extension says image but whose content is a script. Conversely, weak content checks can be fooled by a valid magic header prepended to malicious data.
- **Masquerading payloads (MITRE T1036):** malware renames itself to mimic a document or image so a casual `ls` or user does not flag it. The defender's counter is `file`/`libmagic`.
- **Triage of dropped files:** on a target, an operator uses `file *` to quickly distinguish configs, scripts, keys, and binaries from noise — exactly this level, scaled up.

## Defensive Perspective

- **Validate uploads by content, not extension.** Use `libmagic`/`file`, parse-and-re-encode media, and store uploads outside the web root with non-executable permissions.
- **Defense in depth on file type:** combine magic-byte checks, MIME sniffing, size limits, and an allow-list of accepted types.
- **Detection / hunting:** flag files whose detected type does not match their extension (`.jpg` that is actually an ELF or PE), executables in upload/temp directories, and double-extension names (`*.pdf.exe`).
  ```bash
  # hunt: find files claiming to be images but detected as executables
  find /var/www/uploads -type f -name '*.jpg' -exec sh -c 'file "$1" | grep -qi "executable" && echo "MISMATCH: $1"' _ {} \;
  ```
- **Logging:** AV/EDR and tools like YARA scan by content signature, not name — the same principle as `file`, just deeper.
- **Hardening:** mount upload directories `noexec`, drop execute bits on stored files, and run uploaded content through sandboxed processing.

## Common Beginner Mistakes

- `cat`-ing every file blindly, flooding the terminal with binary and sometimes leaving it in a broken state (recover with `reset`).
- Running `file *` (without `./`) and getting errors because the dash-prefixed names are parsed as options.
- Grepping for the wrong word — match `text` (or `ASCII`), not `data`, which is what the *binary* files report.
- Assuming the file with a particular number is "the obvious one" instead of actually checking type.
- Forgetting `-i` on `grep` and missing a differently-cased match.

## Key Takeaways

- `file` identifies type by *content* (magic numbers), not by extension or name.
- Extensions are cosmetic and routinely lie; verify by bytes.
- `file ./* | grep -i text` is a clean triage one-liner for a directory of unknowns.
- The `./` glob form keeps dash-prefixed filenames from being parsed as options.
- Composing small tools with pipes is the core command-line investigation skill.

## How This Helps Build Cyber Security Expertise

- **Digital forensics:** identifying unknown files by content is bread-and-butter evidence triage; `file`, magic bytes, and `binwalk` extend directly from here.
- **Malware analysis:** the first question about any sample is "what is it really?" — answered by content, never the name.
- **Web AppSec:** understanding magic-byte vs extension validation is essential to finding and fixing file-upload vulnerabilities.
- **Detection engineering:** signature/content-based detection (YARA, AV) is the grown-up version of `file | grep`.

## Additional Reading

- [`man file`](https://man7.org/linux/man-pages/man1/file.1.html), [`man grep`](https://man7.org/linux/man-pages/man1/grep.1.html)
- [List of file signatures (magic numbers) — Wikipedia](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [OWASP — Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [MITRE ATT&CK — T1036: Masquerading](https://attack.mitre.org/techniques/T1036/)

---

*Next up: [Level 5 → 6](./06-bandit-level-5-6.md) — one file among many, found not by reading it but by matching its exact properties with `find`.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

# OverTheWire Bandit Level 7 → Level 8

## Introduction

So far you have located files by their *attributes*. Level 7 → 8 pivots to a different problem entirely: the file is handed to you by name, but its *contents* are enormous — thousands of lines — and the password is buried next to a single keyword. This is your introduction to `grep`, the tool that turns "search a huge text file" from a chore into a one-liner.

If `find` is how you locate files, `grep` is how you locate *content inside* files. It is, without exaggeration, one of the most-used commands in all of offensive work: harvesting credentials from a foothold, searching source code for hardcoded secrets, sifting through dumped configs, and combing wordlists. Learning to reach for it reflexively is a career skill.

## Official Challenge Objective

> **The password for the next level is stored in the file `data.txt` next to the word `millionth`.**

**In plain English:** there is a file named `data.txt` in your home directory. It contains a huge number of lines, each pairing a word with a random-looking string. Exactly one line begins with the word `millionth`; the string next to it on that line is the password for `bandit8`. Instead of scrolling through the whole file, you search for the line containing `millionth`.

## Skills Covered

- Pattern searching with `grep`
- Triaging large text/log files without opening them fully
- Reading whitespace-separated columns of text
- Choosing the right tool for "search inside a file" vs "find a file"

## My Approach

The objective is almost a giveaway: the password sits "next to the word `millionth`." That phrasing maps directly onto `grep`, whose entire job is to print the lines of a file that match a pattern. Rather than `cat` a file with thousands of lines and hunt visually (slow and error-prone), I let `grep` do the matching and print only the relevant line. The string on that line, after the keyword, is the password.

I considered the size of the file first — a quick `ls -la data.txt` or `wc -l data.txt` tells you whether this is a "just `cat` it" file or a "you need to search it" file. Here it is clearly the latter, which confirms `grep` is the right instrument.

> [!TIP]
> When a challenge says the answer is "next to," "after," or "containing" a specific word, that is a flashing sign that says `grep`. Match the keyword, read the line.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit7@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit7` over SSH on port `2220` with the password from the previous level. You land in `/home/bandit7`, which contains `data.txt`.

### Why It Matters

Standard game loop — authenticate, then orient. The interesting part of every level is what you do once you are in.

---

### Command

```bash
ls -la data.txt
wc -l data.txt
```

### Explanation

`ls -la data.txt` shows the file's size (large), and `wc -l data.txt` counts its lines (thousands). Both confirm this is far too big to read by eye.

### Why It Matters

Sizing up a file before you read it is good discipline. It tells you whether to `cat` it, `less` it, or — as here — search it with `grep`. The same instinct stops you from accidentally `cat`-ing a multi-gigabyte log on a production box.

---

### Command

```bash
grep millionth data.txt
```

### Explanation

`grep` ("globally search for a regular expression and print") scans `data.txt` line by line and prints every line containing the literal text `millionth`. Only one line matches, and it looks like:

```
millionth	[REDACTED]
```

The second column — the random-looking string separated from `millionth` by whitespace — is the password for `bandit8`.

### Why It Matters

This is the absolute core use of `grep`: find the line(s) you care about in a large file, instantly, without scrolling. It is the same motion you will use to grep a config dump for `password`, grep a codebase for `API_KEY`, or grep a leaked archive for a token. Master this one command and you have unlocked a huge fraction of day-to-day offensive work.

## Deep Dive: Cyber Security Concept

**Content search and credential harvesting.**

A compromised host is full of text that hides secrets: configuration files, source code, environment dumps, connection strings, history files, and backups. The fundamental operation across all of it is the same — *find the lines that match what I care about*. `grep` is the canonical tool for that operation, and the regular-expression engine behind it lets you express far more than a single literal word.

A few patterns that matter in practice:

- `grep -i` — case-insensitive matching (so `Password`, `PASSWORD`, and `password` all match).
- `grep -r` — recurse through a directory tree (grep an entire source repo or web root).
- `grep -n` — show line numbers (jump straight to the hit).
- `grep -v` — *invert*: print lines that do **not** match (filter out noise).
- `grep -E 'foo|bar'` — extended regex with alternation.
- `grep -c` — count matches instead of printing them.

The conceptual leap is recognizing that almost any loot question over text reduces to "what lines match this pattern?" Hardcoded secrets? `grep -rni "password\|api_key\|secret" .`. Database credentials? `grep -rni "jdbc\|mysql_connect" /var/www`. Typed passwords in a shell history? `grep -i pass ~/.bash_history`.

> [!IMPORTANT]
> `grep` searches *content*; `find` searches *file metadata*. Pairing them — `find` to select files, `grep` to search inside them — is one of the most powerful combinations on the command line: `grep -r pattern $(find . -name '*.log')` or `find . -name '*.log' -exec grep pattern {} +`.

## Offensive Security Perspective

For an attacker on a host, `grep` is how you turn a filesystem full of files into a short list of credentials and secrets:

```bash
# hunt for secrets across the whole box
grep -rniE "password|passwd|api[_-]?key|secret|token" / 2>/dev/null
# pull connection strings out of web app configs
grep -rni "jdbc\|mongodb\|mysql_connect" /var/www 2>/dev/null
# read another user's bash history for typed credentials
grep -i "pass" ~/.bash_history
```

In bug bounty and source-code review, the very first pass over a downloaded codebase or a leaked archive is usually a `grep` for secret-shaped strings. The Bandit `data.txt` is a tame stand-in for a leaked dump or a config blob where the one line you need is drowned in thousands you don't.

## Common Beginner Mistakes

- **`cat`-ing the whole file** and trying to find the line by eye — slow, and easy to miss.
- **Forgetting which argument is which** — the pattern comes before the filename: `grep PATTERN FILE`.
- **Quoting issues** — wrap multi-word or special-character patterns in quotes: `grep "two words" file`.
- **Matching the keyword but copying the wrong column** — the password is the *second* field on the line, not the keyword itself.
- **Reaching for `find` instead of `grep`** — `find` locates files; it does not search their contents (without `-exec grep`).
- **Case sensitivity surprises** — `grep` is case-sensitive by default; use `-i` when unsure.

## Key Takeaways

- `grep PATTERN FILE` prints every line of a file matching a pattern.
- Use it to comb large text files for secrets instead of reading them whole.
- Size up a file (`ls -la`, `wc -l`) before deciding how to read it.
- The password is the field *next to* the keyword — read the whole matched line.
- `grep` (content) and `find` (metadata) are complementary; combine them.

## How This Helps Build Cyber Security Expertise

- **Pentesting & post-exploitation:** credential harvesting is largely a disciplined `grep` campaign across the filesystem of a compromised host.
- **Source code review / AppSec:** grepping for dangerous functions and hardcoded secrets is a standard first pass when auditing a target's code.
- **Bug bounty:** the first sweep of a leaked archive, JS bundle, or repo is a `grep` for secret-shaped strings (keys, tokens, endpoints).
- **Red team:** pulling connection strings and tokens out of config dumps with `grep` fuels lateral movement and further escalation.

## Additional Reading

- [`man grep`](https://man7.org/linux/man-pages/man1/grep.1.html)
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html)
- [Regular expressions quick reference](https://www.regular-expressions.info/quickstart.html)
- [gitleaks — secret scanning](https://github.com/gitleaks/gitleaks)
- [MITRE ATT&CK — T1552.001: Credentials In Files](https://attack.mitre.org/techniques/T1552/001/)

---

*Next up: [Level 8 → 9](./09-bandit-level-8-9.md) — frequency analysis with `sort | uniq` to find the one line that appears exactly once.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

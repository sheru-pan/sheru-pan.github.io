# OverTheWire Bandit Level 8 → Level 9

## Introduction

The previous level found a line by *what it contained*. This one finds a line by *how often it appears*. The password is the single line in a file that occurs exactly once while every other line repeats — and isolating it teaches you one of the most quietly powerful idioms on the command line: `sort | uniq`.

This is frequency analysis, and it is enormously relevant to offensive work. Finding the **outlier** — the one line, value, or entry that doesn't fit the pattern — is exactly how you pick the interesting needle out of a haystack of tool output: the one credential that differs from a leaked dump, the single subdomain that stands out in an enumeration, the lone parameter worth a closer look.

## Official Challenge Objective

> **The password for the next level is stored in the file `data.txt` and is the only line of text that occurs only once.**

**In plain English:** `data.txt` is full of lines, and almost all of them are duplicated many times over. Exactly one line is unique — it appears a single time. That unique line is the password for `bandit9`. Your job is to count how often each line occurs and pull out the one with a count of one.

## Skills Covered

- Sorting text with `sort`
- Deduplication and counting with `uniq`
- Why `uniq` requires sorted input
- Isolating unique lines with `uniq -u`
- Pipelines: chaining commands with `|`
- Frequency analysis / outlier detection

## My Approach

The objective is a textbook frequency-analysis problem: "the only line that occurs only once." That instantly suggests `uniq`, the tool built to collapse and count adjacent duplicate lines. The catch — and the lesson — is that **`uniq` only compares *adjacent* lines.** If duplicates are scattered through the file, `uniq` won't see them as duplicates at all. So the file must be **sorted first**, which brings all identical lines together, and only then does `uniq` work as intended.

With sorted input, `uniq -u` does exactly what I want: it prints only the lines that are *not* repeated — the singletons. Because the puzzle guarantees there is precisely one such line, the pipeline outputs the password directly.

> [!IMPORTANT]
> `uniq` is blind to non-adjacent duplicates. `sort | uniq` is almost always the correct pairing; using `uniq` alone on unsorted data is the single most common mistake with this tool.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit8@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit8` over SSH on port `2220` with the password from the previous level. You land in `/home/bandit8`, which contains `data.txt`.

### Why It Matters

Same game loop — authenticate, then assess. The work is in the analysis that follows.

---

### Command

```bash
wc -l data.txt
sort data.txt | head
```

### Explanation

`wc -l` shows the file has many lines. `sort data.txt | head` previews the sorted output, where you can *see* identical lines now sitting next to each other in blocks — visual confirmation that most lines repeat and that sorting groups them.

### Why It Matters

Previewing your data before running the final pipeline builds intuition for what the tools are doing. Seeing the duplicates cluster after sorting makes the next step obvious rather than magical.

---

### Command

```bash
sort data.txt | uniq -u
```

### Explanation

This pipeline solves the level:

- `sort data.txt` — reorders every line alphabetically, so all identical lines become **adjacent**. This is the prerequisite that makes `uniq` work.
- `| uniq -u` — `uniq` collapses runs of adjacent duplicate lines; the `-u` flag tells it to print **only** the lines that are unique (appeared exactly once after sorting), discarding every line that had any duplicate.

Because exactly one line in the file is unique, the pipeline prints a single line — the password for `bandit9`:

```
[REDACTED]
```

> [!TIP]
> Related `uniq` flags worth knowing: `uniq -d` prints only *duplicated* lines (the opposite of `-u`), and `uniq -c` prefixes each line with its occurrence count. `sort | uniq -c | sort -rn` is the classic "rank values by frequency" recipe used constantly when triaging recon output.

### Why It Matters

`sort | uniq` (in its various flag combinations) is one of the most reusable analysis idioms in existence. Counting occurrences, finding duplicates, finding singletons, and ranking by frequency are everyday tasks when wrangling the bulky output of recon and brute-force tooling — and they all flow from this one small pipeline.

## Deep Dive: Cyber Security Concept

**Frequency analysis and outlier detection.**

A staggering amount of offensive triage boils down to counting things and asking "what stands out here?" The technique cuts two ways:

- **The rare entry is the lead.** In a wordlist of leaked credentials, a dump of directory-listing output, or a column of harvested values, the one line that appears only once is frequently the odd, hand-edited, or interesting one worth chasing. This level's "line that occurs only once" is exactly that pattern in miniature.
- **The frequent entry is the noise (or the pattern).** Thousands of identical responses from a fuzzer usually mean a default page to filter out, while the one differing length or status code is the hit you actually want.

`sort | uniq -c | sort -rn` is the canonical tool for both: it counts every distinct value and ranks them, so the top of the list shows the most common results and the bottom (or `uniq -u`) shows the rarest. Operators run this against IP lists, URLs, usernames, and parameters constantly.

## Offensive Security Perspective

Attackers use frequency analysis to extract signal from bulky output and to blend in:

- **Triaging recon output:** after enumerating thousands of URLs, subdomains, or parameters, `sort | uniq` deduplicates and `sort | uniq -c | sort -rn` highlights the most common (and the oddest) results worth manual attention.
- **Finding the anomaly:** in a wordlist of leaked credentials or a dump of directory-listing output, the unique entry is often the interesting one.
- **Blending in:** because rare, novel traffic is what gets noticed, sophisticated operators try to make their activity look frequent and ordinary rather than singular — the inverse of this technique, but the same mental model.

## Common Beginner Mistakes

- **Running `uniq` without `sort` first** — `uniq` only collapses *adjacent* duplicates, so on unsorted data it misses scattered repeats and gives wrong results. This is *the* classic `uniq` trap.
- **Confusing `-u` and `-d`** — `-u` prints lines that are unique; `-d` prints lines that are duplicated. The level wants `-u`.
- **Expecting `uniq` to count by default** — it doesn't; add `-c` for counts.
- **Sorting numerically vs lexically** — default `sort` is lexicographic; use `sort -n` for true numeric order (not needed here, but a frequent gotcha).
- **Forgetting case/whitespace sensitivity** — `uniq` treats lines differing by case or trailing spaces as distinct; `sort -f` / careful normalization may be needed on messy data.

## Key Takeaways

- `uniq` only collapses *adjacent* duplicates — always `sort` first.
- `uniq -u` prints only the lines that occur exactly once.
- `uniq -d` prints duplicates; `uniq -c` adds occurrence counts.
- `sort | uniq -c | sort -rn` ranks values by frequency — a universal analysis idiom.
- Finding the outlier (rarest or most frequent) is how you spot the interesting result fast.

## How This Helps Build Cyber Security Expertise

- **Recon triage:** deduping and ranking thousands of enumerated URLs, subdomains, and parameters with `sort | uniq` is how you turn raw scanner output into a short list of targets.
- **Credential attacks:** spotting the odd entry in a leaked dump, or filtering fuzzer output down to the one anomalous response, is `uniq -u` thinking applied to real engagements.
- **Data wrangling:** every operator needs to dedupe, count, and rank text — `sort | uniq` is the foundational toolkit.
- **Pattern intuition:** internalizing "the outlier is the lead" shapes how you read every pile of tool output you'll ever sift through.

## Additional Reading

- [`man sort`](https://man7.org/linux/man-pages/man1/sort.1.html) and [`man uniq`](https://man7.org/linux/man-pages/man1/uniq.1.html)
- [The art of command line — text processing](https://github.com/jlevy/the-art-of-command-line)
- [MITRE ATT&CK](https://attack.mitre.org/)

---

*Next up: [Level 9 → 10](./10-bandit-level-9-10.md) — digging printable strings out of a binary file with `strings`.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

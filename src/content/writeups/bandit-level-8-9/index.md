---
title: "OverTheWire Bandit Level 8 → 9: Frequency Analysis with sort and uniq"
description: "The password is the one line that occurs only once. Isolating it teaches sort | uniq — the command-line idiom for finding the outlier when triaging recon output."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, sort, uniq, recon, frequency-analysis]
---

## Introduction

The previous level found a line by *what it contained*. This one finds a line by *how often it appears*. The password is the single line that occurs exactly once while every other line repeats — and isolating it teaches one of the quietly powerful idioms of the command line: `sort | uniq`.

This is frequency analysis, and it is hugely relevant to offensive work. Finding the **outlier** — the one line or value that doesn't fit — is exactly how you pick the interesting needle out of a haystack of tool output.

## Official Challenge Objective

> **The password for the next level is stored in the file `data.txt` and is the only line of text that occurs only once.**

**In plain English:** almost every line in `data.txt` is duplicated many times. Exactly one line is unique. That line is the password for `bandit9`. Count how often each line occurs and pull out the one with a count of one.

## Skills Covered

- Sorting text with `sort`
- Deduplication and counting with `uniq`
- Why `uniq` requires sorted input
- Isolating unique lines with `uniq -u`
- Pipelines with `|`
- Frequency analysis / outlier detection

## My Approach

"The only line that occurs only once" is a textbook frequency-analysis problem, which suggests `uniq` — built to collapse and count adjacent duplicate lines. The catch and the lesson: **`uniq` only compares *adjacent* lines.** Scattered duplicates won't be seen as duplicates, so the file must be **sorted first** to group identical lines together.

With sorted input, `uniq -u` prints only the non-repeated lines. Since exactly one such line exists, the pipeline outputs the password directly.

> [!IMPORTANT]
> `uniq` is blind to non-adjacent duplicates. `sort | uniq` is almost always the correct pairing; using `uniq` alone on unsorted data is the most common mistake with this tool.

## Step-by-Step Walkthrough

### Command

```bash
ssh bandit8@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log in as `bandit8` on port `2220`. You land in `/home/bandit8`, which contains `data.txt`.

### Why It Matters

Same loop — authenticate, then assess. The work is in the analysis that follows.

---

### Command

```bash
sort data.txt | head
```

### Explanation

Previews the sorted output, where identical lines now sit next to each other in blocks — visual confirmation that most lines repeat and that sorting groups them.

### Why It Matters

Previewing your data before the final pipeline builds intuition for what the tools do. Seeing duplicates cluster after sorting makes the next step obvious rather than magical.

---

### Command

```bash
sort data.txt | uniq -u
```

### Explanation

- `sort data.txt` — reorders lines so all identical lines become **adjacent**; the prerequisite that makes `uniq` work.
- `| uniq -u` — collapses adjacent duplicates and, with `-u`, prints **only** the lines that appeared exactly once.

Exactly one line is unique, so the pipeline prints the password for `bandit9`:

```
[REDACTED]
```

> [!TIP]
> Related flags: `uniq -d` prints only *duplicated* lines; `uniq -c` prefixes each line with its count. `sort | uniq -c | sort -rn` is the classic "rank values by frequency" recipe used constantly when triaging recon output.

### Why It Matters

`sort | uniq` is one of the most reusable analysis idioms in existence: counting, finding duplicates, finding singletons, and ranking by frequency are everyday tasks when wrangling the bulky output of recon and brute-force tooling — all from this one small pipeline.

## Deep Dive: Cyber Security Concept

**Frequency analysis and outlier detection.**

So much offensive triage is counting things and asking "what stands out here?" The technique cuts two ways:

- **The rare entry is the lead:** in a wordlist of leaked credentials or a dump of directory-listing output, the one line that appears only once is frequently the odd, hand-edited, or interesting one worth chasing. This level's "line that occurs only once" is this pattern in miniature.
- **The frequent entry is the noise (or the pattern):** thousands of identical fuzzer responses usually mean a default page to filter out, while the one differing length or status code is the hit you want.

`sort | uniq -c | sort -rn` serves both: it counts every distinct value and ranks them — top shows the most common results, bottom (or `uniq -u`) shows the rarest. Operators run this against IPs, URLs, usernames, and parameters constantly.

## Offensive Security Perspective

Attackers use frequency analysis to extract signal and to blend in:

- **Triaging recon:** `sort | uniq` deduplicates thousands of URLs/subdomains; `sort | uniq -c | sort -rn` highlights the most common and oddest results.
- **Finding the anomaly:** in a leaked dump, the unique entry is often the interesting one.
- **Blending in:** because rare, novel activity is what gets noticed, sophisticated operators make their traffic look frequent and ordinary rather than singular.

## Common Beginner Mistakes

- Running `uniq` without `sort` first — it only collapses *adjacent* duplicates. The classic trap.
- Confusing `-u` (unique) with `-d` (duplicated). The level wants `-u`.
- Expecting `uniq` to count by default — add `-c`.
- Lexical vs numeric sort — default `sort` is lexicographic; use `sort -n` for numbers.
- Forgetting case/whitespace sensitivity — `uniq` treats differing case/trailing spaces as distinct.

## Key Takeaways

- `uniq` only collapses *adjacent* duplicates — always `sort` first.
- `uniq -u` prints only lines occurring exactly once.
- `uniq -d` prints duplicates; `uniq -c` adds counts.
- `sort | uniq -c | sort -rn` ranks values by frequency.
- Finding the outlier (rarest or most frequent) is how you spot the interesting result fast.

## How This Helps Build Cyber Security Expertise

- **Recon triage:** deduping and ranking thousands of enumerated URLs, subdomains, and parameters turns raw scanner output into a short target list.
- **Credential attacks:** spotting the odd entry in a leaked dump, or filtering fuzzer output to the one anomalous response, is `uniq -u` thinking on real engagements.
- **Data wrangling:** dedupe, count, rank — `sort | uniq` is the foundation.
- **Pattern intuition:** "the outlier is the lead" shapes how you read every pile of tool output.

## Additional Reading

- [`man sort`](https://man7.org/linux/man-pages/man1/sort.1.html), [`man uniq`](https://man7.org/linux/man-pages/man1/uniq.1.html)
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)
- [MITRE ATT&CK](https://attack.mitre.org/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

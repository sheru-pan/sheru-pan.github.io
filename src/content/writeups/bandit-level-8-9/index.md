---
title: "OverTheWire Bandit Level 8 → 9: Frequency Analysis with sort and uniq"
description: "The password is the one line that occurs only once. Isolating it teaches sort | uniq — the command-line root of anomaly detection and rare-value threat hunting."
date: 2026-06-07
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, bandit, sort, uniq, anomaly-detection, threat-hunting]
---

## Introduction

The previous level found a line by *what it contained*. This one finds a line by *how often it appears*. The password is the single line that occurs exactly once while every other line repeats — and isolating it teaches one of the quietly powerful idioms of the command line: `sort | uniq`.

This is frequency analysis, and it is hugely relevant to real security work. Finding the **outlier** — the one event or value that doesn't fit — is the essence of anomaly detection and threat hunting.

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
> Related flags: `uniq -d` prints only *duplicated* lines; `uniq -c` prefixes each line with its count. `sort | uniq -c | sort -rn` is the classic "rank values by frequency" recipe used constantly in log analysis.

### Why It Matters

`sort | uniq` is one of the most reusable analysis idioms in existence: counting, finding duplicates, finding singletons, and ranking by frequency are everyday tasks in log triage and threat hunting — all from this one small pipeline.

## Deep Dive: Cyber Security Concept

**Frequency analysis and outlier detection.**

So much security analysis is counting things and asking "what's normal, what isn't?" Two symmetric failure modes:

- **The rare event is the threat:** a single login from a new IP, one host running an otherwise-unseen process, one connection to a domain queried only once. This level's "line that occurs only once" is this pattern in miniature.
- **The frequent event is the threat:** thousands of identical requests (brute-force/flood), one source IP dominating the access log.

`sort | uniq -c | sort -rn` serves both: it counts every distinct value and ranks them — top shows noisiest sources, bottom (or `uniq -u`) shows the rarest. Analysts run this against IPs, URLs, usernames, user-agents, and process names constantly.

> [!NOTE]
> This is the command-line ancestor of a SIEM "rare value" / "least frequent occurrence" search — a core threat-hunting technique that is conceptually just `sort | uniq -u` over a billion events.

## Offensive Security Perspective

Attackers use frequency analysis to extract signal and to blend in:

- **Triaging recon:** `sort | uniq` deduplicates thousands of URLs/subdomains; `sort | uniq -c | sort -rn` highlights the most common and oddest results.
- **Finding the anomaly:** in a leaked dump, the unique entry is often the interesting one.
- **Evasion awareness:** knowing defenders hunt rare events, sophisticated operators make traffic look frequent and normal rather than novel.

## Defensive Perspective

- **Log frequency analysis:** `awk '{print $1}' access.log | sort | uniq -c | sort -rn | head` surfaces top talkers (brute-force/scraping); the long tail (`uniq -u`) surfaces one-off, possibly targeted requests.
- **Rare-value threat hunting:** flagging the process or destination seen on only one host out of the fleet catches novel malware and living-off-the-land activity.
- **Baselining:** counting normal frequencies sets a baseline; far above or below is worth investigating. UEBA is essentially automated frequency baselining.
- **Detection engineering:** Sigma rules and SIEM correlation searches use `count by X` aggregation — the productized form of `sort | uniq -c`.

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
- Finding the outlier (rarest or most frequent) is the heart of anomaly detection.

## How This Helps Build Cyber Security Expertise

- **Threat hunting:** rare-value analysis is a top technique for finding stealthy attackers — `uniq -u` thinking at scale.
- **SOC / log analysis:** counting and ranking log values is daily detection work.
- **Data wrangling:** dedupe, count, rank — `sort | uniq` is the foundation.
- **Statistical intuition:** "normal = frequent, suspicious = anomalous" shapes how you read every dataset.

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

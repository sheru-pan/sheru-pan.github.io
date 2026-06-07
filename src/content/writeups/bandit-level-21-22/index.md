---
title: "OverTheWire Bandit Level 21 → 22: Cron Jobs & Insecure Temp Files"
description: "A scheduled cron job copies a privileged password into a predictable, world-readable /tmp file. Read the cron config, follow it to the script, and harvest the leak."
date: 2026-05-26
platform: OverTheWire
difficulty: medium
tags: [ctf, linux, bandit, cron, scheduled-tasks, information-disclosure, privilege-escalation]
series: "OverTheWire Bandit"
order: 21
seriesLabel: "Level 21 → 22"
---

## Introduction

After a long run of levels about *reading* things you already have access to, Bandit 21 → 22 pivots to a new and much more powerful idea: **something else on the system is running on your behalf, automatically, and that automation can leak secrets.** The mechanism is `cron`, the time-based job scheduler that quietly keeps Linux systems alive. Cron is invisible until you go looking for it — and that invisibility is exactly why it is such a rich target.

The skill being taught is reading `cron` configuration. The lesson underneath it is **information disclosure through insecure temporary files**: a scheduled job copies a privileged password into a predictable, world-readable file in `/tmp`, and anyone on the box can read it.

## Official Challenge Objective

> **A program is running automatically at regular intervals from `cron`, the time-based job scheduler. Look in `/etc/cron.d/` for the configuration and see what command is being executed.**

**In plain English:** the system runs a program on a schedule. The definition of *what* runs and *how often* lives in `/etc/cron.d/`. Read that config, follow it to the script it points at, and you will find where it leaves the `bandit22` password.

## Skills Covered

- Understanding `cron` and time-based scheduling on Linux
- Reading cron configuration in `/etc/cron.d/`
- Following a configuration → script → side-effect chain
- Recognizing the insecure-temporary-file disclosure pattern (`/tmp` + world-readable)

## My Approach

The objective hands you the location, so I went straight to `/etc/cron.d/` and read the cron file for this level. It tells me which script runs and on what schedule. I then opened the script itself: it copies `bandit22`'s password out of `/etc/bandit_pass/` into a file in `/tmp` and `chmod 644`s it so everyone can read it. At that point the level is over — I don't need to be `bandit22`, I just read the file the job left lying around.

## Step-by-Step Walkthrough

### Command

```bash
cat /etc/cron.d/cronjob_bandit22
```

### Explanation

`/etc/cron.d/` holds drop-in cron fragments. The relevant line looks like:

```
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
```

The five `*` fields are the schedule (every minute). The `bandit22` field is **the user the job runs as**. The rest is the command, with output sent to `/dev/null`.

### Why It Matters

Cron entries tell you *what* runs, *when*, and **as whom**. That last field is security-critical: a job running as `bandit22` acts with `bandit22`'s privileges.

---

### Command

```bash
cat /usr/bin/cronjob_bandit22.sh
```

### Explanation

The script does roughly:

```bash
#!/bin/bash
chmod 644 /tmp/<generic-temp-file>
cat /etc/bandit_pass/bandit22 > /tmp/<generic-temp-file>
```

It `chmod 644`s a fixed `/tmp` path (everyone can read) and copies `bandit22`'s password into it. Because the job runs as `bandit22`, it can read the protected password file — and leaves the result readable by you.

> [!NOTE]
> The temp filename is a fixed string in the script, not a secret. Read it straight from the script and use it verbatim.

### Why It Matters

This is the whole vulnerability: a privileged process writes a secret to a location and with permissions that expose it to unprivileged users. Nothing was cracked — it was handed out.

---

### Command

```bash
cat /tmp/<generic-temp-file>
```

### Explanation

Read the file the cron job created. Its contents are the `bandit22` password:

```
[REDACTED]
```

### Why It Matters

You escalated from "I can read a cron config" to "I have another user's credential" with nothing but reconnaissance and patience.

## Deep Dive: Cyber Security Concept

**Scheduled tasks and insecure temporary files.**

`cron` reads jobs from per-user crontabs, `/etc/crontab`, and drop-in files in `/etc/cron.d/` (plus `cron.{hourly,daily,weekly,monthly}/`). The `/etc/cron.d/` entries carry an extra **username** field, which is why they're a prime enumeration target — that's where privileged jobs live.

The schedule is five fields: `minute hour day-of-month month day-of-week`. `* * * * *` means "every minute," which is why the temp file is essentially always present here.

The flaw is the **insecure temporary file**. `/tmp` is world-readable by design; writing a secret there and `chmod 644`-ing it exposes it to every user. Combine that with a **predictable filename** and you have a textbook information-disclosure primitive.

> [!IMPORTANT]
> Two mistakes stack: a privileged job writes a secret to world-readable storage, and it does so on a predictable schedule at a predictable path. Together they make the leak trivially harvestable.

## Offensive Security Perspective

Enumerating scheduled tasks is a standard early step in Linux post-exploitation — cron jobs frequently run as `root` or other privileged users. Operators read `/etc/crontab`, every file in `/etc/cron.d/`, the `cron.*` directories, and note **which user each job runs as and what files it touches**. Tools like `linpeas` and especially `pspy` (which watches the process table without root) surface short-lived cron-spawned processes you'd otherwise miss. "A privileged job leaves a secret in `/tmp`" is a real finding, not just a CTF contrivance.

## Common Beginner Mistakes

- Looking only in `/etc/crontab` and missing `/etc/cron.d/`.
- Stopping at the cron config without following it to the script.
- Assuming you must become `bandit22` — the job already did the privileged read for you.
- Mistyping the `/tmp` filename; copy it exactly from the script.
- Reading the temp file when it's momentarily absent — wait a minute and retry.

## Key Takeaways

- `cron` runs jobs on a schedule; `/etc/cron.d/` names the user each job runs as.
- A scheduled job is a chain: *config → script → side effects*. Follow it fully.
- Writing secrets to world-readable `/tmp` files is classic information disclosure.
- You inherited a credential by reading, not exploiting.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** "enumerate scheduled tasks" is a core Linux privesc checklist item; this is your first hands-on encounter.
- **Red team operations:** harvesting secrets cron leaks, or hijacking writable scripts/paths it runs, is a reliable post-exploitation primitive for escalating and persisting.
- **Exploit development:** abusing predictable, world-readable temp files is a classic local privesc technique you'll weaponize beyond this CTF.
- **Cloud/host pentest:** misconfigured scheduled jobs touching world-writable paths are a fast route to a higher-privileged user or root.

## Additional Reading

- [`man 5 crontab`](https://man7.org/linux/man-pages/man5/crontab.5.html), [`man 8 cron`](https://man7.org/linux/man-pages/man8/cron.8.html)
- [`man mktemp`](https://man7.org/linux/man-pages/man1/mktemp.1.html)
- [CWE-377: Insecure Temporary File](https://cwe.mitre.org/data/definitions/377.html)
- [MITRE ATT&CK — T1053.003: Scheduled Task/Job: Cron](https://attack.mitre.org/techniques/T1053/003/)
- [pspy — unprivileged Linux process snooping](https://github.com/DominicBreuker/pspy)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

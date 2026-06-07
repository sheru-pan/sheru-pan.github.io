# OverTheWire Bandit Level 21 → Level 22

## Introduction

After a long run of levels about *reading* things you already have access to, Bandit 21 → 22 pivots to a new and much more powerful idea: **something else on the system is running on your behalf, automatically, and that automation can leak secrets.** The mechanism is `cron`, the time-based job scheduler that quietly keeps Linux systems alive — rotating logs, taking backups, sending mail, expiring caches. Cron is invisible until you go looking for it, and that invisibility is exactly why it is such a rich target.

The skill being taught is reading `cron` configuration. The lesson underneath it is **information disclosure through insecure temporary files**: a scheduled job copies a privileged password into a predictable, world-readable file in `/tmp`, and anyone on the box can simply read it.

## Official Challenge Objective

> **A program is running automatically at regular intervals from `cron`, the time-based job scheduler. Look in `/etc/cron.d/` for the configuration and see what command is being executed.**

**In plain English:** the system is set up to run a particular program over and over on a schedule. The definition of *what* runs and *how often* lives in `/etc/cron.d/`. Read that configuration, follow it to the script it points at, understand what the script does, and you will find where it leaves the password for `bandit22`.

## Skills Covered

- Understanding `cron` and time-based scheduling on Linux
- Reading cron configuration in `/etc/cron.d/`
- Following a configuration → script → side-effect chain
- Reading shell scripts to predict their behaviour
- Recognizing the insecure-temporary-file disclosure pattern (`/tmp` + world-readable)

## My Approach

The objective hands you the location, so I went straight to `/etc/cron.d/` and read the cron file named after this level. That file is short: it tells me which script runs and on what schedule. Rather than guessing, I then opened the script itself to see exactly what it does. The script copies `bandit22`'s password out of `/etc/bandit_pass/` and into a file in `/tmp`, and — crucially — `chmod 644`s that file so it is readable by everyone. At that point the level is over: I don't need to be `bandit22`, I just need to read the file the scheduled job has helpfully left lying around for me.

## Step-by-Step Walkthrough

### Command

```bash
cat /etc/cron.d/cronjob_bandit22
```

### Explanation

`/etc/cron.d/` is one of the standard places Linux looks for cron jobs — each file there is a small crontab fragment installed by a package or an admin. The file `cronjob_bandit22` is the configuration for this level. Reading it shows a line of the form:

```
@reboot bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
```

The five `* * * * *` fields are the schedule (minute, hour, day-of-month, month, day-of-week — all wildcards means "every minute"). The next field, `bandit22`, is **the user the job runs as**. The rest is the command: `/usr/bin/cronjob_bandit22.sh`, with output discarded to `/dev/null`.

### Why It Matters

Cron entries answer three questions at once: *what* runs, *when*, and **as whom**. That third field is the security-critical one. A job running as `bandit22` does things with `bandit22`'s privileges — so if you can influence what it does or read what it produces, you inherit a slice of that user's power.

---

### Command

```bash
cat /usr/bin/cronjob_bandit22.sh
```

### Explanation

Following the configuration to the actual script, you see something equivalent to:

```bash
#!/bin/bash
chmod 644 /tmp/<generic-temp-file>
cat /etc/bandit_pass/bandit22 > /tmp/<generic-temp-file>
```

Two actions: it `chmod 644`s a fixed file path in `/tmp` (owner read/write, **group and everyone read**), and it copies `bandit22`'s password into that file. Because the job runs as `bandit22`, it can read `/etc/bandit_pass/bandit22` — and because of the `644`, the result is readable by *you*.

> [!NOTE]
> The temp filename is a fixed string baked into the script, not a secret. I'm writing it generically here, but in practice you just read it straight out of the script and use it verbatim.

### Why It Matters

This is the whole vulnerability in two lines. A privileged process is taking a secret it legitimately has access to and writing it to a location and with permissions that expose it to unprivileged users. The secret didn't need to be "cracked" — it was *handed out* by a misconfigured automation.

---

### Command

```bash
cat /tmp/<generic-temp-file>
```

### Explanation

Read the file the cron job created. Its contents are the password for `bandit22`:

```
[REDACTED]
```

### Why It Matters

You just escalated from "I can read a cron config" to "I have another user's credential" without exploiting any memory-corruption bug or cracking any hash. The entire chain was *read configuration → read script → read the file it produces*. Reconnaissance and patience, not l33t exploits, did the work.

---

### Command

```bash
ssh bandit22@bandit.labs.overthewire.org -p 2220
```

### Explanation

Log out and reconnect as `bandit22` using the password you just recovered. You are now in Level 22.

### Why It Matters

This mirrors real lateral movement: a secret leaked by one account's automation becomes the key to the next account.

## Deep Dive: Cyber Security Concept

**Scheduled tasks and insecure temporary files.**

`cron` is the Unix/Linux time-based job scheduler. It reads job definitions from several places — the per-user crontabs (`crontab -e`), the system crontab (`/etc/crontab`), and drop-in files in `/etc/cron.d/`, plus the convenience directories `/etc/cron.{hourly,daily,weekly,monthly}/`. Each `/etc/cron.d/` entry carries an extra field that user crontabs don't: the **username** the job runs as. That makes `/etc/cron.d/` a favourite place to look during enumeration, because it is exactly where you find privileged jobs.

The schedule syntax is five fields:

```
┌─ minute (0-59)
│ ┌─ hour (0-23)
│ │ ┌─ day of month (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌─ day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *   <user>  <command>
```

`* * * * *` means "every minute of every hour of every day" — which is why, in this level, you never have to wait long for the temp file to appear.

The actual flaw here is the **insecure temporary file**. `/tmp` is world-readable and world-writable by design (it's shared scratch space). Writing a secret into `/tmp` and then `chmod 644`-ing it means the file is readable by every user on the system for as long as it exists. Combine that with a **predictable filename** (a fixed string, recomputable by anyone — the very next level makes this explicit) and you have a textbook information-disclosure primitive.

> [!IMPORTANT]
> Two design mistakes stack here: (1) a privileged job writes a secret to shared, world-readable storage, and (2) it does so on a predictable schedule at a predictable path. Either alone is bad; together they make the leak trivially harvestable.

## Offensive Security Perspective

Enumerating scheduled tasks is a standard early step in Linux post-exploitation, precisely because cron jobs so often run as more privileged users (frequently `root`). An operator who lands a foothold will routinely:

- Read `/etc/crontab`, every file in `/etc/cron.d/`, and the `cron.{hourly,daily,...}` directories.
- Check per-user crontabs they can access and `/var/spool/cron/`.
- Note which user each job runs as and **what files those jobs touch** — especially anything in world-writable locations like `/tmp`.
- Watch for jobs that write to, read from, or execute paths the attacker can influence.

Automated tools like `linpeas` and `pspy` exist largely to surface this: `pspy` in particular watches the process table without root and reveals short-lived cron-spawned processes (including the exact commands and arguments) that you'd otherwise miss. The pattern in this level — "a privileged job leaves a secret in `/tmp`" — is a real finding, not just a CTF contrivance.

## Defensive Perspective

- **Never write secrets to `/tmp` (or any world-readable path).** If a job must materialize a credential to a file, write it to a directory owned by and readable only by the intended consumer, with `chmod 600` and a restrictive `umask`.
- **Use `mktemp` for temporary files**, which creates them with `600` permissions and an unpredictable name, instead of a hardcoded path you `chmod 644`.
- **Prefer not to materialize secrets at all** — pass them via environment, a secrets manager, or an in-memory pipe rather than a file on disk.
- **Audit your cron jobs.** Review every entry in `/etc/cron.d/` and `/etc/crontab` for the user it runs as and the files it touches. Treat any job that writes to `/tmp` as suspect.
- **Monitoring opportunity:** watch privileged temp-file creation. An `auditd` rule on `/tmp` writes by service accounts, or file-integrity monitoring on credential paths, will flag this pattern:
  ```bash
  auditctl -w /etc/bandit_pass/ -p r -k secret_read
  ```
- **Detection idea:** alert when a cron-scheduled process reads a known secret path and then writes a world-readable file — that sequence is rarely legitimate.

## Common Beginner Mistakes

- **Looking only in `crontab -e` / `/etc/crontab`** and missing `/etc/cron.d/`, where the level explicitly points you.
- **Stopping at the cron config** and not following it to the script — the config tells you *what runs*, but the script tells you *what it does*.
- **Assuming you need to become `bandit22`** to read the password. You don't; the job already did the privileged read for you and left the result world-readable.
- **Mistyping the `/tmp` filename.** Copy it exactly from the script.
- **Reading the temp file at the wrong moment.** With a `* * * * *` schedule it's regenerated every minute, so it's essentially always there — but if it's ever missing, wait a minute and re-read.

## Key Takeaways

- `cron` runs jobs automatically on a schedule; `/etc/cron.d/` is a primary place to find them, and each entry names the user it runs as.
- A scheduled job is a chain: *config → script → side effects*. Follow it all the way.
- Writing secrets to world-readable `/tmp` files is a classic information-disclosure flaw.
- You inherited another user's credential by *reading*, not exploiting — recon wins levels.
- Always check who a scheduled task runs as and what files it touches.

## How This Helps Build Cyber Security Expertise

- **Privilege escalation:** "enumerate scheduled tasks" is a core Linux privesc checklist item; this level is your first hands-on encounter with it. The next two levels build directly on it.
- **DFIR:** investigators frequently find persistence and data-exfil mechanisms hiding in cron; knowing the config locations cold makes triage fast.
- **Detection engineering:** understanding *how* a leak like this looks on disk and in the process table tells you exactly what to instrument and alert on.
- **Secure development:** the `mktemp`-vs-hardcoded-`/tmp` lesson is a real secure-coding habit you'll apply far beyond CTFs.

## Additional Reading

- [`man 5 crontab`](https://man7.org/linux/man-pages/man5/crontab.5.html) and [`man 8 cron`](https://man7.org/linux/man-pages/man8/cron.8.html)
- [`man mktemp`](https://man7.org/linux/man-pages/man1/mktemp.1.html)
- [CWE-377: Insecure Temporary File](https://cwe.mitre.org/data/definitions/377.html)
- [MITRE ATT&CK — T1053.003: Scheduled Task/Job: Cron](https://attack.mitre.org/techniques/T1053/003/)
- [pspy — unprivileged Linux process snooping](https://github.com/DominicBreuker/pspy)

---

*Next up: [Level 22 → 23](./23-bandit-level-22-23.md) — the same cron pattern, but now the temp filename is "hidden" behind an md5sum you can recompute yourself.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

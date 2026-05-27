---
title: "Linux File Search Commands for Incident Response"
description: "which, locate, and find — the three commands you'll lean on the most during a live Linux investigation."
date: 2026-02-04
platform: Lab notes
difficulty: easy
tags: [linux, incident-response, dfir, cheatsheet]
---

When you're triaging a Linux box during an incident, you're constantly looking for files: webshells dropped in document roots, persistence in cron, backdoors masquerading as system binaries, exfiltration staging in `/tmp`. Three commands cover 95% of that work: `which`, `locate`, and `find`.

This is the cheat-sheet I keep open in a second pane during IR exercises.

## `which` — which binary is being run?

`which` walks `$PATH` and prints the first match. Useful when you suspect a malicious binary is shadowing a real one (a common persistence trick on compromised hosts).

```bash
which ls
# /bin/ls

which -a ls
# /usr/local/bin/ls   ← suspicious if you don't expect it
# /bin/ls
```

If `which -a` returns multiple results, an attacker may have planted a binary earlier in `$PATH`. Verify with:

```bash
echo $PATH
ls -la /usr/local/bin/ls /bin/ls
```

Anything in `/usr/local/bin` you don't recognize, or with an unexpected mtime, deserves a hash and a sandbox detonation.

## `locate` — fast lookups against an index

`locate` queries a database built by `updatedb` (cron-scheduled). Hugely faster than `find` for "is there a file called X anywhere on the system?" type questions.

```bash
locate authorized_keys
# /home/admin/.ssh/authorized_keys
# /home/dev/.ssh/authorized_keys
# /tmp/.x/authorized_keys      ← red flag
```

A pubkey under `/tmp/` is almost certainly attacker persistence.

Update the index manually (the cron job may not have run since you mounted the disk):

```bash
sudo updatedb
```

> If `locate` isn't installed, `apt install mlocate` on Debian/Ubuntu, or use `find` directly.

## `find` — the IR Swiss army knife

`find` does live filesystem walks with arbitrary filters. Slow on big disks, but precise.

### Triage recipes

**Files modified in the last day (excellent for post-compromise scoping):**

```bash
find / -type f -mtime -1 -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null
```

**Files accessed in the last hour (catch live activity):**

```bash
find / -type f -atime -1/24 -not -path '/proc/*' 2>/dev/null
```

**SUID binaries outside expected locations (privilege-escalation hunt):**

```bash
find / -perm -4000 -type f -not -path '/proc/*' 2>/dev/null
```

Compare the output against a known-good baseline. Anything new is a finding.

**Recent files in common attacker staging areas:**

```bash
find /tmp /var/tmp /dev/shm -type f -mtime -7
```

**Webshell hunting in document roots:**

```bash
find /var/www -type f \( -name '*.php' -o -name '*.jsp' -o -name '*.aspx' \) -mtime -30 \
  -exec grep -l -E 'eval\(|base64_decode|gzinflate|str_rot13|assert\(' {} \;
```

That `-exec grep` line catches the most common obfuscation patterns in dropped webshells. Tune as needed.

**Excluding noisy paths during a wide hunt:**

```bash
find / -type f -name '*.sh' \
  -not -path '/proc/*' -not -path '/sys/*' -not -path '/snap/*' \
  -mtime -7 2>/dev/null
```

## Putting it together

A practical first-15-minute Linux IR script using just these three commands:

```bash
# 1. What was changed recently?
find / -type f -mtime -1 -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null > /tmp/ir_recent.txt

# 2. Any pubkeys outside home dirs?
locate authorized_keys | grep -v '^/home' | grep -v '^/root'

# 3. SUID footprint baseline check
find / -perm -4000 -type f 2>/dev/null | sort > /tmp/ir_suid.txt
diff /tmp/ir_suid.txt /etc/baselines/suid.txt   # assuming you have a baseline

# 4. Was `ls` shadowed?
which -a ls
```

Four commands, a starting picture of the box.

## Going further

For deeper IR work, swap to `auditd`, `Velociraptor`, or `osquery` — they give structured, queryable results. But `which / locate / find` will be on every box you ever touch, including the ones where the attacker has already removed your fancy tooling. Learn them cold.

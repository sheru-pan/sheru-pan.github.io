---
title: "OverTheWire Bandit — From a Defender's Notebook"
description: "Walking through Bandit Level 0 → 1 not just to solve it, but to think about what each step would look like in SOC telemetry."
date: 2026-04-15
platform: OverTheWire
difficulty: easy
tags: [ctf, linux, ssh, bandit, log-analysis]
---

Theory without hands-on practice is empty calories. CTFs are how I keep my Linux and command-line muscle in shape — but I try to play them from a defender's seat: *if this ran in my environment, what would the logs say?*

[OverTheWire's Bandit](https://overthewire.org/wargames/bandit/) is the canonical Linux starter. 33 levels, each accessed by SSH, each gated by a password you find on the previous level. I'll cover **Level 0 → 1** here, with parenthetical "what the SOC would see" notes.

## SSH refresher

Bandit lives on one host:

- **Host:** `bandit.labs.overthewire.org`
- **Port:** `2220`
- **Level 0 creds:** `bandit0 / bandit0`

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

> **Defender note:** Every SSH login generates an `sshd` log line. On a real system, `/var/log/auth.log` (Debian) or `/var/log/secure` (RHEL) is the first place I'd look. In a SIEM, watch for `EventID=4624` (Windows) or `auth.log` SSH `Accepted password` lines — especially from new source IPs.

## Saving keystrokes with `~/.ssh/config`

Every level uses the same host/port. Edit `~/.ssh/config`:

```sshconfig
Host bandit
  HostName bandit.labs.overthewire.org
  Port 2220
  User bandit0
```

Now `ssh bandit` works. For multi-level convenience I also drop a shell variable in `~/.bashrc`:

```bash
export BANDIT="bandit.labs.overthewire.org"
```

`source ~/.bashrc` to reload — or open a new shell.

> **Defender note:** Attackers love `~/.ssh/config` and `~/.bashrc` modifications for persistence — those files belong in your file-integrity-monitoring set. Sysmon equivalent on Linux: auditd's `file-watch` rules.

## Level 0 → 1: read the readme

Once you're in:

```bash
ls
cat readme
```

The contents of `readme` is the password for `bandit1`. SSH back in as that user and the next level begins.

## What this level actually teaches

- `ssh` with a non-default port.
- `~/.ssh/config` to manage many hosts.
- `ls` and `cat` — first-line tools you'll use a hundred times a day in any incident response.

In a SOC, you'll be reading other people's logs more often than you ever read your own files. Cat-fluency is a tax you pay early so you can move fast later.

## What I'm doing differently this round

I'm keeping a parallel **defender's notebook** alongside each level: for every command I run, I note the matching log artifact and the Sigma/KQL detection pattern that would catch it. Slower, but I'll have a personal MITRE-tagged reference by the time I hit Level 33.

More Bandit posts to follow as I progress.

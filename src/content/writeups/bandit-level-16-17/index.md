---
title: "OverTheWire Bandit Level 16 → 17: Port Scanning, Service Detection & a Private Key"
description: "A miniature engagement: scan a port range with nmap, fingerprint services to tell SSL from echo decoys, connect to the right TLS port, and claim an RSA private key."
date: 2026-06-07
platform: OverTheWire
difficulty: medium
tags: [ctf, linux, bandit, nmap, port-scanning, tls, openssl, reconnaissance]
---

## Introduction

This level brings the previous three together into a proper reconnaissance problem. A server somewhere in ports **31000–32000** on localhost will hand you the next credentials — but you must *find it first*. Several ports listen; some are plaintext echo decoys, some speak SSL/TLS, and exactly **one** TLS port gives up the goods. The reward isn't a password — it's an **RSA private key** for `bandit17`.

The workflow: **scan** to find open ports, **fingerprint** to tell SSL from plain echo, then **connect with TLS** to the right one. The first level that feels like a real engagement: enumerate, classify, exploit.

## Official Challenge Objective

> **The credentials for the next level can be retrieved by submitting the current level's password to a port on localhost in the range 31000 to 32000. First find out which of these ports have a server listening on them. Then find out which of those speak SSL/TLS and which don't. There is only 1 server that will give the next credentials, the others will simply send back to you whatever you send to it.**

**In plain English:** between ports 31000 and 32000 are a handful of services. Most are decoys that echo your input. One — speaking SSL/TLS — validates the `bandit16` password and returns the `bandit17` private key. Scan, identify the TLS service, connect, submit, collect the key.

## Skills Covered

- **Port scanning** with `nmap` over a range
- **Service/version detection** (`nmap -sV`) to distinguish SSL from plaintext
- Connecting to the right TLS port with `openssl s_client`
- Recognizing and saving an **RSA private key**
- Chaining: key → `chmod 600` → `ssh -i`

## My Approach

The objective dictates the method, so I followed it literally. **Scan** 31000–32000 for open ports. **Run `-sV`** on just the open ones to classify each as echo or TLS. Since only one TLS server gives credentials, I focused on the SSL ports. **Connect** to the promising TLS port with `openssl s_client -quiet` (avoiding the renegotiation noise from last level), submit the `bandit16` password, and read the response — a full RSA private key. Then the familiar key dance: save, `chmod 600`, `ssh -i`.

## Step-by-Step Walkthrough

### Command

```bash
nmap localhost -p 31000-32000
```

### Explanation

`nmap` scans the range on `localhost`. The open ports in this run:

```
31046/tcp open  unknown
31518/tcp open  unknown
31691/tcp open  unknown
31790/tcp open  unknown
31960/tcp open  unknown
```

### Why It Matters

Port scanning is the bedrock of recon. Narrowing 1000 possible ports to 5 listeners in one command is the funnel every engagement starts with.

---

### Command

```bash
nmap -sV localhost -p 31046,31518,31691,31790,31960
```

### Explanation

`-sV` enables **service/version detection** — nmap probes each port and identifies the protocol, separating SSL from plain echo:

```
31046  echo (plaintext)
31518  ssl/echo
31691  echo (plaintext)
31790  ssl/unknown   ← the interesting one
31960  echo (plaintext)
```

The decoys announce as `echo`. `31790` is an SSL service that isn't a simple echo — the prime suspect.

### Why It Matters

Knowing a port is open is half the picture; knowing *what speaks there* is the rest. `-sV` separates the one SSL/unknown service from four echo decoys without poking each by hand.

> [!TIP]
> Sanity-check a suspected echo port with `nc`: if it parrots your text back, it's a decoy.

---

### Command

```bash
openssl s_client -connect localhost:31790 -quiet
```

### Explanation

Connect to the TLS service on `31790`. `-quiet` suppresses handshake noise and implies `-ign_eof`. **Paste the `bandit16` password and press Enter.** The server responds:

```
Correct!
-----BEGIN RSA PRIVATE KEY-----
[REDACTED]
-----END RSA PRIVATE KEY-----
```

### Why It Matters

This is the payoff of correct enumeration: the *one* right service, the right way. The RSA-key reward callbacks Level 13 → 14 — keys are credentials you carry forward.

---

### Command

```bash
nano bandit17.key          # paste the full key block, save
chmod 600 bandit17.key
ssh bandit17@localhost -i bandit17.key -p 2220
```

### Explanation

Copy the entire key block (header to footer, inclusive) into a file, set `600` so SSH accepts it, then authenticate as `bandit17` with `-i`.

> [!IMPORTANT]
> Save the key *exactly*: include both `BEGIN`/`END` lines, no extra blank lines or stray characters, every line break preserved. A corrupted key gives "invalid format" / "Permission denied (publickey)" — a transcription problem masquerading as an auth problem.

### Why It Matters

The standard real-world pattern for a recovered key: capture intact, fix permissions, authenticate — the same sequence you'll use with cloud `.pem` files for years.

## Deep Dive: Cyber Security Concept

**Reconnaissance: discovery → fingerprinting → targeted interaction.** Real attacks start with *finding what's there*. This level is a clean three-phase funnel:

```mermaid
flowchart TD
    A[Ports 31000-32000] -->|nmap -p range| B[5 open ports]
    B -->|nmap -sV| C{Classify}
    C -->|echo plaintext| D[31046,31691,31960 decoys]
    C -->|ssl/echo| E[31518 TLS but echoes]
    C -->|ssl/unknown| F[31790 real target]
    F -->|openssl s_client -quiet| G[Submit password]
    G --> H[RSA private key for bandit17]
```

- **Discovery** shrinks the search space from a thousand to a handful.
- **Fingerprinting** (`-sV`) tells you *what* each is, so you don't waste time.
- **Targeted interaction** applies the right protocol to the one service that matters.

The decoys are clever: an **echo service** returns exactly what you send, so a careless tester might mistake the echo for a meaningful reply. Fingerprinting avoids the trap.

> [!NOTE]
> `nmap -sV` sends protocol probes and matches responses against a signature DB — that's how it labels a port `ssl/echo` vs `ssl/unknown`.

## Offensive Security Perspective

- **Nmap is the universal first move** — `-sV`/`-sC` turn open ports into an attack-surface map.
- **Decoys/honeypots are real:** echo services mimic tarpits; fingerprinting keeps you from chasing ghosts.
- **Service mis-ID wastes time and triggers alerts:** know TLS vs plaintext before connecting.
- **Keys as loot, again:** the RSA reward is T1552.004 lateral-movement currency.

## Defensive Perspective

- **Minimize attack surface:** close unneeded ports, bind internal services to loopback; audit with `ss -tlnp`.
- **Detect scanning:** port sweeps are a classic IDS signature; `-sV` is especially detectable.
- **Don't serve secrets from naive services:** require strong auth, rate-limit, rotate.
- **Mask versions** where sensible (defense in depth, not a real control).
- **Treat private keys as crown jewels:** encrypt at rest, scope tightly, monitor, rotate.

## Common Beginner Mistakes

- Skipping the scan and guessing ports.
- Forgetting `-sV` and using the wrong client for the port.
- Treating an echo reply as success — only "Correct!" counts.
- Using plain `nc` on the TLS port (31790 needs `openssl s_client`).
- Mangling the saved key (missing header/footer or added whitespace).
- Skipping `chmod 600` and blaming SSH.

## Key Takeaways

- Recon is a funnel: **discover**, **fingerprint**, **interact** correctly.
- `nmap -p <range>` finds listeners; `nmap -sV` identifies them.
- Echo decoys parrot input — only "Correct!" is real.
- Use `openssl s_client` for TLS; plain `nc` won't handshake.
- A recovered RSA key: save intact, `chmod 600`, `ssh -i`.

## How This Helps Build Cyber Security Expertise

- **Pentesting:** the opening of a real assessment — scan, enumerate, target — in one level.
- **Blue team:** seeing how loud and effective scanning is teaches what to detect and why surface reduction matters.
- **Service analysis:** distinguishing protocols by behavior is transferable.
- **Credential handling:** repeated key recovery cements secure key hygiene.

## Additional Reading

- [Nmap Reference Guide](https://nmap.org/book/man.html) and [Service/Version Detection](https://nmap.org/book/vscan.html)
- [`openssl-s_client` manpage](https://www.openssl.org/docs/man3.0/man1/openssl-s_client.html)
- [MITRE ATT&CK — T1046: Network Service Discovery](https://attack.mitre.org/techniques/T1046/), [T1552.004: Private Keys](https://attack.mitre.org/techniques/T1552/004/)


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

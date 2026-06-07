# OverTheWire Bandit Level 16 → Level 17

## Introduction

This level brings the previous three together into a proper little reconnaissance problem. You are told a server somewhere in the port range **31000–32000** on localhost will hand you the next credentials — but you have to *find it first*. Multiple ports are listening; some speak plain text and merely echo back whatever you send; some speak SSL/TLS; and exactly **one** of the TLS ones gives up the goods. And the reward this time isn't a password — it's an **RSA private key**, which you'll use to log into `bandit17`.

So the workflow is: **scan** the range to find open ports, **fingerprint** them to tell SSL from plain echo, then **connect with TLS** to the right one and submit your password. It's the first level that feels like a miniature engagement: enumerate, classify, exploit.

## Official Challenge Objective

> **The credentials for the next level can be retrieved by submitting the current level's password to a port on localhost in the range 31000 to 32000. First find out which of these ports have a server listening on them. Then find out which of those speak SSL/TLS and which don't. There is only 1 server that will give the next credentials, the others will simply send back to you whatever you send to it.**

**In plain English:** somewhere between ports 31000 and 32000 there are a handful of listening services. Most are decoys that just echo your input back. One — and it speaks SSL/TLS — will validate the `bandit16` password and return the `bandit17` private key. Scan, identify the TLS service, connect, submit, collect the key.

## Skills Covered

- **Port scanning** with `nmap` over a range
- **Service/version detection** (`nmap -sV`) to distinguish SSL from plaintext
- Connecting to the correct TLS port with `openssl s_client`
- Recognizing and saving an **RSA private key** from program output
- Chaining: key → `chmod 600` → `ssh -i` into the next level

## My Approach

The objective practically dictates the methodology, so I followed it literally. **Step one:** scan 31000–32000 to see which ports are even open — no point talking to closed ports. **Step two:** run version detection on just the open ports to learn what each one is; `nmap -sV` labels them as plain "echo" services or TLS-wrapped ones. The objective says only one TLS server gives credentials, so I focused on the SSL ports. **Step three:** connect to the promising TLS port with `openssl s_client` (using `-quiet` to avoid the renegotiation noise I learned about last level), submit the `bandit16` password, and read the response — which turned out to be a full RSA private key. From there it's the familiar key dance: save it, `chmod 600`, and `ssh -i` as `bandit17`.

## Step-by-Step Walkthrough

### Command

```bash
nmap localhost -p 31000-32000
```

### Explanation

`nmap` scans the specified port range on `localhost`. `-p 31000-32000` restricts the scan to that range. The output lists which ports are **open** (have a listening server). In this run, the open ports were:

```
PORT      STATE SERVICE
31046/tcp open  unknown
31518/tcp open  unknown
31691/tcp open  unknown
31790/tcp open  unknown
31960/tcp open  unknown
```

### Why It Matters

Port scanning is the bedrock of network reconnaissance. Before you can attack a service you must know it exists. Narrowing from 1000 possible ports to 5 listeners in one command is exactly the funnel every engagement starts with.

---

### Command

```bash
nmap -sV localhost -p 31046,31518,31691,31790,31960
```

### Explanation

`-sV` enables **service and version detection**: nmap doesn't just report "open," it probes each port and tries to identify the protocol and software. This is what tells SSL apart from plain echo. The result distinguished them roughly as:

```
31046  echo (plaintext)
31518  ssl/echo
31691  echo (plaintext)
31790  ssl/unknown   ← the interesting one
31960  echo (plaintext)
```

The decoys announce themselves as `echo`. `31790` shows up as an SSL service that *isn't* a simple echo — the prime suspect for the real credential server.

### Why It Matters

Knowing a port is open is half the picture; knowing *what speaks there* is the other half. `-sV` is how you separate signal from noise — here, the single SSL/unknown service from four echo decoys — without manually poking each one.

> [!TIP]
> You can sanity-check a suspected echo port by connecting with `nc` and typing something: if it parrots your text straight back, it's a decoy.

---

### Command

```bash
openssl s_client -connect localhost:31790 -quiet
```

### Explanation

Connect to the identified TLS service on port `31790`. `-quiet` suppresses the handshake/certificate noise and implies `-ign_eof` so the session behaves cleanly. Once connected, **paste the `bandit16` password and press Enter.** The server validates it and responds:

```
Correct!
-----BEGIN RSA PRIVATE KEY-----
[REDACTED]
-----END RSA PRIVATE KEY-----
```

### Why It Matters

This is the payoff of correct enumeration: you talked to the *one* right service in the right way. And the reward — an RSA private key — is a callback to Level 13 → 14, reinforcing that keys are credentials you carry forward.

---

### Command

```bash
# On bandit16: save the key, lock it down
nano bandit17.key          # paste the full key block, save
chmod 600 bandit17.key
ssh bandit17@localhost -i bandit17.key -p 2220
```

### Explanation

Copy the entire key block — from `-----BEGIN RSA PRIVATE KEY-----` to `-----END RSA PRIVATE KEY-----`, inclusive — into a file. Set permissions to `600` so SSH will accept it (it refuses world-/group-readable keys). Then authenticate as `bandit17` using `-i`. You're into the next level.

> [!IMPORTANT]
> Save the key *exactly*: include both header and footer lines, no extra blank lines or stray characters, and preserve every line break. A corrupted key produces "invalid format" / "Permission denied (publickey)" errors that look like an auth problem but are really a transcription problem.

### Why It Matters

This is the standard real-world pattern for handling a recovered key: capture it intact, fix permissions, authenticate. You'll repeat this exact sequence with cloud `.pem` files and harvested keys for the rest of your career.

## Deep Dive: Cyber Security Concept

**Reconnaissance: discovery → fingerprinting → targeted interaction.**

Real attacks (and assessments) don't start with exploitation — they start with *finding out what's there*. This level is a clean three-phase model of that funnel:

```mermaid
flowchart TD
    A[Port range 31000-32000] -->|nmap -p range| B[5 open ports]
    B -->|nmap -sV| C{Classify}
    C -->|echo plaintext| D[31046, 31691, 31960 = decoys]
    C -->|ssl/echo| E[31518 = TLS but echoes]
    C -->|ssl/unknown| F[31790 = real target]
    F -->|openssl s_client -quiet| G[Submit password]
    G --> H[RSA private key for bandit17]
```

- **Discovery** (which ports are open?) shrinks the search space from a thousand to a handful.
- **Fingerprinting** (`-sV`) tells you *what* each one is, so you don't waste time talking gibberish to an echo server or plaintext to a TLS port.
- **Targeted interaction** applies the right protocol (`openssl s_client`) to the one service that matters.

The decoys are pedagogically clever: an **echo service** sends back exactly what you send, so a careless tester might "submit" the password and see it returned, mistaking the echo for a meaningful reply. Fingerprinting saves you from that trap.

> [!NOTE]
> `nmap -sV` works by sending protocol-specific probes and matching responses against a signature database. That's why it can label a port `ssl/echo` vs `ssl/unknown` — it negotiated TLS and then saw whether the behavior matched a known service.

## Offensive Security Perspective

- **Nmap is the universal first move.** Nearly every engagement opens with port and service discovery; `-sV` (and `-sC` for default scripts) turn a list of open ports into an actionable map of attack surface.
- **Decoys and honeypots are real.** Echo services here mimic honeypots/tarpits attackers encounter in the wild — fingerprinting and behavioral checks keep you from chasing ghosts.
- **Service mis-ID wastes time.** Knowing whether a port is TLS lets you use the correct client immediately instead of hammering it with the wrong protocol.
- **Keys as loot, again.** The RSA key reward reinforces T1552.004: recovered private keys are immediate lateral-movement currency.

## Common Beginner Mistakes

- **Skipping the scan** and guessing ports — you'll waste effort and may hit a decoy.
- **Forgetting `-sV`** and being unable to tell SSL from plaintext, then using the wrong client.
- **Treating an echo reply as success** — the decoys parrot your input; "Correct!" is the only real signal.
- **Using plain `nc` on the TLS port** (port 31790 needs `openssl s_client`).
- **Mangling the saved key** — missing header/footer lines or added whitespace.
- **Skipping `chmod 600`** on the new key and blaming SSH for rejecting it.

## Key Takeaways

- Recon is a funnel: **discover** open ports, **fingerprint** services, then **interact** correctly.
- `nmap -p <range>` finds listeners; `nmap -sV` identifies what they are.
- Echo/decoy services parrot your input — only a real validation message ("Correct!") counts.
- Use `openssl s_client` for the TLS port; plain `nc` won't handshake.
- A recovered RSA private key follows the same drill: save intact, `chmod 600`, `ssh -i`.

## How This Helps Build Cyber Security Expertise

- **Penetration testing:** this *is* the opening of a real assessment — scan, enumerate, target — compressed into one level.
- **Red teaming:** scanning a port range and fingerprinting services is how you map a target's attack surface and pick the one host worth exploiting.
- **Service analysis:** distinguishing protocols by behavior (echo vs TLS app) is a transferable diagnostic skill for finding the real service among decoys.
- **Credential handling:** repeatedly recovering and using private keys cements secure key hygiene as muscle memory.

## Additional Reading

- [`man nmap`](https://man7.org/linux/man-pages/man1/nmap.1.html) and the [Nmap Reference Guide](https://nmap.org/book/man.html)
- [Nmap — Service and Version Detection](https://nmap.org/book/vscan.html)
- [`openssl-s_client` manpage](https://www.openssl.org/docs/man3.0/man1/openssl-s_client.html)
- [MITRE ATT&CK — T1046: Network Service Discovery](https://attack.mitre.org/techniques/T1046/) and [T1552.004: Private Keys](https://attack.mitre.org/techniques/T1552/004/)

---

*Next up: [Level 17 → 18](./18-bandit-level-17-18.md) — diffing two files to spot the single line that changed.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

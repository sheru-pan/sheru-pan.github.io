---
title: "OverTheWire Natas Level 8 → 9: Reverse Engineering an Encoding Scheme"
description: "Natas Level 8 encodes a secret with base64, string reversal, and hex encoding. We reverse each step in the right order to recover the original value."
date: 2026-06-10
platform: OverTheWire
difficulty: easy
tags: [ctf, web, natas, overthewire, encoding, reverse-engineering, base64, hex, php]
series: "OverTheWire Natas"
order: 8
seriesLabel: "Level 8 → 9"
draft: false
---

> Part of a complete level-by-level Natas series. Each post is self-contained — if you want context on the setup and tooling, start with the [Intro & Setup](../natas-00-introduction/) post.

## Introduction

Level 8 has the same structure as Level 6: a form asking for a secret, a "View sourcecode" link. But this time the comparison is not against a plaintext value in an included file — it is against an **encoded** value embedded in the source. The PHP source shows us both the encoded secret and the encoding function. We need to reverse the encoding to recover the original secret, then submit it. The encoding is three steps: base64 encode, then reverse the string, then hex-encode. We undo them in reverse order. All the tools we need are standard Linux commands.

## Official Challenge Objective

> **Input the secret and unlock the password for the next level. [View sourcecode]**

## Skills Covered

- Reading PHP source code to extract encoding logic
- Reversing a multi-step encoding chain: hex decode → string reverse → base64 decode
- Using `xxd`, `rev`, and `base64` in a shell pipeline
- Understanding the difference between encoding and encryption
- Recognising obfuscated credentials as a false sense of security

## My Approach

I read the sourcecode first, as always. The PHP defines an `encodeSecret()` function that does `bin2hex(strrev(base64_encode($secret)))` — three operations, applied in that order. To reverse them I need to undo each operation in reverse order: hex decode first, then reverse the string, then base64 decode. I built the pipeline step by step in bash, verified each intermediate result, and submitted the final string to the form.

## Step-by-Step Walkthrough

### Command

```bash
curl http://natas8:xcoXLmzMkoIP9D7hlgPlh9XD7OgLAe5Q@natas8.natas.labs.overthewire.org/index-source.html
```

### Explanation

The PHP sourcecode reveals the encoding scheme:

```php
<?

$encodedSecret = "3d3d516343746d4d6d6c315669563362";

function encodeSecret($secret) {
    return bin2hex(strrev(base64_encode($secret)));
}

if(array_key_exists("submit", $_POST)) {
    if(encodeSecret($_POST['secret']) == $encodedSecret) {
        print "Access granted. The password for natas9 is <censored>";
    } else {
        print "Wrong secret";
    }
}
?>
```

The encoding chain, applied to `$secret` to produce `$encodedSecret`:
1. `base64_encode($secret)` — base64 encode the input
2. `strrev(...)` — reverse the resulting string
3. `bin2hex(...)` — convert to hexadecimal representation

To recover `$secret` from `$encodedSecret`, reverse each step in reverse order:
1. Hex decode `3d3d516343746d4d6d6c315669563362`
2. Reverse the resulting string
3. Base64 decode the result

### Why It Matters

This kind of "reverse the encoding" problem teaches you to read encoding logic carefully and identify each operation. In real security work you encounter similar patterns in JWT libraries (base64url encoding), binary protocols, obfuscated malware (multiple layers of encoding), and legacy systems that use rolling XOR or custom ciphers. The skill is: identify the operations, reverse their order, undo each one.

---

### Command

```bash
# Step 1: Hex decode the encoded secret
echo "3d3d516343746d4d6d6c315669563362" | xxd -r -p
```

### Explanation

`xxd -r -p` reverses a hexdump — it reads hex digits and outputs the corresponding bytes. The encoded secret `3d3d516343746d4d6d6c315669563362` decodes to:

```
==QcCtmMml1ViV3b
```

This is the result of PHP's `strrev()` applied to a base64 string (notice the `==` padding characters — they are at the start here because the string is reversed, and base64 padding normally appears at the end).

### Why It Matters

`xxd -r -p` is the standard way to convert hex back to binary in bash. The `-r` flag reverses the direction (from hex to binary), and `-p` specifies "plain" hex input (no address column or ASCII column). Knowing this command is essential for any encoding/decoding work in CTFs and real forensics.

---

### Command

```bash
# Step 2: Reverse the string
echo "3d3d516343746d4d6d6c315669563362" | xxd -r -p | rev
```

### Explanation

`rev` reverses a string line by line. Applying it to `==QcCtmMml1ViV3b`:

```
b3ViV1lmMmtCcQ==
```

Now the `==` padding is back at the end where base64 expects it, and we have what looks like a valid base64 string.

### Why It Matters

`rev` is a simple but useful command. Knowing it exists means you do not need to write a Python script to reverse a string in the shell. In encoding reverse-engineering problems, being able to pipeline through shell tools — `xxd`, `rev`, `base64`, `tr`, `openssl` — without dropping into a scripting language keeps the feedback loop fast.

---

### Command

```bash
# Step 3: Base64 decode
echo "3d3d516343746d4d6d6c315669563362" | xxd -r -p | rev | base64 -d
```

### Explanation

`base64 -d` decodes a base64 string. Applying it to `b3ViV1lmMmtCcQ==`:

```
oubWYf2kBq
```

The original secret is `oubWYf2kBq`. This is what we need to POST to the form.

### Why It Matters

The complete pipeline — `xxd -r -p | rev | base64 -d` — is a one-liner that reverses all three encoding steps. Building this kind of pipeline in bash is a core shell skill. Each component does one thing and passes its output to the next through standard input/output. This is the Unix philosophy in action.

---

### Command

```bash
curl -d "secret=oubWYf2kBq" -d "submit=submit" \
     http://natas8:xcoXLmzMkoIP9D7hlgPlh9XD7OgLAe5Q@natas8.natas.labs.overthewire.org/
```

### Explanation

Submitting the recovered secret via POST:

```
Access granted. The password for natas9 is ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t
```

The natas9 password is `ZE1ck82lmdGIoErlhQgWND6j2Wzz6b6t`.

### Why It Matters

Completing the solve confirms that our decoding pipeline was correct. This is a good practice habit: when you work through an encoding reversal, verify by re-encoding the recovered value through the original function and checking it matches the expected output. Here: `bin2hex(strrev(base64_encode("oubWYf2kBq")))` should produce `3d3d516343746d4d6d6c315669563362`.

## Deep Dive: Cyber Security Concept

**Encoding vs. encryption — and why encoded secrets are not secret.**

This level illustrates a common and dangerous misconception: that encoding a value provides security. It does not. Encoding is a **reversible, public** transformation designed for data compatibility, not for confidentiality. Anyone who knows the encoding scheme (or can read the source code that implements it) can reverse it trivially. The encoding here — base64 + strrev + bin2hex — looks complicated at first glance, but it is deterministic and reversible with standard tools.

Encryption, by contrast, requires a secret **key** that is not embedded in the application and is not derivable from the ciphertext alone. AES-256 encryption of `oubWYf2kBq` with a 256-bit key produces ciphertext that cannot be reversed without that key. The encoded value `3d3d516343746d4d6d6c315669563362` can be reversed by anyone in about 30 seconds with a shell.

The three operations used here:
- `base64_encode` — public standard, trivially reversible with `base64 -d`
- `strrev` — string reversal, reversible with `rev`
- `bin2hex` — hex encoding, reversible with `xxd -r -p`

None of these add any cryptographic security whatsoever.

> [!IMPORTANT]
> Encoding is not encryption. Base64, hex, URL encoding, and string reversal are data transformations — they are fully reversible by anyone who knows the algorithm. Protecting a secret requires encryption with a key that is not embedded in the application source. If you "obfuscate" a hardcoded credential with encoding, a competent attacker will reverse it in minutes.

## Offensive Security Perspective

Obfuscated credentials — "encoded" rather than encrypted values — are a common finding in application source code review. Binary files (Android APKs, iOS IPAs, compiled JavaScript bundles, Java class files) often contain strings that look random but are actually base64, hex, or custom-encoded credentials. Strings analysis (`strings`, `apktool`, `jadx`) followed by attempted decoding of suspicious values is a standard technique in mobile and thick-client pentesting.

In web applications, JavaScript source sometimes contains "obfuscated" API keys or authentication tokens that are simply base64-encoded. Browser DevTools can de-obfuscate these automatically, and tools like `de4js` handle more complex JavaScript obfuscation. The principle is always the same: if the client needs to use the value, the client can access it, and so can an attacker with the same tools.

## Common Beginner Mistakes

- Trying to decode in the wrong order (base64 first, instead of hex first).
- Using `base64 -d` on the raw hex string before hex-decoding it.
- Getting confused by the `==` base64 padding appearing at the start after string reversal — this is expected, and `rev` puts it back at the end correctly.
- Typing the recovered secret incorrectly when submitting it manually — always copy-paste from the terminal output.
- Not verifying the decode by re-encoding: always sanity-check your result.

## Key Takeaways

- Read the encoding function carefully and map out each step before trying to reverse anything.
- Reverse a multi-step encoding chain by undoing the steps in reverse order: last applied is first to undo.
- The bash pipeline `echo "HEX" | xxd -r -p | rev | base64 -d` reverses bin2hex(strrev(base64_encode(x))) in one command.
- Encoding (base64, hex, string reversal) is not encryption — it provides no confidentiality.
- If the source code is readable, any "obfuscated" credential in that source is immediately recoverable.

## How This Helps Build Cyber Security Expertise

- **Encoding and decoding:** base64 and hex are ubiquitous in security work — tokens, hashes, binary data, JWTs, network captures. Fluency with these tools is non-negotiable.
- **Source code analysis:** reading application logic to extract and reverse-engineer encoding schemes is a skill used in binary analysis, mobile pentesting, and thick-client assessments.
- **Obfuscation recognition:** recognising when a value is encoded rather than encrypted (no key present, deterministic algorithm, reversible) is an important analyst judgment call.
- **Shell pipeline mastery:** building multi-stage shell pipelines with standard Unix tools is a general-purpose skill that scales across CTF, forensics, and real-world analysis.

## Additional Reading

- [Wikipedia — Base64 encoding](https://en.wikipedia.org/wiki/Base64)
- [xxd manpage](https://linux.die.net/man/1/xxd)
- [OWASP — Cryptographic Failures (A02:2021)](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-261 — Weak Encoding for Password](https://cwe.mitre.org/data/definitions/261.html)

---

## Connect with the Author

Written by **Himangshu Pan** — cybersecurity researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

---
title: Security Lab Setup
description: A personal cybersecurity lab built with VirtualBox, running Kali Linux and Windows, with DVWA and OWASP Juice Shop deployed for hands-on web application security testing and tool practice.
date: 2026-01-01
stack: [VirtualBox, Kali Linux, Windows, DVWA, OWASP Juice Shop, Nmap, Burp Suite, SQLmap, Wireshark]
draft: false
---

## Overview

Built a local virtualized lab environment using VirtualBox to practice web application security testing in a safe, isolated setup. The lab runs Kali Linux as the attacker machine alongside a Windows VM as an additional target environment.

## Targets Deployed

- **DVWA (Damn Vulnerable Web Application)** — practised SQLi, XSS, CSRF, file upload, and command injection vulnerabilities across all difficulty levels
- **OWASP Juice Shop** — worked through the OWASP Top 10 challenges including broken authentication, insecure deserialization, and sensitive data exposure

## Tools Practised

| Tool | Purpose |
|------|---------|
| Nmap | Port scanning and service enumeration |
| Burp Suite | HTTP interception, repeater, and active scanning |
| SQLmap | Automated SQL injection detection and exploitation |
| Wireshark | Network traffic capture and protocol analysis |

## Key Outcomes

- Hands-on experience with the full web application testing workflow: recon → enumeration → exploitation → documentation
- Developed familiarity with Burp Suite's proxy and scanner for identifying injection points and session weaknesses
- Practiced writing structured notes and findings for each vulnerability discovered

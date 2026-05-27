---
title: "VMware Detection Lab"
description: "A lightweight VMware Workstation setup for safely detonating malware samples and generating Sysmon telemetry."
date: 2026-01-08
stack: [VMware Workstation, Windows 11, Sysmon, REMnux]
---

## Goal

A snapshot-able sandbox where I can detonate suspicious binaries, capture the telemetry, and roll the VM back in one click. The intent isn't to be a full malware analysis lab — it's to feed realistic Sysmon events into my [ELK / Wazuh SOC lab](/projects/elk-soc-home-lab/) so I can write and test detections against actual attacker behavior.

## VM inventory

| VM | OS | Role |
|---|---|---|
| `win11-victim` | Windows 11 Pro (evaluation) | Detonation target, Sysmon + Wazuh agent |
| `kali-attacker` | Kali Linux | Source-side attacker tooling |
| `remnux` | REMnux | Static analysis on captured samples |

## Hardening for safe analysis

- Host-only network — VMs cannot reach the internet by default. A separate NAT toggle for cases where I need C2 simulation, never both at once.
- Hostname / username / install date randomized via Sysprep to defeat the laziest sandbox-detection checks in malware.
- VMware Tools left **un-installed** on `win11-victim` — many samples bail out the moment they see `vmtoolsd.exe`.
- Snapshot tree: `clean → telemetry-baseline → instrumented`. Detonation always starts from `instrumented`, rollback after each run.

## Sysmon configuration

I use [SwiftOnSecurity's `sysmonconfig-export.xml`](https://github.com/SwiftOnSecurity/sysmon-config) as the baseline, then tune two areas:

1. **Network connections** — added a rule to log every outbound DNS so I can correlate DNS lookups with process spawns during detonation.
2. **Image loads** — un-suppressed `clr.dll` and `mscoree.dll` loads so I can hunt for .NET in-memory tradecraft.

## Workflow

1. Spin up `instrumented` snapshot of `win11-victim`.
2. Copy the sample over via shared folder (read-only inside the VM).
3. Detonate, let it run for 60–120 seconds.
4. Grab the Sysmon evtx, screenshot, and any dropped artifacts.
5. Roll back.
6. Ingest the evtx into the [ELK / Wazuh SOC lab](/projects/elk-soc-home-lab/) and write the detection.

## Caveats

- This setup is for personal learning only; production-grade malware analysis labs need air-gapped hardware and stricter network isolation.
- Don't store sensitive credentials on the host — VMware Workstation isn't a security boundary, it's a convenience layer.

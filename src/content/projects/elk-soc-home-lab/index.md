---
title: "ELK + Wazuh SOC Home Lab"
description: "A reproducible blue-team lab — Elastic, Kibana, Wazuh manager + agent, and a Windows victim VM — for detection engineering practice."
date: 2026-05-10
stack: [ELK, Wazuh, Sysmon, Docker, Linux, Windows]
repo: https://github.com/sheru-pan
---

## What it is

A personal SOC lab I use to practice detection engineering end-to-end: generate attacker telemetry on a Windows victim VM, ship logs through Wazuh + Beats, and write Sigma / KQL rules against the data in Kibana.

## Architecture

```
┌──────────────────┐         ┌──────────────────┐
│ Windows 11 VM    │ Sysmon  │ Wazuh Agent      │
│ (victim)         │────────►│ (forwarder)      │
└──────────────────┘         └────────┬─────────┘
                                       │ TLS
                                       ▼
                              ┌──────────────────┐
                              │ Wazuh Manager    │
                              │ (Docker host)    │
                              └────────┬─────────┘
                                       │
                            ┌──────────┴─────────┐
                            │ Elasticsearch +    │
                            │ Kibana             │
                            └────────────────────┘
```

## Services (docker-compose)

The lab is one `docker-compose.yml` away from working:

- `wazuh.manager` — alerts engine, rule loading, agent management
- `wazuh.indexer` — OpenSearch fork backing Wazuh's data
- `wazuh.dashboard` — Kibana fork for the Wazuh UI
- `elasticsearch` — separate cluster for raw Sysmon / Winlogbeat data
- `kibana` — for detection rule authoring and tuning

The Windows VM runs in VMware on the same host network. Sysmon ships via Wazuh agent.

## What I use it for

- Trigger MITRE ATT&CK techniques in the VM (Atomic Red Team), confirm telemetry lands in Wazuh, write Sigma against it.
- Detune SwiftOnSecurity's Sysmon config and observe what falls through the gaps.
- Test KQL-equivalents of Sigma rules I migrate to Sentinel.
- Run incident-response drills against ransomware simulators on a snapshot-restorable VM.

## What's next

- Add Suricata + Zeek for network telemetry alongside the host data.
- Wire a small SOAR (n8n or Tines free tier) to a few high-confidence rules and automate enrichment.
- Document each detection I write here as its own writeup with the corresponding lab playbook.

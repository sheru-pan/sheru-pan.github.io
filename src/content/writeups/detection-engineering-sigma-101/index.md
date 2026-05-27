---
title: "Detection Engineering: Writing Your First Sigma Rule"
description: "From an attacker's command to a portable detection rule — a hands-on intro to Sigma using a Mimikatz-style LSASS access pattern."
date: 2026-05-20
platform: lab
difficulty: easy
tags: [sigma, detection-engineering, sysmon, attack, blue-team]
---

A SOC team that only consumes alerts is operating at someone else's mercy. Writing your own detections is what separates an analyst from a button-clicker.

This post walks through writing a portable detection rule in **Sigma** — the open, generic detection format that compiles down to your SIEM's native query language. We'll target a classic technique: **LSASS process access**, the noisy footprint of credential-dumping tools like Mimikatz.

## Why Sigma?

Sigma is a YAML-based detection format. The same rule can be converted to:

- **KQL** for Microsoft Sentinel / Defender XDR
- **SPL** for Splunk
- **Lucene** for ELK / OpenSearch

Write once, deploy everywhere. Crucially, the Sigma project at [SigmaHQ/sigma](https://github.com/SigmaHQ/sigma) maintains thousands of community rules, so you're not starting from zero.

## The technique we'll detect

> MITRE ATT&CK [T1003.001 — OS Credential Dumping: LSASS Memory](https://attack.mitre.org/techniques/T1003/001/)

When a process opens `lsass.exe` with read access, it's likely trying to scrape credentials from memory. Sysmon **Event ID 10** (`ProcessAccess`) records every such open. We want a rule that fires on suspicious openers.

## The lab setup

For this exercise you need:

1. A Windows VM (Windows 10/11 sandbox is fine).
2. [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) installed with a sensible config — [SwiftOnSecurity's](https://github.com/SwiftOnSecurity/sysmon-config) baseline is the community standard.
3. Shipping Sysmon logs to ELK / Wazuh / Splunk — anything that ingests `winlog`.

You don't need to actually run Mimikatz — we'll trigger the alert with the much safer `procdump64.exe -ma lsass.exe` (Sysinternals).

## The Sigma rule

```yaml
title: Suspicious LSASS Process Access
id: 8f9a2c1e-3b4d-4f1c-9a2b-1e2d3c4b5a6f
status: experimental
description: Detects processes opening lsass.exe with permissions consistent with credential dumping.
author: Himangshu Pan
date: 2026-05-20
references:
  - https://attack.mitre.org/techniques/T1003/001/
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
    GrantedAccess|contains:
      - '0x1410'
      - '0x1010'
      - '0x143a'
      - '0x1438'
      - '0x147a'
  filter_legit:
    SourceImage|endswith:
      - '\svchost.exe'
      - '\wininit.exe'
      - '\csrss.exe'
      - '\lsm.exe'
      - '\MsMpEng.exe'
  condition: selection and not filter_legit
falsepositives:
  - Endpoint security agents (tune by SourceImage)
  - Backup software that touches process memory
level: high
tags:
  - attack.credential_access
  - attack.t1003.001
```

A few things worth noting:

- The `GrantedAccess` masks (`0x1410`, etc.) are the access rights Mimikatz and similar tools request — `PROCESS_VM_READ` combined with query rights.
- The `filter_legit` block is **not optional**. Without it you'll page the SOC every time a normal Windows process touches LSASS.
- `level: high` because a true positive here is almost always an active intrusion.

## Compile it for your SIEM

Using [`sigma-cli`](https://github.com/SigmaHQ/sigma-cli):

```bash
pip install sigma-cli
sigma plugin install splunk
sigma convert --target splunk --pipeline sysmon lsass_access.yml
```

Output (Splunk SPL):

```spl
source="WinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=10
  TargetImage="*\\lsass.exe"
  (GrantedAccess="*0x1410*" OR GrantedAccess="*0x1010*" OR ...)
  NOT (SourceImage="*\\svchost.exe" OR SourceImage="*\\wininit.exe" ...)
```

## Testing the rule

In your Windows VM (admin shell):

```cmd
procdump64.exe -accepteula -ma lsass.exe lsass.dmp
```

Within seconds the SIEM should fire the rule. Investigate the alert:

- Who is `SourceImage`? Should that binary ever touch LSASS?
- Was the command-line invocation expected?
- What did the parent process do beforehand?

## What I learned

- **Detection is iterative.** First rule will be noisy. Tune the allow-list, don't lower confidence.
- **MITRE-tag everything.** Future-you (and your team) will thank you when you're hunting across techniques.
- **Store rules in version control.** Detections are code. Treat them like code.

## Next up

I'll cover converting the same rule to **KQL for Sentinel** and wiring it to an automated response playbook in a follow-up.

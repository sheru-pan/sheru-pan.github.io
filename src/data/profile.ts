export const profile = {
  name: "Himangshu Pan",
  handle: "sheru-pan",
  role: "SOC Analyst",
  tagline: "Blue-team research · Detection · Incident response",
  location: "India",

  bio: [
    "Python developer turned defensive security researcher. After several years building Python backends and blockchain systems, I pivoted into security with a focus on the **blue team** — detection engineering, incident response, and the daily craft of running a SOC.",
    "I spend my time in labs reproducing attacker behavior so I can write better detections for it, picking apart logs, and turning CTF rooms into transferable analyst muscle. CEH (2018) was my entry point; the work since has been about understanding systems deeply enough to defend them, not just probe them.",
  ],

  contact: {
    email: "researchersheru@gmail.com",
    whatsapp: {
      display: "+91 9332943989",
      url: "https://wa.me/919332943989?text=Hi%20Himangshu%2C%20I%20saw%20your%20portfolio",
    },
    linkedin: "https://www.linkedin.com/in/sheru-pan/",
    github: "https://github.com/sheru-pan",
    tryhackme: "https://tryhackme.com/p/researchersheru",
  },

  // Grouped so the home page can render section headers
  skills: [
    {
      group: "SIEM & Log Analysis",
      items: ["Splunk", "ELK / OpenSearch", "Wazuh", "KQL", "Sigma rules"],
    },
    {
      group: "Network Forensics",
      items: ["Wireshark", "tcpdump", "Zeek", "Suricata", "PCAP triage"],
    },
    {
      group: "Endpoint & EDR",
      items: ["Sysmon", "MS Defender", "Velociraptor", "OSQuery"],
    },
    {
      group: "Scripting & Automation",
      items: ["Python", "Bash", "PowerShell", "Regex", "API enrichment"],
    },
    {
      group: "Frameworks",
      items: ["MITRE ATT&CK", "D3FEND", "NIST CSF", "Cyber Kill Chain"],
    },
    {
      group: "Lab & Tooling",
      items: ["Linux", "VMware", "Docker", "Git", "Ghidra (basics)"],
    },
  ],

  certifications: [
    {
      name: "Certified Ethical Hacker (CEH)",
      issuer: "EC-Council",
      year: 2018,
      url: "",
    },
    // Placeholder slots — add as completed
    // { name: "Blue Team Level 1 (BTL1)", issuer: "Security Blue Team", year: 2026, url: "" },
    // { name: "CompTIA Security+", issuer: "CompTIA", year: 2026, url: "" },
  ],

  // Footer navigation links
  navLinks: [
    { href: "/", label: "home" },
    { href: "/writeups", label: "writeups" },
    { href: "/projects", label: "projects" },
    { href: "/resume", label: "resume" },
    { href: "/contact", label: "contact" },
  ],
} as const;

export const profile = {
  name: "Himangshu Pan",
  handle: "0xSh3ru",
  role: "Offensive Security Researcher",
  tagline: "Offensive security · Exploitation · Vulnerability research",
  location: "India",

  bio: [
    "Python developer turned **offensive security researcher**. After several years building Python backends and blockchain systems, I redirected that engineering mindset into security — understanding how systems break, chaining vulnerabilities into working exploits, and documenting every step so others can learn from it.",
    "My developer background gives me an edge in code review and understanding why applications fail from the inside. I spend time on CTF platforms (HTB, TryHackMe), study CVEs, build proof-of-concept exploits, and approach every target with the same eye that once built it. CEH (2018) was the entry point; OSCP is the current goal.",
  ],

  contact: {
    email: "researchersheru@gmail.com",
    whatsapp: {
      display: "+91 9332943989",
      url: "https://wa.me/919332943989?text=Hi%20Himangshu%2C%20I%20saw%20your%20portfolio",
    },
    linkedin: "https://www.linkedin.com/in/0xsh3ru/",
    github: "https://github.com/0xSh3ru",
    tryhackme: "https://tryhackme.com/p/researchersheru",
  },

  // Grouped so the home page can render section headers
  skills: [
    {
      group: "Web Application Testing",
      items: ["Burp Suite", "OWASP ZAP", "SQLmap", "ffuf", "Nikto"],
    },
    {
      group: "Network & Recon",
      items: ["Nmap", "Masscan", "Netcat", "Shodan", "Wireshark"],
    },
    {
      group: "Exploitation",
      items: ["Metasploit", "Buffer overflows", "CVE research", "Shellcode", "Privilege escalation"],
    },
    {
      group: "OSINT & Enumeration",
      items: ["theHarvester", "recon-ng", "BloodHound", "Amass", "WHOIS"],
    },
    {
      group: "Scripting & Development",
      items: ["Python", "Bash", "PowerShell", "Exploit scripting", "PoC dev"],
    },
    {
      group: "Frameworks & Lab",
      items: ["MITRE ATT&CK", "PTES", "Kali Linux", "Docker", "VMware"],
    },
  ],

  certifications: [
    {
      name: "Certified Ethical Hacker (CEH)",
      issuer: "EC-Council",
      year: 2018,
      url: "",
    },
    // { name: "Offensive Security Certified Professional (OSCP)", issuer: "OffSec", year: 2026, url: "" },
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

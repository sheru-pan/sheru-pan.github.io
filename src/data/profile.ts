export const profile = {
  name: "Himangshu Pan",
  handle: "0xSh3ru",
  role: "Offensive Security Researcher",
  tagline: "Offensive security · Exploitation · Vulnerability research",
  location: "India",

  bio: [
    "Python developer turned **offensive security researcher**. After several years building Python backends and blockchain systems, I redirected that engineering mindset into security — understanding how systems break, chaining vulnerabilities into working exploits, and documenting every step so others can learn from it.",
    "My developer background gives me an edge in code review and understanding why applications fail from the inside. I spend time on TryHackMe and the OverTheWire wargames, study CVEs, build proof-of-concept exploits, and approach every target with the same eye that once built it. CEH (2018) was the entry point; next up is hands-on web security via the PortSwigger Web Security Academy labs.",
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
      items: ["Burp Suite", "OWASP ZAP", "SQLmap", "ffuf", "Nikto", "CyberChef"],
    },
    {
      group: "Network & Recon",
      items: ["Nmap", "Masscan", "Netcat", "Shodan", "Wireshark"],
    },
    {
      group: "Exploitation",
      items: ["Metasploit", "CVE research", "PoC development", "Privilege escalation"],
    },
    {
      group: "Learning / Exploring",
      items: ["theHarvester", "recon-ng", "Amass", "WHOIS"],
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
    {
      name: "GhostWire CTF — Participation",
      issuer: "VIGYAANRANG 2026 · Atria Institute of Technology",
      year: 2026,
      url: "https://0xsh3ru.github.io/ghostwire-ctf-certificate.jpg",
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

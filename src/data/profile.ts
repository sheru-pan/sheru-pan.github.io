export const profile = {
  name: "Himangshu Pan",
  handle: "0xSh3ru",
  role: "Python Developer | Cybersecurity Researcher",
  tagline: "Committed to continuous learning and professional growth in cybersecurity",
  location: "India",

  bio: [
    "I started my journey in technology in 2015 as a developer, gradually stepping into the world of software systems, automation, server administration, cloud platforms, and CI/CD pipelines. At the time, I was mostly focused on building and maintaining things—understanding how systems worked, how they failed, and how they could be made more reliable. Over the years, that exposure gave me a broader perspective on the software lifecycle, from development to deployment and operations, and I naturally became more interested in how everything connected behind the scenes.",
    "As I worked deeper into these systems, I found myself increasingly drawn toward the security side of technology—not just how systems are built, but how they can be tested, challenged, and understood from an adversarial point of view. That curiosity slowly shifted into intent, and I began dedicating time to **cybersecurity** through hands-on labs, security research, and continuous self-learning. Along the way, I started documenting what I was learning, turning notes and experiments into structured write-ups as a way to reinforce my understanding and track my growth.",
    "Today, I am intentionally steering my path toward cybersecurity, building on my existing engineering foundation while developing practical security skills. I am looking for opportunities at the **internship or junior level** where I can apply what I know, learn from real-world environments, and continue evolving into a security professional.",
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
      group: "Security",
      items: ["Nmap", "Wireshark", "SQLmap", "Burp Suite", "Splunk", "CyberChef", "Metasploit"],
    },
    {
      group: "Programming",
      items: ["Python", "Rust", "JavaScript", "Bash", "Git"],
    },
    {
      group: "Platforms",
      items: ["Kali Linux", "Ubuntu", "Windows", "Docker", "VirtualBox", "AWS"],
    },
    {
      group: "Learning & Practice",
      items: ["TryHackMe", "OTW: Bandit (Linux)", "OTW: Natas (Web)", "OWASP Juice Shop", "DVWA"],
    },
  ],

  certifications: [
    {
      name: "Certified Ethical Hacker (CEHv9)",
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
    {
      name: "Shields Up: Cybersecurity Job Simulation",
      issuer: "AIG (Forage)",
      year: 2026,
      url: "https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/4nAmAbTbHbnGMNSyo/2ZFnEGEDKTQMtEv9C_4nAmAbTbHbnGMNSyo_6a0de1afffd50d8819eb3298_1779627006412_completion_certificate.pdf",
    },
    {
      name: "Cybersecurity Job Simulation",
      issuer: "MasterCard (Forage)",
      year: 2026,
      url: "https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/mfxGwGDp6WkQmtmTf/vcKAB5yYAgvemepGQ_mfxGwGDp6WkQmtmTf_6a0de1afffd50d8819eb3298_1779620833579_completion_certificate.pdf",
    },
    {
      name: "Cyber Job Simulation",
      issuer: "Deloitte (Forage)",
      year: 2026,
      url: "https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/9PBTqmSxAf6zZTseP/E9pA6qsdbeyEkp3ti_9PBTqmSxAf6zZTseP_6a0de1afffd50d8819eb3298_1779298958092_completion_certificate.pdf",
    },
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

---
layout: post
title: "🎮 Wargames → OverTheWire Bandit Series"
date: 2025-06-26
categories: infosec wargames linux ssh
permalink: /blog/Wargames→OverTheWire_Bandit_Series/
---

# 🎮 Wargames → OverTheWire Bandit Series

In the field of information security, theory alone isn't enough — without hands-on practice, your knowledge has little real value.

This raises an important question: how should I go about practicing effectively? I understand the need for a dedicated lab environment, which is why I previously set up VMware on my system.

VMware allows me to simulate Capture The Flag (CTF) challenges locally and experiment with various hacking tools on isolated guest machines.

However, today I discovered an even more accessible option: **online wargames**. These platforms offer hands-on practice in a more guided and interactive manner, making the learning process faster and more effective compared to reading books.

One such platform is [**OverTheWire**](https://overthewire.org), which offers a variety of wargame series such as **Bandit**, **Natas**, **Leviathan**, **Krypton**, and more. Each wargame is structured in levels — to advance, you must retrieve the password for the next level by applying different hacking tools and techniques.

Today, I'm starting with the [**Bandit Series**](https://overthewire.org/wargames/bandit/), which is recommended for beginners.

---

### About Bandit

The Bandit series contains a total of **33 levels**. To play, I need to connect to the server using SSH:

- **Host:** `bandit.labs.overthewire.org`
- **Port:** `2220`
- **Level 0 Login:**
  - **Username:** `bandit0`
  - **Password:** `bandit0`

At each level, the goal is to find the password for the next user (e.g., `bandit1`, `bandit2`, and so on) by exploring the system, reading files, and using Linux command-line tools. This process continues until the final level is reached.

---

### Before You Begin: A Quick Overview of SSH

Before we dive into the Bandit series, it’s crucial to understand SSH (Secure Shell) — the primary method used to connect to each level.

SSH is a cryptographic network protocol that enables secure communication between two remote devices. With SSH, you can remotely log in to servers, securely transfer files, execute commands on remote machines, and even set up encrypted tunnels through port forwarding.

To connect to the Bandit server as bandit0, you can use:

```bash
ssh bandit0@bandit.labs.overthewire.org
```

If the account is password-protected, you’ll be prompted to enter it.

SSH also supports key-based authentication. You can use the -i option to specify a private key file:

```bash
ssh bandit0@bandit.labs.overthewire.org -i bandit0-key-file
```

For more details and options, refer to the SSH manual page:

```bash
man ssh
```

---

Let’s begin the game. First, I attempt to log in to Level 0 using the following command:

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

![Image not found](/assets/images/bandit/bandit1/bandit0.png)

This command prompts for a password, which is already known. I’ll enter `bandit0` and hit Enter.

Login successful!

Since all levels in the Bandit series use the same host and port, I’ll configure this in my SSH config file to save time. Additionally, I’ll define a variable named BANDIT for bandit.labs.overthewire.org. This way, I won’t have to type the full details every time — making the process faster and more convenient.

Let's create/edit ssh config file first. the ssh config file path is `~/.ssh/config` .
Here is my updated config file for the same.
![Image not found](/assets/images/bandit/bandit1/bandit1.png)

Also adding the f0ollowing line to the ~/.bashrc file.

![Image not found](/assets/images/bandit/bandit1/bandit2.png)

Now I have to load the latest .bashrc file changes into current shell using `source ~/.bashrc`

I can use `ssh bandit@$BANDIT` in place of `ssh bandit0@bandit.labs.overthewire.org -p 2220` and this should work perfectly.

![Image not found](/assets/images/bandit/bandit1/bandit3.png)

Working fine. typing password `bandit0` and successfully loged in with a welcome and guided message.

My next challenge is to find the password for Level 1. According to the Bandit [Level 0 → Level 1 instructions](https://overthewire.org/wargames/bandit/bandit1.html), there is a file named **\*\*\*\***readme**\*\*\*\*** located in the home directory. This file contains the password needed to access the next level.

Let’s list the files in the home directory using the `ls` command. This will display the contents of the current directory, where we should find the readme file containing the password for the next level.

![Image not found](/assets/images/bandit/bandit1/bandit4.png)

We can see that the readme file exists. Let’s try to read its contents using the `cat` command. This will display the password for Level 1 on the terminal.

![Image not found](/assets/images/bandit/bandit1/bandit5.png)

We have successfully retrieved the password for the **bandit1** user.

### 🧠 What We Learned in This Level

- How to configure and use `ssh` for remote login
- How to list files in a directory using the `ls` command
- How to read the contents of a file using the `cat` command

Next, I’ll dive deeper into `ls`, `cat`, and proceed to **Level 1** of the Bandit series.

**Happy hacking!**

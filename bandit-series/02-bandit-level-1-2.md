# OverTheWire Bandit Level 1 → Level 2

## Introduction

On the surface this level is identical to the last one: read a file, get a password. But the file has a name that breaks the most natural command you would reach for. The filename is a single dash — `-`. The instant you type `cat -`, the shell hands `cat` an argument that *looks like an option/stdin marker* rather than a filename, and the program quietly waits for keyboard input instead of reading your file.

That tiny friction is the entire lesson. Level 1 → 2 is your first encounter with the gap between **what you mean** and **what the shell and the program actually parse** from your command line. Understanding that gap is the foundation of an enormous class of attacks later on — argument injection, option smuggling, and path-traversal tricks all live in exactly this seam.

## Official Challenge Objective

> **The password for the next level is stored in a file called `-` located in the home directory.**

**In plain English:** there is a file in your home directory whose entire name is a single hyphen, `-`. You need to read it. The catch is that most command-line tools treat a leading `-` as the start of an *option* (like `-l` or `-a`), and `cat -` specifically means "read from standard input." So you have to tell the tool, unambiguously, that `-` is a *filename*, not a flag.

## Skills Covered

- Reading files with awkward/hostile names
- How the shell and `argv` parse leading-dash arguments
- Disambiguating filenames with a `./` path prefix
- The `--` end-of-options separator
- An introduction to the argument/option-injection mindset

## My Approach

Same opening move as always: `ls` to see what is in the home directory. The level promised a file called `-`, and there it was. My first reflex — `cat -` — did nothing useful: the terminal just sat there with a blinking cursor, because `cat -` means "read from stdin." That hang is the clue. I knew the fix was to give `cat` a path that *contains* the dash but does not *start* with it, so the parser sees a normal filename. Prefixing with the current-directory path, `./-`, does exactly that.

## Step-by-Step Walkthrough

### Command

```bash
ls
```

### Explanation

A plain `ls` lists the contents of the home directory. You will see a single entry: `-`. (Long-listing with `ls -la` works too and confirms it is a regular, readable file.)

### Why It Matters

Enumeration first, always. Before you can craft a command to read a file, you need to confirm the file exists and see its exact name. Here the "exact name" is the whole problem.

---

### Command

```bash
cat ./-
```

### Explanation

`cat` prints a file to standard output. The trick is the argument `./-`:

- `.` is the current directory.
- `/` is the path separator.
- `-` is the filename.

Because the argument now *starts with* `.` rather than `-`, neither the shell nor `cat` mistakes it for an option. `cat` opens the file `./-` and prints the bandit2 password:

```
[REDACTED]
```

> [!TIP]
> Two other reliable ways to read this file:
> - `cat -- -` — the `--` token tells most GNU tools "everything after this is an operand, not an option."
> - `cat < -` — shell redirection feeds the file to `cat` on stdin, sidestepping argv parsing entirely.

### Why It Matters

`./` is the single most useful habit for dealing with hostile filenames — anything that starts with a dash, or that you fear might be interpreted as a flag. The same `./` prefix is also how you execute a script in the current directory (`./script.sh`) precisely because the shell will not search `$PATH` for a name containing a slash.

## Deep Dive: Cyber Security Concept

**Argument parsing and the leading-dash problem.**

When you run a command, the shell splits your line into words and hands them to the program as an array called `argv`. The program then walks `argv` and decides which entries are *options* (flags) and which are *operands* (like filenames). The near-universal convention — codified by POSIX and the GNU `getopt` library — is: **a word that starts with `-` is an option.**

So `cat -` is not "cat the file named dash." `cat` specifically defines `-` to mean "use standard input here," which is why your terminal hung waiting for you to type. A file literally named `-` is therefore unreachable by the obvious command, not because of permissions, but because of *naming collision with the option syntax*.

There are exactly two robust escapes from this collision:

1. **Change the spelling without changing the target.** `./-`, `/home/bandit1/-`, or any path that does not begin with `-` refers to the same file but no longer trips the option parser.
2. **Disable option parsing.** The `--` separator tells a well-behaved program "stop looking for options now," so `cat -- -` treats the trailing `-`... well, almost — for `cat`, `--` then `-` still resolves to stdin in some implementations, which is why `./-` is the most reliable answer here.

> [!IMPORTANT]
> The shell does not know or care what your filenames "mean." It does mechanical word-splitting and globbing, then the *program* interprets the results. Bugs and exploits live in the mismatch between those two stages.

## Offensive Security Perspective

This level is a baby version of **argument / option injection**, one of the most underrated bug classes in real software. The pattern: an application builds a command line by concatenating user-controlled input, and the attacker supplies a value that *starts with a dash* so it is parsed as an option instead of data.

Concrete real-world examples:

- A web app runs `tar` on a user-supplied filename; an attacker names a file `--checkpoint-action=exec=sh shell.sh` and turns a file extract into code execution.
- Software calls `git clone <user_url>`; a URL beginning with `--upload-pack=...` injects a `git` option that runs an arbitrary command.
- A script does `cp $userfile /backup/`; a filename like `-r` or `--no-preserve-root`-style flags change the command's behavior.

The mental model you just practiced — "this string is being parsed as a flag, not data, and I can use that" — is precisely the attacker's mindset, and the seam where these injection bugs are found and weaponized.

## Common Beginner Mistakes

- Running `cat -` and concluding the file is "empty" or the terminal is frozen — it is actually waiting on stdin. (Press `Ctrl+C` or `Ctrl+D` to escape.)
- Trying to escape the dash with quotes — `cat "-"` and `cat '-'` *do not help*, because quoting only stops word-splitting/globbing; the program still sees `-` as the first character.
- Trying `cat \-`, which has the same problem for the same reason.
- Forgetting that tab-completion will happily complete `-` but you still need the `./` to make the resulting argument safe.

## Key Takeaways

- A leading `-` makes a filename collide with option syntax; the program, not the shell, is what gets confused.
- `./filename` is the go-to fix for any dash-prefixed or option-looking filename.
- `--` is the standard "end of options" separator and a security best practice when passing untrusted operands.
- Quoting does **not** solve the leading-dash problem; changing the path spelling does.
- This is the entry point to the argument/option-injection bug class.

## How This Helps Build Cyber Security Expertise

- **Application security testing:** spotting unsafe `subprocess`/`exec` calls that concatenate user input is a daily offensive AppSec task; this level builds the intuition for where command injection hides.
- **Exploit development:** option injection is a real, exploited primitive in CVEs against `git`, `tar`, `find`, and more — you now understand its root cause and how to weaponize it.
- **Privilege escalation:** dash-prefixed and option-looking filenames are a classic trick for coercing privileged scripts and cron jobs into running attacker-controlled flags.
- **Fuzzing for bugs:** hostile filenames (dashes, spaces, newlines) are classic fuzz inputs that surface file-handling vulnerabilities ripe for exploitation.

## Additional Reading

- [`man cat`](https://man7.org/linux/man-pages/man1/cat.1.html), [`man bash`](https://man7.org/linux/man-pages/man1/bash.1.html) (see "SIMPLE COMMAND EXPANSION")
- [POSIX Utility Argument Syntax — `--` and operands](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [GNU `getopt` and the `--` convention](https://www.gnu.org/software/libc/manual/html_node/Getopt.html)
- [OWASP — Argument Injection / Command Injection](https://owasp.org/www-community/attacks/Command_Injection)

---

*Next up: [Level 2 → 3](./03-bandit-level-2-3.md) — a filename full of spaces teaches you why quoting exists and how the shell chops your commands into words.*


---

## Connect with the Author

Written by **Himangshu Pan** — offensive security researcher.

- **GitHub:** [@0xSh3ru](https://github.com/0xSh3ru)
- **LinkedIn:** [in/0xsh3ru](https://www.linkedin.com/in/0xsh3ru/)

*If this walkthrough helped, follow along on GitHub and connect on LinkedIn — questions and corrections are always welcome.*

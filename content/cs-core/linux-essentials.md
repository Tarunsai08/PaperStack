---
id: "cs-core-linux-essentials"
kind: "primer"
subject: "cs-core"
slug: "linux-essentials"
title: "A Workshop Where Every Tool Has a Label"
subtitle: "Linux essentials for interviews and on-call: everything is a file, permission bits like 754, processes and signals, pipes and redirection, and a command table you will actually use"
track: "cs-os"
track_order: 24
priority: "P1"
prerequisites: ["cs-core-system-calls", "cs-core-file-systems"]
difficulty: "beginner"
read_minutes: 12
topics: ["linux", "shell", "permissions", "signals", "pipes", "commands"]
glossary:
  - term: "File descriptor"
    definition: "A small integer a process uses to refer to an open file, pipe or socket; 0, 1 and 2 are standard input, output and error."
  - term: "Permission bits"
    definition: "Read, write and execute flags for the owner, the group and everyone else, often written as three octal digits such as 754."
  - term: "Signal"
    definition: "A small asynchronous notification sent to a process, such as SIGTERM (please stop) or SIGKILL (stop now)."
  - term: "Pipe"
    definition: "A kernel buffer connecting one process's standard output to another's standard input, written with |."
  - term: "Redirection"
    definition: "Pointing a command's standard input, output or error at a file instead of the terminal, using <, >, >> and 2>."
quiz:
  - q: "A file has permissions 754. What can members of the file's group do?"
    options: ["Read, write and execute", "Read and execute", "Read only", "Nothing"]
    answer: 1
    explain: "7 = rwx for the owner, 5 = r-x for the group, 4 = r-- for others. ls -l shows -rwxr-xr--."
  - q: "What is the difference between kill -TERM and kill -KILL?"
    options: ["None", "SIGTERM can be caught so the process can clean up; SIGKILL cannot be caught or ignored", "SIGKILL is gentler", "SIGTERM only works for root"]
    answer: 1
    explain: "A script that traps TERM printed its cleanup message before exiting. SIGKILL gives no such chance, so use it last."
  - q: "What does `cmd > out.txt 2>&1` do?"
    options: ["Sends errors to the terminal", "Sends both standard output and standard error to out.txt", "Appends to out.txt", "Runs cmd twice"]
    answer: 1
    explain: "> sends file descriptor 1 to the file, then 2>&1 makes descriptor 2 point where 1 points."
cover_seed: "linux-essentials"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.75
---

## The hook

It is your first week as an intern, and the payment service is returning errors. Your mentor opens a terminal on a server, types one line, and in three seconds says: "Three 500 errors, mostly on /cart." No dashboards, no code. Just a few small Linux tools snapped together.

Interviewers ask about Linux for the same reason: permissions, processes, signals and pipes are the operating-system ideas from this track made visible and usable. Learn a handful of them and you can find almost anything on any server. Predict how many separate programs the mentor's one line ran. (Five, connected by pipes.)

## The intuition

:::analogy
Linux is **a workshop where every tool has a label** and does one job well: one tool cuts, one sorts, one counts. Every tool takes material in one side and puts it out the other, so you can line them up on a bench. And nearly everything in the workshop, from files to devices to running processes, is stored in labelled drawers you can open the same way.
:::

Two ideas carry most of Linux:

1. **Everything is a file.** Regular files, directories, devices (/dev/sda), pipes, sockets and even process information (/proc/1234/status) are opened, read and written with the same calls, through a **[[file descriptor]]**.
2. **Small tools, connected.** Each command reads standard input (descriptor 0), writes standard output (1) and reports errors on standard error (2).

## Let's build it up

### Permissions

`ls -l` shows ten characters such as `-rwxr-xr--`: the type (`-` file, `d` directory, `l` link), then **[[permission bits]]** for owner, group and others.

| Digit | Bits | Meaning |
|---|---|---|
| 7 | rwx | 4 (read) + 2 (write) + 1 (execute) |
| 5 | r-x | 4 + 1 |
| 4 | r-- | 4 |

`chmod 754 run.sh` produced `-rwxr-xr--`, and `stat -c %a run.sh` printed 754. On directories, r lets you list names, w lets you create and delete entries, and x lets you enter the directory and reach files inside. New files get default permissions minus the **umask** (0022 here, removing write for group and others).

### Processes and signals

| Command | Shows or does |
|---|---|
| `ps aux`, `top`, `htop` | running processes with CPU and memory |
| `pgrep name` | process IDs by name |
| `kill -TERM pid` | ask the process to stop (can be caught) |
| `kill -KILL pid` | stop it immediately (cannot be caught) |
| `cmd &`, `jobs`, `fg`, `bg` | run in the background, manage jobs |
| `nohup cmd &` | keep running after logout |

A **[[signal]]** is a tiny message to a process. A shell script that ran `trap "echo got TERM, cleaning up; exit 0" TERM` and then received SIGTERM printed "got TERM, cleaning up" before exiting. SIGKILL would have given it no chance, which is why services are stopped with TERM first and KILL only if they ignore it. Ctrl+C sends SIGINT; a parent receives SIGCHLD when a child exits.

### Pipes and redirection

A **[[pipe]]** `a | b` connects a's standard output to b's standard input, and both run at the same time. **[[Redirection]]** sends a stream to a file:

| Syntax | Meaning |
|---|---|
| `cmd > f` | stdout to f (overwrite) |
| `cmd >> f` | stdout to f (append) |
| `cmd < f` | stdin from f |
| `cmd 2> f` | stderr to f |
| `cmd > f 2>&1` | both to f |
| `cmd > /dev/null` | discard output |

Wait, why does `2>&1` have to come after `> f`? Redirections apply left to right. `> f 2>&1` points 1 at f, then 2 at wherever 1 now points (f). Written the other way round, 2 is pointed at the terminal first, and then only 1 moves to f.

### The commands worth knowing

| Task | Commands |
|---|---|
| Navigate and inspect | `pwd`, `ls -la`, `cd`, `cat`, `less`, `head`, `tail -f` |
| Find | `find . -name '*.log'`, `grep -rn 'error' .` |
| Slice text | `cut`, `awk '{print $2}'`, `sed 's/a/b/'`, `sort`, `uniq -c`, `wc -l` |
| Disk and memory | `df -h`, `du -sh *`, `free -h` |
| Network | `ss -tulpn`, `curl -v`, `ping`, `dig` |
| Permissions and owners | `chmod`, `chown`, `sudo` |
| Logs and services | `journalctl -u name`, `systemctl status name` |

:::insight
Linux treats files, devices, pipes and process information as files reached through descriptors, and builds complex jobs by piping small single-purpose tools together. Permissions are three groups of read, write and execute bits, and processes are controlled with signals, where TERM asks politely and KILL does not ask.
:::

## A tiny example

The mentor's log, access.log, has lines like `GET /cart 500`. The one-liner and its real output:

```bash
grep ' 500$' access.log | awk '{print $2}' | sort | uniq -c | sort -rn
#       2 /cart
#       1 /pay
```

Step by step: grep keeps lines ending in 500 (three of them), awk prints the path column, sort groups equal paths together, `uniq -c` counts each group (it only merges adjacent duplicates, which is why sort comes first), and `sort -rn` puts the largest count on top.

:::warning
Common misconception: "uniq removes all duplicate lines." It only collapses *adjacent* duplicates. Without a sort first, /cart, /home, /cart counts /cart twice as two separate groups of 1.
:::

:::try-this
Count how many requests returned each status code in access.log. Predict the command and output for the six sample lines (three 500s, two 200s, one 404). (`awk '{print $3}' access.log | sort | uniq -c | sort -rn` prints 3 500, then 2 200, then 1 404.)
:::

### Interview follow-ups

**"What happens when you type ls and press Enter?"** The shell parses the line, finds ls on the PATH, forks a child, the child execs ls, ls makes system calls to read the directory and write to stdout, and the shell waits for the child to exit.

**"Find which process is using port 8080."** `ss -tulpn | grep 8080` (or `lsof -i :8080`).

**"What is a zombie process?"** A child that has exited but whose parent has not yet collected its exit status with wait; it holds only a process table entry.

## Where you'll see this again

Every server, container and cloud machine you touch will be Linux, and on-call debugging starts with these tools. The system calls underneath every command are explained in [Asking the Teller to Open the Vault](article:cs-core-system-calls), and the inodes behind `ls -l` and links are in [A Library Catalogue Pointing to the Shelves](article:cs-core-file-systems).

## Key takeaways

- Linux treats files, devices, pipes, sockets and process information as files, accessed through file descriptors 0, 1 and 2 for standard input, output and error.
- Permissions are read, write and execute bits for owner, group and others, so 754 means rwx for the owner, r-x for the group and r-- for everyone else.
- Signals control processes: SIGTERM can be caught for a clean shutdown, while SIGKILL stops a process immediately and cannot be caught.
- Pipes connect one command's output to the next command's input, and redirection sends streams to files, applied from left to right.
- Combining grep, awk, sort, uniq and wc answers most log questions in one line, remembering that uniq needs sorted input.

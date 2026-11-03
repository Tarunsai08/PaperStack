---
id: "cs-core-concurrency-control"
kind: "deep-dive"
subject: "cs-core"
slug: "concurrency-control"
title: "Booking Library Rooms With Sign-Up Sheets"
subtitle: "Concurrency control: shared and exclusive locks, two-phase locking and its strict variants, deadlocks, timestamp ordering with the Thomas write rule, optimistic validation and MVCC"
track: "cs-dbms"
track_order: 13
priority: "P0"
prerequisites: ["cs-core-serializability"]
difficulty: "intermediate"
read_minutes: 14
topics: ["dbms", "concurrency control", "locking", "2pl", "timestamp ordering", "mvcc"]
glossary:
  - term: "Shared lock"
    definition: "A read lock (S); many transactions can hold it on the same item at once."
  - term: "Exclusive lock"
    definition: "A write lock (X); only one transaction can hold it, and no shared locks may coexist with it."
  - term: "Two-phase locking"
    definition: "2PL: a transaction acquires all its locks before releasing any, so it has a growing phase followed by a shrinking phase."
  - term: "Strict 2PL"
    definition: "2PL where exclusive locks are held until commit or abort, which also makes schedules strict and cascadeless."
  - term: "Timestamp ordering"
    definition: "A lock-free protocol that orders transactions by start timestamp and aborts any operation that would arrive too late for that order."
  - term: "MVCC"
    definition: "Multi-version concurrency control: writers create new versions and readers see a consistent snapshot, so reads do not block writes."
quiz:
  - q: "T1 holds a shared lock on A. Which request is granted immediately?"
    options: ["T2 asks for an exclusive lock on A", "T2 asks for a shared lock on A", "Both", "Neither"]
    answer: 1
    explain: "Shared locks are compatible with each other; an exclusive lock conflicts with any other lock."
  - q: "Why does basic 2PL still allow cascading aborts?"
    options: ["It does not guarantee serializability", "Locks may be released in the shrinking phase before commit, so others can read uncommitted writes", "It has no exclusive locks", "It never deadlocks"]
    answer: 1
    explain: "Strict 2PL fixes this by holding exclusive locks until the transaction finishes."
  - q: "Timestamp ordering with TS(T1) = 1 and TS(T2) = 2: R2(A) has run, so the read timestamp of A is 2. What happens to W1(A)?"
    options: ["It succeeds", "T1 is aborted, because a younger transaction already read the old value", "T2 is aborted", "It waits"]
    answer: 1
    explain: "Writing now would change a value that T2, which comes later in timestamp order, has already read. T1 is restarted with a new timestamp."
cover_seed: "concurrency-control"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.88
---

## The hook

The lost update again: two transactions read balance 100, both write, and ₹10 disappears. The previous article showed how to *detect* this on paper with a precedence graph. A real database cannot wait until afterwards and then draw a graph. It needs rules, applied as each operation arrives, that make bad schedules impossible.

There are two families of rules: make transactions **wait** (locking) or make late-comers **restart** (timestamps and validation). Predict which one deadlocks and which one wastes work. (Locking can deadlock; timestamp and optimistic schemes never wait, so they abort and redo work instead.)

## The intuition

:::analogy
The college library has study rooms. **Booking library rooms with sign-up sheets** works like this: many people can sign up to *look* at the room's whiteboard together, but someone who wants to *rewrite* the whiteboard needs the room alone. And a fair rule: once you start giving rooms back, you may not book any new ones.
:::

## How it works

### Shared and exclusive locks

| Held \ Requested | S (read) | X (write) |
|---|---|---|
| S | granted | wait |
| X | wait | wait |

A **[[shared lock]]** lets many readers in; an **[[exclusive lock]]** admits a single writer. Locks alone are not enough, though: if T1 locks A, writes, unlocks, then locks B, another transaction can slip in between and see half of T1's work.

### Two-phase locking

**[[Two-phase locking]]** adds one rule: no new locks after the first unlock. Every transaction has a **growing phase** (acquire) and a **shrinking phase** (release).

```mermaid
flowchart LR
  G[Growing phase acquire locks only] --> L[Lock point all locks held]
  L --> S[Shrinking phase release locks only]
```

2PL guarantees conflict serializability: transactions are equivalent to the serial order of their **lock points** (the moment each holds all its locks).

Replay the lost update under 2PL. T1 and T2 both take S locks on A and read 100. T1 asks to upgrade to X: it must wait for T2's S lock. T2 asks to upgrade too: it must wait for T1. That is a **deadlock**; the database aborts one (say T2), T1 writes 110 and commits, and T2 restarts, reads 110 and writes 130. Correct, at the cost of one retry.

### Strict and rigorous 2PL

Basic 2PL may release an X lock before commit, so another transaction can read the uncommitted value and must abort too if the writer aborts (a cascade).

| Variant | Holds until commit or abort | Gives |
|---|---|---|
| Basic 2PL | nothing in particular | Conflict serializability |
| **[[Strict 2PL]]** | all X locks | Plus strict, cascadeless schedules |
| Rigorous 2PL | all locks | Plus commit order equals serial order |

Most lock-based databases use strict or rigorous 2PL.

### Deadlocks under locking

2PL does not prevent deadlocks. Databases handle them as operating systems do: build a **wait-for graph** and abort a victim when it has a cycle, or use timeouts. Two prevention schemes use timestamps (older = smaller timestamp):

| Scheme | Older asks for a lock held by younger | Younger asks for a lock held by older |
|---|---|---|
| Wait-die | older waits | younger dies (aborts) |
| Wound-wait | older wounds (aborts) the younger | younger waits |

A restarted transaction keeps its original timestamp, so it eventually becomes the oldest and cannot starve.

### Timestamp ordering

**[[Timestamp ordering]]** uses no locks. Each transaction gets a timestamp TS at start; each item remembers RTS (largest timestamp that read it) and WTS (largest that wrote it). The target serial order is timestamp order, and any operation arriving "too late" for that order aborts its transaction:

| Operation by T | Reject (abort T) if | Otherwise |
|---|---|---|
| read | TS(T) < WTS | read, RTS = max(RTS, TS(T)) |
| write | TS(T) < RTS, or TS(T) < WTS | write, WTS = TS(T) |

A small simulator replayed the lost-update schedule R1(A) R2(A) W1(A) W2(A) with TS(T1) = 1, TS(T2) = 2:

| Step | RTS(A) | WTS(A) | Result |
|---|---|---|---|
| R1(A) | 1 | 0 | ok |
| R2(A) | 2 | 0 | ok |
| W1(A) | 2 | 0 | rejected: T2, which is later in the order, already read A, so T1 aborts |
| W2(A) | 2 | 2 | ok |

T1 restarts with a new, larger timestamp and adds its 10 on top. No waiting, so no deadlock, but work is redone.

Wait, why reject a write merely because a younger transaction wrote *after*? Under the **Thomas write rule**, you need not: if TS(T) < WTS but TS(T) ≥ RTS, the write is obsolete (a later write already replaced it and nobody read the gap), so it is ignored instead of aborting T. With W2(A) then W1(A), the simulator aborts T1 under the basic rule and simply skips W1(A) under Thomas's rule.

### Optimistic validation and MVCC

**Optimistic concurrency control** lets a transaction run without locks on private copies, then validates at commit: if anything it read was changed by a transaction that committed meanwhile, it aborts. It suits workloads with rare conflicts.

**[[MVCC]]** keeps several versions of each row. A reader sees the snapshot as of its start, so readers never block writers and writers never block readers; writers still conflict with writers. PostgreSQL, MySQL InnoDB and Oracle are MVCC databases.

:::insight
Pessimistic schemes (locking) make conflicting transactions wait and must handle deadlocks. Optimistic schemes (timestamps, validation) never wait but abort and redo conflicting work. MVCC removes read–write blocking by giving readers old versions, which is why most modern databases combine it with locks for writes.
:::

## Trade-offs

| Scheme | Best when | Cost |
|---|---|---|
| Strict 2PL | High contention, must be serializable | Blocking, deadlocks, lock overhead |
| Timestamp ordering | Short transactions, few conflicts | Aborts and restarts; possible starvation without care |
| Optimistic validation | Read-mostly, rare conflicts | Wasted work when conflicts happen |
| MVCC | Mixed read and write workloads | Old versions need garbage collection (vacuum); snapshot isolation alone allows write skew |

:::warning
Common misconception: "two-phase locking means locking happens in two steps, lock and unlock, like any locking." The two phases are a whole-transaction rule: after the first release, no lock may be acquired. Releasing A and later locking B breaks 2PL even if each lock is used correctly.
:::

:::try-this
Under wait-die, T5 (timestamp 5) holds a lock that T3 (timestamp 3) wants, and T7 wants a lock held by T3. What happens to each? (T3 is older than T5, so T3 waits. T7 is younger than T3, so T7 dies and restarts with its original timestamp 7.)
:::

## What can go wrong

- **Lock upgrades** (S to X) by two readers of the same row, the most common deadlock.
- **Releasing locks early** for speed and losing serializability or causing cascading aborts.
- **Long transactions** under MVCC keeping old versions alive and bloating tables.
- **Optimistic schemes under heavy contention**, where most transactions abort repeatedly.
- **Snapshot isolation mistaken for serializable**, allowing write skew.

### Interview follow-ups

**"What is lock granularity?"** Locks can cover a row, page or whole table. Fine locks allow more concurrency but cost more to manage; intention locks (IS, IX) on the table signal row locks below, so a table lock request can be checked quickly.

**"How would you avoid the lost update in application code?"** UPDATE … SET bal = bal + 10 (atomic), SELECT … FOR UPDATE (pessimistic) or a version column checked in the WHERE clause (optimistic), as in [Several Cashiers, One Ledger](article:system-design-isolation-levels).

**"How do databases detect deadlocks?"** By periodically looking for cycles in the wait-for graph and aborting the cheapest victim, or by timeouts.

## In the real world

PostgreSQL combines MVCC for reads with row locks for writes and detects deadlocks with a wait-for graph check after a timeout. MySQL InnoDB uses MVCC plus row and gap locks. The schedules these protocols must produce are defined in [Did the Interleaved Cooks Still Make the Right Dish?](article:cs-core-serializability).

## Further reading

- Bernstein, Hadzilacos and Goodman, *Concurrency Control and Recovery in Database Systems*.
- H. T. Kung and John Robinson, "On Optimistic Methods for Concurrency Control" (ACM TODS, 1981).

## Key takeaways

- Shared locks allow many readers and exclusive locks allow one writer, but locks alone do not give serializability.
- Two-phase locking (no new lock after the first release) guarantees conflict serializability, and strict 2PL also holds write locks until commit to prevent cascading aborts.
- Locking can deadlock, which databases handle with wait-for graph detection, timeouts, or wait-die and wound-wait prevention.
- Timestamp ordering aborts operations that arrive too late for timestamp order, and the Thomas write rule skips obsolete writes instead of aborting.
- MVCC gives readers consistent snapshots so reads and writes do not block each other, and is combined with locks or validation for conflicting writes.

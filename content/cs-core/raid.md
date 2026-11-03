---
id: "cs-core-raid"
kind: "deep-dive"
subject: "cs-core"
slug: "raid"
title: "Spreading a Book Across Shelves, With Backup Pages"
subtitle: "RAID 0, 1, 5, 6 and 10: striping, mirroring and XOR parity worked bit by bit, usable capacity and failures tolerated, the small-write penalty, and why RAID is not a backup"
track: "cs-os"
track_order: 20
priority: "P1"
prerequisites: ["cs-core-disk-scheduling"]
difficulty: "intermediate"
read_minutes: 12
topics: ["operating systems", "storage", "raid", "parity", "redundancy"]
glossary:
  - term: "Striping"
    definition: "Splitting data into chunks spread across several disks so they can be read or written in parallel."
  - term: "Mirroring"
    definition: "Writing identical copies of data to two or more disks."
  - term: "Parity"
    definition: "An extra block computed as the XOR of data blocks, from which any one missing block can be recomputed."
  - term: "Rebuild"
    definition: "Reconstructing a failed disk's contents onto a replacement disk from the surviving disks."
  - term: "Write penalty"
    definition: "The extra disk operations a RAID level needs per logical write, such as reading and rewriting parity in RAID 5."
quiz:
  - q: "Four 2 TB disks in RAID 5. What is the usable capacity?"
    options: ["8 TB", "6 TB", "4 TB", "2 TB"]
    answer: 1
    explain: "One disk's worth of space holds parity: (4 − 1) × 2 TB = 6 TB."
  - q: "Data blocks 0110, 1011, 1100 have parity 0001. The disk holding 1011 fails. How is it rebuilt?"
    options: ["It cannot be", "XOR the survivors: 0110 ⊕ 1100 ⊕ 0001 = 1011", "Copy the parity block", "Average the other blocks"]
    answer: 1
    explain: "XOR of all blocks including parity is zero, so the missing one equals the XOR of the rest."
  - q: "Why is RAID not a backup?"
    options: ["It is", "It faithfully copies deletions, corruption and ransomware encryption to every disk at once", "It is too slow", "It only works on SSDs"]
    answer: 1
    explain: "RAID protects against disk failure, not against mistakes or attacks. Backups keep older versions elsewhere."
cover_seed: "raid"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.7
---

## The hook

Disks fail. In a server with dozens of them, a failure is not a question of if but of when. When one fails, two things can go wrong: the data on it is gone, and every program waiting on it stops.

RAID (redundant array of independent disks) combines several disks so that one failure loses nothing and the system keeps running. The cleverest version stores a single extra disk's worth of information and can still rebuild *any* failed disk. Predict the operation that makes that possible. (XOR: the parity of all the others.)

## The intuition

:::analogy
You must store a precious book. **Spread it across several shelves** and several readers can fetch pages at once (fast, but one collapsed shelf loses chapters). Keep a full photocopy on another shelf (safe, but twice the space). Or keep **backup pages**: one extra page per row that is a clever summary of the others, enough to rewrite any single lost page. RAID levels are these three ideas and their combinations.
:::

## How it works

### The three building blocks

- **[[Striping]]**: chunk 1 on disk A, chunk 2 on disk B, and so on. Reads and writes use all disks in parallel.
- **[[Mirroring]]**: every chunk written to two disks.
- **[[Parity]]**: for each row of chunks across the disks, store the XOR of the data chunks in one extra chunk.

### Parity, bit by bit

XOR has two useful properties: x ⊕ x = 0 and x ⊕ 0 = x. So if P = A ⊕ B ⊕ C, then any one of them equals the XOR of the other three.

| Block | Bits |
|---|---|
| A (disk 1) | 0110 |
| B (disk 2) | 1011 |
| C (disk 3) | 1100 |
| P = A ⊕ B ⊕ C (disk 4) | 0001 |
| disk 2 fails: A ⊕ C ⊕ P | 1011, the lost B |

Wait, why can parity recover only one failure? With two unknowns, one XOR equation cannot separate them. RAID 6 adds a second, independent parity (computed with Reed–Solomon-style arithmetic) so two failures are survivable.

### The levels

With n disks of size D:

| Level | Layout | Usable capacity | Failures survived | Notes |
|---|---|---|---|---|
| RAID 0 | striping only | n × D | 0 | fastest; any failure loses everything |
| RAID 1 | mirroring | D (for a 2-disk mirror) | 1 of the pair | fast reads, simple rebuild |
| RAID 5 | striping + one parity, rotated across disks | (n − 1) × D | 1 | needs at least 3 disks |
| RAID 6 | striping + two parities | (n − 2) × D | any 2 | needs at least 4 disks |
| RAID 10 | stripe across mirrored pairs | n × D / 2 | 1 per pair, at least 1 | fast writes, fast rebuild |

For four 2 TB disks: RAID 0 gives 8 TB, RAID 5 gives 6 TB, RAID 6 and RAID 10 give 4 TB.

```mermaid
flowchart TD
  subgraph RAID5 with parity rotating
    R1[Row 1 A1 B1 C1 P1]
    R2[Row 2 A2 B2 P2 D2]
    R3[Row 3 A3 P3 C3 D3]
  end
```

RAID 5 rotates the parity across disks so that no single parity disk becomes a bottleneck (RAID 4 used a dedicated parity disk and suffered for it).

### The small-write penalty

Changing one block in RAID 5 means updating parity too. Without reading the whole row: new P = old P ⊕ old B ⊕ new B. That is 2 reads (old B, old P) plus 2 writes (new B, new P), so **4 disk operations per small write**, versus 2 for RAID 1 and 6 for RAID 6. Check with the table: changing B from 1011 to 0011 gives new P = 0001 ⊕ 1011 ⊕ 0011 = 1001, and recomputing A ⊕ new B ⊕ C directly also gives 1001.

### Rebuilds

When a disk fails, the array runs **degraded**: reads of the lost disk are recomputed from the others. A **[[rebuild]]** reads every surviving disk in full to reconstruct the replacement. On large disks this takes many hours, and a second failure, or an unreadable sector on a survivor, during that window loses data in RAID 5. That risk is why large arrays prefer RAID 6 or RAID 10.

:::insight
RAID trades capacity and write cost for speed and failure tolerance. Striping buys parallelism, mirroring buys simple redundancy, and XOR parity buys one disk of fault tolerance for the price of one disk, at the cost of a write penalty and long, risky rebuilds.
:::

## Trade-offs

| Need | Choose |
|---|---|
| Maximum speed, data is disposable (scratch space) | RAID 0 |
| Simple redundancy for two disks (boot drives) | RAID 1 |
| Capacity-efficient, read-heavy storage | RAID 5 (small disks) or RAID 6 (large disks) |
| Write-heavy databases needing redundancy | RAID 10 |

The **[[write penalty]]** per small logical write: RAID 0 is 1 operation, RAID 1 and 10 are 2, RAID 5 is 4, and RAID 6 is 6.

:::warning
Common misconception: "RAID is a backup." RAID keeps the system running when a disk dies, but an accidental `rm`, a software bug that corrupts files, or ransomware is written to every disk immediately. Backups keep older, separate copies; you need both.
:::

:::try-this
Six 4 TB disks. What is the usable capacity in RAID 5, RAID 6 and RAID 10, and how many failures can each survive? (RAID 5: 5 × 4 = 20 TB, 1 failure. RAID 6: 4 × 4 = 16 TB, any 2. RAID 10: three mirrored pairs, 12 TB, at least 1 and up to 3 if each failure hits a different pair.)
:::

## What can go wrong

- **A second failure during rebuild**, losing a RAID 5 array.
- **Disks from the same batch** failing close together.
- **Write-heavy workloads on RAID 5**, slowed by the parity penalty.
- **Treating RAID as backup** and losing data to deletion or corruption.
- **Hardware controller failures**, where a proprietary layout needs an identical controller to read the disks.

### Interview follow-ups

**"Hardware or software RAID?"** Hardware controllers offload work and may have battery-backed caches; software RAID (Linux md, ZFS) is flexible and portable. Both are common.

**"How do large distributed systems do this?"** Across machines rather than disks, with replication or erasure coding, the general form of parity, as in [Why a Stained QR Code Still Scans](article:famous-algos-reed-solomon).

**"Why is RAID 10 preferred for databases?"** Small random writes cost 2 operations instead of 4 or 6, and rebuilds copy from one mirror instead of reading every disk.

## In the real world

Servers, NAS boxes and storage arrays use RAID or its successors (ZFS RAID-Z, erasure-coded object stores). It sits beneath the file system described in [A Library Catalogue Pointing to the Shelves](article:cs-core-file-systems).

## Further reading

- David Patterson, Garth Gibson and Randy Katz, "A Case for Redundant Arrays of Inexpensive Disks (RAID)" (SIGMOD, 1988).
- Remzi and Andrea Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, chapter on RAID (free online).

## Key takeaways

- RAID combines disks using striping for speed, mirroring for simple redundancy, and XOR parity for capacity-efficient redundancy.
- Parity is the XOR of the data blocks in a row, so any single missing block equals the XOR of all the others.
- RAID 0 survives no failures, RAID 1 and RAID 5 survive one, RAID 6 survives any two, and RAID 10 survives one per mirrored pair.
- RAID 5 needs four disk operations per small write and long full-array rebuilds, which is why large arrays prefer RAID 6 or RAID 10.
- RAID protects against disk failure, not against deletion, corruption or ransomware, so it never replaces backups.

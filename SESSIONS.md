# Sessions (append-only, one line per session)

- 2026-11-03 (claude/epic-noether-sl9wr0): Removed all word-count limits (filler and repeat lint instead), engagement and completeness rubric in review_score.py and the pipeline; UI reorganisation of Home and Learn approved by the owner and merged (screenshots tool `npm run screenshots`); interview follow-ups added to 35 Famous Algorithms, 29 System Design and 10 DSA articles; `progress.py --handoff`. Next: System Design P0 articles, then Famous Algorithms P0.

## Session 2026-11-03 (continued): CS Core nearly complete
- Wrote CS Core sequentially (no agents): DBMS track complete (SQL interview queries, FDs, normalisation, transactions, serializability, concurrency control, recovery, indexing, query optimisation, relational algebra, views/triggers, NoSQL); OS track complete (file systems, disk scheduling, RAID, thrashing, I/O and DMA, threading models, Linux essentials, booting); Networks track complete (15); OOP track complete (17); Architecture 4 of 5.
- Famous Algorithms: FFT and TLS 1.3 handshake.
- Every number, SQL result, C++ output and command output was produced by actually running it.
- NEXT: cs-core-cache-coherence (last CS Core entry). A false-sharing test was already measured on the 4-core container: two threads doing 20M relaxed fetch_add each took about 750 to 900 ms with both counters on one 64-byte line, versus about 120 ms with alignas(64) padding (sizeof 16 vs 128). Then Famous Algorithms (52 left, P0 first), then ML (36), then the quality pass for imperfect articles.

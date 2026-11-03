---
id: "cp-parallel-binary-search"
kind: "pattern"
subject: "cp"
slug: "parallel-binary-search"
title: "A Whole Class Guessing in Rounds"
subtitle: "Parallel binary search: when every query needs its own binary search over time, run all of them together and replay the updates once per round"
track: "cp-ranges"
track_order: 20
priority: "P2"
prerequisites: ["cp-offline-queries", "cp-fenwick-advanced"]
difficulty: "advanced"
read_minutes: 12
topics: ["binary search", "offline queries", "fenwick tree", "divide and conquer"]
complexity: { time: "O((T + Q) log T · cost of one update or query)", space: "O(n + T + Q)" }
practice_problems:
  - { name: "Meteors", platform: "SPOJ", url: "https://www.spoj.com/problems/METEORS/", difficulty: "Hard" }
  - { name: "New Roads Queries", platform: "CSES", url: "https://cses.fi/problemset/task/2101", difficulty: "Hard" }
  - { name: "Stamp Rally", platform: "AtCoder", url: "https://atcoder.jp/contests/agc002/tasks/agc002_d", difficulty: "Hard" }
glossary:
  - term: "Parallel binary search"
    definition: "Running the binary searches of many offline queries at the same time, so that each round replays the sequence of updates once for all of them."
  - term: "Monotone predicate"
    definition: "A yes/no condition that, once true at some time, stays true at every later time; binary search needs this."
  - term: "Round"
    definition: "One pass in which every unfinished query tests the middle of its current range and halves it. About log₂ T rounds finish all queries."
  - term: "Offline"
    definition: "Knowing all updates and queries in advance, so they can be processed in any convenient order."
quiz:
  - q: "There are T = 10⁵ updates and Q = 10⁵ queries. About how many rounds does parallel binary search need?"
    options: ["1", "About 17", "About 10⁵", "About 316"]
    answer: 1
    explain: "Each round halves every query's range, so about ⌈log₂(T + 1)⌉ = 17 rounds."
  - q: "Why must the predicate be monotone over time?"
    options: ["For speed only", "Binary search assumes that once the answer is 'yes' at time k, it is 'yes' at every later time; otherwise halving can throw away the true answer", "Fenwick trees need it", "It is not required"]
    answer: 1
    explain: "With non-negative additions, a value that reached the target stays above it. If updates could subtract, the 'earliest time' might not be found by halving."
  - q: "Inside one round, why are queries grouped by their middle time?"
    options: ["To sort the output", "So the updates are replayed once from time 1 to T, and each query is checked exactly when the replay reaches its middle time", "To reduce memory", "Because Fenwick trees are sorted"]
    answer: 1
    explain: "Bucketing by mid lets one sweep over time serve every query, instead of rebuilding the state separately for each query."
cover_seed: "parallel-binary-search"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.6
---

## The hook

Meteor showers fall on a ring of space stations, one shower per day for 10⁵ days, each adding samples to a range of stations. Each of 10⁵ countries owns some stations and needs a target number of samples. For each country: on which day does it first reach its target?

One country alone is easy: binary search the day, and to test day k, replay the first k showers. That costs O(T log T) per country. For 10⁵ countries, it is about 10¹¹ operations.

What if all the countries searched at the same time, sharing a single replay of the showers in every step? Guess how many replays that needs in total: 10⁵, 316 or 17?

## The intuition

:::analogy
A teacher wants each student's exact score threshold for passing, and each student is doing a binary search in their head. Instead of re-reading the answer key once per student per guess, the teacher **reads the key out once per round**, and every student checks their own current guess while it is read. After about 17 rounds of reading, every student has their answer.
:::

That is **[[parallel binary search]]**:

- Every query has its own range [lo, hi] of possible answers, and its own middle guess.
- In each **[[round]]**, replay the updates once from time 1 to T. When the replay reaches time k, test every query whose middle is k.
- Each test halves that query's range. After about log₂ T rounds, every range has one value.

It needs the queries to be **[[offline]]** (known in advance) and the condition to be a **[[monotone predicate]]**: once true, it stays true as more updates arrive.

## How it works

1. For each query i, set lo = 1 and hi = T + 1 (T + 1 means "never").
2. Repeat while some query has lo < hi:
   - Put each unfinished query in the bucket of its mid = (lo + hi) / 2.
   - Reset the data structure. Apply updates 1, 2, …, T in order. Right after applying update k, test every query in bucket k:
     - if satisfied, hi = k (the answer is k or earlier);
     - otherwise lo = k + 1.
3. lo is the answer, or "never" if it equals T + 1.

Wait, why reset the data structure every round? Because each round replays time from the start. Forgetting to reset adds every update twice in the second round, and every answer comes out too early.

Each round costs T updates plus Q tests. With about log₂ T rounds, the total is O((T + Q) log T) updates and tests, times the cost of one update (O(log n) for a Fenwick tree). Compare O(Q · T log T) for separate binary searches.

:::insight
When many offline queries each need a binary search over the same sequence of updates, let them search together: one replay of the updates per round serves every query's middle guess, and about log₂ T rounds finish them all.
:::

## Walk through an example

Positions 1 to 3. Updates over time (add v to positions l..r):

| Time | Update | Values at positions 1, 2, 3 after it |
|---|---|---|
| 1 | +2 on [1, 2] | 2, 2, 0 |
| 2 | +1 on [2, 3] | 2, 3, 1 |
| 3 | +3 on [1, 3] | 5, 6, 4 |
| 4 | +2 on [3, 3] | 5, 6, 6 |

Queries: q1 = position 1 needs 4; q2 = position 2 needs 3; q3 = position 3 needs 5; q4 = position 3 needs 7. Ranges start at [1, 5], where 5 means never.

| Round | q1 | q2 | q3 | q4 |
|---|---|---|---|---|
| 1 | mid 3: value 5 ≥ 4, so [1, 3] | mid 3: 6 ≥ 3, so [1, 3] | mid 3: 4 < 5, so [4, 5] | mid 3: 4 < 7, so [4, 5] |
| 2 | mid 2: 2 < 4, so [3, 3] | mid 2: 3 ≥ 3, so [1, 2] | mid 4: 6 ≥ 5, so [4, 4] | mid 4: 6 < 7, so [5, 5] |
| 3 | done | mid 1: 2 < 3, so [2, 2] | done | done |

Answers: q1 = **3**, q2 = **2**, q3 = **4**, q4 = **never**. Three rounds, each one replay of the four updates, instead of a separate binary search per query.

:::try-this
Add q5 = position 1 needs 2. Trace its range. (Round 1: mid 3, value 5 ≥ 2, range [1, 3]. Round 2: mid 2, value 2 ≥ 2, range [1, 2]. Round 3: mid 1, value 2 ≥ 2, range [1, 1]. Answer: time 1.)
:::

## The code

```pseudo
parallel_binary_search(updates[1..T], queries):
    for each query i: lo[i] = 1; hi[i] = T + 1
    while some query has lo < hi:
        bucket[mid] = list of queries with mid = (lo + hi) / 2
        reset the data structure
        for k in 1 .. T:
            apply update k
            for i in bucket[k]:
                if condition(i) holds now: hi[i] = k
                else: lo[i] = k + 1
    answer[i] = lo[i], or "never" if lo[i] == T + 1
```

The C++ uses a Fenwick tree with range add and point query, and prints the four answers above.

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct Fenwick {                       // range add, point query
    vector<ll> t;
    explicit Fenwick(int n) : t(n + 2, 0) {}
    void add(int i, ll v) { for (; i < (int)t.size(); i += i & -i) t[i] += v; }
    void rangeAdd(int l, int r, ll v) { add(l, v); add(r + 1, -v); }
    ll point(int i) { ll s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }
};

struct Update { int l, r; ll v; };     // at time k (1-based), add v to positions l..r
struct Query { int pos; ll need; };    // earliest time when value at pos >= need

// For every query, the earliest update time that satisfies it, or -1 if none does.
vector<int> parallelBinarySearch(int n, const vector<Update>& ups, const vector<Query>& qs) {
    int T = ups.size(), Q = qs.size();
    vector<int> lo(Q, 1), hi(Q, T + 1);           // answer in [lo, hi]; T + 1 means never
    bool changed = true;
    while (changed) {                              // about log2(T + 1) rounds
        changed = false;
        vector<vector<int>> atMid(T + 2);
        for (int i = 0; i < Q; i++)
            if (lo[i] < hi[i]) atMid[(lo[i] + hi[i]) / 2].push_back(i), changed = true;
        if (!changed) break;
        Fenwick fw(n);                             // fresh structure, replay updates once per round
        for (int k = 1; k <= T; k++) {
            fw.rangeAdd(ups[k - 1].l, ups[k - 1].r, ups[k - 1].v);
            for (int i : atMid[k]) {               // every query whose guess is time k
                if (fw.point(qs[i].pos) >= qs[i].need) hi[i] = k;
                else lo[i] = k + 1;
            }
        }
    }
    vector<int> ans(Q);
    for (int i = 0; i < Q; i++) ans[i] = lo[i] == T + 1 ? -1 : lo[i];
    return ans;
}

int main() {
    vector<Update> ups = {{1, 2, 2}, {2, 3, 1}, {1, 3, 3}, {3, 3, 2}};
    vector<Query> qs = {{1, 4}, {2, 3}, {3, 5}, {3, 7}};
    for (int t : parallelBinarySearch(3, ups, qs)) cout << t << " ";   // 3 2 4 -1
    cout << "\n";
}
```

## Complexity

About ⌈log₂(T + 1)⌉ rounds. Each round applies T updates and runs Q tests, each O(log n) with a Fenwick tree: **O((T + Q) · log T · log n)** time and **O(n + T + Q)** memory. For T = Q = 10⁵ and n = 10⁵, that is roughly 17 × 2·10⁵ × 17 ≈ 6·10⁷ basic steps, against about 10¹¹ for separate searches.

## Common mistakes

:::warning
Common misconception: "parallel binary search works for any query." It needs the condition to be monotone in time. If updates can lower values (for example, negative additions), a query may become true and then false again, and halving can discard the real earliest time.
:::

- **Not resetting the structure each round**, which double-applies updates.
- **Off-by-one in "never"**: use T + 1 as the upper bound and translate it at the end.
- **Testing before applying update k**: the test for mid = k must see updates 1..k, so apply first, then test.
- **Overflow**: sums of many updates can exceed 32 bits; use 64-bit counters, and for "country owns many stations" sum carefully or stop early once the target is reached.

### Interview follow-ups

**"What if the queries came online, one at a time?"** Parallel binary search needs all queries in advance. Online, you would need a persistent structure that can be queried at any time, as in persistent segment trees.

**"Is there a recursive version?"** Yes: solve(lo, hi, queries) applies updates up to mid, splits the queries by whether they are satisfied, and recurses on each half. It is the same idea, organised as divide and conquer.

**"Where else does it appear?"** Union-find over time ("when do u and v first become connected?"), which is "New Roads Queries", and k-th smallest queries over static arrays.

## Practice problems

Start with **Meteors** (the hook's problem shape, with a circular range update), then **New Roads Queries** (the "update" is a union in a DSU, which is reset each round), and finally **Stamp Rally**, where each query asks for the earliest edge index at which two walkers together can visit enough vertices. Offline thinking in general is covered in [Grading in the Easiest Order, Returning in Roll Order](article:cp-offline-queries), and the range-update Fenwick tree in [Two Piggy Banks That Track One Total](article:cp-fenwick-advanced).

## Key takeaways

- Parallel binary search answers many offline "earliest time when condition holds" queries by running all their binary searches together.
- Each round buckets queries by their middle time, replays the updates once from the start, and halves every query's range.
- About log₂ T rounds suffice, so the cost is O((T + Q) log T) updates and tests instead of a separate replay per query.
- The condition must be monotone over time, and the data structure must be reset at the start of every round.

---
id: "cp-bitset-optimisation"
kind: "pattern"
subject: "cp"
slug: "bitset-optimisation"
title: "Flipping 64 Light Switches With One Hand"
subtitle: "Bitsets divide the work by 64: shift-or subset sums, transitive closure, and knowing when that factor is enough"
track: "cp-misc"
track_order: 16
priority: "P2"
prerequisites: ["cp-bitwise-tricks-cp"]
difficulty: "advanced"
read_minutes: 12
topics: ["bitset", "subset sum", "reachability", "word-level parallelism"]
complexity: { time: "O(n · S / 64)", space: "O(S / 64) per set" }
practice_problems:
  - { name: "Money Sums", platform: "CSES", url: "https://cses.fi/problemset/task/1745", difficulty: "Easy" }
  - { name: "Reachability Queries", platform: "CSES", url: "https://cses.fi/problemset/task/2143", difficulty: "Hard" }
  - { name: "Partition Equal Subset Sum", platform: "LeetCode", url: "https://leetcode.com/problems/partition-equal-subset-sum/", difficulty: "Medium" }
glossary:
  - term: "Bitset"
    definition: "A fixed-size array of bits packed into machine words, so operations like OR, AND and shifts work on 64 bits per instruction."
  - term: "Word-level parallelism"
    definition: "Doing the same operation on all 64 bits of a machine word at once, which divides the cost of bit-by-bit loops by about 64."
  - term: "Shift-or"
    definition: "The update can |= can << c, which marks every old reachable sum plus c as reachable, for all sums at once."
  - term: "Transitive closure"
    definition: "For every node, the set of all nodes it can reach. Stored as one bitset per node, it is built by OR-ing children's sets."
quiz:
  - q: "Coins [3, 5]. The bitset starts as {0}. After processing both coins with shift-or, which sums are reachable?"
    options: ["{0, 3, 5}", "{0, 3, 5, 8}", "{3, 5, 8}", "{0, 8}"]
    answer: 1
    explain: "After 3: {0, 3}. After 5: {0, 3} OR {5, 8} = {0, 3, 5, 8}."
  - q: "Why must the coins loop use can |= can << c and not a loop over sums from low to high setting can[s + c]?"
    options: ["Both are identical", "The bitset version is 64 times faster and, because it shifts the old set, uses each coin at most once", "Shifts are undefined for bitsets", "To save memory"]
    answer: 1
    explain: "can << c is computed from the old set before OR-ing, so a coin is never reused. A naive increasing loop over s would let one coin be added repeatedly."
  - q: "What is the main limitation of std::bitset?"
    options: ["It cannot shift", "Its size must be a compile-time constant, so you size it for the maximum constraint", "It only holds 64 bits", "It is slower than vector<bool>"]
    answer: 1
    explain: "std::bitset<N> needs N at compile time. Size it from the problem's upper bound, or use a dynamic bitset if sizes vary widely."
cover_seed: "bitset-optimisation"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.6
---

## The hook

You have 100 coins, each worth at most 1,000. Which totals between 1 and 100,000 can you make? A DP over (coin, sum) is 100 × 10⁵ = 10⁷ steps, fine. Now make it 2,000 coins and sums up to 10⁶: 2·10⁹ steps. Too slow.

Same algorithm, one change, and it becomes about 3·10⁷ word operations. No clever maths, no new idea about coins. Just a different way of storing a row of true/false values.

Here is the puzzle: how can the same O(n · S) algorithm suddenly run 64 times faster? Think about how many bits a CPU register holds.

## The intuition

:::analogy
A hall has 100,000 light switches, and you must flip a pattern of them. Flipping one at a time takes forever. But the switches are mounted in **panels of 64 that you can flip with one hand**: press a panel template and all 64 change at once. Same lights, same pattern, 64 times fewer movements.
:::

A **[[bitset]]** stores booleans packed into 64-bit machine words. One OR, AND or shift instruction handles 64 of them at once. That is **[[word-level parallelism]]**: whenever your loop does the same boolean operation on a long row of flags, packing them divides the work by about 64.

It does not change the complexity class. It changes the constant, and in contests a factor of 64 is often the difference between time limit exceeded and accepted.

## How it works

### Subset sums with shift-or

Let `can` be a bitset where bit s means "sum s is reachable". Start with only bit 0 set. For each coin c:

`can |= can << c`

Shifting left by c moves every reachable sum s to s + c. OR-ing it with the old set means "every sum I could make before, plus every sum I could make before with this coin added". That single line replaces the whole inner loop over sums. This is the **[[shift-or]]** update.

Wait, why can't a coin be used twice? Because `can << c` is computed from the set *before* this coin, and only then OR-ed in. The new sums never feed back into the same shift.

### Transitive closure with OR

For a directed acyclic graph, the set of nodes reachable from u is u itself plus everything reachable from its children. Store each set as a bitset and process nodes children-first (reverse topological order, from [Socks Before Shoes](article:dsa-topological-sort)):

`reach[u] = {u} OR reach[v] for each edge u → v`

Each OR costs n / 64 word operations instead of n. That is the **[[transitive closure]]**, and its popcount answers "how many nodes can u reach?" in one call.

If the graph has cycles, first collapse each strongly connected component into a single node, as in [One-Way Streets, Found in a Single Walk](article:cp-scc), then run the same OR on the resulting DAG.

:::insight
When the inner loop of an algorithm is "for each of S positions, combine booleans the same way", pack the booleans into a bitset and let one instruction handle 64 positions. Shift-or for sums and OR-closure for reachability are the two shapes you will meet most.
:::

## Walk through an example

**Money sums** with coins [4, 2, 5, 2]. Bits shown as the set of reachable sums.

| Coin | can before | can << coin | can after (OR) |
|---|---|---|---|
| start | | | {0} |
| 4 | {0} | {4} | {0, 4} |
| 2 | {0, 4} | {2, 6} | {0, 2, 4, 6} |
| 5 | {0, 2, 4, 6} | {5, 7, 9, 11} | {0, 2, 4, 5, 6, 7, 9, 11} |
| 2 | {0, 2, 4, 5, 6, 7, 9, 11} | {2, 4, 6, 7, 8, 9, 11, 13} | {0, 2, 4, 5, 6, 7, 8, 9, 11, 13} |

Answer (excluding 0): **9 sums**: 2, 4, 5, 6, 7, 8, 9, 11, 13.

**Reachability** in the DAG 1→2, 1→3, 2→4, 3→4, 4→5. Reverse topological order: 5, 4, 3, 2, 1.

| Node | Children | reach (bitset) | Count |
|---|---|---|---|
| 5 | none | {5} | 1 |
| 4 | 5 | {4, 5} | 2 |
| 3 | 4 | {3, 4, 5} | 3 |
| 2 | 4 | {2, 4, 5} | 3 |
| 1 | 2, 3 | {1, 2, 3, 4, 5} | 5 |

Node 4 is reached through both 2 and 3, but OR counts it once. Summing sizes of sets instead would double count it.

:::try-this
Coins [1, 3, 3]. List the reachable sums after each coin using shift-or. (Start {0}. After 1: {0, 1}. After 3: {0, 1, 3, 4}. After the second 3: {0, 1, 3, 4} OR {3, 4, 6, 7} = {0, 1, 3, 4, 6, 7}. So 5 non-zero sums: 1, 3, 4, 6, 7.)
:::

## The code

```pseudo
subset_sums(coins):
    can = bitset of size MAXSUM + 1, only bit 0 set
    for c in coins:
        can = can OR (can shifted left by c)
    return all s >= 1 with can[s] set

reach_counts(DAG):
    for u in reverse topological order:
        reach[u] = {u}
        for each edge u -> v: reach[u] = reach[u] OR reach[v]
    return popcount(reach[u]) for each u
```

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXSUM = 100000;   // bitset size must be a compile-time constant

// All sums reachable by picking a subset of coins: shift-or, 64 sums per machine word.
vector<int> moneySums(const vector<int>& coins) {
    bitset<MAXSUM + 1> can;
    can[0] = 1;
    for (int c : coins) can |= can << c;        // old sums, plus old sums shifted by c
    vector<int> sums;
    for (int s = 1; s <= MAXSUM; s++) if (can[s]) sums.push_back(s);
    return sums;
}

// Reachability in a DAG: reach[u] = {u} OR reach[v] over edges u -> v, in reverse topological order.
const int MAXN = 50001;
vector<int> reachCounts(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (auto [u, v] : edges) adj[u].push_back(v), indeg[v]++;
    vector<int> order;                                  // Kahn's topological order
    queue<int> q;
    for (int u = 1; u <= n; u++) if (!indeg[u]) q.push(u);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    vector<bitset<MAXN>> reach(n + 1);
    for (int i = (int)order.size() - 1; i >= 0; i--) {  // children before parents
        int u = order[i];
        reach[u][u] = 1;
        for (int v : adj[u]) reach[u] |= reach[v];      // n/64 word operations per edge
    }
    vector<int> cnt(n + 1);
    for (int u = 1; u <= n; u++) cnt[u] = reach[u].count();
    return cnt;
}

int main() {
    for (int s : moneySums({4, 2, 5, 2})) cout << s << " ";   // 2 4 5 6 7 8 9 11 13
    cout << "\n";
    auto cnt = reachCounts(5, {{1, 2}, {1, 3}, {2, 4}, {3, 4}, {4, 5}});
    for (int u = 1; u <= 5; u++) cout << cnt[u] << " ";       // 5 3 3 2 1
    cout << "\n";
}
```

## Complexity

- **Subset sums**: n coins × S / 64 words. With n = 100 and S = 10⁵ that is about 1.6·10⁵ word operations, against 10⁷ bit by bit.
- **Closure**: one OR of n / 64 words per edge, O(m · n / 64). With n = 5·10⁴ nodes and m = 10⁵ edges, about 7.8·10⁷ word operations.
- **Memory** is the catch for closure: one n-bit set per node is n² bits. For n = 5·10⁴ that is about 312 MB. Process the target nodes in chunks (for example, only targets 0 to 9,999 in the first pass, then the next block) to keep memory bounded, at the cost of repeating the passes.

## Common mistakes

:::warning
Common misconception: "a bitset makes an algorithm asymptotically faster." It divides by a constant of about 64; O(n · S) stays O(n · S). Use it when the plain version is a small factor too slow, not when it is millions of times too slow.
:::

- **Fixed size at compile time**: `bitset<N>` needs a constant N. Size it to the maximum constraint (plus one), and remember that bits beyond your real range may get set by shifts and must be ignored.
- **Allocating huge bitsets on the stack**: a `bitset<1000000>` local variable is 125 KB; arrays of them belong in global or heap memory.
- **Forgetting cycles** in reachability: OR-closure needs a DAG; condense SCCs first.
- **Using vector<bool>**: it is also packed, but shifts and bulk ORs are not provided as single operations; use std::bitset.

### Interview follow-ups

**"Can the subset-sum bitset tell you which coins to use?"** Not directly. Store the bitset after each coin, or the first coin that made each sum reachable, then walk back from the target.

**"How would you check whether an array splits into two equal-sum halves?"** Build subset sums with shift-or and test whether bit total / 2 is set (with an even total). That is "Partition Equal Subset Sum" in one line of DP.

**"Other places bitsets help?"** Counting triangles in dense graphs (AND of adjacency rows and popcount), the bounded knapsack in [Packing When the Shop Has Only Three of Each](article:cp-knapsack-variants), and set intersections in matching problems.

## Practice problems

Start with **Money Sums** (shift-or, exactly the walkthrough), then **Partition Equal Subset Sum** for the same idea in an interview setting. **Reachability Queries** combines SCC condensation with OR-closure and needs the memory care above. The bit tricks behind all of this are in [Counting How Often Each Light Is On Across All Switches](article:cp-bitwise-tricks-cp).

## Key takeaways

- A bitset packs booleans into 64-bit words, so OR, AND and shifts process 64 positions per instruction.
- Subset sums become one line per coin, can |= can << c, which also guarantees each coin is used at most once.
- Transitive closure in a DAG is an OR of children's bitsets in reverse topological order; condense strongly connected components first if there are cycles.
- The speed-up is a constant factor of about 64, which is exactly what turns many borderline contest solutions from too slow to accepted.
- Watch memory: n bitsets of n bits cost n²/8 bytes, so process large closures in chunks.

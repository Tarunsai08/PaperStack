---
id: "cp-xor-basis"
kind: "pattern"
subject: "cp"
slug: "xor-basis"
title: "The Building Blocks of Every Reachable XOR"
subtitle: "XOR basis (linear basis over bits): insert greedily by the highest bit, then answer maximum subset XOR, counting and membership in O(log V)"
track: "cp-math"
track_order: 21
priority: "P2"
prerequisites: ["cp-bitwise-tricks-cp"]
difficulty: "advanced"
read_minutes: 12
topics: ["xor", "linear basis", "bit manipulation", "gaussian elimination"]
complexity: { time: "O(n log V)", space: "O(log V)" }
practice_problems:
  - { name: "(Zero XOR Subset)-less", platform: "Codeforces", url: "https://codeforces.com/problemset/problem/1101/G", difficulty: "Hard" }
  - { name: "Shortest Path Problem?", platform: "Codeforces", url: "https://codeforces.com/problemset/problem/845/G", difficulty: "Hard" }
  - { name: "Square Subsets", platform: "Codeforces", url: "https://codeforces.com/problemset/problem/895/C", difficulty: "Hard" }
glossary:
  - term: "XOR basis"
    definition: "A small set of numbers, at most one per highest bit, such that the XORs of their subsets are exactly the XORs of subsets of the original numbers."
  - term: "Linear independence"
    definition: "A set of numbers is independent if no non-empty subset of them XORs to 0, so none can be made from the others."
  - term: "Rank"
    definition: "The number of numbers in the basis. With rank r, exactly 2^r distinct values can be made as subset XORs."
  - term: "Span"
    definition: "The set of all values reachable as an XOR of some subset of the basis (including the empty subset, which gives 0)."
quiz:
  - q: "A basis has rank 4. How many distinct values can be formed as XORs of subsets of the original array?"
    options: ["4", "8", "16", "Depends on the array length"]
    answer: 2
    explain: "Each basis element is either in or out, and different choices give different values, so 2⁴ = 16 distinct XORs (including 0)."
  - q: "Inserting a number reduces it all the way to 0. What does that mean?"
    options: ["Insertion failed because of a bug", "The number can already be made as an XOR of earlier numbers, so it adds nothing new", "The number is 0", "The basis is full"]
    answer: 1
    explain: "Reducing to 0 means x equals an XOR of stored blocks. It is dependent and the span does not change."
  - q: "Why is 'maximum XOR of any subset' different from 'maximum XOR of a pair'?"
    options: ["They are the same problem", "A pair uses exactly two numbers (solved with a bitwise trie); a subset can use any number of them (solved with a XOR basis)", "Subsets are always smaller", "Pairs need sorting"]
    answer: 1
    explain: "Different questions, different tools. The trie answers pairs in O(log V) per element; the basis answers any-subset questions."
cover_seed: "xor-basis"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.6
---

## The hook

You get 10⁵ numbers below 2⁶⁰. Pick any subset (any size at all) and XOR it. What is the largest value you can get?

There are 2^(10⁵) subsets. Even the answer for 60 numbers would take longer than a contest to brute force. And yet the answer comes from keeping **at most 60 numbers** and one greedy pass.

Before reading on, guess: if you insert all 10⁵ numbers, at most how many of them can actually matter for what XORs are reachable? The number is in the first paragraph.

## The intuition

:::analogy
Imagine a box of **building blocks** where every block has a different tallest part. Any structure anyone could build from the original huge pile can also be built from this small box. Extra blocks from the pile add nothing new: each one can already be assembled from blocks in the box.
:::

That box is a **[[XOR basis]]**. Each stored number has a different highest set bit, so there are at most 60 of them for 60-bit values. Every value you could get by XOR-ing a subset of the original array is also an XOR of a subset of the basis, and the reverse holds too. That set of reachable values is the **[[span]]**.

A new number either brings a new "tallest part" the box cannot make, or it can be reduced to nothing by blocks already there. In linear-algebra language, it is either independent or dependent ([[linear independence]]). XOR is addition of bit vectors mod 2, so this really is Gaussian elimination, one bit at a time.

## How it works

### Insert

To insert x, scan bits from high to low. At the first set bit i:

- If the box has no block with highest bit i, store x there. Done: x was independent.
- Otherwise XOR x with that block. This clears bit i, and you continue down.

If x becomes 0, it was already in the span.

Wait, why does XOR-ing with a stored block keep the span the same? Because stored blocks are themselves in the span, so x and x ⊕ block are reachable from exactly the same combinations. You are only rewriting x in terms of what you already have.

### Questions the basis answers

- **Maximum subset XOR.** Start from 0 and go from the highest bit down: if XOR-ing the block for bit i makes the value larger, do it. The block for bit i is the only one that can still change bit i, so a greedy choice at each bit is optimal.
- **How many distinct values?** With [[rank]] r (the number of stored blocks), exactly 2^r.
- **Can x be made?** Reduce x like an insert without storing; it can be made if it reaches 0.
- **How many subsets give each value?** For n numbers and rank r, every value in the span is made by exactly 2^(n − r) subsets.

:::insight
However many numbers you have, everything their subsets can XOR to is captured by at most one number per bit. Insert greedily by highest bit, and the questions "biggest", "how many", and "is x reachable" each become a single pass over 60 bits.
:::

## Walk through an example

Insert 11, 7, 14, 9 (4 bits each).

| Insert | Binary | Reduction steps | Result | Basis afterwards (by highest bit) |
|---|---|---|---|---|
| 11 | 1011 | bit 3 empty | stored at bit 3 | 3: 1011 |
| 7 | 0111 | bit 2 empty | stored at bit 2 | 3: 1011, 2: 0111 |
| 14 | 1110 | ⊕ 1011 → 0101, ⊕ 0111 → 0010, bit 1 empty | stored 0010 at bit 1 | 3: 1011, 2: 0111, 1: 0010 |
| 9 | 1001 | ⊕ 1011 → 0010, ⊕ 0010 → 0000 | dependent | unchanged |

Rank 3, so there are 2³ = **8** distinct subset XORs: 0, 2, 5, 7, 9, 11, 12, 14 (checked against all 16 subsets).

**Maximum:** start 0. Bit 3: 0 ⊕ 1011 = 11 > 0, take it. Bit 2: 11 ⊕ 0111 = 1100 = 12 > 11, take it. Bit 1: 12 ⊕ 0010 = 1110 = 14 > 12, take it. Answer **14**.

Notice 9 was dependent: 9 = 11 ⊕ 2, and 2 = 14 ⊕ 11 ⊕ 7, so the original 9 was 14 ⊕ 7 all along.

:::try-this
With the basis above, can 6 (0110) be made? Can 5 (0101)? (6: highest bit 2, ⊕ 0111 → 0001; bit 0 has no block, so no. 5: ⊕ 0111 → 0010, ⊕ 0010 → 0, so yes: 5 = 7 ⊕ 2, which is 7 ⊕ 14 ⊕ 11 ⊕ 7 = 14 ⊕ 11.)
:::

## The code

```pseudo
insert(x):
    for bit from HIGH down to 0:
        if x has bit set:
            if basis[bit] empty: basis[bit] = x; return independent
            x = x XOR basis[bit]
    return dependent                 // x reduced to 0

max_xor():
    best = 0
    for bit from HIGH down to 0:
        best = max(best, best XOR basis[bit])
    return best
```

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct XorBasis {
    static const int B = 60;          // enough for values below 2^60
    ll b[B] = {};                      // b[i] has highest set bit i, or 0
    int rank = 0;

    // Returns true if x added a new independent vector.
    bool insert(ll x) {
        for (int i = B - 1; i >= 0; i--) {
            if (!(x >> i & 1)) continue;
            if (!b[i]) { b[i] = x; rank++; return true; }
            x ^= b[i];                 // clear bit i using the stored block
        }
        return false;                  // reduced to 0: already reachable
    }
    bool canMake(ll x) const {
        for (int i = B - 1; i >= 0; i--)
            if (x >> i & 1) {
                if (!b[i]) return false;
                x ^= b[i];
            }
        return true;
    }
    ll maxXor() const {                // greedy from the top bit
        ll best = 0;
        for (int i = B - 1; i >= 0; i--) best = max(best, best ^ b[i]);
        return best;
    }
};

int main() {
    XorBasis xb;
    for (ll x : {11, 7, 14, 9}) cout << x << (xb.insert(x) ? " added" : " dependent") << "\n";
    cout << "rank " << xb.rank << ", distinct subset XORs " << (1LL << xb.rank) << "\n";   // 3, 8
    cout << "max " << xb.maxXor() << "\n";                                                // 14
    cout << "5? " << xb.canMake(5) << "  6? " << xb.canMake(6) << "\n";                   // 1 0
}
```

## Complexity

Each insert or query scans at most B bits (60 for values below 2⁶⁰), so n inserts cost **O(n · B)** and each query O(B). The basis stores **at most B numbers**, whatever n is.

## Common mistakes

:::warning
Common misconception: "maximum XOR means the best pair, so use a trie." The bitwise trie in [Taking the Opposite Turn at Every Fork](article:dsa-max-xor-trie) finds the best XOR of exactly two numbers. Any-size subsets need the basis. Read the statement carefully: "pair" and "subset" are different problems.
:::

- **Scanning bits low to high** when inserting: the basis must be keyed by the highest set bit, so scan from the top.
- **Shifting 1 instead of 1LL**: for 60-bit values, `1 << i` overflows int; use 64-bit types everywhere.
- **Counting subsets wrongly**: 2^r counts distinct values (including 0 from the empty subset); the number of subsets per value is 2^(n − r). Check whether the problem wants non-empty subsets.
- **Expecting the stored numbers to be original array elements**: they are reduced combinations. If you need which original elements form an answer, track the combinations as you reduce.

### Interview follow-ups

**"XOR of a path in a graph with cycles: minimum over all paths from 1 to n."** Take any path's XOR, then put the XOR of every cycle into a basis; walking around a cycle and back changes the path XOR by that cycle's value. Minimise greedily from the top bit. That is "Shortest Path Problem?".

**"Split an array into the most segments so that no non-empty set of segments XORs to 0."** Segment XORs are differences of prefix XORs, so the answer is the rank of the prefix XORs (and −1 if the total is 0). That is "(Zero XOR Subset)-less".

**"Count subsets whose product is a perfect square."** Turn each number into a bit vector of prime exponents mod 2; square products are subsets XOR-ing to 0, so the answer is 2^(n − r) − 1. That is "Square Subsets".

## Practice problems

Start with **(Zero XOR Subset)-less** (rank of prefix XORs), then **Shortest Path Problem?** (cycle basis on a graph), then **Square Subsets** (counting with 2^(n − r)). The bit-level tricks used throughout are in [Counting How Often Each Light Is On Across All Switches](article:cp-bitwise-tricks-cp).

## Key takeaways

- A XOR basis keeps at most one number per highest bit, and its subset XORs are exactly the subset XORs of the whole array.
- Insert by scanning bits from the top and XOR-ing away bits already covered; a number that reduces to 0 is dependent and adds nothing.
- The maximum subset XOR comes from a greedy pass from the highest bit, taking each block if it makes the value larger.
- With rank r out of n numbers, there are 2^r distinct subset XORs, and each is made by 2^(n − r) subsets.
- Use a trie for the best pair and a basis for the best subset; the two problems look alike but need different tools.

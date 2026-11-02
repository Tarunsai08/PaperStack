---
id: "dsa-binary-search-answer"
kind: "pattern"
subject: "dsa"
slug: "binary-search-answer"
title: "Guessing the Answer, Then Checking It"
subtitle: "Binary search on the answer: when finding the best value is hard but checking a value is easy"
track: "dsa-search-sort"
track_order: 2
priority: "P0"
prerequisites: ["dsa-binary-search"]
difficulty: "intermediate"
read_minutes: 9
topics: ["binary search", "optimisation", "greedy", "minimise the maximum"]
complexity: { time: "O(n log R), where R is the range of possible answers", space: "O(1)" }
practice_problems:
  - { name: "Koko Eating Bananas", platform: "LeetCode", url: "https://leetcode.com/problems/koko-eating-bananas/", difficulty: "Medium" }
  - { name: "Capacity To Ship Packages Within D Days", platform: "LeetCode", url: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/", difficulty: "Medium" }
  - { name: "Factory Machines", platform: "CSES", url: "https://cses.fi/problemset/task/1620", difficulty: "Medium" }
  - { name: "Split Array Largest Sum", platform: "LeetCode", url: "https://leetcode.com/problems/split-array-largest-sum/", difficulty: "Hard" }
  - { name: "Magnetic Force Between Two Balls", platform: "LeetCode", url: "https://leetcode.com/problems/magnetic-force-between-two-balls/", difficulty: "Medium" }
glossary:
  - term: "Answer space"
    definition: "The range of values the answer could possibly take, such as capacities from the heaviest package to the total weight."
  - term: "Feasibility check"
    definition: "A function that answers 'is this candidate value good enough?' for one guess, usually with a simple greedy pass."
  - term: "Monotonic"
    definition: "Changing in one direction only. If capacity c works, every capacity above c also works."
  - term: "Greedy pass"
    definition: "A single left-to-right scan that makes the obvious local choice at each step, used here to test one guess."
  - term: "Minimise the maximum"
    definition: "A family of problems that asks for the smallest possible value of the worst case, such as the lightest possible heaviest day."
quiz:
  - q: "What property must the feasibility check have for binary search on the answer to work?"
    options: ["It must be O(1)", "If a value works, every larger value also works (or every smaller one, consistently)", "It must use recursion", "The array must be sorted"]
    answer: 1
    explain: "Binary search needs a no-then-yes pattern over the answer space. Monotonic feasibility provides exactly that."
  - q: "For 'ship packages within D days', what are good search bounds for the capacity?"
    options: ["0 to 1", "The heaviest package to the total weight", "1 to D", "The average weight to the median"]
    answer: 1
    explain: "Capacity below the heaviest package can never ship it; capacity equal to the total ships everything in one day. The answer lies between."
  - q: "Why is the overall time O(n log R) and not O(n squared)?"
    options: ["Because the check is O(1)", "Each of the log R guesses runs one O(n) check", "Because the array is sorted", "Because R is always small"]
    answer: 1
    explain: "Binary search makes about log2 of the range guesses, and each guess costs one linear greedy pass over the input."
cover_seed: "binary-search-answer"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.92
---

## The hook

A shipping company must move a row of packages, in order, within 5 days. Every day the ship carries packages from the front of the row until the next one would exceed its capacity. What is the smallest capacity that gets the job done?

Computing that capacity directly is awkward. But answering a slightly different question is easy: "would capacity 15 work?" You just simulate the five days. That small shift, from finding the answer to checking a guess, unlocks one of the most powerful patterns in interviews.

## The intuition

:::analogy
Think of setting an oven to bake a cake you have never made. You do not know the perfect temperature, but you can test any guess: too low and the middle stays raw, high enough and it bakes. And if 180 degrees bakes it, 200 certainly does too. So you try the middle of the plausible range, and each test tells you which half to keep, until you find the lowest temperature that still bakes the cake.
:::

That is binary search on the answer. Instead of searching an array, you search the [[answer space]], all values the answer could take. Each guess runs a [[feasibility check]], and because feasibility is [[monotonic]], the answers look like `no no no yes yes yes`. You already know how to find the first yes from [Binary Search Without the Off-by-One Fear](article:dsa-binary-search).

## How it works

Four steps, every time:

- **Name the answer** you are minimising or maximising (capacity, speed, distance, time).
- **Bound it**: the smallest value that could possibly work and the largest that surely works.
- **Write `check(x)`**: usually a [[greedy pass]] that answers "is x enough?" in O(n).
- **Binary search** for the first x where `check(x)` is true.

```mermaid
flowchart TD
  A[Set lo and hi bounds on the answer] --> B{lo less than hi}
  B -- no --> F[Answer is lo]
  B -- yes --> C[Guess mid]
  C --> D{check of mid is true}
  D -- yes --> E[Keep mid and smaller: hi = mid]
  D -- no --> G[Need bigger: lo = mid + 1]
  E --> B
  G --> B
```

:::insight
When a problem says "minimise the maximum" or "maximise the minimum", or asks for "the smallest value such that something is possible", ask yourself: is it easy to check one guess? If yes, and the check is monotonic, binary search on the answer.
:::

Problems phrased as [[minimise the maximum]], like the heaviest day of shipping, or "maximise the minimum", like the closest pair of placed objects, are the classic signals.

### Why the greedy check is safe

For shipping with capacity c, load each day as full as possible before moving on. Loading less on an early day can never help: it only pushes more weight onto later days. So the greedy pass uses the fewest days possible for c, and comparing that count with D answers the question exactly.

## Walk through an example

Weights `[3, 2, 2, 4, 1, 4]`, D = 3 days. Bounds: lo = 4 (heaviest package), hi = 16 (total).

The check, for capacity c, counts days:

| Guess | Day loads with greedy | Days | ≤ 3? | Update |
|---|---|---|---|---|
| mid = 10 | [3,2,2] [4,1,4] | 2 | yes | hi = 10 |
| mid = 7 | [3,2,2] [4,1] [4] | 3 | yes | hi = 7 |
| mid = 5 | [3,2] [2] [4,1] [4] | 4 | no | lo = 6 |
| mid = 6 | [3,2] [2,4] [1,4] | 3 | yes | hi = 6 |
| lo = hi = 6 | | | | answer 6 |

The smallest capacity is 6. Notice that the check never had to be clever; all the cleverness is in realising you only need to check.

:::try-this
Koko eats bananas from piles `[3, 6, 7, 11]` and has 8 hours. At speed k, a pile of size p takes ⌈p / k⌉ hours. Find the minimum k by checking k = 3 and k = 4 by hand. (At k = 3 she needs 1 + 2 + 3 + 4 = 10 hours, too slow. At k = 4 she needs 1 + 2 + 2 + 3 = 8 hours, which works. The answer is 4.)
:::

### Maximise the minimum: Magnetic Force Between Two Balls

Place 3 balls in baskets at positions [1, 2, 3, 4, 7] so the smallest distance between any two balls is as large as possible. Name the answer: the minimum gap d.

Check: "can 3 balls be placed with every gap at least d?" Greedily put a ball in the first basket and then in every basket at least d past the last ball. If d works, every smaller d works too, so the pattern is yes, yes, yes, then no. Search for the first d that fails and step back one. It is the oven test turned around: instead of the lowest temperature that bakes the cake, you want the highest gap that still fits every ball.

| Guess d | Greedy placement | Balls placed | At least 3? |
|---|---|---|---|
| 4 | 1, 7 | 2 | no, so the answer is below 4 |
| 2 | 1, 3, 7 | 3 | yes |
| 3 | 1, 4, 7 | 3 | yes |

The first failing d is 4, so the answer is 3. The greedy check is safe for the same reason as shipping: placing each ball as early as allowed leaves the most room for the rest.

### Searching over time: Factory Machines

Machines take 2, 3 and 7 seconds per product. How soon can they make 10 products together? In time T, a machine with speed s finishes T / s products, rounded down, so the check is "do the machines finish at least 10 products by time T?". More time never makes fewer products, so it is monotonic, just as a hotter oven never un-bakes a cake that a cooler one baked. The answer lies between 0 and 2 × 10 = 20, the time the fastest machine needs alone.

| lo | hi | Guess T | Products 2s, 3s, 7s machines | Total | At least 10? |
|---|---|---|---|---|---|
| 0 | 20 | 10 | 5, 3, 1 | 9 | no |
| 11 | 20 | 15 | 7, 5, 2 | 14 | yes |
| 11 | 15 | 13 | 6, 4, 1 | 11 | yes |
| 11 | 13 | 12 | 6, 4, 1 | 11 | yes |
| 11 | 12 | 11 | 5, 3, 1 | 9 | no |

The answer is 12 seconds. Here the upper bound matters: with a billion products and slow machines, `fastest × products` can reach 10¹⁸, so the search and the sum must use 64-bit integers, and the sum should stop early once it passes the target to avoid overflow.

### Recognising the pattern

| Problem | Answer searched | check(x) | Direction |
|---|---|---|---|
| Koko Eating Bananas | eating speed | total hours at speed x is at most h | first yes |
| Capacity To Ship Packages | ship capacity | greedy days at capacity x is at most D | first yes |
| Split Array Largest Sum | largest part sum | greedy parts with sum at most x is at most k | first yes |
| Factory Machines | time | products made by time x is at least t | first yes |
| Magnetic Force | minimum gap | greedy placement with gap x fits m balls | last yes |

In every row, the check is a single linear pass, and the hard part of the problem is noticing that checking one guess is easy.

## The code

```pseudo
can_ship(w, days, cap):
    used = 1, load = 0
    for x in w:
        if load + x > cap:
            used += 1
            load = 0
        load += x
    return used <= days

min_capacity(w, days):
    lo = max(w), hi = sum(w)
    while lo < hi:
        mid = lo + (hi - lo) / 2
        if can_ship(w, days, mid): hi = mid
        else: lo = mid + 1
    return lo
```

```cpp
#include <bits/stdc++.h>
using namespace std;

template <class Pred>
long long firstTrue(long long lo, long long hi, Pred pred) {   // [lo, hi), no..no yes..yes
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (pred(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

bool canShip(const vector<int>& w, int days, long long cap) {
    int used = 1;
    long long load = 0;
    for (int x : w) {
        if (load + x > cap) { used++; load = 0; }
        load += x;
    }
    return used <= days;
}

long long minCapacity(const vector<int>& w, int days) {
    long long lo = *max_element(w.begin(), w.end());
    long long hi = accumulate(w.begin(), w.end(), 0LL);
    return firstTrue(lo, hi + 1, [&](long long c) { return canShip(w, days, c); });
}

long long minEatingSpeed(const vector<int>& piles, long long h) {
    long long hi = *max_element(piles.begin(), piles.end());
    return firstTrue(1, hi + 1, [&](long long k) {
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;            // ceil(p / k)
        return hours <= h;
    });
}

long long maxMinGap(vector<int> pos, int balls) {               // maximise the minimum
    sort(pos.begin(), pos.end());
    auto fits = [&](long long d) {
        int placed = 1, last = pos[0];
        for (int x : pos) if (x - last >= d) placed++, last = x;
        return placed >= balls;
    };
    long long span = pos.back() - pos[0];
    return firstTrue(1, span + 2, [&](long long d) { return !fits(d); }) - 1;   // last yes
}

long long factoryTime(const vector<long long>& k, long long target) {
    long long hi = *min_element(k.begin(), k.end()) * target;
    return firstTrue(0, hi + 1, [&](long long T) {
        long long made = 0;
        for (long long s : k) { made += T / s; if (made >= target) return true; }   // stop before overflow
        return false;
    });
}

int main() {
    cout << minCapacity({3, 2, 2, 4, 1, 4}, 3) << '\n';          // 6
    cout << minEatingSpeed({3, 6, 7, 11}, 8) << '\n';            // 4
    cout << maxMinGap({1, 2, 3, 4, 7}, 3) << '\n';               // 3
    cout << factoryTime({2, 3, 7}, 10) << '\n';                  // 12
}
```

## Complexity

- **Time:** O(n log R), where R = hi − lo is the size of the answer space. With weights up to 10⁴ and n up to 5·10⁴, R is at most about 5·10⁸, so roughly 29 guesses of O(n) each.
- **Space:** O(1) beyond the input.

## Common mistakes

:::warning
Common misconception: "binary search on the answer needs the input to be sorted." The input order does not matter at all; the shipping problem must keep its order. What must be monotonic is the **check**: if capacity c works, c + 1 must work too.
:::

- **Bad bounds.** A lower bound below the heaviest item makes the check loop forever or lie; an upper bound that does not surely work can miss the answer.
- **Overflow.** Totals and products like "machines × time" exceed 32 bits quickly. Use `long long` for the answer space.
- **Searching the wrong direction** for "maximise the minimum": there the pattern is `yes yes yes no no`, so search for the last yes, or flip the predicate.
- **A non-greedy check that is too slow**, making the total O(n² log R). The check should be one linear pass.

## Practice problems

*Koko Eating Bananas* and *Capacity To Ship Packages* are the template almost verbatim. *Factory Machines* (CSES) searches over time, with a check that sums how many products each machine finishes. *Split Array Largest Sum* is shipping with a new story. *Magnetic Force Between Two Balls* is "maximise the minimum distance": its check places balls greedily and counts how many fit.

## Key takeaways

- When the best value is hard to compute but any guess is easy to check, binary search over the possible answers.
- The check must be monotonic: if a value works, every larger value works too, giving a no-then-yes pattern.
- Bound the answer between the smallest value that could work and the largest that surely works.
- The check is usually a single greedy pass, so the total cost is O(n log R).
- "Minimise the maximum" and "maximise the minimum" are the classic signals for this pattern.

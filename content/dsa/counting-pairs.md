---
id: "dsa-counting-pairs"
kind: "pattern"
subject: "dsa"
slug: "counting-pairs"
title: "Pairing Dancers by Height"
subtitle: "Counting pairs without checking every pair: sort and squeeze when order does not matter, a Fenwick tree when it does"
track: "dsa-search-sort"
track_order: 10
priority: "P1"
prerequisites: ["dsa-two-pointers", "dsa-binary-search", "dsa-fenwick-tree"]
difficulty: "intermediate"
read_minutes: 12
topics: ["counting", "two pointers", "sorting", "fenwick tree", "pairs"]
complexity: { time: "O(n log n)", space: "O(n)" }
practice_problems:
  - { name: "Count Pairs Whose Sum is Less than Target", platform: "LeetCode", url: "https://leetcode.com/problems/count-pairs-whose-sum-is-less-than-target/", difficulty: "Easy" }
  - { name: "Count the Number of Fair Pairs", platform: "LeetCode", url: "https://leetcode.com/problems/count-the-number-of-fair-pairs/", difficulty: "Medium" }
  - { name: "Count of Smaller Numbers After Self", platform: "LeetCode", url: "https://leetcode.com/problems/count-of-smaller-numbers-after-self/", difficulty: "Hard" }
  - { name: "Reverse Pairs", platform: "LeetCode", url: "https://leetcode.com/problems/reverse-pairs/", difficulty: "Hard" }
glossary:
  - term: "Unordered pair condition"
    definition: "A condition on a pair that does not depend on which index comes first, such as a[i] + a[j] ≤ K. Sorting the array does not change the answer."
  - term: "Index-order condition"
    definition: "A condition that depends on positions, such as i < j and a[i] > a[j]. Sorting destroys the information, so you scan in order instead."
  - term: "Fenwick tree"
    definition: "A binary indexed tree supporting point updates and prefix-count queries in O(log n), used here to count earlier or later values below a threshold."
  - term: "Range by subtraction"
    definition: "Counting pairs with a value in [lo, hi] as count(≤ hi) minus count(≤ lo − 1), reusing one 'at most' routine."
quiz:
  - q: "Sorted array [1, 2, 5, 7, 9], K = 10. With l = 0 and r = 4, a[l] + a[r] = 10 ≤ K. How many pairs does this step count?"
    options: ["1", "3", "4", "5"]
    answer: 2
    explain: "a[0] = 1 pairs with every index from 1 to 4, because all of those values are at most a[4]. That is r − l = 4 pairs."
  - q: "Why can't you sort the array for 'count of smaller numbers after self'?"
    options: ["Sorting is too slow", "The condition depends on index order (j > i), and sorting destroys positions", "Duplicates break sorting", "It needs a hash map"]
    answer: 1
    explain: "Whether a value is 'after' another is about positions. Scan from the right and keep a Fenwick tree of values already seen instead."
  - q: "How do you count pairs with sum in [lo, hi] using a function that counts pairs with sum ≤ X?"
    options: ["Call it once with hi", "count(≤ hi) − count(≤ lo − 1)", "count(≤ hi) + count(≤ lo)", "It cannot be done"]
    answer: 1
    explain: "Pairs with sum ≤ hi include those below lo; subtracting the pairs with sum ≤ lo − 1 leaves exactly the range."
cover_seed: "counting-pairs"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.8
---

## The hook

An online assessment question: "Given 10⁵ integers and a limit K, count the pairs whose sum is at most K." You write two loops. It works on the samples. It times out on the hidden test with n = 10⁵, because that is about 5·10⁹ pairs.

A second question in the same test: "For each element, how many elements to its right are smaller?" Two loops again, same timeout.

Both questions count pairs, and both have an O(n log n) answer. But the tricks are different, and picking the wrong one is the classic way to lose these marks. The deciding question is one you can ask in five seconds. Can you guess it? It is about whether the positions matter.

## The intuition

:::analogy
A dance teacher must count how many pairs of students can dance together if their **heights add up to at most** a limit. She does not try every pair. She **lines the students up by height**, puts the shortest and tallest side by side, and asks: if even the tallest fits with the shortest, then *everyone* fits with the shortest. Count them all at once, send the shortest away, and repeat.
:::

That is the first trick. It works because the condition "heights add to at most K" does not care who stood where originally. It is an **[[unordered pair condition]]**, so sorting loses nothing.

The second question is different. "Smaller elements **to the right**" is an **[[index-order condition]]**: it depends on positions. Sort the array and the answer is gone. For those, you walk through the array in order and keep a running tally of values seen so far in a [[Fenwick tree]], as in [A Pyramid of Savings Jars](article:dsa-fenwick-tree).

So the five-second question is: **does the condition mention i < j, or only the values?**

## How it works

### Order does not matter: sort and squeeze

Sort the array. Put l at the start and r at the end.

- If a[l] + a[r] ≤ K, then a[l] pairs with **every** index from l + 1 to r, because all of those values are ≤ a[r]. Add r − l, then move l right.
- Otherwise a[r] is too big to pair with even the smallest remaining value, so it pairs with nothing: move r left.

Each step moves one pointer, so the scan is O(n) after an O(n log n) sort. This is the squeeze from [Two Fingers on a Sorted List](article:dsa-two-pointers), turned from "find a pair" into "count pairs".

**Exact sums and ranges.** For pairs with sum in [lo, hi], do not write a new loop. Use **[[range by subtraction]]**: count(≤ hi) − count(≤ lo − 1). Pairs with sum exactly K are count(≤ K) − count(≤ K − 1), or a hash map of counts.

**Differences.** For |a[i] − a[j]| ≤ d, sort and slide a window: for each right end r, move l until a[r] − a[l] ≤ d, then add r − l.

### Order matters: scan with a Fenwick tree

For "how many later elements are smaller than a[i]":

1. Compress values to ranks 0, 1, 2, … (coordinate compression), so they can index the tree.
2. Scan from the right. For each i, ask the tree how many ranks below rank(a[i]) have been seen: those are exactly the smaller elements to the right.
3. Add rank(a[i]) to the tree.

Wait, why scan from the right? Because the tree must contain exactly the elements after i at the moment you query i. Scanning right to left, those are precisely the ones already inserted.

The same skeleton counts inversions (pairs i < j with a[i] > a[j]), "Reverse Pairs" (a[i] > 2·a[j]) and many OA variants. Only the query threshold changes. Merge sort is the other classic tool for these, as in [Merging Two Piles of Exam Papers](article:dsa-merge-sort-inversions).

:::insight
Before counting pairs, ask whether the condition depends on positions. If it does not, sort and count in bulk with two pointers. If it does, scan in index order and let a Fenwick tree count the values already seen. Either way, you count many pairs per step instead of one.
:::

## Walk through an example

**Pairs with sum at most 10** in [7, 2, 5, 1, 9]. Sorted: [1, 2, 5, 7, 9].

| l | r | a[l] | a[r] | Sum | Decision | Added | Total |
|---|---|---|---|---|---|---|---|
| 0 | 4 | 1 | 9 | 10 | ≤ 10: a[0] pairs with indices 1 to 4 | 4 | 4 |
| 1 | 4 | 2 | 9 | 11 | too big: drop 9 | 0 | 4 |
| 1 | 3 | 2 | 7 | 9 | ≤ 10: a[1] pairs with indices 2, 3 | 2 | 6 |
| 2 | 3 | 5 | 7 | 12 | too big: drop 7 | 0 | 6 |

l meets r, so the answer is **6**: (1,2), (1,5), (1,7), (1,9), (2,5), (2,7). With [lo, hi] = [6, 10], subtraction gives count(≤ 10) − count(≤ 5) = 6 − 1 = **5** (only 1 + 2 = 3 is too small).

**Smaller numbers after self** in [5, 2, 6, 1]. Ranks: 1 → 0, 2 → 1, 5 → 2, 6 → 3.

| i (right to left) | a[i] | Rank | Ranks already in tree | Smaller to the right | Insert |
|---|---|---|---|---|---|
| 3 | 1 | 0 | none | 0 | 0 |
| 2 | 6 | 3 | {0} | 1 | 3 |
| 1 | 2 | 1 | {0, 3} | 1 | 1 |
| 0 | 5 | 2 | {0, 1, 3} | 2 | 2 |

Answer: [2, 1, 1, 0].

:::try-this
Count pairs i < j in [4, 1, 3, 2] with a[i] > a[j] (inversions) by scanning from the left and asking how many earlier values are larger. (Index 0: none before, 0. Index 1, value 1: earlier {4}, 1 larger. Index 2, value 3: earlier {4, 1}, 1 larger. Index 3, value 2: earlier {4, 1, 3}, 2 larger. Total 4.)
:::

## The code

```pseudo
pairs_at_most(a, K):                 // order does not matter
    sort a
    l = 0; r = n - 1; count = 0
    while l < r:
        if a[l] + a[r] <= K:
            count += r - l           // a[l] fits with everything in (l, r]
            l += 1
        else:
            r -= 1                   // a[r] fits with nothing left
    return count

smaller_after_self(a):               // order matters
    compress values to ranks
    tree = empty Fenwick tree over ranks
    for i from n - 1 down to 0:
        answer[i] = tree.count(ranks below rank(a[i]))
        tree.add(rank(a[i]))
    return answer
```

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// Pairs i < j with a[i] + a[j] <= k: sort, then squeeze from both ends.
ll pairsAtMost(vector<ll> a, ll k) {
    sort(a.begin(), a.end());
    ll count = 0;
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        if (a[l] + a[r] <= k) { count += r - l; l++; }   // a[l] pairs with every index in (l, r]
        else r--;
    }
    return count;
}

// Pairs with sum in [lo, hi] = (sum <= hi) - (sum <= lo - 1).
ll pairsInRange(const vector<ll>& a, ll lo, ll hi) {
    return pairsAtMost(a, hi) - pairsAtMost(a, lo - 1);
}

struct Fenwick {
    vector<int> t;
    explicit Fenwick(int n) : t(n + 1, 0) {}
    void add(int i) { for (i++; i < (int)t.size(); i += i & -i) t[i]++; }
    int prefix(int i) { int s = 0; for (i++; i > 0; i -= i & -i) s += t[i]; return s; }   // count of indices <= i
};

// For each i, how many later elements are smaller (order of indices matters, so no sorting the array).
vector<int> smallerAfterSelf(const vector<ll>& a) {
    vector<ll> vals(a.begin(), a.end());
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    Fenwick bit(vals.size());
    vector<int> res(a.size());
    for (int i = (int)a.size() - 1; i >= 0; i--) {
        int rank = lower_bound(vals.begin(), vals.end(), a[i]) - vals.begin();
        res[i] = rank > 0 ? bit.prefix(rank - 1) : 0;   // strictly smaller values seen to the right
        bit.add(rank);
    }
    return res;
}

// Reverse pairs: i < j and a[i] > 2 * a[j]. Scan left to right, count earlier values above 2 * a[j].
ll reversePairs(const vector<ll>& a) {
    vector<ll> vals(a.begin(), a.end());
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    Fenwick bit(vals.size());
    ll count = 0;
    for (size_t j = 0; j < a.size(); j++) {
        int upto = upper_bound(vals.begin(), vals.end(), 2 * a[j]) - vals.begin();   // values <= 2a[j]
        count += (ll)j - (upto > 0 ? bit.prefix(upto - 1) : 0);
        bit.add(lower_bound(vals.begin(), vals.end(), a[j]) - vals.begin());
    }
    return count;
}

int main() {
    vector<ll> a = {7, 2, 5, 1, 9};
    cout << pairsAtMost(a, 10) << "\n";          // 6
    cout << pairsInRange(a, 6, 10) << "\n";      // 5
    for (int x : smallerAfterSelf({5, 2, 6, 1})) cout << x << " ";   // 2 1 1 0
    cout << "\n" << reversePairs({1, 3, 2, 3, 1}) << "\n";          // 2
}
```

## Complexity

- Sort and squeeze: O(n log n) for the sort, O(n) for the scan, O(1) extra space beyond the sorted copy.
- Fenwick counting: O(n log n) for compression, O(log n) per query and update, so **O(n log n) time and O(n) space**.
- Both replace the O(n²) double loop, which is the difference between about 3.4·10⁶ and 5·10⁹ steps at n = 10⁵.

## Common mistakes

:::warning
Common misconception: "sorting first is always safe for pair counting." It is safe only when the condition ignores positions. "Pairs i < j with a[i] > a[j]" or "elements after self" become meaningless after sorting. Check whether i < j appears in the condition before you sort.
:::

- **Double counting**: counting (i, j) and (j, i) separately, or counting (i, i). The squeeze counts each unordered pair once by construction.
- **Overflow**: the number of pairs can reach about n²/2 = 5·10⁹ for n = 10⁵, beyond 32-bit int. Use 64-bit counters. Also 2·a[j] can overflow for values near 2³¹.
- **Off-by-one in thresholds**: "less than K" is count(≤ K − 1); "strictly smaller" needs the prefix below the rank, not including it.
- **Forgetting duplicates** in compression: equal values must share one rank, or "strictly smaller" counts them.
- **Ranges by a second loop**: use subtraction of two "at most" counts; it is shorter and less buggy.

### Interview follow-ups

**"Count pairs with sum exactly K."** Either count(≤ K) − count(≤ K − 1) with the squeeze, or one pass with a hash map of how many times each value appeared so far: for each x, add freq[K − x], then increment freq[x].

**"Count pairs with a[i] − a[j] = i − j."** Rewrite as a[i] − i = a[j] − j, so you are counting equal values of b[i] = a[i] − i, a hash-map count. Rewriting the condition so each side depends on one index is a common OA trick.

**"Now values are up to 10⁹ and n is 10⁵ for the Fenwick version."** Compress values to ranks first, as in [Renaming Huge Numbers as 1, 2, 3](article:cp-coordinate-compression); the tree size becomes n, not 10⁹.

## Practice problems

Start with **Count Pairs Whose Sum is Less than Target** (squeeze), then **Count the Number of Fair Pairs** (range by subtraction). Move to **Count of Smaller Numbers After Self** for the Fenwick scan, and finish with **Reverse Pairs**, where the threshold is 2·a[j].

## Key takeaways

- Decide first whether the pair condition depends on index order; that single question chooses the technique.
- When order does not matter, sort and squeeze with two pointers, adding r − l pairs at once whenever a[l] + a[r] fits.
- Count ranges of sums as count(≤ hi) minus count(≤ lo − 1) instead of writing a new loop.
- When order matters, scan in index order and use a Fenwick tree over compressed values to count earlier or later elements below a threshold in O(log n).
- Use 64-bit counters, because the number of pairs grows like n²/2.

---
id: "dsa-binary-search"
kind: "pattern"
subject: "dsa"
slug: "binary-search"
title: "Binary Search Without the Off-by-One Fear"
subtitle: "One invariant, one template, and the lower_bound way of thinking that ends boundary bugs"
track: "dsa-search-sort"
track_order: 1
priority: "P0"
prerequisites: ["dsa-big-o"]
difficulty: "beginner"
read_minutes: 8
topics: ["binary search", "searching", "invariants"]
complexity: { time: "O(log n)", space: "O(1)" }
practice_problems:
  - { name: "Binary Search", platform: "LeetCode", url: "https://leetcode.com/problems/binary-search/", difficulty: "Easy" }
  - { name: "Search Insert Position", platform: "LeetCode", url: "https://leetcode.com/problems/search-insert-position/", difficulty: "Easy" }
  - { name: "First Bad Version", platform: "LeetCode", url: "https://leetcode.com/problems/first-bad-version/", difficulty: "Easy" }
  - { name: "Find First and Last Position of Element in Sorted Array", platform: "LeetCode", url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", difficulty: "Medium" }
  - { name: "Search a 2D Matrix", platform: "LeetCode", url: "https://leetcode.com/problems/search-a-2d-matrix/", difficulty: "Medium" }
  - { name: "Sqrt(x)", platform: "LeetCode", url: "https://leetcode.com/problems/sqrtx/", difficulty: "Easy" }
glossary:
  - term: "Predicate"
    definition: "A yes-or-no question about an index, like 'is a[i] at least x?'. Binary search needs it to be no for a while, then yes for the rest."
  - term: "Monotonic"
    definition: "Changing in only one direction. A monotonic predicate switches from no to yes once and never back."
  - term: "Search space"
    definition: "The range of indices that could still contain the answer, shrinking by half each step."
  - term: "Lower bound"
    definition: "The first position whose value is at least x, which is also where x would be inserted to keep the array sorted."
  - term: "Half-open interval"
    definition: "A range written [lo, hi) that includes lo but not hi. It makes the length simply hi minus lo."
quiz:
  - q: "In the template lo = 0, hi = n, while lo < hi, what is the meaning of hi?"
    options: ["The last index that might be the answer", "One past the last candidate, so the answer lies in [lo, hi)", "Always n - 1", "The middle element"]
    answer: 1
    explain: "With a half-open range, hi itself is never checked. When lo meets hi, that position is the first yes, or n if there is none."
  - q: "Why is mid computed as lo + (hi - lo) / 2 instead of (lo + hi) / 2?"
    options: ["It is faster", "It avoids integer overflow when lo and hi are large", "It rounds up", "It is required by the compiler"]
    answer: 1
    explain: "lo + hi can exceed the largest int for big ranges. lo + (hi - lo) / 2 never does."
  - q: "On [1, 3, 3, 3, 7], what are lower_bound(3) and upper_bound(3)?"
    options: ["1 and 3", "1 and 4", "0 and 4", "2 and 3"]
    answer: 1
    explain: "lower_bound is the first index with value at least 3, which is 1. upper_bound is the first index with value greater than 3, which is 4. Their difference, 3, counts the 3s."
cover_seed: "binary-search"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.94
---

## The hook

Donald Knuth noted that although the first binary search was published in 1946, the first version that worked correctly for every input took many more years to appear. Decades later, a bug was found in the binary search inside Java's standard library: computing `(low + high) / 2` overflowed on very large arrays.

If experts trip over it, the problem is not the idea. The idea is simple. The problem is boundaries: `<` or `<=`, `mid` or `mid + 1`. This article gives you one invariant that makes those choices obvious.

## The intuition

:::analogy
Think of the number-guessing game. A friend picks a number from 1 to 100, and after each guess says "higher" or "lower". You guess 50, then 75 or 25, always the middle of what is left. Seven guesses are enough for any number up to 128. Each answer throws away half of the possibilities.
:::

Binary search is that game on a sorted array. But the most useful way to think about it is not "find x". It is: **find the first position where a yes-or-no question turns true.**

That question is the [[predicate]]. For "first index with `a[i] >= x`" on a sorted array, the answers look like `no no no no yes yes yes`. A predicate that flips from no to yes exactly once is [[monotonic]], and any monotonic predicate can be binary searched.

## How it works

Keep a [[search space]] as a [[half-open interval]] `[lo, hi)` with this invariant:

- everything before `lo` is **no**,
- everything at or after `hi` is **yes**,
- the boundary between them lies somewhere in `[lo, hi]`.

Each step, check the middle:

- if `mid` is **yes**, the first yes is at `mid` or before: set `hi = mid`.
- if `mid` is **no**, the first yes is after `mid`: set `lo = mid + 1`.

When `lo == hi`, the range is empty and `lo` is the first yes (or `n`, meaning there is none).

```mermaid
flowchart TD
  A[lo = 0, hi = n] --> B{lo less than hi}
  B -- no --> F[Answer is lo]
  B -- yes --> C[mid = lo + half the gap]
  C --> D{Predicate true at mid}
  D -- yes --> E[hi = mid]
  D -- no --> G[lo = mid + 1]
  E --> B
  G --> B
```

:::insight
Stop asking "where is x?" and start asking "where does the answer flip from no to yes?". With one template for "first yes", every variant becomes a choice of predicate, not a new set of boundary rules.
:::

### The two predicates you will use most

- **[[Lower bound]]**: first `i` with `a[i] >= x`. If `a[lo] == x` there, x exists; otherwise not.
- **Upper bound**: first `i` with `a[i] > x`. The count of x is `upper − lower`, and the last occurrence is `upper − 1`.

C++ gives you both as `lower_bound` and `upper_bound`, but writing the template yourself is what lets you binary search on things that are not arrays at all.

### Every common question is a choice of predicate

"Last" questions do not need a second template. The last position where something is true is one before the first position where it becomes false, so flip the predicate and subtract one.

| Question on a sorted array | Predicate for first_true | Answer |
|---|---|---|
| first index with a[i] ≥ x | a[i] ≥ x | the result |
| first index with a[i] > x | a[i] > x | the result |
| last index with a[i] ≤ x (floor) | a[i] > x | result − 1, or none if 0 |
| last index with a[i] < x | a[i] ≥ x | result − 1 |
| how many values lie in [l, r] | a[i] > r, and a[i] ≥ l | difference of the two results |
| does x exist? | a[i] ≥ x | result < n and a[result] == x |
| value closest to x | a[i] ≥ x | compare a[result] and a[result − 1] |

### Searching over numbers, not indices

The search space does not have to be array positions. For the integer square root of x, the predicate "m · m > x" is false for small m and true for large m, so the answer is first_true over m in [0, x + 1), minus one. For x = 10:

| lo | hi | mid | mid² | mid² > 10? |
|---|---|---|---|---|
| 0 | 11 | 5 | 25 | yes, hi = 5 |
| 0 | 5 | 2 | 4 | no, lo = 3 |
| 3 | 5 | 4 | 16 | yes, hi = 4 |
| 3 | 4 | 3 | 9 | no, lo = 4 |

The first m with m² > 10 is 4, so the integer square root is 3. Compute `mid * mid` in 64-bit, or compare `mid > x / mid`, because the square overflows for large x.

### Real numbers

On real numbers there is no "mid + 1", so run a fixed number of halvings instead of looping until lo meets hi. Each halving gains one bit of precision; 60 iterations on a range of width 2 narrow it below 10⁻¹⁷. Searching for the x with x² = 2 in [0, 2] this way gives 1.414214 to six decimals. A loop like `while (hi - lo > 1e-9)` also works but can spin forever if the precision asked for is finer than floating point can represent.

### A matrix as one long array

*Search a 2D Matrix* has rows that are sorted and each row starting after the previous one ends, so the whole matrix is one sorted sequence in [row-major order](article:dsa-matrix-traversal). Search k over [0, m · n) and read cell (k / n, k % n). Nothing else changes.

## Walk through an example

Find the first index with value at least 7 in `a = [2, 4, 7, 7, 9, 12]` (n = 6).

| Step | lo | hi | mid | a[mid] | a[mid] ≥ 7? | Update |
|---|---|---|---|---|---|---|
| 1 | 0 | 6 | 3 | 7 | yes | hi = 3 |
| 2 | 0 | 3 | 1 | 4 | no | lo = 2 |
| 3 | 2 | 3 | 2 | 7 | yes | hi = 2 |
| 4 | 2 | 2 | — | — | stop | answer 2 |

The first 7 is at index 2. Note that step 1 found a 7 at index 3 but kept going, because the question was "first", and the invariant does not stop at any yes; it stops when the range is empty.

:::try-this
Use the same template to find the first index with `a[i] > 7` in the same array. Write the table. (You should end at index 4, the 9. So there are 4 − 2 = 2 sevens.)
:::

## The code

```pseudo
first_true(lo, hi, pred):        // search [lo, hi); pred is no...no yes...yes
    while lo < hi:
        mid = lo + (hi - lo) / 2
        if pred(mid): hi = mid
        else: lo = mid + 1
    return lo                     // hi if every answer is no

lower_bound(a, x) = first_true(0, n, i -> a[i] >= x)
upper_bound(a, x) = first_true(0, n, i -> a[i] > x)
```

```cpp
#include <bits/stdc++.h>
using namespace std;

template <class Pred>
long long firstTrue(long long lo, long long hi, Pred pred) {  // [lo, hi)
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (pred(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

long long intSqrt(long long x) {                        // largest m with m * m <= x
    return firstTrue(0, x + 1, [&](long long m) { return m > 0 && m > x / m; }) - 1;
}

double realSqrt(double x) {                             // fixed iterations on reals
    double lo = 0, hi = max(1.0, x);
    for (int it = 0; it < 60; it++) {
        double mid = (lo + hi) / 2;
        if (mid * mid >= x) hi = mid;
        else lo = mid;
    }
    return hi;
}

bool searchMatrix(const vector<vector<int>>& g, int target) {   // rows continue each other
    int m = g.size(), n = g[0].size();
    long long k = firstTrue(0, (long long)m * n, [&](long long k) { return g[k / n][k % n] >= target; });
    return k < (long long)m * n && g[k / n][k % n] == target;
}

int main() {
    vector<int> a = {2, 4, 7, 7, 9, 12};
    int n = a.size();
    long long lo = firstTrue(0, n, [&](long long i) { return a[i] >= 7; });
    long long hi = firstTrue(0, n, [&](long long i) { return a[i] > 7; });
    cout << lo << ' ' << hi << ' ' << hi - lo << '\n';                       // 2 4 2
    long long floor8 = firstTrue(0, n, [&](long long i) { return a[i] > 8; }) - 1;
    cout << floor8 << ' ' << a[floor8] << '\n';                             // 3 7
    cout << lower_bound(a.begin(), a.end(), 7) - a.begin() << '\n';         // 2
    cout << intSqrt(10) << ' ' << intSqrt(16) << ' ' << intSqrt(2147395600) << '\n';   // 3 4 46340
    printf("%.6f\n", realSqrt(2));                                         // 1.414214
    cout << searchMatrix({{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}}, 16) << '\n';  // 1
}
```

## Complexity

- **Time:** O(log n). The range halves every step, so about log₂ n steps: 20 for a million elements, 30 for a billion. Searching over a numeric range of size R takes O(log R) checks, and on reals the number of iterations sets the precision.
- **Space:** O(1).

## Common mistakes

:::warning
Common misconception: "binary search needs a sorted array." It needs a monotonic predicate. A sorted array gives you one, but so does "can we ship all packages in D days with capacity c?", which is false for small c and true for large c. That is binary search on the answer, the next article in this track.
:::

- **Mixing conventions.** Using `hi = n - 1` with `while (lo < hi)` and `hi = mid` silently skips the last element. Pick the half-open template and never mix.
- **Infinite loops.** Writing `lo = mid` instead of `lo = mid + 1` can get stuck when `hi = lo + 1`.
- **Overflow** in `(lo + hi) / 2` when indices or answer ranges are large; use `lo + (hi - lo) / 2`.
- **Forgetting "not found".** When the result is `n`, or `a[result] != x`, the value is absent.
- **Overflow in the predicate,** such as `mid * mid` for square roots near the 32-bit limit; use 64-bit or divide instead.
- **Looping on a tolerance with doubles** that floating point cannot reach; use a fixed number of iterations.
- **Non-monotonic predicates**, such as searching an unsorted array, give wrong answers silently, with no crash to warn you.

## Practice problems

*Binary Search* and *Search Insert Position* are lower bound directly. *First Bad Version* is "first true" with the predicate given to you as a function. *Find First and Last Position* is lower and upper bound together. *Search a 2D Matrix* is the same template over a matrix flattened into one index range, and *Sqrt(x)* searches over numbers instead of indices. For each one, write the predicate in words before touching code.

## Key takeaways

- Binary search finds the first position where a monotonic yes-or-no predicate becomes true, halving the search space each step.
- Use one half-open template, `[lo, hi)` with `while lo < hi`, `hi = mid` on yes and `lo = mid + 1` on no, so boundaries are never in doubt.
- Lower bound is the first value at least x and upper bound is the first value greater than x; their difference counts x.
- Compute the middle as `lo + (hi - lo) / 2` to avoid overflow.
- Binary search needs monotonicity, not necessarily a sorted array, which opens the door to searching over answers.

---
id: "dsa-subarray-sum-k"
kind: "problem-walkthrough"
subject: "dsa"
slug: "subarray-sum-k"
title: "Counting Subarrays That Add Up to K"
subtitle: "Prefix sums meet a hash map: the walkthrough that handles negatives where sliding windows fail"
track: "dsa-arrays"
track_order: 14
priority: "P0"
prerequisites: ["dsa-prefix-sums", "dsa-hashing-patterns"]
difficulty: "intermediate"
read_minutes: 9
topics: ["prefix sums", "hashing", "subarrays", "counting"]
complexity: { time: "O(n) average", space: "O(n)" }
practice_problems:
  - { name: "Subarray Sum Equals K", platform: "LeetCode", url: "https://leetcode.com/problems/subarray-sum-equals-k/", difficulty: "Medium" }
  - { name: "Continuous Subarray Sum", platform: "LeetCode", url: "https://leetcode.com/problems/continuous-subarray-sum/", difficulty: "Medium" }
  - { name: "Subarray Sums II", platform: "CSES", url: "https://cses.fi/problemset/task/1661", difficulty: "Medium" }
  - { name: "Subarray Divisibility", platform: "CSES", url: "https://cses.fi/problemset/task/1662", difficulty: "Medium" }
  - { name: "Contiguous Array", platform: "LeetCode", url: "https://leetcode.com/problems/contiguous-array/", difficulty: "Medium" }
glossary:
  - term: "Subarray"
    definition: "A contiguous, non-empty slice of an array."
  - term: "Prefix sum"
    definition: "The total of all elements from the start of the array up to a position."
  - term: "Frequency map"
    definition: "A hash map from a value to how many times it has been seen so far."
  - term: "Complement"
    definition: "Here, the earlier prefix sum you need, P minus k, so that the subarray between them sums to k."
quiz:
  - q: "If P[j] is the prefix sum through j and P[i] is the prefix sum before i, what is the sum of elements i through j?"
    options: ["P[j] + P[i]", "P[j] − P[i]", "P[i] − P[j]", "P[j] × P[i]"]
    answer: 1
    explain: "The difference of two running totals is the total of the stretch between them."
  - q: "Why must the map start with {0: 1}?"
    options: ["To avoid an empty map", "It represents the empty prefix before the array, so subarrays starting at index 0 are counted", "Because k is never 0", "It speeds up hashing"]
    answer: 1
    explain: "A subarray from index 0 to j sums to k when P[j] − 0 = k. The empty prefix with sum 0 must already be in the map for that to be found."
  - q: "Why does a sliding window fail here when negatives are allowed?"
    options: ["Windows cannot hold negatives", "With negatives, growing a window can lower its sum and shrinking can raise it, so there is no rule for which end to move", "Windows are always O(n squared)", "It does not fail"]
    answer: 1
    explain: "Sliding windows rely on sums changing in one direction as the window grows. Negative numbers break that monotonicity."
cover_seed: "subarray-sum-k"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

"Count the subarrays whose sum equals k." With only positive numbers, a sliding window solves it in one pass. Add a single negative number, and the window falls apart: growing it might shrink the sum, so you no longer know which end to move.

The fix combines two tools you already have, prefix sums and a hash map, into a one-pass algorithm that does not care about signs. It is a favourite interview question precisely because it tests whether you can combine patterns.

## The problem

Given an integer array `nums`, which may contain negative numbers and zeros, and an integer `k`, return the number of non-empty contiguous [[subarray|subarrays]] whose elements sum to exactly k.

Example: `nums = [1, 2, 3]`, `k = 3`. The subarrays [1, 2] and [3] both sum to 3, so the answer is 2.

## The obvious approach

Try every start i and extend the end j, keeping a running sum: O(n²) subarrays, each updated in O(1). Correct, but about 5 × 10⁹ steps for n = 10⁵.

The sliding window from [The Caterpillar That Reads Arrays in One Pass](article:dsa-sliding-window) would be O(n), but it needs sums to grow when the window grows. With negatives, that is false.

## The key insight

:::analogy
Think of a car's odometer. To check whether some stretch of your trip covered exactly 30 km, you do not re-drive any part. At each moment, you look at the current reading, say 112, and ask your notebook: "did the odometer ever read 82?" Every time it did, the stretch from then to now was exactly 30 km. The notebook records every reading you have passed, and how many times.
:::

With a [[prefix sum]] P, the sum of a subarray ending at j and starting after position i is P[j] − P[i]. We want that to equal k, so we need earlier prefix sums equal to P[j] − k, the [[complement]].

Walk left to right, keeping a [[frequency map]] of every prefix sum seen so far. At each j, add `count[P[j] − k]` to the answer, then record P[j]. Negative numbers just make the odometer go backwards sometimes; the notebook does not care.

:::insight
Turn "find a subarray with property X" into "find an earlier prefix that pairs with the current one". Then a hash map of earlier prefixes answers each step in O(1), whatever the signs of the numbers.
:::

```mermaid
flowchart TD
  A[count = map with 0 seen once, running = 0] --> B[Read next number, add to running]
  B --> C[answer += count of running minus k]
  C --> D[Record running in the map]
  D --> E{More numbers}
  E -- yes --> B
  E -- no --> F[Return answer]
```

## Walk through an example

`nums = [1, −1, 2, 1, −2, 1]`, k = 2. The map starts as {0: 1}.

| j | value | running P | P − k | count[P − k] | answer | map after |
|---|---|---|---|---|---|---|
| 0 | 1 | 1 | −1 | 0 | 0 | {0:1, 1:1} |
| 1 | −1 | 0 | −2 | 0 | 0 | {0:2, 1:1} |
| 2 | 2 | 2 | 0 | 2 | 2 | {0:2, 1:1, 2:1} |
| 3 | 1 | 3 | 1 | 1 | 3 | {..., 3:1} |
| 4 | −2 | 1 | −1 | 0 | 3 | {..., 1:2} |
| 5 | 1 | 2 | 0 | 2 | 5 | {..., 2:2} |

Answer: 5. For example at j = 2, the two earlier prefixes equal to 0 give subarrays [1, −1, 2] and [2].

:::try-this
Using the table, list the subarrays found at j = 3 and j = 5. (j = 3 pairs with the prefix 1 at j = 0, giving [−1, 2, 1]. j = 5 pairs with the two prefixes equal to 0, at the start and at j = 1, giving [1, −1, 2, 1, −2, 1] and [2, 1, −2, 1].)
:::

### Why order of operations matters

At each step, look up first and record second. Looking up `running − k` before adding `running` to the map ensures that every pair uses an earlier prefix and a later one, which corresponds to a real, non-empty subarray. If you recorded first, then with k = 0 every position would match itself and count an empty subarray. In odometer terms: you only compare the current reading with readings you passed earlier, never with the one you are reading right now.

## The code

```pseudo
count_subarrays(nums, k):
    count = map with {0: 1}
    running = 0, answer = 0
    for x in nums:
        running += x
        answer += count.get(running - k, 0)
        count[running] += 1
    return answer
```

```cpp
#include <bits/stdc++.h>
using namespace std;

long long subarraySum(const vector<int>& nums, long long k) {
    unordered_map<long long, long long> cnt;
    cnt[0] = 1;
    long long running = 0, answer = 0;
    for (int x : nums) {
        running += x;
        auto it = cnt.find(running - k);
        if (it != cnt.end()) answer += it->second;
        cnt[running]++;
    }
    return answer;
}

int main() {
    cout << subarraySum({1, 2, 3}, 3) << '\n';             // 2
    cout << subarraySum({1, -1, 2, 1, -2, 1}, 2) << '\n';  // 5
}
```

## Complexity

- **Time:** O(n) on average, one hash lookup and one update per element.
- **Space:** O(n) for the map of prefix sums.

## Common mistakes

:::warning
Common misconception: "reach for a sliding window whenever you see 'subarray sum'." Windows need all-positive (or otherwise monotonic) values. With negatives or zeros and an exact target, use prefix sums with a hash map.
:::

- **Forgetting `{0: 1}`**, which misses every subarray starting at index 0.
- **Recording the prefix before looking it up**, which can count an empty subarray when k = 0.
- **Overflow** in running sums of large values; use long long.
- **Using `cnt[running - k]`** to read in C++, which inserts zero entries; use `find` instead.

## Practice problems

*Subarray Sum Equals K* and *Subarray Sums II* (CSES) are this walkthrough. *Subarray Divisibility* and *Continuous Subarray Sum* change the key to the prefix sum modulo k: two prefixes with equal remainders bound a stretch divisible by k. *Contiguous Array* turns 0s into −1s, then looks for subarrays summing to 0.

## Key takeaways

- The sum of a subarray is the difference of two prefix sums, so a target sum k means finding an earlier prefix equal to the current prefix minus k.
- A hash map counting earlier prefix sums answers that in O(1) per step, giving an O(n) algorithm.
- Seed the map with prefix 0 seen once so subarrays starting at index 0 are counted.
- Unlike a sliding window, this works with negative numbers and zeros.
- Changing the map's key, for example to the prefix sum modulo k, solves divisibility and balance variants.

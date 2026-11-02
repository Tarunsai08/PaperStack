---
id: "dsa-sorting-as-tool"
kind: "pattern"
subject: "dsa"
slug: "sorting-as-tool"
title: "Sort First, Ask Questions Later"
subtitle: "Sorting as a problem-solving tool: custom comparators, sorting indices, and why order reveals structure"
track: "dsa-search-sort"
track_order: 3
priority: "P0"
prerequisites: ["dsa-cpp-stl-toolkit"]
difficulty: "beginner"
read_minutes: 8
topics: ["sorting", "comparators", "greedy", "arrays"]
complexity: { time: "O(n log n) for the sort, then usually O(n)", space: "O(n) or O(log n) depending on the sort" }
practice_problems:
  - { name: "Largest Number", platform: "LeetCode", url: "https://leetcode.com/problems/largest-number/", difficulty: "Medium" }
  - { name: "Merge Intervals", platform: "LeetCode", url: "https://leetcode.com/problems/merge-intervals/", difficulty: "Medium" }
  - { name: "Car Fleet", platform: "LeetCode", url: "https://leetcode.com/problems/car-fleet/", difficulty: "Medium" }
  - { name: "Distinct Numbers", platform: "CSES", url: "https://cses.fi/problemset/task/1621", difficulty: "Easy" }
  - { name: "Minimum Absolute Difference", platform: "LeetCode", url: "https://leetcode.com/problems/minimum-absolute-difference/", difficulty: "Easy" }
glossary:
  - term: "Comparator"
    definition: "A function that decides whether one element should come before another during sorting."
  - term: "Strict weak ordering"
    definition: "The rules a comparator must follow: never say an element comes before itself, and stay consistent, so equal elements compare false both ways."
  - term: "Stable sort"
    definition: "A sort that keeps equal elements in their original relative order."
  - term: "Sort key"
    definition: "The value that decides an element's position, such as the end time of an interval or the length of a word."
  - term: "Index sort"
    definition: "Sorting a list of positions by the values at those positions, so you keep track of where each element originally was."
quiz:
  - q: "After sorting an array, where must the closest pair of values be?"
    options: ["At the two ends", "Next to each other", "Anywhere", "In the middle"]
    answer: 1
    explain: "In sorted order, any value between two others is closer to both. So the minimum difference is always between neighbours, and one pass finds it."
  - q: "Which comparator breaks std::sort?"
    options: ["return a < b;", "return a.second < b.second;", "return a <= b;", "return a > b;"]
    answer: 2
    explain: "a <= b returns true for equal elements, which violates strict weak ordering and can cause wrong results or crashes."
  - q: "You must sort values but return answers by original position. What do you sort?"
    options: ["Nothing; it is impossible", "Indices (or pairs of value and index) by value", "The answers", "A copy, then search each value"]
    answer: 1
    explain: "Sorting indices by value gives sorted order while remembering where each value came from."
cover_seed: "sorting-as-tool"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

"Find the two numbers in this list that are closest together." The brute force compares every pair: about n²/2 comparisons. Now sort the list first. The closest pair is suddenly sitting side by side, and one pass finds it.

You rarely need to write a sorting algorithm in an interview. What you need is the reflex to ask: would this problem become easy if the data were in order? Surprisingly often, the answer is yes.

## The intuition

:::analogy
Think of a sports teacher picking teams from a scattered crowd of students. Comparing everyone with everyone is chaos. But ask them to line up by height first, and suddenly every question is easy: the tallest are at one end, similar heights stand side by side, and anyone looking for "the next tallest" just looks one place along the line.
:::

Sorting costs O(n log n) once. In exchange, it creates structure: neighbours are similar, ranges are contiguous, and the smallest and largest sit at known places. Many O(n²) "compare everything" ideas collapse into O(n) scans over that line.

## How it works

The pattern has three steps:

1. **Choose the [[sort key]]**: what order makes the problem simple? Value, end time, length, ratio?
2. **Sort**, with a [[comparator]] if the key is not the natural order.
3. **Scan** the sorted data once, often with a running variable, two pointers or a greedy choice.

```mermaid
flowchart TD
  A[Problem compares many pairs] --> B{Would order make it local}
  B -- yes --> C[Pick the sort key]
  C --> D[Sort, keeping indices if needed]
  D --> E[One scan over neighbours or with two pointers]
  B -- no --> F[Try hashing or another pattern]
```

### What order gives you

- **Neighbours are closest.** Minimum difference, merging duplicates, grouping equal values.
- **Ranges become contiguous.** Counting values in [a, b] becomes two binary searches.
- **Greedy choices become safe.** Interval scheduling sorts by end time; task problems often sort by deadline or ratio.
- **Two pointers become possible.** Pair sums need sorted input, as in [Two Fingers on a Sorted List](article:dsa-two-pointers).

### Comparators that do not lie

A comparator returns true when the first argument must come first. It must be a [[strict weak ordering]]: in particular, it must return false when the two elements are equal. `return a < b;` is fine; `return a <= b;` is a bug that can crash `std::sort`.

When equal keys must keep their original order, use a [[stable sort]] (`stable_sort` in C++).

:::insight
Before reaching for nested loops, ask what order would make the answer local. If the answer only depends on neighbours, or on a prefix of the sorted data, one sort plus one scan replaces the quadratic search.
:::

## Walk through an example

**Largest Number**: arrange `[3, 30, 34, 5, 9]` to form the largest number.

Sorting numerically gives 3, 5, 9, 30, 34 in some direction, which is wrong: we want 9534330. The right [[sort key]] is the concatenation itself: put a before b if the string `a + b` is larger than `b + a`.

| Compare | a + b | b + a | Who goes first |
|---|---|---|---|
| 3 vs 30 | "330" | "303" | 3 |
| 3 vs 34 | "334" | "343" | 34 |
| 9 vs 5 | "95" | "59" | 9 |
| 34 vs 5 | "345" | "534" | 5 |

Sorted order: 9, 5, 34, 3, 30, giving "9534330". Notice the custom comparator did all the thinking; the scan is just joining strings.

:::try-this
Find the minimum absolute difference in `[40, 11, 26, 27, 2]` by sorting first. (Sorted: 2, 11, 26, 27, 40. Neighbour differences: 9, 15, 1, 13. The minimum is 1, between 26 and 27.)
:::

## The code

```pseudo
largest_number(nums):
    strs = nums as strings
    sort strs so that a comes before b when a + b > b + a
    result = join(strs)
    if result starts with "0": return "0"
    return result

min_difference(a):
    sort a
    return min over i of (a[i+1] - a[i])
```

```cpp
#include <bits/stdc++.h>
using namespace std;

string largestNumber(const vector<int>& nums) {
    vector<string> s;
    for (int x : nums) s.push_back(to_string(x));
    sort(s.begin(), s.end(), [](const string& a, const string& b) { return a + b > b + a; });
    string r;
    for (auto& x : s) r += x;
    return r[0] == '0' ? "0" : r;
}

int main() {
    cout << largestNumber({3, 30, 34, 5, 9}) << '\n';  // 9534330

    // Sorting indices by value, keeping original positions.
    vector<int> v = {40, 11, 26, 27, 2};
    vector<int> idx(v.size());
    iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int i, int j) { return v[i] < v[j]; });
    for (int i : idx) cout << i << ':' << v[i] << ' ';  // 4:2 1:11 2:26 3:27 0:40
    cout << '\n';
}
```

The second half shows an [[index sort]]: sort positions by their values, so you know where each sorted value came from.

### Counting sort when values are small

If values are small integers, say exam scores from 0 to 100, you can skip comparison sorting altogether: count how many times each value appears, then walk the counts in order. That runs in O(n + k) for k possible values, faster than O(n log n) when k is small. It is the same idea as asking students to stand in numbered boxes on the ground instead of comparing heights pair by pair.

## Complexity

- **Time:** O(n log n) for the sort with simple keys, then usually O(n) for the scan. With string keys as in Largest Number, each comparison costs up to the string length.
- **Space:** `std::sort` works in place with O(log n) extra stack; `stable_sort` may use O(n). Index sorting adds an O(n) array of indices.

## Common mistakes

:::warning
Common misconception: "sorting destroys the information I need." It destroys the original order, but you can keep it by sorting pairs of (value, index) or sorting indices. Many "return the original positions" problems are exactly that.
:::

- **`<=` in a comparator**, which breaks strict weak ordering.
- **Sorting when order must be preserved**, as in subarray problems, where the original sequence matters.
- **Forgetting the all-zeros case** in Largest Number, which would print "000".
- **Sorting inside a loop**, turning O(n log n) into O(n² log n) without noticing.

## Practice problems

*Minimum Absolute Difference* and *Distinct Numbers* are sort-then-scan in their simplest form. *Merge Intervals* sorts intervals by start time, after which every overlap is between neighbours. *Largest Number* is all about the comparator. *Car Fleet* sorts cars by position and scans from the front, a nice example of sorting revealing the structure.

## Key takeaways

- Sorting once, in O(n log n), often turns a quadratic compare-everything problem into a single linear scan.
- In sorted order, the closest values are neighbours, ranges are contiguous, and greedy and two-pointer methods become valid.
- The real skill is choosing the sort key, which may be a custom rule such as comparing concatenations.
- Comparators must return false for equal elements; use stable_sort when equal elements must keep their order.
- Sort indices or (value, index) pairs when the answer must refer to original positions.

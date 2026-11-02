---
id: "dsa-sample"
kind: "pattern"
subject: "dsa"
slug: "sample"
title: "A Sample Pattern"
subtitle: "Used by the validator tests"
track: "dsa-arrays"
track_order: 1
priority: "P0"
prerequisites: []
difficulty: "beginner"
read_minutes: 5
topics: ["arrays"]
complexity: { time: "O(n)", space: "O(1)" }
practice_problems:
  - { name: "Two Sum", platform: "LeetCode", url: "https://leetcode.com/problems/two-sum/", difficulty: "Easy" }
  - { name: "Missing Number", platform: "CSES", url: "https://cses.fi/problemset/task/1083", difficulty: "Easy" }
  - { name: "Watermelon", platform: "Codeforces", url: "https://codeforces.com/problemset/problem/4/A", difficulty: "800" }
glossary:
  - { term: "Pointer", definition: "An index into the array." }
  - { term: "Window", definition: "A contiguous range of the array." }
  - { term: "Invariant", definition: "A fact that stays true on every step." }
quiz:
  - { q: "One?", options: ["a", "b", "c", "d"], answer: 0, explain: "Because." }
  - { q: "Two?", options: ["a", "b", "c", "d"], answer: 1, explain: "Because." }
  - { q: "Three?", options: ["a", "b", "c", "d"], answer: 2, explain: "Because." }
cover_seed: "sample"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.5
---

## The hook

A [[pointer]] walks. See [the other one](article:paper-sample).

## The intuition

Keep a [[window]] and an [[invariant]].

## How it works

Move the right end, then the left.

## Walk through an example

Trace it.

## The code

```cpp
#include <bits/stdc++.h>
int main() { std::vector<int> a{1, 2, 3}; std::cout << a.size() << '\n'; }
```

```cpp partial
// not compiled
for (...) {}
```

## Complexity

Linear.

## Common mistakes

Off by one.

## Practice problems

Above.

## Key takeaways

- One pass is enough.

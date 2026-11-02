---
id: "dsa-intervals-sweep"
kind: "pattern"
subject: "dsa"
slug: "intervals-sweep"
title: "A Receptionist Watching the Door"
subtitle: "Interval problems: sort by start to merge, and sweep +1 and -1 events to count overlaps"
track: "dsa-arrays"
track_order: 8
priority: "P0"
prerequisites: ["dsa-two-pointers", "dsa-sorting-as-tool"]
difficulty: "intermediate"
read_minutes: 9
topics: ["intervals", "sorting", "sweep line", "greedy"]
complexity: { time: "O(n log n)", space: "O(n)" }
practice_problems:
  - { name: "Merge Intervals", platform: "LeetCode", url: "https://leetcode.com/problems/merge-intervals/", difficulty: "Medium" }
  - { name: "Insert Interval", platform: "LeetCode", url: "https://leetcode.com/problems/insert-interval/", difficulty: "Medium" }
  - { name: "Car Pooling", platform: "LeetCode", url: "https://leetcode.com/problems/car-pooling/", difficulty: "Medium" }
  - { name: "Restaurant Customers", platform: "CSES", url: "https://cses.fi/problemset/task/1619", difficulty: "Easy" }
  - { name: "Interval List Intersections", platform: "LeetCode", url: "https://leetcode.com/problems/interval-list-intersections/", difficulty: "Medium" }
glossary:
  - term: "Interval"
    definition: "A range with a start and an end, such as a meeting from 9:00 to 10:30 or an array range from index 3 to 7."
  - term: "Overlap"
    definition: "Two intervals overlap when one starts before the other ends."
  - term: "Merge"
    definition: "Replacing overlapping intervals with one interval that covers all of them."
  - term: "Sweep line"
    definition: "A technique that processes events in sorted order, as if a line moved across the timeline, keeping a running state."
  - term: "Event"
    definition: "A point where something changes, such as an interval starting (+1) or ending (-1)."
quiz:
  - q: "After sorting intervals by start, when does the current interval overlap the last merged one?"
    options: ["When its end is smaller", "When its start is at most the last merged end", "When their lengths are equal", "Only when they are identical"]
    answer: 1
    explain: "Sorted by start, a new interval overlaps the previous merged block exactly when it starts before (or at) that block's end."
  - q: "To find the maximum number of guests present at once, what do you sort?"
    options: ["Guests by name", "All arrival and departure events by time", "Only arrival times", "Intervals by length"]
    answer: 1
    explain: "Turn each guest into a +1 at arrival and a -1 at departure, sort all events, and track the running count."
  - q: "Two events happen at the same time: one departure and one arrival. Which should be processed first if a guest leaving at 5 and one arriving at 5 do not overlap?"
    options: ["The arrival", "The departure", "It never matters", "Neither; skip both"]
    answer: 1
    explain: "If touching endpoints do not count as overlapping, process the departure first so the count does not briefly include both guests."
cover_seed: "intervals-sweep"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.9
---

## The hook

A calendar app must show your busy blocks, merging back-to-back and overlapping meetings into single stretches. A restaurant wants to know the most customers it ever had at once. A booking system must check whether a new reservation clashes with existing ones.

These sound like different problems. They are all interval problems, and almost every interval problem yields to one of two moves: sort by start and walk forward, or turn starts and ends into events and sweep across them.

## The intuition

:::analogy
Picture a receptionist at a restaurant door with a clicker counter. Every time a guest walks in, they click up; every time a guest leaves, they click down. They never need to know who is sitting where. Glancing at the counter at any moment tells them how many guests are inside, and the highest number they ever saw is the peak occupancy.
:::

Each guest is an [[interval]]: an arrival time and a departure time. The receptionist's clicks are [[event]]s. Reading the counter as time moves forward is a [[sweep line]]. And when you only care which stretches of time are busy, you [[merge]] overlapping visits into continuous blocks.

## How it works

### Move 1: sort by start, then merge

Sort intervals by start time. Walk through them, keeping the last merged block:

- If the next interval starts at or before the block's end, they [[overlap]]: extend the block's end to the larger of the two ends.
- Otherwise the block is finished; start a new block.

Sorting guarantees that once an interval starts after the current block ends, nothing later can touch that block, because everything later starts even later. In receptionist terms: once the room has been empty for a moment, the next guest starts a brand-new busy stretch, and nothing earlier can ever join it.

### Move 2: sweep events

Turn each interval [s, e] into two events: (+1 at s) and (−1 at e). Sort all events by time, breaking ties carefully, then walk through them keeping a running sum. The running sum is the number of intervals covering that moment; its maximum is the peak overlap.

```mermaid
flowchart TD
  A[Interval problem] --> B{What is asked}
  B -- covered stretches or clashes --> C[Sort by start, merge as you go]
  B -- how many at once --> D[Make plus one and minus one events]
  D --> E[Sort events, break ties by the touching rule]
  E --> F[Running sum, track the maximum]
```

:::insight
Intervals are hard to compare all at once and easy to process in time order. Sorting by start turns "does anything overlap?" into "does the next one overlap the last one?", and events turn "how many at once?" into a running counter.
:::

## Walk through an example

**Merge** `[[1,3], [8,10], [2,6], [15,18], [9,11]]`.

Sorted by start: [1,3], [2,6], [8,10], [9,11], [15,18].

| Next interval | Last merged block | Overlap? | Blocks after |
|---|---|---|---|
| [1,3] | — | — | [1,3] |
| [2,6] | [1,3] | 2 ≤ 3, yes | [1,6] |
| [8,10] | [1,6] | 8 > 6, no | [1,6], [8,10] |
| [9,11] | [8,10] | 9 ≤ 10, yes | [1,6], [8,11] |
| [15,18] | [8,11] | 15 > 11, no | [1,6], [8,11], [15,18] |

**Peak overlap** for guests [1,4], [2,5], [3,6] (leaving at time t means gone at t):

Events: +1@1, +1@2, +1@3, −1@4, −1@5, −1@6. Running sum: 1, 2, 3, 2, 1, 0. Peak: **3**, between times 3 and 4.

:::try-this
Find the peak for [1,3], [3,5], [5,7], where a guest leaving at 3 and one arriving at 3 do not overlap. Which tie rule do you need? (Process departures before arrivals at the same time. Events: +1@1, −1@3, +1@3, −1@5, +1@5, −1@7. Running sum never exceeds 1, so the peak is 1.)
:::

## The code

```pseudo
merge(intervals):
    sort intervals by start
    result = []
    for (s, e) in intervals:
        if result is not empty and s <= result.last.end:
            result.last.end = max(result.last.end, e)
        else:
            append (s, e) to result
    return result

peak_overlap(intervals):
    events = [(s, +1) and (e, -1) for each interval]
    sort events by time, with -1 before +1 at equal times
    cur = 0, best = 0
    for (t, d) in events:
        cur += d
        best = max(best, cur)
    return best
```

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<array<int, 2>> mergeIntervals(vector<array<int, 2>> v) {
    sort(v.begin(), v.end());
    vector<array<int, 2>> out;
    for (auto& [s, e] : v) {
        if (!out.empty() && s <= out.back()[1]) out.back()[1] = max(out.back()[1], e);
        else out.push_back({s, e});
    }
    return out;
}

int peakOverlap(const vector<array<int, 2>>& v) {
    vector<pair<int, int>> ev;  // (time, delta); -1 sorts before +1 at the same time
    for (auto& [s, e] : v) { ev.push_back({s, +1}); ev.push_back({e, -1}); }
    sort(ev.begin(), ev.end());
    int cur = 0, best = 0;
    for (auto& [t, d] : ev) best = max(best, cur += d);
    return best;
}

int main() {
    for (auto& [s, e] : mergeIntervals({{1, 3}, {8, 10}, {2, 6}, {15, 18}, {9, 11}}))
        cout << '[' << s << ',' << e << "] ";
    cout << '\n' << peakOverlap({{1, 4}, {2, 5}, {3, 6}}) << '\n';  // 3
}
```

Sorting pairs `(time, delta)` puts −1 before +1 at equal times automatically, which implements the "departures first" rule.

## Complexity

- **Time:** O(n log n) for sorting; the merge walk and the sweep are O(n).
- **Space:** O(n) for the output or the 2n events.

When times are small integers, a difference array, adding +1 at s and −1 at e and taking prefix sums as in [prefix sums](article:dsa-prefix-sums), gives the same counts in O(n + T) without sorting.

## Common mistakes

:::warning
Common misconception: "touching intervals always overlap." It depends on the problem. A meeting ending at 10:00 and one starting at 10:00 usually do not clash, but closed integer ranges [1,3] and [3,5] share the point 3. Decide the rule from the statement, then encode it in your comparison (`<` vs `<=`) and in the event tie-break.
:::

- **Forgetting to sort** before merging, which misses overlaps between non-adjacent intervals in the input.
- **Setting the merged end to the new interval's end** instead of the maximum, which breaks when one interval contains another, like [1,10] and [2,3].
- **Wrong tie-break** in the sweep, which over- or under-counts at shared endpoints.

## Practice problems

*Merge Intervals* and *Insert Interval* practise Move 1. *Restaurant Customers* (CSES) and *Car Pooling* are pure sweeps: the second adds passenger counts instead of +1. *Interval List Intersections* combines sorted order with two pointers across two lists.

## Key takeaways

- Most interval problems become easy once intervals are processed in time order.
- To merge, sort by start and extend the last block while the next interval starts before the block ends.
- To count simultaneous intervals, turn each into a +1 and a -1 event, sort events and track a running sum.
- Decide whether touching endpoints overlap, and encode that rule in comparisons and event tie-breaks.
- Sorting costs O(n log n); with small integer times, a difference array gives the same counts without sorting.

---
id: "cp-sweep-line-geometry"
kind: "pattern"
subject: "cp"
slug: "sweep-line-geometry"
title: "A Scanner Bar Sliding Across the Page"
subtitle: "Sweep line: sort events, keep an active set, and solve closest pair and rectangle union area in O(n log n)"
track: "cp-misc"
track_order: 15
priority: "P2"
prerequisites: ["cp-geometry-basics"]
difficulty: "advanced"
read_minutes: 13
topics: ["geometry", "sweep line", "closest pair", "segment tree", "ordered set"]
complexity: { time: "O(n log n)", space: "O(n)" }
practice_problems:
  - { name: "Minimum Euclidean Distance", platform: "CSES", url: "https://cses.fi/problemset/task/2194", difficulty: "Hard" }
  - { name: "Area of Rectangles", platform: "CSES", url: "https://cses.fi/problemset/task/1741", difficulty: "Hard" }
  - { name: "Rectangle Area II", platform: "LeetCode", url: "https://leetcode.com/problems/rectangle-area-ii/", difficulty: "Hard" }
  - { name: "The Skyline Problem", platform: "LeetCode", url: "https://leetcode.com/problems/the-skyline-problem/", difficulty: "Hard" }
glossary:
  - term: "Sweep line"
    definition: "An imaginary line moved across the plane in one direction, stopping only at events, while a data structure holds what the line currently touches."
  - term: "Event"
    definition: "A point where something changes for the sweep line, such as a point appearing or a rectangle starting or ending."
  - term: "Active set"
    definition: "The objects the sweep line currently cares about, kept in a structure that supports fast insert, delete and range queries."
  - term: "Coordinate compression"
    definition: "Replacing large coordinates by their rank among all distinct values, so they can index an array or segment tree."
  - term: "Cover count"
    definition: "In the rectangle union, how many active rectangles cover a segment-tree node's whole interval; the node is fully covered when it is positive."
quiz:
  - q: "In the closest-pair sweep, the best squared distance so far is 10. The new point has x = 9. Which earlier points can be removed from the active set?"
    options: ["Points with x below 9", "Points with x ≤ 5, since their x-distance alone is at least 4 > √10", "None", "Points with y far from 9"]
    answer: 1
    explain: "√10 ≈ 3.16, so any point at x-distance 4 or more can never beat the current best. With d = ⌊√10⌋ + 1 = 4, points with 9 − x ≥ 4, that is x ≤ 5, are dropped forever."
  - q: "Why does the closest-pair sweep check only a few points per step?"
    options: ["Because points are random", "Inside the d by 2d box of candidates, points are at least d apart from each other, so only a constant number fit", "Because the set is sorted by x", "It checks all points"]
    answer: 1
    explain: "Every pair already seen is at least the current best distance apart, so a bounded box can only hold a constant number of them. That keeps each step O(log n) plus a constant."
  - q: "For the union area of rectangles, what does the segment tree return after each event?"
    options: ["The number of rectangles", "The total length of y covered by at least one active rectangle", "The largest rectangle", "The leftmost x"]
    answer: 1
    explain: "Covered length times the x-gap to the next event is the area of that vertical strip. Summing strips gives the union area without double counting overlaps."
cover_seed: "sweep-line-geometry"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.6
---

## The hook

You have 200,000 points and must find the two closest ones. Checking every pair is about 2·10¹⁰ distance computations. At a generous 10⁹ simple operations per second, that is 20 seconds against a 1-second limit.

Now a second problem: 100,000 overlapping rectangles, and you need the total area they cover, counting overlaps once. Painting a grid is hopeless when coordinates go up to 10⁹.

Two different problems, one trick. Guess the shape of it before reading on: what if you only ever looked at the plane through a narrow slit, moving left to right?

## The intuition

:::analogy
A flatbed **scanner bar slides across the page** from left to right. At any moment it only sees one thin vertical line. It does not need to remember the whole page: it keeps just what is under the bar right now, and it only does work where something on the page starts or ends.
:::

That is a [[sweep line]]:

1. Turn the problem into **[[event]]s**: places on the x-axis where something changes (a point appears, a rectangle starts, a rectangle ends).
2. Sort the events by x.
3. Move the line from event to event, keeping an **[[active set]]** of what the line currently touches, in a structure that answers the question you care about fast (an ordered set, a segment tree).

The 2D problem becomes a sequence of 1D problems, one per event. That is where the n log n comes from: sort once, then O(log n) per event.

This technique shows up from about Codeforces 2000 and upward in geometry and data-structure problems, and the event-sorting half of it appears much earlier in interval problems.

## How it works

### Closest pair of points

Keep `best`, the smallest squared distance found so far, and let d = ⌊√best⌋ + 1, so any pair at x-distance or y-distance d or more cannot beat it.

Sweep points in order of x. For each new point p:

1. **Evict**: remove from the active set every point whose x is at least d to the left of p. Wait, why can they leave forever? Because later points are even further right, and best only shrinks. Once too far, always too far.
2. **Query**: the active set is ordered by y, so jump straight to points with y in (p.y − d, p.y + d) and compute their distances.
3. **Insert** p.

The candidates live in a box d wide and 2d tall. Every pair already in the set is at least √best apart, so only a constant number of points can be packed into that box. Each step is O(log n) for the set operations plus a constant number of distance checks.

### Union area of rectangles

Each rectangle [x1, x2) × [y1, y2) makes two events: at x1 it **starts** (+1), at x2 it **ends** (−1).

Between two consecutive event x-values, the covered set of y does not change. So the area of that strip is (covered y-length) × (x-gap). Sum the strips.

The covered y-length is the clever part. A segment tree over the compressed y-coordinates ([[coordinate compression]]) stores at each node a **[[cover count]]**: how many active rectangles cover that node's whole interval. A node with count > 0 is fully covered; otherwise its covered length is the sum of its children's. The root then holds the total covered length, updated in O(log n) per event, with no lazy propagation needed, because every add has a matching remove on exactly the same interval.

:::insight
A sweep line turns "everything against everything" into "each event against what is currently active". If you can name the events and find a structure that answers the question for the active set in O(log n), the whole problem drops to O(n log n).
:::

## Walk through an example

### Closest pair

Points: (0,0), (5,4), (3,1), (9,6), (4,4), (1,7), (7,2). Sorted by x: (0,0), (1,7), (3,1), (4,4), (5,4), (7,2), (9,6).

| Point | d before | Active set (by y) after evicting | Candidates checked | best after |
|---|---|---|---|---|
| (0,0) | ∞ | empty | 0 | ∞ |
| (1,7) | ∞ | (0,0) | 1 | 50 |
| (3,1) | 8 | (0,0), (1,7) | 2 | 10 |
| (4,4) | 4 | (3,1), (1,7) | 2 | 10 |
| (5,4) | 4 | (3,1), (4,4) | 2 | 1 |
| (7,2) | 2 | empty | 0 | 1 |
| (9,6) | 2 | empty | 0 | 1 |

At (4,4), d = ⌊√10⌋ + 1 = 4 evicts (0,0) because 4 − 0 ≥ 4. Once best drops to 1 at (5,4), d = 2 and the window becomes tiny: by (7,2) every older point is evicted. Answer: squared distance 1, between (4,4) and (5,4).

### Union area

Rectangles: A = [0,4)×[0,3), B = [2,6)×[1,5), C = [5,8)×[4,6). Areas add to 12 + 16 + 6 = 34, but they overlap.

| Strip x-range | Active | Covered y | Length | Strip area |
|---|---|---|---|---|
| 0 to 2 | A | [0,3) | 3 | 6 |
| 2 to 4 | A, B | [0,5) | 5 | 10 |
| 4 to 5 | B | [1,5) | 4 | 4 |
| 5 to 6 | B, C | [1,6) | 5 | 5 |
| 6 to 8 | C | [4,6) | 2 | 4 |

Total: 6 + 10 + 4 + 5 + 4 = **29**, not 34. The overlaps of A with B and B with C are counted once.

:::try-this
Add rectangle D = [0,8)×[0,1) to the example. What is the new union area? (D covers the bottom strip y in [0,1) everywhere. In strips 0-2 and 2-4 that row is already covered by A, so nothing changes there. In 4-5, 5-6 and 6-8 it adds 1 × 1, 1 × 1 and 1 × 2 = 4. New total 33.)
:::

## The code

```pseudo
closest_pair(points):
    sort points by x
    active = ordered set keyed by (y, x)
    best = infinity
    for p in points:
        d = floor(sqrt(best)) + 1
        remove from active every q with p.x - q.x >= d
        for q in active with p.y - d < q.y < p.y + d:
            best = min(best, dist2(p, q))
        insert p into active
    return best

union_area(rects):
    events = (x1, +1, y1, y2) and (x2, -1, y1, y2) for each rectangle
    sort events by x; compress all y values
    area = 0; prev_x = first event x
    for (x, type, y1, y2) in events:
        area += covered_length() * (x - prev_x)
        prev_x = x
        add type to the cover count of [y1, y2) in the segment tree
    return area
```

The C++ below prints both answers from the walkthrough. It uses integer coordinates and squared distances, so no floating point decides a comparison.

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// Closest pair: squared distance, O(n log n).
ll closestPair(vector<pair<ll, ll>> p) {
    sort(p.begin(), p.end());                       // by x, then y
    set<pair<ll, ll>> active;                       // stored as (y, x)
    ll best = LLONG_MAX;
    size_t left = 0;                                // oldest point still active
    for (auto [x, y] : p) {
        ll d = best == LLONG_MAX ? LLONG_MAX / 4 : (ll)sqrtl((long double)best) + 1;
        while (left < p.size() && x - p[left].first >= d) {   // too far left: drop
            active.erase({p[left].second, p[left].first});
            left++;
        }
        auto it = active.lower_bound({y - d + 1, LLONG_MIN});
        for (; it != active.end() && it->first < y + d; ++it) {
            ll dx = x - it->second, dy = y - it->first;
            best = min(best, dx * dx + dy * dy);
        }
        active.insert({y, x});
    }
    return best;
}

// Union area of axis-aligned rectangles: sweep x, segment tree over compressed y.
struct CoverTree {
    vector<ll> ys; vector<int> cnt; vector<ll> len;
    CoverTree(vector<ll> v) : ys(v), cnt(4 * v.size()), len(4 * v.size()) {}
    void update(int node, int l, int r, int ql, int qr, int delta) {   // [l, r) over ys
        if (qr <= l || r <= ql) return;
        if (ql <= l && r <= qr) cnt[node] += delta;
        else {
            int m = (l + r) / 2;
            update(2 * node, l, m, ql, qr, delta);
            update(2 * node + 1, m, r, ql, qr, delta);
        }
        if (cnt[node] > 0) len[node] = ys[r] - ys[l];          // fully covered
        else if (r - l == 1) len[node] = 0;
        else len[node] = len[2 * node] + len[2 * node + 1];
    }
};

ll unionArea(const vector<array<ll, 4>>& rects) {          // x1, y1, x2, y2
    vector<ll> ys;
    vector<array<ll, 4>> events;                            // x, +1/-1, y1, y2
    for (auto [x1, y1, x2, y2] : rects) {
        ys.push_back(y1); ys.push_back(y2);
        events.push_back({x1, +1, y1, y2});
        events.push_back({x2, -1, y1, y2});
    }
    sort(ys.begin(), ys.end());
    ys.erase(unique(ys.begin(), ys.end()), ys.end());
    sort(events.begin(), events.end());
    CoverTree t(ys);
    int m = ys.size() - 1;
    ll area = 0, prevX = events[0][0];
    for (auto [x, type, y1, y2] : events) {
        area += t.len[1] * (x - prevX);                     // covered height times width
        prevX = x;
        int l = lower_bound(ys.begin(), ys.end(), y1) - ys.begin();
        int r = lower_bound(ys.begin(), ys.end(), y2) - ys.begin();
        t.update(1, 0, m, l, r, (int)type);
    }
    return area;
}

int main() {
    vector<pair<ll, ll>> pts = {{0, 0}, {5, 4}, {3, 1}, {9, 6}, {4, 4}, {1, 7}, {7, 2}};
    cout << closestPair(pts) << "\n";                       // 1: (4,4) and (5,4)
    vector<array<ll, 4>> rects = {{0, 0, 4, 3}, {2, 1, 6, 5}, {5, 4, 8, 6}};
    cout << unionArea(rects) << "\n";                       // 29
}
```

## Complexity

- **Closest pair:** sorting is O(n log n). Each point is inserted and evicted once, O(log n) each, and checks a constant number of candidates, so the total is **O(n log n) time, O(n) space**.
- **Union area:** sorting 2n events and compressing y is O(n log n); each of the 2n updates walks O(log n) segment-tree nodes. **O(n log n) time, O(n) space.**

## Common mistakes

:::warning
Common misconception: "use doubles and sqrt everywhere." Floating-point distances make ties and near-ties unreliable, and CSES-style problems ask for the squared distance anyway. Keep coordinates and squared distances in 64-bit integers; use sqrt only to compute the window width d, and add 1 to stay safe.
:::

- **Overflow**: coordinates up to 10⁹ give squared differences up to about 4·10¹⁸, close to the 64-bit limit. Use long long and do not add two squares that might each be that large without thinking.
- **Evicting with > instead of ≥ (or the reverse)**: decide the window precisely. With d = ⌊√best⌋ + 1, keep points with x-distance < d.
- **Forgetting duplicates**: two identical points have distance 0. An ordered set of (y, x) collapses them; the moment you see a duplicate, the answer is 0.
- **Tie-breaking events at the same x** in the area sweep: the strip width is 0 there, so order does not matter for area, but it does for problems that count boundaries, such as skyline outputs. State your rule.
- **Segment tree over points instead of intervals**: leaves must represent the gaps between consecutive compressed y-values, not the values themselves.

### Interview follow-ups

**"Can you do closest pair with divide and conquer instead?"** Yes, the classic version splits by x, solves both halves, then checks a strip around the middle sorted by y, also O(n log n). The sweep is usually shorter to code with an ordered set.

**"What other problems use a sweep?"** Meeting rooms and maximum overlapping intervals (events +1/−1 on a 1D line), the skyline (active heights in a multiset), counting segment intersections, and nearest neighbours in some geometric problems.

**"What if rectangles are given as real numbers?"** The same sweep works with doubles for coordinates; only the compression needs exact equality of shared coordinates, so read them as given rather than recomputing.

## Practice problems

Start with **The Skyline Problem** to get comfortable with events and an active multiset, then **Minimum Euclidean Distance** for the closest-pair sweep. **Rectangle Area II** and **Area of Rectangles** both use the cover-count segment tree; do the LeetCode one first (fewer rectangles), then CSES with large coordinates. The geometry basics behind these problems are in [Left Turn or Right Turn at the Junction](article:cp-geometry-basics).

## Key takeaways

- A sweep line turns a 2D problem into sorted events plus an active set, so each event is handled against only what the line currently touches.
- For closest pair, evicting points that are too far in x and querying an ordered set by y checks only a constant number of candidates per point, giving O(n log n).
- For union area, a segment tree with cover counts over compressed y gives the covered length after each event, and summing length times x-gap counts overlaps exactly once.
- Keep coordinates and squared distances in 64-bit integers, and decide window boundaries and tie-breaking rules explicitly.
- Many problems hide a sweep: whenever things start and end along one axis, try sorting the events.

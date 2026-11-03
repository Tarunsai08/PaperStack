---
id: "dsa-state-space-search"
kind: "pattern"
subject: "dsa"
slug: "state-space-search"
title: "Same Room, Different Inventory"
subtitle: "Shortest paths over states: when where you are is not enough, add what you carry (keys, fuel, walls you may break) to the node"
track: "dsa-graphs"
track_order: 22
priority: "P1"
prerequisites: ["dsa-bfs", "dsa-dijkstra"]
difficulty: "intermediate"
read_minutes: 12
topics: ["bfs", "dijkstra", "state space", "bitmask", "grid"]
complexity: { time: "O(cells × extra states × 4)", space: "O(cells × extra states)" }
practice_problems:
  - { name: "Shortest Path to Get All Keys", platform: "LeetCode", url: "https://leetcode.com/problems/shortest-path-to-get-all-keys/", difficulty: "Hard" }
  - { name: "Shortest Path in a Grid with Obstacles Elimination", platform: "LeetCode", url: "https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/", difficulty: "Hard" }
  - { name: "Cheapest Flights Within K Stops", platform: "LeetCode", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", difficulty: "Medium" }
  - { name: "Shortest Path Visiting All Nodes", platform: "LeetCode", url: "https://leetcode.com/problems/shortest-path-visiting-all-nodes/", difficulty: "Hard" }
glossary:
  - term: "State"
    definition: "Everything that affects what you can do next: the position plus any extra information such as keys held, fuel left or stops used."
  - term: "State space"
    definition: "The graph whose nodes are states and whose edges are moves between them. Its size is positions times the number of possible extra values."
  - term: "Bitmask"
    definition: "An integer whose bits record a set, such as which of up to 6 keys you hold; bit i is 1 if key i is collected."
  - term: "Visited set"
    definition: "The record of states already reached, which stops BFS from expanding the same state twice. It must be keyed by the full state, not the position alone."
quiz:
  - q: "In a grid with keys and doors, BFS marks visited by (row, col) only. What goes wrong?"
    options: ["Nothing", "After picking up a key you cannot walk back over cells you already visited without it, so paths that need backtracking are missed", "BFS becomes slower", "It finds paths through walls"]
    answer: 1
    explain: "The same cell with a key is a different situation from the same cell without it. Visited must be keyed by (row, col, keys)."
  - q: "A 30 × 30 grid with up to 6 keys. How many states are there at most?"
    options: ["900", "5,400", "57,600", "900⁶"]
    answer: 2
    explain: "900 cells × 2⁶ = 64 key subsets = 57,600 states, small enough for BFS."
  - q: "Moves cost 1, except passing a toll costs 0 more steps but uses one of k vouchers. Which search fits?"
    options: ["Plain BFS over positions", "BFS over (position, vouchers left), since every move still costs 1 step", "Dijkstra over positions only", "DFS"]
    answer: 1
    explain: "Edge weights are all equal, so BFS works, but the voucher count must be part of the state."
cover_seed: "state-space-search"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.8
---

## The hook

A corridor of seven tiles: `a . @ . A . b`. You start at `@`. There is a key `a` two steps to your left, a locked door `A` two steps to your right, and a second key `b` behind the door. Collect both keys in as few steps as possible.

You know BFS. You write the standard version: queue, visited grid, four directions. It returns **−1**: impossible.

But the answer is obviously 8: walk left two steps for the key, walk back past where you started, open the door, reach `b`. What did BFS get wrong? Think about what the visited grid says about the tile you started on, after you have the key.

## The intuition

:::analogy
In a video game, standing in the castle hall **with** the silver key is not the same as standing there **without** it. The save file records the room *and* the inventory. Load a save from the same room with a different inventory, and the game plays out differently. **Same room, different inventory, different situation.**
:::

Standard BFS treats a node as a position. Here, a position is not enough. The node must be the full **[[state]]**: position plus whatever extra information changes your options.

In the corridor, standard BFS visits the start tile without the key, then refuses to step on it again after picking the key up, because the visited grid says "been there". The fix is to mark visited by **(tile, keys held)**. The tile with the key is a brand-new node.

## How it works

1. **Name the state.** Position plus the smallest extra piece of information that affects future moves: keys collected (a [[bitmask]]), walls you may still break, fuel left, stops used, the direction you face.
2. **Count the [[state space]].** positions × possible extra values. If it is a few million or less, you can search it.
3. **Pick the search by edge weights**, exactly as on a normal graph:
   - every move costs 1 → BFS;
   - moves cost 0 or 1 → 0-1 BFS with a deque;
   - varied non-negative costs → Dijkstra.
4. **Key the [[visited set]] (or distance array) by the full state**, and stop when any state at the target satisfies the goal (for keys: all bits set).

Wait, why not just carry the keys along in the queue entry and keep the old visited grid? Because the visited grid is what decides which states get explored. If it ignores the keys, the queue never contains (start tile, with key) in the first place.

:::insight
When "where am I" does not determine "what can I do next", the graph you are searching is not the map. It is the map multiplied by the extra information. Put that information in the node and in the visited key, and BFS or Dijkstra work unchanged.
:::

## Walk through an example

The corridor `a . @ . A . b`, tiles 0 to 6, start at 2. State = (tile, keys), keys written as a set.

| Step | Popped state | Moves allowed | New states pushed |
|---|---|---|---|
| 0 | (2, {}) | left, right | (1, {}), (3, {}) |
| 1 | (1, {}) | left | (0, {a}) |
| 1 | (3, {}) | right is door A, locked | none |
| 2 | (0, {a}) | right | (1, {a}) |
| 3 | (1, {a}) | right | (2, {a}) |
| 4 | (2, {a}) | right | (3, {a}) |
| 5 | (3, {a}) | right, door now open | (4, {a}) |
| 6 | (4, {a}) | right | (5, {a}) |
| 7 | (5, {a}) | right | (6, {a, b}) |
| 8 | (6, {a, b}) | all keys held | **answer 8** |

Look at step 3: (1, {a}) is pushed even though tile 1 was visited at step 1. With position-only visited, that push is refused, the queue empties after step 2, and BFS reports −1.

The same idea solves "Shortest Path in a Grid with Obstacles Elimination": the state is (row, col, walls you may still break). On the 5 × 3 grid from that problem with one break allowed, the answer is 6; on a 3 × 3 grid walled off by two layers, it is −1 even with one break.

:::try-this
In a 20 × 20 grid you may break at most k = 3 walls. How many states can there be, and how does that compare with plain BFS? (400 cells × 4 values of walls-left (0 to 3) = 1,600 states, four times plain BFS. Small. And if k ≥ rows + cols − 2, you can walk straight to the corner breaking everything, which is a shortcut worth stating in an interview.)
:::

## The code

```pseudo
state_bfs(start, is_goal):
    dist[start_state] = 0
    queue = [start_state]                 // start_state = (position, initial extra)
    while queue not empty:
        s = pop front
        if is_goal(s): return dist[s]
        for each move from s.position:
            t = (new position, extra updated by what is there)
            if move is illegal for s.extra: skip      // locked door, no breaks left
            if t not in dist:
                dist[t] = dist[s] + 1
                push t
    return -1
```

The C++ solves the corridor, a grid with keys and doors, and the wall-breaking grid.

```cpp
#include <bits/stdc++.h>
using namespace std;

// Fewest steps to collect every key ('a'..'f'); doors 'A'..'F' need their key; '@' is the start.
int collectKeys(const vector<string>& g) {
    int R = g.size(), C = g[0].size(), all = 0, sr = 0, sc = 0;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (g[r][c] == '@') sr = r, sc = c;
            if (islower(g[r][c])) all |= 1 << (g[r][c] - 'a');
        }
    // A state is (row, col, keys held): same cell with different keys is a different situation.
    vector<vector<vector<int>>> dist(R, vector<vector<int>>(C, vector<int>(1 << 6, -1)));
    queue<array<int, 3>> q;
    dist[sr][sc][0] = 0;
    q.push({sr, sc, 0});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c, keys] = q.front(); q.pop();
        if (keys == all) return dist[r][c][keys];
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C || g[nr][nc] == '#') continue;
            char ch = g[nr][nc];
            if (isupper(ch) && !(keys >> (ch - 'A') & 1)) continue;     // locked door
            int nk = islower(ch) ? keys | 1 << (ch - 'a') : keys;
            if (dist[nr][nc][nk] != -1) continue;
            dist[nr][nc][nk] = dist[r][c][keys] + 1;
            q.push({nr, nc, nk});
        }
    }
    return -1;
}

// Shortest path from top-left to bottom-right, allowed to break through at most k walls (1s).
int withEliminations(const vector<vector<int>>& g, int k) {
    int R = g.size(), C = g[0].size();
    vector<vector<vector<int>>> dist(R, vector<vector<int>>(C, vector<int>(k + 1, -1)));
    queue<array<int, 3>> q;
    dist[0][0][k] = 0;
    q.push({0, 0, k});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c, left] = q.front(); q.pop();
        if (r == R - 1 && c == C - 1) return dist[r][c][left];
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            int nl = left - g[nr][nc];
            if (nl < 0 || dist[nr][nc][nl] != -1) continue;
            dist[nr][nc][nl] = dist[r][c][left] + 1;
            q.push({nr, nc, nl});
        }
    }
    return -1;
}

int main() {
    cout << collectKeys({"a.@.A.b"}) << "\n";                       // 8: fetch a, walk back through A to b
    cout << collectKeys({"@.a..", "###.#", "b.A.B"}) << "\n";       // 8
    cout << withEliminations({{0,0,0},{1,1,0},{0,0,0},{0,1,1},{0,0,0}}, 1) << "\n";   // 6
    cout << withEliminations({{0,1,1},{1,1,1},{1,0,0}}, 1) << "\n";                   // -1
}
```

## Complexity

With P positions, X possible extra values and up to 4 moves each, BFS takes **O(P · X) time and space**. For keys, X = 2^(number of keys), which is why problems keep the number of keys tiny (6 here gives 64). With Dijkstra, add a log factor: O(P · X · log(P · X)).

## Common mistakes

:::warning
Common misconception: "add the extra information to the queue entry and you are done." The visited array (or distance array) must also be indexed by the extra information. Otherwise states that matter, like the start tile with a key in hand, are never explored.
:::

- **Too much state**: storing the full path or the set of visited cells explodes the state space. Store only what changes future moves.
- **Stopping too early**: with keys, the goal is "all keys held", which can happen at any tile; check it when a state is popped (BFS) or settled (Dijkstra), not only at a fixed target.
- **Wrong search for the weights**: BFS on weighted edges gives wrong answers; use 0-1 BFS or Dijkstra as in [A Travel Planner With One Discount Voucher](article:cp-shortest-path-tricks).
- **Bit errors**: door 'A' needs bit (ch − 'A'); key 'a' sets bit (ch − 'a'). Mixing them silently opens the wrong doors.

### Interview follow-ups

**"Cheapest flights with at most k stops: why not plain Dijkstra?"** Plain Dijkstra keeps only the cheapest cost per city, but a cheaper route that used more stops may block a slightly pricier route that still has stops left. The state is (city, stops used), or use the bounded Bellman-Ford rounds in [Booking Flights With a Layover Limit](article:dsa-cheapest-flights-k-stops).

**"Visit every node of a small graph in the shortest walk."** State = (current node, set of visited nodes as a bitmask), multi-source BFS from every node with its own bit set. The same bitmask idea as [A Checklist Written as a Row of Lights](article:dsa-bitmask-dp-intro).

**"How do you know the state space is small enough?"** Multiply it out before coding: positions × extra values × moves. Up to a few million is comfortable in C++.

## Practice problems

Start with **Shortest Path in a Grid with Obstacles Elimination** (one integer of extra state), then **Cheapest Flights Within K Stops** (stops as state). **Shortest Path to Get All Keys** adds a bitmask, and **Shortest Path Visiting All Nodes** makes the bitmask the whole point. Plain BFS is in [Ripples on a Pond: Breadth-First Search](article:dsa-bfs) if you need a refresher.

## Key takeaways

- When the same position can lead to different futures, the search node must be the full state: position plus the extra information such as keys, fuel, breaks left or stops used.
- The visited or distance array must be keyed by the full state, or necessary revisits of a position are wrongly refused.
- Choose BFS, 0-1 BFS or Dijkstra by edge weights exactly as on an ordinary graph; only the node definition changes.
- Multiply positions by extra values before coding to check the state space is small enough, and store only what affects future moves.
- Bitmasks record small sets such as collected keys compactly, which is why such problems keep the number of keys small.

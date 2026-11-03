---
id: "dsa-oa-strategy"
kind: "primer"
subject: "dsa"
slug: "oa-strategy"
title: "Chasing a Target: How to Play an Online Assessment"
subtitle: "Time, constraints, partial scores and hidden tests: the game plan that turns what you know into points"
track: "dsa-start"
track_order: 6
priority: "P0"
prerequisites: ["dsa-big-o", "dsa-problem-solving-framework"]
difficulty: "beginner"
read_minutes: 11
topics: ["online assessment", "strategy", "edge cases", "time management", "placements"]
glossary:
  - term: "Online assessment"
    definition: "A timed, auto-graded coding test that companies use to shortlist candidates before interviews, often with two to four problems."
  - term: "Hidden tests"
    definition: "Test cases you cannot see, run after you submit. They usually include edge cases and the largest allowed inputs."
  - term: "Partial scoring"
    definition: "Grading that awards points for each test case passed, so a correct but slow solution can still earn part of the marks."
  - term: "Expected score per minute"
    definition: "A planning estimate: the points a step is likely to earn divided by the minutes it will take, used to decide what to do next."
  - term: "Edge case"
    definition: "An input at the boundary of what is allowed, such as an empty array, one element, all equal values or the maximum size."
quiz:
  - q: "You have 20 minutes left. Problem 3 is unsolved. A brute force that passes small tests would take 10 minutes; the full solution might take 40. What do you do, if the test awards points per test case?"
    options: ["Start the full solution", "Write the brute force, submit it for partial points, then attempt the improvement if time remains", "Re-check problem 1", "Submit nothing"]
    answer: 1
    explain: "With per-test scoring, a correct brute force banks real points in the time you have. The full solution would not finish in 20 minutes."
  - q: "Constraints say n ≤ 2·10⁵. Which complexity should you aim for?"
    options: ["O(n²)", "O(n log n) or O(n)", "O(2ⁿ)", "O(n³)"]
    answer: 1
    explain: "n² is 4·10¹⁰ operations, far too many. O(n log n) is a few million, comfortably fast."
  - q: "Your solution passes every visible sample but fails hidden tests. What is the most likely cause?"
    options: ["The judge is broken", "An edge case or overflow: empty input, one element, duplicates, negative numbers or values near the maximum", "You used C++", "The samples were wrong"]
    answer: 1
    explain: "Samples are usually small and friendly. Hidden tests probe boundaries and maximum sizes, where off-by-one errors, overflow and slow loops appear."
cover_seed: "oa-strategy"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.92
---

## The hook

Two friends take the same 90-minute assessment. Both know binary search, graphs and DP equally well.

One opens problem 3 first because it looks the most interesting, spends 70 minutes on it, gets it nearly working, and submits two half-finished solutions in the last ten minutes. The other banks problem 1 in 15 minutes, gets problem 2 fully, and earns partial marks on problem 3 with a brute force. Guess who gets the interview call.

An online assessment does not measure what you know. It measures how many points you turn your knowledge into, under a clock, against tests you cannot see. That is a skill of its own, and this article is the game plan.

## The intuition

:::analogy
A batting side **chasing a target** in limited overs does not swing at every ball. It reads the required run rate, banks easy singles to keep the scoreboard moving, and goes for boundaries only when the situation allows. Getting out chasing a six off a good ball loses the match; a steady 140 that wins beats a flashy 90.
:::

Map it to an [[online assessment]]:

- The **target** is the score the shortlist needs. You rarely need every point.
- **Easy singles** are the problems, and parts of problems, you can finish with certainty.
- **Boundaries** are the hard, high-value solutions you attempt once runs are on the board.
- **Getting out** is spending all your time on one problem and submitting nothing that passes.

## Let's build it up

### Step 1: Read everything first (5 minutes)

Before writing a line, read every problem and its constraints. For each, note a rough guess: easy, medium or hard for you, and what complexity the constraints demand.

Wait, why spend five precious minutes not coding? Because order matters more than speed. Problems are not always sorted by difficulty, and the "hard-looking" one is sometimes a known pattern in disguise.

### Step 2: Let the constraints pick the algorithm

A widely used rule of thumb is that a judge runs on the order of 10⁸ simple operations per second. Read n, then reverse-engineer the target complexity, as in [Reading Constraints Like a Pro](article:dsa-big-o):

| Constraint on n | Operations allowed | Aim for |
|---|---|---|
| n ≤ 20 | 2²⁰ ≈ 10⁶ | Subsets, bitmask, backtracking |
| n ≤ 500 | n³ ≈ 1.25·10⁸ | O(n³) DP |
| n ≤ 5,000 | n² = 2.5·10⁷ | O(n²) DP or pairs |
| n ≤ 2·10⁵ | n log n ≈ 3.5·10⁶ | Sorting, heaps, binary search, segment trees |
| n ≤ 10⁷ or more | about n | Linear scans, two pointers, math |

### Step 3: Order by expected score per minute

For each problem, estimate the points and the minutes. [[Expected score per minute]] decides the order, and it often says: easiest full solution first, then the brute force of the next one.

### Step 4: Bank, then improve

Where tests are scored one by one ([[partial scoring]]; read the instructions to confirm), a correct slow solution is worth real points. Write it, submit it, then optimise. If scoring is all-or-nothing for a problem, the brute force still helps: it becomes your checker for the fast version.

### Step 5: Defend against hidden tests

[[Hidden tests]] are where most marks are lost. Before every submit, run through this [[edge case]] list in 60 seconds:

- n = 0 or 1, if allowed. Empty strings.
- All elements equal; already sorted; reverse sorted.
- Negative numbers and zero.
- Maximum values: does a sum or product overflow 32 bits? Use 64-bit (`long long`) and take the modulo at every step if asked.
- The largest n: is anything accidentally O(n²), like erasing from the front of a vector inside a loop?
- Output format: spaces, new lines, "−1 if impossible", the exact modulo.

```cpp partial
// Two lines that fix a surprising number of hidden-test failures.
long long total = 0;                    // not int: 2e5 values of 1e9 overflow 32 bits
total = (total + 1LL * a * b) % MOD;    // 1LL forces 64-bit multiplication
```

:::insight
An assessment rewards banked points, not elegant attempts. Read everything, let the constraints choose the algorithm, take the surest points first, submit a correct brute force before chasing the optimal one, and spend the last minute of each problem on edge cases.
:::

## A tiny example

A 90-minute, three-problem test, each problem worth 100 points with per-test scoring. Your honest estimates (illustrative):

| Problem | Full solution | Brute force | Brute force passes |
|---|---|---|---|
| P1, easy | 15 min | n/a | n/a |
| P2, medium | 35 min | 10 min | about 40% |
| P3, hard | 60+ min | 15 min | about 20% |

Plan A, the "interesting problem first" approach: 70 minutes on P3, unfinished, then a rushed P1 in the last 20. Likely score: 100 if P1 survives the rush, perhaps 0 for P3.

Plan B, the chase:

| Time | Action | Banked |
|---|---|---|
| 0 to 5 | Read all three, note constraints | 0 |
| 5 to 20 | P1 full, edge-case check, submit | 100 |
| 20 to 55 | P2 full, submit | 200 |
| 55 to 70 | P3 brute force, submit | about 220 |
| 70 to 88 | Try P3's optimisation; submit only if it passes your brute-force comparison | 220 to 300 |
| 88 to 90 | Re-check the output format of everything | |

Plan B's worst case is better than Plan A's best realistic case.

:::try-this
P2's full solution looks like 50 minutes instead of 35, and its brute force passes about 40% in 10 minutes. After finishing P1 at minute 20, should you start P2's full solution or bank its brute force first? (Bank the brute force first: 10 minutes for about 40 points, then the full solution from minute 30 still finishes by minute 80. If the full solution stalls, you keep the 40 instead of 0.)
:::

:::warning
Common misconception: "if the samples pass, the solution is right." Samples are chosen to explain the problem, not to break your code. Failing hidden tests almost always means an edge case, overflow or a too-slow loop on the largest input. A one-minute checklist before submitting is the cheapest score you will ever earn.
:::

### Interview follow-ups

**"How do you test quickly without a debugger?"** Write two or three tiny custom inputs, including one edge case, and compare with values computed by hand. For a fast solution, compare it against your brute force on random small inputs, the idea in [Let a Robot Find Your Wrong Answer](article:cp-stress-testing).

**"You recognise none of the problems. What now?"** Use the steps in [What to Do When You Have Never Seen the Problem](article:dsa-problem-solving-framework): brute force first, find what repeats, then look at the constraints for the intended complexity.

**"Should you use the language you know best or the fastest one?"** The one you write correctly fastest. In C++, remember fast input (`ios::sync_with_stdio(false); cin.tie(nullptr);`) for large inputs.

## Where you'll see this again

Every coding round, and every contest, runs on this plan. The pattern articles that follow give you the moves; this gives you the match strategy. A common OA favourite is answering a question about "the smallest X that works", which is exactly [Guessing the Answer, Then Checking It](article:dsa-binary-search-answer).

## Key takeaways

- An online assessment scores points under a clock, so the order in which you attack problems matters as much as what you know.
- Read every problem and its constraints first, and let the constraint on n tell you the target complexity before you design anything.
- Where tests are scored individually, submit a correct brute force before chasing the optimal solution; otherwise keep it as a checker.
- Hidden tests target edge cases, overflow and maximum sizes, so run a one-minute edge-case checklist before every submission.
- Spend the last minutes checking output formats and the modulo, not starting something new.

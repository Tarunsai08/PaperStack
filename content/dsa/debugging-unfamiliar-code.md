---
id: "dsa-debugging-unfamiliar-code"
kind: "primer"
subject: "dsa"
slug: "debugging-unfamiliar-code"
title: "The Detective's Method for Someone Else's Bug"
subtitle: "Finding the bug in code you did not write: reproduce small, check invariants, know the usual suspects, and verify every fix, including an AI's"
track: "dsa-start"
track_order: 7
priority: "P2"
prerequisites: ["dsa-oa-strategy"]
difficulty: "beginner"
read_minutes: 11
topics: ["debugging", "invariants", "testing", "code review", "online assessment"]
glossary:
  - term: "Minimal failing input"
    definition: "The smallest input that still triggers the bug. Small inputs can be traced by hand, which makes the cause visible."
  - term: "Invariant"
    definition: "A statement that must be true at a certain point in the code every time, such as 'the answer lies in [lo, hi]'. A bug is a place where an invariant breaks."
  - term: "Strict weak ordering"
    definition: "The rule a sort comparator must follow in C++: comp(x, x) is false, and the comparison is consistent. Using <= instead of < breaks it."
  - term: "Stale state"
    definition: "Data left over from a previous test case or call that should have been reset, such as a global array that is never cleared."
quiz:
  - q: "A binary search loop `while (lo < hi) { mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }` never ends on some inputs. Why?"
    options: ["ok() is slow", "When hi = lo + 1, mid equals lo, and lo = mid makes no progress; it must be lo = mid + 1", "The loop condition should be lo <= hi", "Integer overflow"]
    answer: 1
    explain: "With integer division mid rounds down to lo, so assigning lo = mid repeats the same state forever. Each branch must shrink the range."
  - q: "A sort with comparator `return a.score <= b.score;` sometimes crashes. What is the bug?"
    options: ["Sorting is unstable", "The comparator must be strict (<); <= violates strict weak ordering and is undefined behaviour", "score should be a double", "sort needs a lambda"]
    answer: 1
    explain: "comp(x, x) must be false. With <= it is true, which breaks the sorting algorithm's assumptions and can read out of bounds."
  - q: "An AI assistant proposes a fix and the sample now passes. What should you do before trusting it?"
    options: ["Submit immediately", "Check that you understand why it fixes the cause, and test edge cases and a brute-force comparison", "Ask for a second fix", "Rename the variables"]
    answer: 1
    explain: "A fix that only makes the sample pass may hide the real bug. Understand the cause and test the cases that broke it."
cover_seed: "debugging-unfamiliar-code"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.65
---

## The hook

Some assessment rounds now hand you code instead of a blank editor: a working program with a bug, and a request to fix it. Amazon has described such a round, where you fix bugs across several coding tasks with help from an AI assistant. Code review in any job is the same skill.

It feels harder than writing code yourself. The variable names are someone else's, the logic is someone else's, and the bug could be anywhere in 80 lines.

Here is the twist: debugging unfamiliar code is mostly not about reading every line. It is about asking the code the right questions in the right order. By the end you will have a method, and a list of the six suspects responsible for most bugs in interview-sized programs.

## The intuition

:::analogy
A detective does not interview the whole city. She **narrows the suspects with alibis**: when did the crime happen, who could have been there, who has a motive. Each fact removes suspects until one remains. Then she confirms it with evidence before making an arrest.
:::

Debugging works the same way:

- **When did it happen?** Find the [[minimal failing input]] and the first line where the state goes wrong.
- **Who could have done it?** Check the usual suspects: boundaries, overflow, comparators, resets.
- **Alibis** are [[invariant]]s: facts that must be true at a line. A suspect whose alibi fails is your bug.
- **Evidence before arrest**: confirm with a test that failed before the fix and passes after.

## Let's build it up

### Step 1: Reproduce, then shrink

Get one failing input. Then make it smaller while it still fails: fewer elements, smaller values. A failing input of size 3 can be traced on paper; one of size 10⁵ cannot.

Wait, why not just read the code first? Because reading without a failing case means checking every line against every possible input in your head. A tiny failing input tells you which lines matter.

### Step 2: Write down what each part should guarantee

For each loop or function, state its invariant in one sentence: "after iteration i, best holds the maximum of a[0..i]"; "the answer is always in [lo, hi]". Then trace the small input and check the sentence at each step. The first step where it is false is where the bug lives.

### Step 3: Check the usual suspects

| Suspect | Typical symptom | Quick check |
|---|---|---|
| Off-by-one | Wrong on the first or last element; empty input crashes | Try n = 0, 1, 2 |
| Overflow | Correct on small values, garbage on large | Are sums or products of large values stored in int? |
| Comparator | Crash or odd order in sort | Is it strict (<) and consistent? |
| [[Stale state]] | First test correct, later tests wrong | Are globals and arrays reset per test? |
| Loop progress | Time limit exceeded, infinite loop | Does every branch shrink the problem? |
| Aliasing and invalidation | Random crashes | Modifying a container while iterating over it? |

### Step 4: Fix the cause, not the symptom

If the sample output is off by one, adding 1 at the end makes the sample pass and leaves the bug. Find which invariant broke and fix that line.

### Step 5: Verify, especially an AI's fix

An AI assistant is a fast suspect generator, not a judge. For any suggested change, ask: which invariant did it restore? Then run the minimal failing input, the edge cases and, if you can, a brute-force comparison, as in [Let a Robot Find Your Wrong Answer](article:cp-stress-testing).

:::insight
Debugging is a search problem: shrink the failing input, state what each part of the code must guarantee, and find the first place the guarantee breaks. The usual suspects (boundaries, overflow, comparators, stale state, loop progress, invalidation) explain most bugs in short programs.
:::

## A tiny example

Three buggy snippets, each with the suspect that did it.

**1. The binary search that never ends.**

```cpp partial
// Find the first index where ok(i) is true; assumes one exists in [lo, hi].
while (lo < hi) {
    int mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;          // BUG: when hi == lo + 1, mid == lo, so nothing changes
}
// Fix: else lo = mid + 1;   (mid failed, so the answer is strictly to its right)
```

Trace lo = 4, hi = 5 with ok(4) false: mid = 4, lo stays 4, forever. The invariant "the range shrinks every iteration" fails. Binary search done carefully is in [Binary Search Without the Off-by-One Fear](article:dsa-binary-search).

**2. The sum that turns negative.**

```cpp partial
int total = 0;                       // BUG: 10^5 values up to 10^5 squared reach 10^15
for (int x : a) total += x * x;      // x * x alone overflows int for x > 46340
// Fix: long long total = 0; total += 1LL * x * x;
```

Correct for small inputs, nonsense for large ones: the overflow suspect. Note that changing only `total` is not enough, because `x * x` is still computed in int.

**3. The sort that crashes.**

```cpp partial
sort(v.begin(), v.end(), [](const P& a, const P& b) {
    return a.score <= b.score;       // BUG: not a strict weak ordering
});
// Fix: return a.score < b.score;
```

A comparator must return false for equal elements ([[strict weak ordering]]). With <=, the behaviour is undefined, and with many equal scores the sort can read outside the array.

:::try-this
A function counts distinct values per test case using a global `set<int> seen;`. Test 1 prints 3 (correct). Test 2, with values {1, 2}, prints 4. Which suspect is it, and what is the fix? (Stale state: `seen` still holds test 1's values. Clear it at the start of each test case, or make it a local variable.)
:::

:::warning
Common misconception: "if the samples pass after my change, the bug is fixed." Samples are small and friendly. A fix that only changes the output for the sample, such as adding 1 at the end, usually hides the real bug. Confirm that the change restores a broken invariant, then test edge cases.
:::

### Interview follow-ups

**"How do you debug without a debugger?"** Print the state at the start of each loop iteration for the minimal failing input and compare it with what the invariant says it should be. Remove the prints before submitting.

**"The code is correct but too slow. How do you find where?"** Estimate each loop's cost from the constraints; look for hidden O(n) operations inside loops, such as erasing from the front of a vector, string concatenation in a loop, or copying a container passed by value.

**"How would you explain your fix in a code review?"** State the failing input, the invariant that broke, the line that broke it, the change, and the test that now covers it.

## Where you'll see this again

Every article in this subject lists common mistakes; they are this table, specialised. The online assessment game plan in [Chasing a Target: How to Play an Online Assessment](article:dsa-oa-strategy) relies on this method in its last minutes, when you check edge cases before submitting.

## Key takeaways

- Debugging unfamiliar code starts with a minimal failing input, because small inputs can be traced by hand.
- State the invariant each part of the code must keep, and the first place it breaks during a trace is where the bug lives.
- Most bugs in short programs come from a few suspects: off-by-one boundaries, overflow, non-strict comparators, stale state, loops that do not make progress, and container invalidation.
- Fix the broken invariant rather than adjusting the output, and verify every fix, including an AI assistant's, with edge cases and a brute-force comparison.

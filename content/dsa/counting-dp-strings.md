---
id: "dsa-counting-dp-strings"
kind: "pattern"
subject: "dsa"
slug: "counting-dp-strings"
title: "Building a Necklace Bead by Bead"
subtitle: "Counting valid strings with DP: remember only the last few beads, add one character at a time, and take the modulo at every step"
track: "dsa-dp"
track_order: 24
priority: "P1"
prerequisites: ["dsa-dp-intro", "dsa-modular-fast-power"]
difficulty: "intermediate"
read_minutes: 12
topics: ["dynamic programming", "counting", "strings", "modular arithmetic"]
complexity: { time: "O(n × states × alphabet)", space: "O(states)" }
practice_problems:
  - { name: "Count Vowels Permutation", platform: "LeetCode", url: "https://leetcode.com/problems/count-vowels-permutation/", difficulty: "Hard" }
  - { name: "Student Attendance Record II", platform: "LeetCode", url: "https://leetcode.com/problems/student-attendance-record-ii/", difficulty: "Hard" }
  - { name: "Non-negative Integers without Consecutive Ones", platform: "LeetCode", url: "https://leetcode.com/problems/non-negative-integers-without-consecutive-ones/", difficulty: "Hard" }
  - { name: "Count Number of Texts", platform: "LeetCode", url: "https://leetcode.com/problems/count-number-of-texts/", difficulty: "Medium" }
glossary:
  - term: "Counting DP"
    definition: "Dynamic programming whose table entries are numbers of ways rather than best values, combined by adding instead of taking a max or min."
  - term: "Suffix state"
    definition: "The small summary of a partial string that decides which characters may come next, such as its last character or the length of its current run."
  - term: "Transition"
    definition: "The rule that moves counts from strings of length L to strings of length L + 1 by appending one allowed character."
  - term: "Complement counting"
    definition: "Counting the strings that break a rule as (all strings) minus (strings that obey it)."
quiz:
  - q: "How many binary strings of length 5 have no two adjacent 1s?"
    options: ["8", "13", "16", "21"]
    answer: 1
    explain: "The counts for lengths 1 to 5 are 2, 3, 5, 8, 13: each length adds strings ending in 0 (any previous) and strings ending in 1 (only after a 0)."
  - q: "For attendance records (fewer than 2 absences, never 3 lates in a row), what must the state remember?"
    options: ["The whole string", "Absences used so far (0 or 1) and the current run of trailing lates (0, 1 or 2)", "Only the length", "The number of P characters"]
    answer: 1
    explain: "Those two numbers decide which next characters are allowed. That gives 2 × 3 = 6 states per length."
  - q: "You compute bad = (total − good) % MOD in C++ and get a negative number. Why, and what is the fix?"
    options: ["Overflow in total", "After taking modulo, total can be smaller than good, and % keeps the sign; use (total − good + MOD) % MOD", "MOD is wrong", "Use double"]
    answer: 1
    explain: "Both values were reduced modulo MOD, so their difference can be negative. Adding MOD before the final % keeps it in range."
cover_seed: "counting-dp-strings"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.8
---

## The hook

A Microsoft-style OA question: count the binary strings of length n with no two consecutive 1s. For n = 5, list them by hand and you will find 13. For n = 10⁵, there are more such strings than atoms in the universe, so the answer is asked "modulo 10⁹ + 7".

You cannot generate them. You cannot even store one count without the modulo. Yet the solution is a loop with two variables.

Here is the question to hold in your head while reading: when you append the next character to a valid string, how much of the string do you actually need to remember? (Spoiler: almost nothing, and that is the whole technique.)

## The intuition

:::analogy
You are **building a necklace bead by bead** under a rule: "never two red beads side by side". When you add the next bead, you do not need to look at the whole necklace. You only need to see the **last bead**. If it is red, the next must be white; if it is white, the next can be either. Two kinds of unfinished necklaces (ending red, ending white) are all you ever need to count.
:::

That is **[[counting DP]]** over strings:

- Group partial strings by a tiny **[[suffix state]]**: whatever about the end of the string decides what may come next.
- A **[[transition]]** appends one character and moves counts from length L to length L + 1.
- Add counts instead of maximising, and take the modulo at every addition.

## How it works

Four questions turn a rule into a DP:

1. **What breaks the rule?** For "no 11", a 1 after a 1.
2. **What is the least I must remember to know if the next character breaks it?** The last character. That is the state.
3. **For each state and each next character, which state results?** That is the transition table.
4. **What are the counts at length 1, and where is the answer?** Usually: every single character is valid; the answer is the sum over states at length n.

For "no two consecutive 1s":

| From state | Append 0 | Append 1 |
|---|---|---|
| ends in 0 | ends in 0 | ends in 1 |
| ends in 1 | ends in 0 | not allowed |

So end0[L] = end0[L−1] + end1[L−1] and end1[L] = end0[L−1].

### When one character is not enough

Some rules need a slightly bigger memory:

- **"Never three L in a row"**: remember the length of the current run of L (0, 1 or 2).
- **"At most one A in the whole string"**: remember how many A's were used (0 or 1). This is not about the suffix, but it is still a small number that decides what may come next.
- **"Each vowel may only be followed by certain vowels"**: remember the last vowel (5 states), with a transition table given by the rules.

Wait, why not remember the whole string, to be safe? Because the number of distinct states is what makes DP fast. Remembering the whole string means 2ⁿ states, which is the brute force you were trying to avoid.

:::insight
Counting strings with a rule is a walk through a tiny machine whose states are "what the end of the string looks like". Find the smallest state that decides the next character, write its transition table, and add counts length by length, taking the modulo each time.
:::

## Walk through an example

**No two consecutive 1s, n = 5.**

| Length L | end0 | end1 | Total |
|---|---|---|---|
| 1 | 1 ("0") | 1 ("1") | 2 |
| 2 | 1 + 1 = 2 | 1 | 3 |
| 3 | 2 + 1 = 3 | 2 | 5 |
| 4 | 3 + 2 = 5 | 3 | 8 |
| 5 | 5 + 3 = 8 | 5 | **13** |

The totals are Fibonacci numbers, which is no coincidence: the recurrence is total[L] = total[L−1] + total[L−2]. Recognising a known sequence lets you jump to huge n with matrix exponentiation, as in [Jumping a Billion Steps Ahead in a Recurrence](article:cp-matrix-exponentiation).

**Attendance records**: each day is P (present), A (absent) or L (late). A record is valid with fewer than 2 A's in total and never 3 L's in a row. State = (A's used ∈ {0, 1}, trailing L's ∈ {0, 1, 2}), six states.

| Next char | Effect on (a, l) | Allowed when |
|---|---|---|
| P | (a, 0) | always |
| A | (1, 0) | a = 0 |
| L | (a, l + 1) | l < 2 |

Running this gives 3 valid records of length 1, 8 of length 2 and 19 of length 3. For n = 10101 the count, modulo 10⁹ + 7, is 183236316.

:::try-this
How many strings of length 3 over {a, b} have no "aa"? Write the end-a / end-b table. (Length 1: end-a 1, end-b 1. Length 2: end-a = end-b(1) = 1, end-b = 1 + 1 = 2, total 3. Length 3: end-a = 2, end-b = 1 + 2 = 3, total 5. It is the same machine as "no 11".)
:::

## The code

```pseudo
count_strings(n):
    count[state] = number of valid length-1 strings ending in that state
    repeat n - 1 times:
        next = all zeros
        for each state s with count[s] > 0:
            for each character c allowed after s:
                t = transition(s, c)
                next[t] = (next[t] + count[s]) mod M
        count = next
    return sum of count[s] mod M
```

The C++ runs three problems: no consecutive ones (and its complement), vowel strings and attendance records.

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

// Binary strings of length n with no two adjacent 1s. State: last character.
ll noConsecutiveOnes(int n) {
    ll end0 = 1, end1 = 1;                         // length 1: "0" and "1"
    for (int len = 2; len <= n; len++) {
        ll n0 = (end0 + end1) % MOD;               // append 0 after anything
        ll n1 = end0;                              // append 1 only after a 0
        end0 = n0, end1 = n1;
    }
    return (end0 + end1) % MOD;
}

// Binary strings of length n that DO contain "11": total minus good, careful with the modulo.
ll withConsecutiveOnes(int n) {
    ll total = 1;
    for (int i = 0; i < n; i++) total = total * 2 % MOD;
    return (total - noConsecutiveOnes(n) + MOD) % MOD;    // + MOD keeps it non-negative
}

// Count Vowels Permutation: a->e, e->a/i, i->anything but i, o->i/u, u->a.
ll vowelStrings(int n) {
    ll a = 1, e = 1, i = 1, o = 1, u = 1;
    for (int len = 2; len <= n; len++) {
        ll na = (e + i + u) % MOD, ne = (a + i) % MOD, ni = (e + o) % MOD, no = i, nu = (i + o) % MOD;
        a = na, e = ne, i = ni, o = no, u = nu;
    }
    return (a + e + i + o + u) % MOD;
}

// Attendance records of length n: fewer than 2 'A' in total, never 3 'L' in a row.
// State: absences so far (0 or 1) and the current run of trailing 'L' (0, 1 or 2).
ll attendance(int n) {
    ll dp[2][3] = {{1, 0, 0}, {0, 0, 0}};
    for (int day = 0; day < n; day++) {
        ll nd[2][3] = {};
        for (int a = 0; a < 2; a++)
            for (int l = 0; l < 3; l++) {
                ll v = dp[a][l];
                if (!v) continue;
                nd[a][0] = (nd[a][0] + v) % MOD;                   // P resets the late run
                if (a == 0) nd[1][0] = (nd[1][0] + v) % MOD;       // A uses the one absence
                if (l < 2) nd[a][l + 1] = (nd[a][l + 1] + v) % MOD; // L extends the run
            }
        memcpy(dp, nd, sizeof dp);
    }
    ll total = 0;
    for (auto& row : dp) for (ll v : row) total = (total + v) % MOD;
    return total;
}

int main() {
    cout << noConsecutiveOnes(5) << "\n";     // 13
    cout << withConsecutiveOnes(5) << "\n";   // 19
    cout << vowelStrings(5) << "\n";          // 68
    cout << attendance(2) << "\n";            // 8
    cout << attendance(10101) << "\n";        // 183236316
}
```

## Complexity

**O(n · S · Σ) time** for S states and an alphabet of Σ characters, and **O(S) space**, because each length needs only the previous one. With 6 states and 3 characters, n = 10⁵ is about 1.8 million steps.

## Common mistakes

:::warning
Common misconception: "the modulo can be taken once at the end." Counts grow exponentially, so they overflow 64-bit integers within a few dozen steps (2ⁿ passes 2⁶³ at n = 63; the Fibonacci-like count above passes it around n = 91). Take the modulo after every addition, and when you subtract (as in [[complement counting]]), add MOD before the final % so the result is never negative.
:::

- **State too small**: remembering only the last character for "no three L in a row" misses runs; check that the state truly decides every next move.
- **State too big**: storing the whole suffix or the full string brings back the brute force.
- **Wrong base case**: the empty string (length 0) is 1 way; length 1 is the number of allowed single characters. Mixing them shifts every answer.
- **Forgetting global limits**: "fewer than 2 A's in total" is not a suffix property; it still has to be in the state.

### Interview follow-ups

**"How many binary strings of length n contain '11' at least once?"** Complement counting: 2ⁿ − (strings without 11), computed modulo M as (total − good + MOD) % MOD. For n = 5: 32 − 13 = 19.

**"n is 10¹⁸ now."** The transition is linear, so raise the transition matrix to the n-th power in O(S³ log n).

**"Count numbers up to N with no consecutive ones in binary."** The strings are now bounded by N, so add a "still tight to N" flag to the state; that is digit DP, as in [Rolling the Odometer Without Passing the Limit](article:cp-digit-dp).

## Practice problems

Start with **Count Vowels Permutation**, where the transition table is given directly. Then **Count Number of Texts** (runs of a repeated key), then **Student Attendance Record II** (two-part state). **Non-negative Integers without Consecutive Ones** adds an upper bound, a first step into digit DP. For the DP basics, see [Dynamic Programming Is Just Careful Recursion](article:dsa-dp-intro), and for modular arithmetic, [Arithmetic on a Clock That Never Overflows](article:dsa-modular-fast-power).

## Key takeaways

- To count strings that obey a rule, group partial strings by the smallest state that decides which character may come next, usually something about the end of the string.
- Write the transition table from each state and character to the next state, then add counts length by length; only the previous length is needed.
- Take the modulo after every addition, and add MOD before reducing a subtraction so results stay non-negative.
- Global limits such as "at most one A" belong in the state too, as small counters.
- If the recurrence is linear, matrix exponentiation handles astronomically large n.

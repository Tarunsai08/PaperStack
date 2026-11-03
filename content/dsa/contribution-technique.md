---
id: "dsa-contribution-technique"
kind: "pattern"
subject: "dsa"
slug: "contribution-technique"
title: "Splitting the Bill by What Each Person Ate"
subtitle: "The contribution technique: stop looping over subarrays and ask how many of them each element affects"
track: "dsa-linear"
track_order: 16
priority: "P0"
prerequisites: ["dsa-monotonic-stack", "dsa-prefix-sums"]
difficulty: "intermediate"
read_minutes: 13
topics: ["contribution technique", "monotonic stack", "counting", "subarrays"]
complexity: { time: "O(n)", space: "O(n)" }
practice_problems:
  - { name: "Sum of Subarray Minimums", platform: "LeetCode", url: "https://leetcode.com/problems/sum-of-subarray-minimums/", difficulty: "Medium" }
  - { name: "Sum of Subarray Ranges", platform: "LeetCode", url: "https://leetcode.com/problems/sum-of-subarray-ranges/", difficulty: "Medium" }
  - { name: "Total Appeal of A String", platform: "LeetCode", url: "https://leetcode.com/problems/total-appeal-of-a-string/", difficulty: "Hard" }
  - { name: "Count Unique Characters of All Substrings of a Given String", platform: "LeetCode", url: "https://leetcode.com/problems/count-unique-characters-of-all-substrings-of-a-given-string/", difficulty: "Hard" }
  - { name: "Maximum Subarray Min-Product", platform: "LeetCode", url: "https://leetcode.com/problems/maximum-subarray-min-product/", difficulty: "Medium" }
glossary:
  - term: "Contribution technique"
    definition: "Computing a sum over many groups (such as all subarrays) by adding up, for each element, its value times the number of groups in which it counts."
  - term: "Span"
    definition: "For an element, the range of start and end positions of subarrays in which it is the minimum (or maximum); its size is left count times right count."
  - term: "Previous smaller element"
    definition: "The nearest element to the left that is smaller than (or, by a chosen rule, at most) the current one."
  - term: "Tie-breaking rule"
    definition: "A convention such as 'the leftmost minimum owns the subarray', used so that equal values never count the same subarray twice."
quiz:
  - q: "In the array [5, 9, 7], in how many subarrays does the element at index 1 (value 9) appear?"
    options: ["2", "3", "4", "6"]
    answer: 2
    explain: "It can start at index 0 or 1 (2 choices) and end at index 1 or 2 (2 choices), so (i + 1)·(n − i) = 2·2 = 4 subarrays."
  - q: "Why use 'previous smaller or equal' on one side and 'next strictly smaller' on the other?"
    options: ["It is faster", "So that when equal values tie for the minimum, exactly one of them owns each subarray and nothing is counted twice", "Because the stack requires it", "To handle negative numbers"]
    answer: 1
    explain: "With both sides strict, a subarray like [2, 2] would be counted for both 2s. Making one side inclusive gives ownership to the leftmost (or rightmost) minimum only."
  - q: "How do you get the sum of (max − min) over all subarrays quickly?"
    options: ["Two nested loops", "Sum of subarray maxima minus sum of subarray minima, each by contribution", "Sort the array first", "Prefix sums of max and min"]
    answer: 1
    explain: "The sum splits into two independent sums. Each is a contribution problem with a monotonic stack, so the whole thing is O(n)."
cover_seed: "contribution-technique"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.9
---

## The hook

An online assessment gives you an array of up to 10⁵ numbers and asks: over **every** subarray, add up the minimum element. Give the answer modulo 10⁹ + 7.

There are about 5·10⁹ subarrays. Even finding each minimum in O(1) would blow a 2-second limit. And yet the expected solution is O(n), one pass with a stack.

Here is the shift in thinking that makes it possible. Do not ask "what is the minimum of this subarray?" five billion times. Ask, for each element, "**how many subarrays is this element the minimum of?**" Then multiply and add. Try to predict the answer for the array [3, 1, 2, 4] before you scroll: it is the running example for this whole article.

## The intuition

:::analogy
Ten friends share one restaurant bill. You could take every dish and argue about who shared it. Or you could **split the bill by what each person ate**: each person's total is their dishes times their price, and adding all the people gives the same bill. Same total, completely different way of adding it up.
:::

That is the **[[contribution technique]]**. A sum over subarrays (the dishes) is rewritten as a sum over elements (the people):

Σ over subarrays of min(subarray) = Σ over elements a[i] × (number of subarrays where a[i] is the minimum).

The second form has only n terms. The whole problem becomes: for each element, count the subarrays it "owns".

### The easiest case first: sum of all subarray sums

Every subarray containing index i adds a[i] to the total. How many subarrays contain index i? A start position from 0 to i (that is i + 1 choices) and an end position from i to n − 1 (n − i choices).

So the sum of all subarray sums is Σ a[i]·(i + 1)·(n − i). For [1, 2, 3]: 1·1·3 + 2·2·2 + 3·3·1 = 3 + 8 + 9 = 20. Check by brute force: 1 + 2 + 3 + 3 + 5 + 6 = 20.

## How it works

For the minimum, element a[i] owns a subarray only if nothing smaller is inside it. So the subarray must stay between the **[[previous smaller element]]** on the left and the next smaller element on the right. That stretch is its **[[span]]**.

- **left[i]** = number of valid start positions = distance back to the previous smaller element.
- **right[i]** = number of valid end positions = distance forward to the next smaller element.
- Contribution of a[i] = a[i] × left[i] × right[i].

Both distances come from a monotonic stack in one pass each, exactly as in [Who Can See Over the Crowd](article:dsa-monotonic-stack).

### Wait, what about equal values?

Predict the answer for [2, 2, 2]. The subarray [2, 2] has two minimums. If both of them claim it, you count it twice.

The fix is a **[[tie-breaking rule]]**: let the **leftmost** minimum own the subarray. In code, that means asymmetric comparisons:

- On the left, stop at the previous element that is **≤** a[i] (an equal value on the left already owns subarrays that extend over it).
- On the right, stop only at the next element that is **strictly <** a[i] (equal values on the right are included in a[i]'s span).

With both sides strict, [2, 2, 2] gives 20. With the asymmetric rule it gives 12, which is correct: six subarrays, each with minimum 2.

:::insight
Turn "for every group, find something" into "for every element, count the groups it decides". The counting is almost always (choices on the left) × (choices on the right), and a monotonic stack finds those boundaries in O(n).
:::

## Walk through an example

Array [3, 1, 2, 4], n = 4. Left counts stop at the previous element ≤ a[i]; right counts stop at the next element < a[i].

| i | a[i] | Previous ≤ at | left[i] | Next < at | right[i] | Subarrays owned | Contribution |
|---|---|---|---|---|---|---|---|
| 0 | 3 | none (−1) | 1 | index 1 | 1 | [3] | 3·1·1 = 3 |
| 1 | 1 | none (−1) | 2 | none (4) | 3 | 2·3 = 6 subarrays | 1·2·3 = 6 |
| 2 | 2 | index 1 | 1 | none (4) | 2 | [2], [2,4] | 2·1·2 = 4 |
| 3 | 4 | index 2 | 1 | none (4) | 1 | [4] | 4·1·1 = 4 |

Total: 3 + 6 + 4 + 4 = **17**. There are 4·5/2 = 10 subarrays, and the owned counts 1 + 6 + 2 + 1 add up to exactly 10, so every subarray is counted once.

### The same idea, three more ways

- **Sum of subarray ranges** (max − min): sum of maxima minus sum of minima. Maxima are just minima of the negated array, so reuse the same function. For [4, −2, −3, 4, 1] the answer is 59.
- **Counting characters in substrings**: in "Total Appeal of A String", each position adds 1 to every substring where it is the first occurrence of its letter, so it contributes (i − previous occurrence) × (n − i).
- **Pairs after sorting**: the sum of |a[i] − a[j]| over all pairs becomes, after sorting, Σ a[i]·(i − (n − 1 − i)): each element is the larger one in i pairs and the smaller one in n − 1 − i pairs.

:::try-this
Compute the sum of subarray minimums of [2, 1, 2] using contributions. (Index 0: left 1, right 1, contributes 2. Index 1: left 2, right 2, contributes 1·4 = 4. Index 2: left 1 (previous ≤ is index 1), right 1, contributes 2. Total 8. Check: subarrays [2], [1], [2], [2,1], [1,2], [2,1,2] have minimums 2+1+2+1+1+1 = 8.)
:::

## The code

```pseudo
sum_of_minimums(a):
    n = length(a)
    stack = empty
    for i in 0 .. n - 1:                       // left counts
        while stack not empty and a[top] > a[i]: pop
        left[i] = i - (top index, or -1 if empty)
        push i
    clear stack
    for i in n - 1 down to 0:                  // right counts
        while stack not empty and a[top] >= a[i]: pop
        right[i] = (top index, or n if empty) - i
        push i
    return sum of a[i] * left[i] * right[i]
```

The C++ prints the results of every example above. In a judge that asks for the answer modulo 10⁹ + 7, take the modulo after each multiplication.

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// left[i]: how many start positions make a[i] the minimum (stop at previous <= a[i]).
// right[i]: how many end positions (stop at next < a[i]). Ties go to the leftmost minimum.
ll sumOfMins(const vector<ll>& a) {
    int n = a.size();
    vector<ll> left(n), right(n);
    vector<int> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] > a[i]) st.pop_back();
        left[i] = i - (st.empty() ? -1 : st.back());
        st.push_back(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
        right[i] = (st.empty() ? n : st.back()) - i;
        st.push_back(i);
    }
    ll total = 0;
    for (int i = 0; i < n; i++) total += a[i] * left[i] * right[i];
    return total;
}

// Sum over subarrays of (max - min): maxima are minima of the negated array.
ll sumOfRanges(const vector<ll>& a) {
    vector<ll> neg(a.size());
    for (size_t i = 0; i < a.size(); i++) neg[i] = -a[i];
    return -sumOfMins(neg) - sumOfMins(a);
}

// Sum of all subarray sums: a[i] appears in (i + 1) * (n - i) subarrays.
ll sumOfSums(const vector<ll>& a) {
    ll n = a.size(), total = 0;
    for (ll i = 0; i < n; i++) total += a[i] * (i + 1) * (n - i);
    return total;
}

int main() {
    cout << sumOfMins({3, 1, 2, 4}) << "\n";          // 17
    cout << sumOfMins({2, 2, 2}) << "\n";             // 12
    cout << sumOfRanges({1, 3, 3}) << "\n";           // 4
    cout << sumOfRanges({4, -2, -3, 4, 1}) << "\n";   // 59
    cout << sumOfSums({1, 2, 3}) << "\n";             // 20
}
```

## Complexity

Each index is pushed and popped at most once per pass, so both passes are O(n), and the final sum is O(n). Total **O(n) time, O(n) space**, compared with O(n²) or O(n³) for brute force.

## Common mistakes

:::warning
Common misconception: "use strict comparisons on both sides, it is symmetric." Symmetric rules double-count subarrays whose minimum appears more than once. One side must be inclusive (≤ or ≥) and the other strict, so exactly one copy of a repeated value owns each subarray.
:::

- **Overflow**: a[i]·left·right can reach about 10⁹ · 10⁵ · 10⁵ = 10¹⁹ before any modulo, beyond 64 bits. Reduce a[i] modulo M first and take the modulo after each multiplication.
- **Off-by-one in boundaries**: use −1 and n as sentinels when no smaller element exists, so the counts are i + 1 and n − i.
- **Mixing up which stack pass is which**: write a comment stating the tie rule for each side before coding.
- **Forgetting the sign trick** for maxima: negate, reuse the minimum function, negate the result.

### Interview follow-ups

**"How would you count subarrays where a[i] is the maximum and the sum of the subarray is at most K?"** Contribution alone no longer works, because the subarray's sum matters too. You fall back to two pointers or prefix sums plus binary search inside each span, a typical OA twist.

**"What is the maximum of (min × sum) over subarrays?"** For each element as the minimum, its best subarray is its whole span; compute the span sum with [Answering a Million Range Questions Instantly](article:dsa-prefix-sums) and take the best. That is "Maximum Subarray Min-Product".

**"Where else does this pattern hide?"** The largest rectangle in a histogram is the same span idea with max instead of sum, as in [Pushing a Box Under the Skyline](article:dsa-largest-rectangle).

## Practice problems

Start with **Sum of Subarray Minimums** (the running example), then **Sum of Subarray Ranges** (reuse with negation). **Maximum Subarray Min-Product** adds prefix sums to the span. Finish with the two string problems, **Total Appeal of A String** and **Count Unique Characters of All Substrings**, where the "span" is the distance between occurrences of a letter.

## Key takeaways

- The contribution technique turns a sum over all subarrays (or pairs, or substrings) into a sum over elements: each element's value times the number of groups it counts in.
- For subarray minimums, each element owns left × right subarrays, where the boundaries are the previous and next smaller elements found with a monotonic stack in O(n).
- Equal values need an asymmetric tie rule, inclusive on one side and strict on the other, so every subarray is counted exactly once.
- The same idea gives sums of subarray sums, ranges, substring character counts and sorted pair differences, which makes it one of the most reused tricks in online assessments.
- Watch for overflow: take the modulo after every multiplication when the problem asks for it.

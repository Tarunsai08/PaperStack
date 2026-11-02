---
id: "dsa-string-patterns"
kind: "pattern"
subject: "dsa"
slug: "string-patterns"
title: "Mirrors, Anagrams and Letter Counts"
subtitle: "String patterns for interviews: count arrays of 26, expand around the centre, and build strings without hidden quadratic costs"
track: "dsa-arrays"
track_order: 6
priority: "P0"
prerequisites: ["dsa-hashing-patterns", "dsa-two-pointers"]
difficulty: "beginner"
read_minutes: 9
topics: ["strings", "palindromes", "anagrams", "two pointers", "counting"]
complexity: { time: "O(n) for counting and two-pointer checks; O(n^2) for expand-around-centre", space: "O(1) with a fixed alphabet" }
practice_problems:
  - { name: "Valid Anagram", platform: "LeetCode", url: "https://leetcode.com/problems/valid-anagram/", difficulty: "Easy" }
  - { name: "Valid Palindrome", platform: "LeetCode", url: "https://leetcode.com/problems/valid-palindrome/", difficulty: "Easy" }
  - { name: "Longest Palindromic Substring", platform: "LeetCode", url: "https://leetcode.com/problems/longest-palindromic-substring/", difficulty: "Medium" }
  - { name: "Palindromic Substrings", platform: "LeetCode", url: "https://leetcode.com/problems/palindromic-substrings/", difficulty: "Medium" }
  - { name: "Longest Repeating Character Replacement", platform: "LeetCode", url: "https://leetcode.com/problems/longest-repeating-character-replacement/", difficulty: "Medium" }
glossary:
  - term: "Frequency array"
    definition: "An array of 26 counters, one per lowercase letter, used instead of a hash map when the alphabet is small and fixed."
  - term: "Anagram"
    definition: "A word formed by rearranging all the letters of another, like 'listen' and 'silent'."
  - term: "Palindrome"
    definition: "A string that reads the same forwards and backwards, like 'racecar' or 'abba'."
  - term: "Expand around centre"
    definition: "Finding palindromes by starting from each possible middle and growing outwards while both ends match."
  - term: "Immutable string"
    definition: "A string that cannot be changed in place, so every 'change' creates a new copy. In C++ std::string is mutable, but s = s + c still builds a new string."
quiz:
  - q: "How do you check if two lowercase strings are anagrams in O(n)?"
    options: ["Sort both and compare in O(n)", "Count letters with one array of 26: add for the first string, subtract for the second, and check all zero", "Compare the first letters", "Use nested loops"]
    answer: 1
    explain: "Anagrams have identical letter counts. One frequency array, incremented for one string and decremented for the other, ends at all zeros exactly when they match."
  - q: "How many centres does expand-around-centre try for a string of length n?"
    options: ["n", "2n − 1, because even-length palindromes have a centre between two characters", "n squared", "log n"]
    answer: 1
    explain: "Each character is an odd-length centre, and each gap between neighbours is an even-length centre: n + (n − 1) centres."
  - q: "Why is s = s + c inside a loop over n characters slow?"
    options: ["It is not slow", "Each step copies the whole string built so far, so the total work is O(n squared)", "Characters cannot be added", "It uses recursion"]
    answer: 1
    explain: "s + c creates a new string of the current length each time. Use s += c or push_back, which append in amortised O(1)."
cover_seed: "string-patterns"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

String questions look endless: anagrams, palindromes, "longest substring with at most k changes", "group words that are rearrangements of each other". Then you notice something. Almost all of them reduce to two tools you already know: counting letters, and two pointers moving in from the ends or out from the middle.

Learn those two tools in their string form, plus one performance trap, and a whole category of interview questions turns routine.

## The intuition

:::analogy
Think of a mirror placed at the middle of a word. If the word is a palindrome, the left half's reflection matches the right half exactly. To check, you can stand at both ends and walk inward, comparing letters, or stand at the mirror and walk outward. And to check whether two words are anagrams, you do not care about order at all: you just pour each word's letters into a row of 26 labelled cups and see whether the cups match.
:::

The cups are a [[frequency array]]. Walking from both ends toward the mirror, or outward from it, is two pointers applied to strings.

## How it works

### Tool 1: count letters

When the alphabet is small, say 26 lowercase letters, an array of 26 counters beats a hash map: it is faster, simpler and uses constant space. For [[anagram]]s, add one per letter of the first word and subtract one per letter of the second. All zeros means the words match. The same cups also answer "can these letters form a palindrome?": at most one cup may hold an odd count.

The same counts power sliding-window string problems: keep counts for the letters inside the window and update them as characters enter and leave, as in [The Caterpillar That Reads Arrays in One Pass](article:dsa-sliding-window).

### Tool 2: walk with two pointers

- **Is it a [[palindrome]]?** Put pointers at both ends, compare, move inward. Stop at the first mismatch.
- **Longest palindromic substring?** Use [[expand around centre]]: for each possible centre, grow outward while the letters on both sides match. Odd-length palindromes centre on a character; even-length ones centre between two characters, so there are 2n − 1 centres.

```mermaid
flowchart TD
  A[String problem] --> B{Does order matter}
  B -- no, just which letters --> C[Count with an array of 26]
  B -- yes, symmetry --> D[Two pointers: ends inward or centre outward]
  B -- yes, contiguous window --> E[Sliding window with letter counts]
  C --> F[Compare counts or track a window]
```

:::insight
Ask whether order matters. If it does not, anagrams, permutations, "can be rearranged into", count letters and compare counts. If it does, use pointers: from both ends for a whole-string check, from a centre for substrings, or a window for contiguous ranges.
:::

### The performance trap

In many languages strings are an [[immutable string]] type, and even in C++ the expression `s = s + c` builds a brand-new string each time. Doing that n times copies 1 + 2 + ... + n characters: O(n²). Append in place with `s += c` or `s.push_back(c)`, which is amortised O(1), or collect pieces and join once.

## Walk through an example

**Longest palindromic substring** of `"cbbd"` with expand around centre.

| Centre | Type | Expansion | Palindrome found |
|---|---|---|---|
| c (0) | odd | c | "c", length 1 |
| between c and b | even | c ≠ b | none |
| b (1) | odd | b; then c vs b differ | "b" |
| between b and b | even | b = b; then c vs d differ | **"bb", length 2** |
| b (2) | odd | b; then b vs d differ | "b" |
| between b and d | even | b ≠ d | none |
| d (3) | odd | d | "d" |

Answer: "bb". An approach that only tried characters as centres would miss it, because "bb" is centred between two letters.

:::try-this
Check whether "rat" and "tar" are anagrams with one array of 26 cups. Then check "rat" and "car". (rat/tar: r, a, t each go +1 then −1, all cups end at 0, anagrams. rat/car: t stays +1 and c ends at −1, not anagrams.)
:::

## The code

```pseudo
is_anagram(s, t):
    if len(s) != len(t): return false
    cnt = [0] * 26
    for i in range: cnt[s[i]] += 1; cnt[t[i]] -= 1
    return all cnt == 0

longest_palindrome(s):
    best = (0, 1)                        // start, length
    for c in 0 .. len(s)-1:
        for (l, r) in [(c, c), (c, c+1)]:      // odd and even centres
            while l >= 0 and r < len(s) and s[l] == s[r]: l -= 1; r += 1
            if r - l - 1 > best.length: best = (l + 1, r - l - 1)
    return s[best.start : best.start + best.length]
```

```cpp
#include <bits/stdc++.h>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    array<int, 26> cnt{};
    for (size_t i = 0; i < s.size(); i++) { cnt[s[i] - 'a']++; cnt[t[i] - 'a']--; }
    for (int c : cnt) if (c != 0) return false;
    return true;
}

string longestPalindrome(const string& s) {
    int n = s.size(), start = 0, len = n ? 1 : 0;
    for (int c = 0; c < n; c++) {
        for (int k = 0; k < 2; k++) {
            int l = c, r = c + k;
            while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
            if (r - l - 1 > len) { len = r - l - 1; start = l + 1; }
        }
    }
    return s.substr(start, len);
}

int main() {
    cout << isAnagram("listen", "silent") << ' ' << longestPalindrome("cbbd") << '\n';  // 1 bb
}
```

## Complexity

- **Anagram check:** O(n) time, O(1) space with a fixed 26-letter alphabet.
- **Palindrome check with two pointers:** O(n) time, O(1) space.
- **Expand around centre:** O(n²) time in the worst case, such as "aaaa...", O(1) space. Manacher's algorithm, covered in the CP subject, does it in O(n).

## Common mistakes

:::warning
Common misconception: "a hash map is always the right way to count characters." For a small fixed alphabet, an array of 26 or 128 counters is faster and simpler. Use a hash map when the alphabet is large or unknown, such as Unicode words.
:::

- **Forgetting even-length centres** in palindrome problems.
- **Off-by-one when recovering the substring** after expansion: the palindrome is from l + 1 to r − 1.
- **Assuming lowercase only** when the input may contain capitals, digits or spaces; normalise first, as in Valid Palindrome.
- **Building strings with `s = s + c`** in a loop, which is quadratic.

## Practice problems

*Valid Anagram* and *Valid Palindrome* are the two tools in their purest form. *Longest Palindromic Substring* and *Palindromic Substrings* use expand around centre; the second counts every expansion step. *Longest Repeating Character Replacement* combines letter counts with a sliding window: the window is valid while its length minus its most frequent letter's count is at most k.

## Key takeaways

- Many string problems reduce to two tools: counting letters, and two pointers that move inward from the ends or outward from a centre.
- For a small fixed alphabet, an array of 26 counters is the fastest way to compare letter counts, as in anagram checks.
- Expand around each of the 2n − 1 centres to find palindromic substrings, remembering that even-length palindromes centre between letters.
- Combine letter counts with a sliding window for contiguous substring problems.
- Append to strings in place; building with s = s + c in a loop is quadratic.

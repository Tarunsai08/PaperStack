---
id: "dsa-hashing-patterns"
kind: "pattern"
subject: "dsa"
slug: "hashing-patterns"
title: "The Notebook That Turns O(n²) Into O(n)"
subtitle: "Hash map patterns: remember what you have seen, count, and group by a key"
track: "dsa-arrays"
track_order: 4
priority: "P0"
prerequisites: ["dsa-cpp-stl-toolkit"]
difficulty: "beginner"
read_minutes: 8
topics: ["hashing", "hash map", "arrays", "strings"]
complexity: { time: "O(n) average", space: "O(n)" }
practice_problems:
  - { name: "Two Sum", platform: "LeetCode", url: "https://leetcode.com/problems/two-sum/", difficulty: "Easy" }
  - { name: "Contains Duplicate", platform: "LeetCode", url: "https://leetcode.com/problems/contains-duplicate/", difficulty: "Easy" }
  - { name: "Group Anagrams", platform: "LeetCode", url: "https://leetcode.com/problems/group-anagrams/", difficulty: "Medium" }
  - { name: "Longest Consecutive Sequence", platform: "LeetCode", url: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "Medium" }
  - { name: "Subarray Sum Equals K", platform: "LeetCode", url: "https://leetcode.com/problems/subarray-sum-equals-k/", difficulty: "Medium" }
  - { name: "Top K Frequent Elements", platform: "LeetCode", url: "https://leetcode.com/problems/top-k-frequent-elements/", difficulty: "Medium" }
glossary:
  - term: "Hash map"
    definition: "A structure that stores key-value pairs and finds a key in constant time on average by turning it into a bucket number."
  - term: "Complement"
    definition: "The value you still need to reach a target, such as target minus the current number."
  - term: "Frequency map"
    definition: "A hash map from each item to how many times it has appeared."
  - term: "Canonical key"
    definition: "A standard form of an item, such as its sorted letters, chosen so that items that belong together get the same key."
  - term: "Collision"
    definition: "When two different keys land in the same bucket of a hash table, which slows lookups if it happens a lot."
quiz:
  - q: "In Two Sum, when should you insert the current number into the map?"
    options: ["Before checking for its complement", "After checking for its complement", "Only at the end", "It does not matter for any input"]
    answer: 1
    explain: "Checking first prevents pairing a number with itself, for example target 8 with a single 4. Inserting afterwards keeps the answer correct."
  - q: "Which canonical key groups 'eat', 'tea' and 'ate' together?"
    options: ["The first letter", "The length", "The letters sorted: 'aet'", "The sum of character codes"]
    answer: 2
    explain: "All anagrams have the same letters, so sorting gives the same string. Length or first letter would also group words that are not anagrams."
  - q: "What is the worst-case time of a single unordered_map lookup?"
    options: ["O(1) always", "O(log n)", "O(n) when many keys collide", "O(n log n)"]
    answer: 2
    explain: "It is O(1) on average, but if many keys land in the same bucket, a lookup may scan all of them."
cover_seed: "hashing-patterns"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.92
---

## The hook

Two Sum is probably the most famous interview question in the world. Given a list of numbers, find two that add up to a target. Most people's first answer checks every pair, and with 100,000 numbers that is about five billion checks.

The fix is so small it feels like cheating: keep a notebook of the numbers you have already seen. One pass, and you are done. That notebook is a hash map, and it quietly solves a huge share of interview problems.

## The intuition

:::analogy
Picture a coat check at a theatre. When you hand over a coat, the attendant does not search the whole room later. They give you a numbered ticket, and the number tells them exactly which hook to walk to. A [[hash map]] works the same way: it turns a key into a hook number, so finding it later takes one walk, not a search.
:::

Most brute-force solutions are slow because they search. "Is there an earlier number that pairs with this one?" means scanning everything before it. A hash map turns that search into a single lookup, which is O(1) on average.

That gives three core patterns you will use constantly, plus two more further down:

- **Seen before?** Store items as you go and ask whether the partner you need is already there.
- **How many?** Count occurrences with a [[frequency map]].
- **Which group?** Map each item to a [[canonical key]] and bucket items that share it.

## How it works

### Pattern 1: remember what you have seen

For each number `x`, the partner you need is its [[complement]], `target - x`. Ask the map whether you have seen it. If not, record `x` and move on.

```mermaid
flowchart TD
  A[Read next number x] --> B{Is target minus x in the map}
  B -- yes --> C[Found the pair]
  B -- no --> D[Store x with its index]
  D --> A
```

### Pattern 2: count things

A frequency map answers "how many times?" in one pass: `count[x]++` for every item. Valid Anagram, majority element, "first unique character" and many more are frequency questions in disguise.

### Pattern 3: group by a key

Two items belong in the same group exactly when they share some standard form. For anagrams, the standard form is the sorted letters: "eat", "tea" and "ate" all become "aet". Use that as the map key, and append each word to its key's list.

### Pattern 4: remember where you first saw it

Sometimes the fact you need is not "have I seen x?" but "where did I first see x?". *Contiguous Array* asks for the longest subarray with equally many 0s and 1s. Count a 1 as +1 and a 0 as −1, and keep a running total. A subarray is balanced exactly when the running total is the same at both of its ends. So store the first index of every running total; when the total repeats, the stretch since that first index is balanced, and storing only the first index makes it as long as possible.

### Pattern 5: two maps for a one-to-one match

*Isomorphic Strings* asks whether the letters of one string can be renamed to give the other, with each letter always mapping to the same letter and no two letters mapping to the same one. One map is not enough: "badc" and "baba" fit a one-way map from the first string to the second (b to b, a to a, d to b, c to a), yet d and b both land on b. Keep a map in each direction, and reject as soon as either disagrees.

### What is inside the notebook

A hash map turns a key into a bucket number with a hash function, then looks only in that bucket. With 7 buckets and the hash "key mod 7", the keys 10, 22, 31, 4 and 15 land in buckets 3, 1, 3, 4 and 1. Keys 10 and 31 share bucket 3: that is a [[collision]], and the map keeps both in the bucket and compares them on lookup.

As long as buckets hold only a few keys on average, every lookup is a short walk. When the map fills up, it grows to more buckets and re-places everything, an occasional O(n) step that averages out to O(1) per insert. If many keys are forced into one bucket, lookups slow to O(n), which is how contest tests attack `unordered_map`.

### Choosing the key: a cheat sheet

| Problem | What you store | Key | Value |
|---|---|---|---|
| Two Sum | numbers seen so far | the number | its index |
| Contains Duplicate II | latest position of each number | the number | last index |
| Group Anagrams | buckets of words | sorted letters, or 26 counts | list of words |
| Subarray Sum Equals K | prefix sums seen so far | the prefix sum | how many times |
| Contiguous Array | running balance | the balance | first index |
| Top K Frequent | how often each value appears | the value | its count |
| Isomorphic Strings | letter renamings | a letter | the letter it maps to |

### When not to reach for a hash map

A hash map costs O(n) extra memory and gives up order. If the array is already sorted, two pointers find a pair in O(n) time with O(1) memory. If you need "the next bigger key" or keys in order, use an ordered `map` instead. And if the keys are small integers, say values from 0 to 1,000, a plain array of counts is faster and simpler than any hash map. Use the notebook when you need fast lookups by arbitrary keys and order does not matter.

:::insight
The whole skill is choosing what to store as the key. Ask: "what fact about earlier items would let me answer instantly for the current one?" Store that fact as the key.
:::

## Walk through an example

Two Sum with `nums = [3, 8, 4, 5]` and `target = 9`. The map stores value → index.

| Step | x | Complement 9 − x | In map? | Map after step |
|---|---|---|---|---|
| 0 | 3 | 6 | no | {3: 0} |
| 1 | 8 | 1 | no | {3: 0, 8: 1} |
| 2 | 4 | 5 | no | {3: 0, 8: 1, 4: 2} |
| 3 | 5 | 4 | **yes, at index 2** | done |

Answer: indices 2 and 3. Notice that we check before we insert. With target 8 and `nums = [4, 1]`, inserting first would let 4 pair with itself.

### First positions: Contiguous Array on [0, 1, 1, 0, 1, 1, 1, 0]

The map starts with balance 0 at index −1, meaning "before the array, the balance was zero".

| i | Value | Balance | First seen? | Longest balanced so far |
|---|---|---|---|---|
| 0 | 0 | −1 | first, store index 0 | 0 |
| 1 | 1 | 0 | seen at −1, length 2 | 2 |
| 2 | 1 | 1 | first, store index 2 | 2 |
| 3 | 0 | 0 | seen at −1, length 4 | 4 |
| 4 | 1 | 1 | seen at 2, length 2 | 4 |
| 5 | 1 | 2 | first, store index 5 | 4 |
| 6 | 1 | 3 | first, store index 6 | 4 |
| 7 | 0 | 2 | seen at 5, length 2 | 4 |

The answer is 4, the subarray `[0, 1, 1, 0]`. It is the coat check again: the ticket for "balance 0" was handed out at the very start, and when balance 0 shows up again, you know exactly how far back it began.

### Counting, then bucketing: Top K Frequent Elements

For `[1, 1, 1, 2, 2, 3]` and k = 2, a frequency map gives {1: 3, 2: 2, 3: 1}. Instead of sorting by count, which costs O(n log n), drop each value into a bucket indexed by its count: bucket 3 holds 1, bucket 2 holds 2, bucket 1 holds 3. Walk the buckets from the highest count down and take the first k values: 1, then 2. Counts can never exceed n, so there are only n + 1 buckets and the whole thing is O(n).

:::try-this
Group these words by anagram: "listen", "stone", "silent", "notes", "enlist", "tones". Write the sorted-letters key for each by hand. You should get two groups: key "eilnst" for listen, silent, enlist, and key "enost" for stone, notes, tones.
:::

## The code

The idea first:

```pseudo
two_sum(nums, target):
    seen = empty map from value to index
    for i, x in nums:
        if (target - x) in seen:
            return [seen[target - x], i]
        seen[x] = i
    return none

group_anagrams(words):
    groups = empty map from key to list
    for w in words:
        groups[sorted letters of w].append(w)
    return all lists in groups
```

Compact C++:

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;  // value -> index
    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {};
}

vector<vector<string>> groupAnagrams(const vector<string>& words) {
    unordered_map<string, vector<string>> groups;
    for (const string& w : words) {
        string key = w;
        sort(key.begin(), key.end());
        groups[key].push_back(w);
    }
    vector<vector<string>> out;
    for (auto& [key, list] : groups) out.push_back(list);
    return out;
}

int longestBalanced(const vector<int>& a) {          // equal 0s and 1s
    unordered_map<int, int> first{{0, -1}};          // balance -> first index
    int bal = 0, best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        bal += a[i] ? 1 : -1;
        auto it = first.find(bal);
        if (it != first.end()) best = max(best, i - it->second);
        else first[bal] = i;                         // keep only the first index
    }
    return best;
}

vector<int> topKFrequent(const vector<int>& a, int k) {
    unordered_map<int, int> cnt;
    for (int x : a) cnt[x]++;
    vector<vector<int>> bucket(a.size() + 1);        // bucket[c] = values seen c times
    for (auto& [v, c] : cnt) bucket[c].push_back(v);
    vector<int> res;
    for (int c = a.size(); c >= 1 && (int)res.size() < k; c--)
        for (int v : bucket[c]) if ((int)res.size() < k) res.push_back(v);
    return res;
}

bool isomorphic(const string& s, const string& t) {
    unordered_map<char, char> st, ts;                // one map in each direction
    for (int i = 0; i < (int)s.size(); i++) {
        auto a = st.find(s[i]), b = ts.find(t[i]);
        if ((a != st.end() && a->second != t[i]) || (b != ts.end() && b->second != s[i])) return false;
        st[s[i]] = t[i], ts[t[i]] = s[i];
    }
    return true;
}

int main() {
    auto r = twoSum({3, 8, 4, 5}, 9);
    cout << r[0] << ' ' << r[1] << '\n';                                             // 2 3
    cout << groupAnagrams({"eat", "tea", "tan", "ate", "nat", "bat"}).size() << '\n';  // 3
    cout << longestBalanced({0, 1, 1, 0, 1, 1, 1, 0}) << '\n';                       // 4
    for (int v : topKFrequent({1, 1, 1, 2, 2, 3}, 2)) cout << v << ' ';
    cout << '\n';                                                                    // 1 2
    cout << isomorphic("egg", "add") << isomorphic("foo", "bar") << isomorphic("badc", "baba") << '\n';  // 100
}
```

## Complexity

- **Two Sum:** O(n) time on average, one lookup and one insert per element; O(n) space for the map.
- **Group Anagrams:** sorting each word of length k costs O(k log k), so O(n · k log k) in total, plus O(n · k) space for the stored words. With only lowercase letters, a 26-count key gives O(n · k).

These are average costs. A single hash lookup can be O(n) in the worst case when many keys cause a [[collision]], which is why contest problems sometimes include tests designed to slow down `unordered_map`.

## Common mistakes

:::warning
Common misconception: "hash maps are always O(1)." They are O(1) on average. In interviews that is the accepted answer, but in contests with adversarial tests, a `map` (O(log n)) or a custom hash function is safer.
:::

- **Inserting before checking** in Two Sum, which pairs an element with itself.
- **Using `map[key]` just to check existence.** In C++, `m[key]` inserts a default value when the key is missing. Use `find` or `count` to look without inserting.
- **Iterating an `unordered_map` and expecting order.** It has none. If you need sorted output, use `map` or sort afterwards.
- **Storing the latest index when you need the first,** as in Contiguous Array, which makes balanced stretches look shorter than they are.
- **One map where a bijection is needed,** as in Isomorphic Strings.
- **Choosing a key that is too weak.** Length or letter sums group words that are not anagrams. A key must be equal exactly when the items belong together.

## Practice problems

Start with *Two Sum* and *Contains Duplicate* to get the "seen before" reflex. *Group Anagrams* practises choosing a canonical key. *Longest Consecutive Sequence* uses a set cleverly: only start counting from numbers whose predecessor is missing. *Subarray Sum Equals K* combines this pattern with [prefix sums](article:dsa-prefix-sums): store how many times each prefix sum has appeared, and look up `prefix - k`. *Top K Frequent Elements* is counting followed by bucketing.

Afterwards, try *Contiguous Array* and *Isomorphic Strings* on LeetCode to practise patterns 4 and 5.

## Key takeaways

- A hash map turns "search everything before me" into one average O(1) lookup, which often drops a solution from O(n²) to O(n).
- A few patterns cover most uses: remember what you have seen, count with a frequency map, group by a canonical key, remember where you first saw something, and keep two maps for one-to-one matches.
- The core skill is choosing the key, the fact about earlier items that answers the current question instantly.
- In Two Sum, check for the complement before inserting the current number so an element never pairs with itself.
- Hash lookups are O(1) on average but O(n) in the worst case, so use an ordered map or custom hash when inputs may be adversarial.

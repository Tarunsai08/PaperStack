---
id: "cp-nim-games"
kind: "problem-walkthrough"
subject: "cp"
slug: "nim-games"
title: "Why XOR Decides Who Takes the Last Matchstick"
subtitle: "The proof behind the Nim rule, the misère twist and its exception, staircase Nim, and bounded-removal variants"
track: "cp-misc"
track_order: 12
priority: "P1"
prerequisites: ["cp-sprague-grundy"]
difficulty: "intermediate"
read_minutes: 13
topics: ["game theory", "nim", "xor", "misère", "staircase nim"]
complexity: { time: "O(k) for k piles", space: "O(1)" }
practice_problems:
  - { name: "Nim Game", platform: "LeetCode", url: "https://leetcode.com/problems/nim-game/", difficulty: "Easy" }
  - { name: "Nim Game I", platform: "CSES", url: "https://cses.fi/problemset/task/1730", difficulty: "Medium" }
  - { name: "Nim Game II", platform: "CSES", url: "https://cses.fi/problemset/task/1098", difficulty: "Medium" }
  - { name: "Stair Game", platform: "CSES", url: "https://cses.fi/problemset/task/1099", difficulty: "Medium" }
glossary:
  - term: "Nim"
    definition: "A game with several piles of objects. On each turn a player removes any positive number of objects from one pile. Under normal play, whoever cannot move loses."
  - term: "Nim-sum"
    definition: "The XOR of all pile sizes. The player to move loses normal-play Nim exactly when it is 0."
  - term: "Balanced position"
    definition: "A position whose Nim-sum is 0: in binary, every power of two appears an even number of times across the piles."
  - term: "Misère play"
    definition: "The convention where the player who takes the last object loses, instead of winning."
  - term: "Staircase Nim"
    definition: "A game with coins on numbered stairs, where a move slides any positive number of coins from one stair to the stair directly below. Coins on the bottom stair can no longer move."
  - term: "Bounded Nim"
    definition: "Nim where each move removes between 1 and k objects from one pile. Each pile then behaves like a Nim pile of size n mod (k + 1)."
quiz:
  - q: "Piles are 6, 9, 13 and 7 under normal play. Which move wins?"
    options: ["Take all 9 from the second pile", "Reduce 13 to 8, making the Nim-sum 0", "Reduce 6 to 5", "There is no winning move"]
    answer: 1
    explain: "6 ⊕ 9 ⊕ 13 ⊕ 7 = 5. Pile 13 has the 4s bit set, and 13 ⊕ 5 = 8 < 13, so reducing it to 8 leaves 6 ⊕ 9 ⊕ 8 ⊕ 7 = 0. Reducing 6 to 3 or 7 to 2 also works."
  - q: "Misère Nim with piles 1, 1 and 4. What should the first player do?"
    options: ["Empty the pile of 4, as in normal Nim", "Reduce the 4 to 1, leaving three piles of size 1", "Take one of the 1s", "Nothing works, it is a loss"]
    answer: 1
    explain: "Emptying the 4 leaves 1, 1: the opponent takes one and you are forced to take the last. Leaving 1, 1, 1 means the opponent takes the first and the last of the three, so they lose."
  - q: "In staircase Nim, why can moves from an even stair be ignored?"
    options: ["They are illegal", "Whatever coins land on an odd stair, the winner can push those same coins one stair further down, restoring the odd stairs exactly", "Even stairs are always empty", "They do not change the game"]
    answer: 1
    explain: "Such moves are reversible. The odd-stair piles return to exactly what they were, so only moves from odd stairs, which act like Nim moves, matter."
cover_seed: "nim-games"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.76
---

## The hook

Four piles of matchsticks sit on a table: 6, 9, 13 and 7. You and a friend take turns removing as many sticks as you like from any single pile, and whoever takes the last stick wins. Your friend says "you go first". Should you agree?

You may know the rule from [Counting Backwards From the Last Move](article:cp-game-theory): XOR the pile sizes, and the player to move wins exactly when the result is non-zero. But a rule you cannot explain is a rule you cannot bend. Interviewers ask why it works, and in contests the twist, a misère ending or a staircase, is the whole problem.

## The problem

Under normal play, given k piles of sizes p₁, ..., pₖ, decide whether the first player wins [[Nim]] with perfect play, and if so find a winning move. This is *Nim Game I* on CSES. Then handle three common variants: [[misère play]], where taking the last stick loses; [[staircase Nim]]; and [[bounded Nim]], where each move takes at most k sticks.

:::analogy
Imagine every pile of matchsticks is tied into bundles of 1, 2, 4, 8 and so on, using each bundle size at most once per pile. A pile of 13 becomes one bundle of 8, one of 4 and one of 1. Now look across the table at each bundle size. Call the table balanced when every bundle size appears an even number of times. Nim is a fight over balance: whoever hands over a balanced table is winning.
:::

The bundles are binary digits, and "every bundle size an even number of times" means "the XOR of the piles is 0". That XOR is the [[Nim-sum]], and a table with Nim-sum 0 is a [[balanced position]].

## The obvious approach

Run the win/lose DP with the tuple of all pile sizes as the state. Even four piles of size 20 give 21⁴ = 194,481 states, and contest piles reach 10⁹.

Guessing a simple rule fails too. "The first player wins when the total is odd" fails on piles 1 and 3: the total 4 is even, yet the first player wins by taking 2 from the 3, leaving 1 and 1. Something finer than the total decides the game, and it is the bundle count for each size.

## The key insight

### Why XOR is the rule

Three facts prove it.

1. **The empty table is balanced.** No bundles at all means every count is 0, which is even. The player facing it cannot move and loses.
2. **From a balanced table, every move unbalances it.** A move changes the bundles of exactly one pile, so at least one bundle size flips from an even count to an odd one. In XOR terms, changing one pile changes the XOR, so it cannot stay 0.
3. **From an unbalanced table, some move balances it.** Let x be the Nim-sum, and look at the biggest bundle size that appears an odd number of times, the highest set bit of x. Pick a pile p that contains that bundle. Rebuild it as p ⊕ x: this removes that big bundle and only reshuffles smaller ones, so p ⊕ x < p and the move is legal. Afterwards every count is even.

So whoever receives a balanced table can only pass back an unbalanced one, which the other player rebalances. Sticks only disappear, so the game ends, on the empty balanced table, in front of the player who kept receiving balanced tables.

:::insight
Nim is a fight over balance. Every move from a balanced table breaks it, and every unbalanced table can be rebalanced by rebuilding one pile as p ⊕ x, where p contains the highest bundle that x says is out of balance.
:::

### The misère twist, and its exception

In misère Nim the player who takes the last stick loses. The rule is almost the same:

- **If some pile has 2 or more sticks**, play exactly as in normal Nim: the player to move wins when the Nim-sum is non-zero.
- **If every pile has 0 or 1 stick**, the rule flips: the player to move wins when the number of 1-piles is even.

Why the exception? With only single sticks left, every move is forced and the game lasts exactly as many moves as there are 1-piles. With an odd count, the player to move takes the last stick, which wins in normal play and loses in misère.

Why the rest stays the same: a balanced table can never have **exactly one** pile of size 2 or more (a big pile), because that pile's bundle of 2 or larger would appear an odd number of times.

So suppose you face an unbalanced table with at least two big piles. Your rebalancing move changes one pile, so at least one big pile survives, and since the result is balanced, at least two survive. Your opponent then changes one pile and leaves at least one big pile behind.

The first time you face **exactly one** big pile, stop copying normal Nim. Shrink that pile to 0 or 1, whichever leaves an **odd** number of 1-piles. From there every move is forced, and your opponent takes the last stick.

### Staircase Nim

Coins sit on stairs 0 (the bottom), 1, 2 and up. A move slides any positive number of coins from stair i to stair i − 1, so coins on stair 0 are stuck. Whoever cannot move loses.

**Rule: XOR only the coin counts on the odd-numbered stairs.** Even stairs do not matter.

- A move from an odd stair to the even stair below removes coins from an odd pile. On the odd stairs, that is exactly a Nim move, and coins arriving on an even stair change nothing that counts.
- A move from an even stair to the odd stair below adds coins to an odd pile. The winner reverses it by sliding those same coins one more stair down. The odd stairs look exactly as before, and the game still ends because coins only travel downward.

If the bottom stair is numbered 1, the stairs that count are 2, 4, 6 and so on.

### Bounded removal and other variants

- **Take 1 to k sticks per move.** A pile of n reaches n − 1 down to n − k (or 0). By induction their values are their remainders mod (k + 1), which include every value below n mod (k + 1) but never that value itself. So the pile acts like a Nim pile of size n mod (k + 1), in the sense of [Every Small Game Is a Nim Pile in Disguise](article:cp-sprague-grundy), and several piles combine by XOR. With k = 3 and one pile, you lose exactly when n is a multiple of 4.
- **Take from up to k piles at once** (Moore's Nim). Write the piles in binary; the player to move loses exactly when, for every bit position, the number of piles with that bit set is divisible by k + 1. Ordinary Nim is the case k = 1.

## Walk through an example

**Normal play, piles 6, 9, 13, 7.** Bundle the sticks:

| Pile | 8 | 4 | 2 | 1 |
|---|---|---|---|---|
| 6 | | 1 | 1 | |
| 9 | 1 | | | 1 |
| 13 | 1 | 1 | | 1 |
| 7 | | 1 | 1 | 1 |
| count | 2 | 3 | 2 | 3 |

The 4s and the 1s appear an odd number of times, so the Nim-sum is 4 + 1 = 5 and the table is unbalanced: **you should go first.** The biggest odd bundle is 4, and piles 6, 13 and 7 all contain one. Each gives a winning move:

| Pile p | p ⊕ 5 | Move | New Nim-sum |
|---|---|---|---|
| 6 | 3 | take 3 sticks | 3 ⊕ 9 ⊕ 13 ⊕ 7 = 0 |
| 13 | 8 | take 5 sticks | 6 ⊕ 9 ⊕ 8 ⊕ 7 = 0 |
| 7 | 2 | take 5 sticks | 6 ⊕ 9 ⊕ 13 ⊕ 2 = 0 |

Pile 9 has no 4-bundle: 9 ⊕ 5 = 12 would mean adding sticks.

**Misère, piles 1, 1, 4.** The Nim-sum is 4, and there is a big pile, so the player to move wins. Normal Nim says empty the 4, leaving 1, 1, but in misère that hands your friend an even number of 1-piles: they take one, and you must take the last.

Since 4 is the only big pile, reduce it to 1 instead. Now there are three 1-piles, an odd count, with your friend to move. They take one, you take one, and they are forced to take the last stick.

**Staircase, coins (3, 2, 4, 5)** on stairs 0, 1, 2, 3. The odd stairs hold 2 and 5, and 2 ⊕ 5 = 7, so the first player wins. In Nim on piles 2 and 5, the move is 5 → 5 ⊕ 7 = 2, so slide 3 coins from stair 3 to stair 2, giving (3, 2, 7, 2).

Suppose your friend now slides 4 coins from stair 2 to stair 1, giving (3, 6, 3, 2). You slide those same 4 coins from stair 1 to stair 0, giving (7, 2, 3, 2), and the odd stairs are back to 2 and 2. A brute-force search over every small staircase confirms the odd-stairs rule.

:::try-this
Misère Nim with piles 2 and 2. Who wins? (There are two big piles and the Nim-sum is 0, so the player to move loses. If they empty a pile, the other player takes 1 from the remaining 2, leaving a single stick for them. If they leave 1 and 2, the other player empties the 2, again leaving a single stick for them.)
:::

## The code

```pseudo
normal_wins(piles):  return XOR(piles) != 0

winning_move(piles):
    x = XOR(piles)
    for each pile p at index i:
        if (p XOR x) < p: return (i, p XOR x)          // set pile i to this size

misere_wins(piles):
    if max(piles) <= 1: return count of 1-piles is even
    return XOR(piles) != 0

staircase_wins(coins):  return XOR of coins[i] for odd i != 0      // stair 0 at the bottom

bounded_wins(piles, k): return XOR of (p mod (k + 1)) != 0
```

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

ll nimSum(const vector<ll>& v) { ll x = 0; for (ll p : v) x ^= p; return x; }

bool misereWins(const vector<ll>& v) {
    ll big = *max_element(v.begin(), v.end());
    if (big <= 1) return count(v.begin(), v.end(), 1LL) % 2 == 0;
    return nimSum(v) != 0;
}

bool staircaseWins(const vector<ll>& coins) {         // coins[0] is the bottom stair
    ll x = 0;
    for (size_t i = 1; i < coins.size(); i += 2) x ^= coins[i];
    return x != 0;
}

bool boundedWins(const vector<ll>& v, ll k) {
    ll x = 0;
    for (ll p : v) x ^= p % (k + 1);
    return x != 0;
}

int main() {
    vector<ll> piles = {6, 9, 13, 7};
    ll x = nimSum(piles);
    cout << x << ':';                                         // 5:
    for (ll p : piles) if ((p ^ x) < p) cout << ' ' << p << "->" << (p ^ x);
    cout << '\n';                                             // 6->3 13->8 7->2
    cout << misereWins({1, 1, 4}) << misereWins({1, 1, 1})
         << misereWins({2, 2}) << '\n';                       // 100
    cout << staircaseWins({3, 2, 4, 5}) << staircaseWins({3, 2, 7, 2}) << '\n';  // 10
    cout << boundedWins({8}, 3) << boundedWins({10}, 3) << '\n';                 // 01
}
```

## Complexity

- **Time:** O(k) for k piles or stairs, one XOR each, and another O(k) pass to find a winning move.
- **Space:** O(1) beyond the input.
- **Values:** XOR never overflows; just use `long long` if sizes can exceed 32 bits.

## Common mistakes

:::warning
Common misconception: "misère Nim is normal Nim with the answer flipped." Flipping is right only when every pile has 0 or 1 stick. With any pile of 2 or more, misère and normal Nim have the same winner. Test with piles 1, 1, 4 and 2, 2 to catch both wrong versions.
:::

- **XORing every stair in staircase Nim.** Only odd distances from the bottom count. Check how the statement numbers its stairs before choosing which ones.
- **Picking the wrong pile for the winning move.** Only a pile containing the highest set bit of x works.
- **Bounded Nim with the plain XOR.** With a move limit of k, XOR the values p mod (k + 1), not the sizes.
- **Applying XOR to dependent piles.** If one move can change two piles, as in Wythoff's game, XOR does not apply.
- **Not resetting the XOR** between test cases.

## Practice problems

Start with *Nim Game* (LeetCode): one pile, removals of 1 to 3, so check n mod 4. *Nim Game I* is the XOR rule. *Nim Game II* is bounded Nim, so XOR the remainders mod 4. *Stair Game* is staircase Nim: decide which stairs are an odd number of steps above the bottom first.

Nim and its variants appear on Codeforces from roughly the 1500 rating range, usually disguised as a story about coins, tokens or cards.

## Key takeaways

- In normal-play Nim, the player to move loses exactly when the XOR of the pile sizes is 0, because every move breaks a zero XOR and every non-zero XOR can be restored to zero.
- The winning move takes a pile p that contains the highest set bit of the Nim-sum x and reduces it to p ⊕ x.
- Misère Nim follows the normal rule while any pile has 2 or more objects, and flips only when every pile has at most 1, where the player to move wins with an even number of 1-piles.
- Staircase Nim is ordinary Nim on the stairs an odd number of steps above the bottom, because moves from the other stairs can always be reversed.
- When each move removes at most k objects, a pile of n acts like a Nim pile of n mod (k + 1), and the piles combine by XOR.

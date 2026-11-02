---
id: "dsa-fast-slow-pointers"
kind: "pattern"
subject: "dsa"
slug: "fast-slow-pointers"
title: "The Tortoise and the Hare on a Circular Track"
subtitle: "Fast and slow pointers: detect cycles, find where they start, and find the middle, all in O(1) extra space"
track: "dsa-linear"
track_order: 2
priority: "P0"
prerequisites: ["dsa-linked-list-basics"]
difficulty: "intermediate"
read_minutes: 10
topics: ["linked lists", "two pointers", "cycle detection", "floyd"]
complexity: { time: "O(n)", space: "O(1)" }
practice_problems:
  - { name: "Linked List Cycle", platform: "LeetCode", url: "https://leetcode.com/problems/linked-list-cycle/", difficulty: "Easy" }
  - { name: "Middle of the Linked List", platform: "LeetCode", url: "https://leetcode.com/problems/middle-of-the-linked-list/", difficulty: "Easy" }
  - { name: "Linked List Cycle II", platform: "LeetCode", url: "https://leetcode.com/problems/linked-list-cycle-ii/", difficulty: "Medium" }
  - { name: "Happy Number", platform: "LeetCode", url: "https://leetcode.com/problems/happy-number/", difficulty: "Easy" }
  - { name: "Find the Duplicate Number", platform: "LeetCode", url: "https://leetcode.com/problems/find-the-duplicate-number/", difficulty: "Medium" }
glossary:
  - term: "Cycle"
    definition: "A loop in a linked structure where following next pointers eventually returns to a node already visited."
  - term: "Slow pointer"
    definition: "A pointer that moves one step at a time."
  - term: "Fast pointer"
    definition: "A pointer that moves two steps at a time."
  - term: "Cycle entry"
    definition: "The first node of the cycle, where the straight part of the list joins the loop."
  - term: "Floyd's algorithm"
    definition: "The tortoise-and-hare method for detecting a cycle and finding its entry with two pointers and O(1) memory."
quiz:
  - q: "Why must the fast pointer eventually meet the slow pointer if there is a cycle?"
    options: ["Because they start together", "Once both are in the cycle, the fast one gains exactly one step per move, so the gap shrinks by one each time until it reaches zero", "Because the cycle is short", "It might never meet"]
    answer: 1
    explain: "Inside the loop, the distance from slow to fast changes by one each step, so it must hit zero; the fast pointer cannot jump over the slow one."
  - q: "After the pointers meet, how do you find the cycle entry?"
    options: ["Return the meeting node", "Move one pointer back to the head, then move both one step at a time; they meet at the entry", "Count the cycle length only", "Reverse the list"]
    answer: 1
    explain: "The distance from the head to the entry equals the distance from the meeting point to the entry, modulo the cycle length, so stepping together lands both at the entry."
  - q: "When the fast pointer reaches the end of a list with no cycle, where is the slow pointer?"
    options: ["At the head", "At the middle", "At the last node", "At a random node"]
    answer: 1
    explain: "Slow has taken half as many steps as fast, so it is at the middle."
cover_seed: "fast-slow-pointers"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

A linked list might end, or it might loop back on itself forever. How do you tell, without a hash set of visited nodes? Walk it and you will either reach the end or walk in circles forever, and you cannot know which is happening.

There is a neat answer that uses no extra memory at all: send two runners down the list at different speeds. If there is a loop, the fast one will lap the slow one. The same trick then tells you exactly where the loop begins, and as a bonus, finds the middle of a list in one pass.

## The intuition

:::analogy
Picture two runners on a track. The tortoise jogs one step at a time; the hare runs two. If the track is a straight road with an end, the hare simply reaches the finish first. But if the road bends into a circular lap, the hare enters the loop, keeps going round, and eventually comes up behind the tortoise and catches it. Catching up can only happen on a loop.
:::

The [[slow pointer]] is the tortoise, the [[fast pointer]] is the hare, and a [[cycle]] is the circular lap. This is [[Floyd's algorithm]].

## How it works

### Detecting a cycle

Start both pointers at the head. Each step, slow moves one node and fast moves two.

- If fast reaches null (or fast's next is null), the list ends: no cycle.
- If slow and fast ever point to the same node, there is a cycle.

Why they must meet: once both are inside the loop, consider the distance from slow forward to fast. Each step, fast moves two and slow moves one, so the gap changes by exactly one. A gap that changes by one each step must pass through zero, so fast cannot skip over slow.

### Finding the cycle entry

Let a be the distance from the head to the [[cycle entry]], b the distance from the entry to the meeting point along the loop, and L the loop length. When they meet:

- slow has walked a + b steps,
- fast has walked 2(a + b), which is a + b plus some whole number k of extra laps: 2(a + b) = a + b + kL.

So a + b = kL, which means a = kL − b. In words: walking a steps from the meeting point lands exactly on the entry, because it completes the rest of the lap (L − b) plus whole laps. So reset one pointer to the head and move both one step at a time; they meet at the entry.

```mermaid
flowchart TD
  A[slow and fast start at head] --> B[slow moves 1, fast moves 2]
  B --> C{fast reached the end}
  C -- yes --> D[No cycle]
  C -- no --> E{slow equals fast}
  E -- no --> B
  E -- yes --> F[Move one pointer to head]
  F --> G[Move both one step until they meet]
  G --> H[Meeting node is the cycle entry]
```

### Finding the middle

Without a cycle, when fast reaches the end, slow has gone half as far: it is at the middle. For an even-length list, the exact middle chosen depends on the loop condition, which interview problems specify.

:::insight
Two pointers moving at different speeds turn questions about the shape of a structure, "does it loop?", "where is the middle?", into questions about distance, which you can answer with simple arithmetic and O(1) memory.
:::

### Beyond linked lists

Anything that repeatedly applies a function x → f(x) forms a "list" where the next pointer is f. If values come from a finite set, the sequence must eventually loop. That is how fast and slow pointers solve *Happy Number* (repeatedly summing squares of digits) and *Find the Duplicate Number* (treating each value as a pointer to an index).

## Walk through an example

List: 1 → 2 → 3 → 4 → 5 → 6, and 6 points back to 3. So a = 2 (nodes 1, 2 before the entry 3), and the loop 3 → 4 → 5 → 6 → 3 has L = 4.

| Step | slow | fast |
|---|---|---|
| 0 | 1 | 1 |
| 1 | 2 | 3 |
| 2 | 3 | 5 |
| 3 | 4 | 3 |
| 4 | 5 | 5 |

They meet at node 5. Now move one pointer to the head:

| Step | pointer from head | pointer from meeting |
|---|---|---|
| 0 | 1 | 5 |
| 1 | 2 | 6 |
| 2 | 3 | 3 |

They meet at node 3, the entry. Check the formula: b = 2 (3 → 4 → 5), L = 4, and a = L − b = 2. ✓

:::try-this
For the list 1 → 2 → 3 → 4 → 5 with no cycle, trace slow and fast until fast cannot move two steps. Where is slow? (slow: 1, 2, 3; fast: 1, 3, 5, then fast's next is null. Slow is at 3, the middle.)
:::

## The code

```pseudo
has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return true
    return false

cycle_entry(head):
    slow = fast = head
    loop until slow == fast (return none if fast reaches the end)
    slow = head
    while slow != fast:
        slow = slow.next; fast = fast.next
    return slow
```

```cpp
#include <bits/stdc++.h>
using namespace std;

struct Node { int val; Node* next = nullptr; Node(int v) : val(v) {} };

Node* cycleEntry(Node* head) {
    Node *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) { slow = slow->next; fast = fast->next; }
            return slow;
        }
    }
    return nullptr;  // no cycle
}

int main() {
    vector<Node*> n;
    for (int i = 1; i <= 6; i++) n.push_back(new Node(i));
    for (int i = 0; i < 5; i++) n[i]->next = n[i + 1];
    n[5]->next = n[2];                       // 6 -> 3
    Node* e = cycleEntry(n[0]);
    cout << (e ? e->val : -1) << '\n';       // 3
}
```

## Complexity

- **Time:** O(n). Before the pointers meet, slow travels at most the straight part plus one lap; finding the entry takes at most another a steps.
- **Space:** O(1), just two pointers, compared with O(n) for a hash set of visited nodes.

## Common mistakes

:::warning
Common misconception: "the meeting point is where the cycle starts." It is just some node inside the loop. The second phase, resetting one pointer to the head and stepping both at the same speed, is what finds the entry.
:::

- **Null checks:** the loop must check `fast && fast->next` before moving fast two steps.
- **Comparing values instead of nodes**: different nodes can hold the same value; compare pointers.
- **Moving both pointers twice in phase two**: in the second phase, both move one step.
- **Find the Duplicate Number**: start both pointers at index 0 and treat `nums[i]` as the next index; the duplicate is the cycle entry.

## Practice problems

*Linked List Cycle* and *Middle of the Linked List* are the basic uses. *Linked List Cycle II* needs the entry-finding phase. *Happy Number* applies the idea to a number sequence. *Find the Duplicate Number* is the classic disguised version: an array of n + 1 values in 1..n, solved in O(1) space by treating values as next pointers.

## Key takeaways

- Moving one pointer one step and another two steps detects a cycle: they meet only if the structure loops.
- Inside a loop the gap between them shrinks by one each step, so the fast pointer can never skip over the slow one.
- To find the cycle entry, reset one pointer to the head and move both one step at a time until they meet.
- Without a cycle, the slow pointer is at the middle when the fast pointer reaches the end.
- Any repeated function on a finite set forms such a sequence, which is how Happy Number and Find the Duplicate Number are solved in O(1) space.

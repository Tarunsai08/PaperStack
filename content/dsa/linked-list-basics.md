---
id: "dsa-linked-list-basics"
kind: "pattern"
subject: "dsa"
slug: "linked-list-basics"
title: "Pointer Surgery Without Losing the Patient"
subtitle: "Linked lists: dummy heads, three-pointer reversal, merging, and drawing before you code"
track: "dsa-linear"
track_order: 1
priority: "P0"
prerequisites: ["dsa-cpp-stl-toolkit"]
difficulty: "beginner"
read_minutes: 9
topics: ["linked lists", "pointers", "reversal", "merging"]
complexity: { time: "O(n)", space: "O(1) for iterative versions" }
practice_problems:
  - { name: "Reverse Linked List", platform: "LeetCode", url: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "Easy" }
  - { name: "Merge Two Sorted Lists", platform: "LeetCode", url: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "Easy" }
  - { name: "Remove Nth Node From End of List", platform: "LeetCode", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "Medium" }
  - { name: "Reorder List", platform: "LeetCode", url: "https://leetcode.com/problems/reorder-list/", difficulty: "Medium" }
  - { name: "Reverse Linked List II", platform: "LeetCode", url: "https://leetcode.com/problems/reverse-linked-list-ii/", difficulty: "Medium" }
  - { name: "Remove Linked List Elements", platform: "LeetCode", url: "https://leetcode.com/problems/remove-linked-list-elements/", difficulty: "Easy" }
glossary:
  - term: "Node"
    definition: "One element of a linked list, holding a value and a pointer to the next node."
  - term: "Head"
    definition: "The first node of a linked list. Losing the head means losing the whole list."
  - term: "Dummy node"
    definition: "An extra node placed before the head so that edits at the front work exactly like edits in the middle."
  - term: "Null pointer"
    definition: "A pointer that points nowhere, marking the end of a list. Following it crashes the program."
  - term: "In-place"
    definition: "Rearranging the existing nodes by changing their pointers, without creating new nodes or copying values."
quiz:
  - q: "When reversing a list, why must you save next before changing curr->next?"
    options: ["To save memory", "Because changing curr->next loses the only link to the rest of the list", "Because next is null", "It is not necessary"]
    answer: 1
    explain: "Once curr->next points backwards, nothing points to the remaining nodes. Saving next first keeps the rest of the list reachable."
  - q: "What does a dummy node simplify?"
    options: ["Sorting", "Edits at the head, such as deleting the first node or building a new list, which then need no special case", "Finding the length", "Memory usage"]
    answer: 1
    explain: "With a dummy before the head, every real node has a predecessor, so inserting or deleting at the front uses the same code as anywhere else."
  - q: "How do you remove the 2nd node from the end in one pass?"
    options: ["Count the length twice", "Move a fast pointer 2 steps ahead, then move fast and slow together until fast reaches the end; slow is just before the target", "Reverse the list", "Use recursion only"]
    answer: 1
    explain: "Keeping a gap of n between two pointers means that when the leader reaches the end, the follower is exactly n nodes from it."
cover_seed: "linked-list-basics"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

Linked list questions are short to state and easy to get wrong. "Reverse this list." Five lines of code, and half of candidates either lose the rest of the list, create a cycle, or crash on an empty input.

The problems are not hard. They are fragile. A few habits make them safe every time: draw the pointers, save what you are about to break, and use a dummy node so the head is never a special case.

## The intuition

:::analogy
Think of a treasure hunt where each clue tells you where the next clue is hidden. You can only reach clue 7 by following clues 1 to 6. If you rewrite clue 3 before noting where it pointed, everything after it is lost forever. Pointer surgery on linked lists is rewriting clues: always note where a clue points before you change it.
:::

Each clue is a [[node]]: a value plus a pointer to the next node. The first clue is the [[head]]. The last clue points to nothing, a [[null pointer]]. You cannot jump to the middle; you must walk.

### Linked list or array?

| Operation | Array or vector | Singly linked list |
|---|---|---|
| Read the i-th element | O(1) | O(i), walk from the head |
| Insert or delete at the front | O(n), shift everything | O(1) |
| Insert or delete after a node you hold | O(n) | O(1) |
| Find a value | O(n) | O(n) |
| Memory per element | the value | the value plus a pointer |
| Scanning speed in practice | fast, contiguous memory | slower, nodes are scattered |

A list wins when you already hold a pointer to where the change happens, as in an LRU cache or a free list. An array wins almost everywhere else. Interviews use lists mostly to test whether you can rewire pointers without losing anything.

## How it works

### Habit 1: draw before you code

Sketch three or four boxes with arrows, then write each pointer change as an arrow you redraw. Most bugs are visible on paper: an arrow that disappears, two arrows forming a loop, a node left pointing at itself. Interviewers also like seeing the drawing: it shows you are reasoning about the structure, not guessing at code until it compiles.

### Habit 2: the three-pointer reversal

To reverse [[in-place]], walk the list with three pointers: `prev` (the already-reversed part), `curr` (the node being moved), and `next` (saved before breaking the link).

1. `next = curr->next` (note where the clue points)
2. `curr->next = prev` (rewrite the clue to point backwards)
3. `prev = curr`, `curr = next` (step forward)

When `curr` becomes null, `prev` is the new head. Three assignments per node, no extra memory.

```mermaid
flowchart TD
  A[prev = null, curr = head] --> B{curr is null}
  B -- yes --> F[Return prev as the new head]
  B -- no --> C[Save next = curr.next]
  C --> D[Point curr.next back to prev]
  D --> E[prev = curr, curr = next]
  E --> B
```

### Habit 3: a dummy node

A [[dummy node]] sits before the head. With it, deleting the first node, inserting at the front, or building a new list all use the same code as the middle, and at the end you return `dummy->next`. It removes a whole category of special cases.

### Habit 4: two pointers with a gap

Many list problems need a position measured from the end. Move a `fast` pointer n steps ahead, then move `fast` and `slow` together. When `fast` reaches the end, `slow` is n nodes behind it. Fast-and-slow pointers moving at different speeds get their own article, [The Tortoise and the Hare on a Circular Track](article:dsa-fast-slow-pointers).

### Habit 5: delete by looking one node ahead

In a singly linked list you cannot go back, so to delete a node you must stand on the node **before** it and set `prev->next = prev->next->next`. That is why deletions loop with `while (cur->next)` and inspect `cur->next`, and why the dummy node matters: the node before the head is the dummy. When the next node is deleted, stay where you are, because the new next node has not been checked yet.

### Doubly linked lists and sentinels

A doubly linked list stores `prev` as well as `next`, so a node you hold can be removed in O(1) without knowing its predecessor: `node->prev->next = node->next` and `node->next->prev = node->prev`. Real implementations usually keep two sentinel nodes, a dummy head and a dummy tail, so every real node always has both neighbours. That is exactly the structure inside [The Desk That Keeps Your Latest Books on Top](article:dsa-lru-cache).

:::insight
Every linked list bug is a lost or tangled pointer. Before overwriting any `next`, make sure something else still points to whatever it pointed at. A dummy node and a saved `next` cover most cases.
:::

## Walk through an example

Reverse `1 → 2 → 3 → null`.

| Step | prev | curr | next saved | Change | List so far |
|---|---|---|---|---|---|
| start | null | 1 | — | — | 1 → 2 → 3 |
| 1 | null | 1 | 2 | 1 → null | 1 (reversed part) |
| 2 | 1 | 2 | 3 | 2 → 1 | 2 → 1 |
| 3 | 2 | 3 | null | 3 → 2 | 3 → 2 → 1 |
| end | 3 | null | — | return prev | 3 → 2 → 1 → null |

**Merging** `1 → 3 → 5` and `2 → 4` with a dummy: compare heads, attach the smaller to the tail, advance that list, repeat, then attach whatever remains. Result: `1 → 2 → 3 → 4 → 5`.

**Deleting every 6** from `6 → 1 → 6 → 6 → 2` with a dummy D in front:

| cur | cur.next | Action | List after |
|---|---|---|---|
| D | 6 | delete it, stay at D | 1 → 6 → 6 → 2 |
| D | 1 | keep, move to 1 | 1 → 6 → 6 → 2 |
| 1 | 6 | delete, stay at 1 | 1 → 6 → 2 |
| 1 | 6 | delete, stay at 1 | 1 → 2 |
| 1 | 2 | keep, move to 2 | 1 → 2 |
| 2 | null | stop | 1 → 2 |

The leading 6 was deleted by the same code as the middle ones, because the dummy stood in front of it. And staying put after each deletion is what caught the two 6s in a row.

:::try-this
Using the gap technique, which node does `slow` stop before when removing the 2nd node from the end of `1 → 2 → 3 → 4 → 5` (start both at a dummy, move fast 2 steps ahead first)? (Fast moves until it reaches the last node; slow stops at node 3, so slow->next, node 4, is removed, giving 1 → 2 → 3 → 5.)
:::

## The code

```pseudo
reverse(head):
    prev = null, curr = head
    while curr != null:
        next = curr.next
        curr.next = prev
        prev = curr
        curr = next
    return prev

merge(a, b):
    dummy = new node; tail = dummy
    while a and b:
        if a.val <= b.val: tail.next = a; a = a.next
        else: tail.next = b; b = b.next
        tail = tail.next
    tail.next = a if a else b
    return dummy.next
```

```cpp
#include <bits/stdc++.h>
using namespace std;

struct Node { int val; Node* next; Node(int v, Node* n = nullptr) : val(v), next(n) {} };

Node* build(const vector<int>& v) {
    Node* h = nullptr;
    for (int i = (int)v.size() - 1; i >= 0; i--) h = new Node(v[i], h);
    return h;
}
void print(Node* h) {
    for (Node* p = h; p; p = p->next) cout << p->val << ' ';
    cout << '\n';
}

Node* reverseList(Node* head) {
    Node* prev = nullptr;
    while (head) { Node* next = head->next; head->next = prev; prev = head; head = next; }
    return prev;
}

Node* reverseRecursive(Node* head) {               // elegant, but O(n) stack
    if (!head || !head->next) return head;
    Node* newHead = reverseRecursive(head->next);
    head->next->next = head;                        // the node after me now points back to me
    head->next = nullptr;
    return newHead;
}

Node* mergeLists(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}

Node* removeValue(Node* head, int v) {
    Node dummy(0, head);
    for (Node* cur = &dummy; cur->next;) {
        if (cur->next->val == v) cur->next = cur->next->next;   // delete, stay put
        else cur = cur->next;
    }
    return dummy.next;
}

Node* removeNthFromEnd(Node* head, int n) {
    Node dummy(0, head);
    Node *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; i++) fast = fast->next;  // open a gap of n
    while (fast->next) fast = fast->next, slow = slow->next;
    slow->next = slow->next->next;                  // slow stands just before the target
    return dummy.next;
}

int main() {
    print(reverseList(build({1, 2, 3})));                        // 3 2 1
    print(reverseRecursive(build({1, 2, 3})));                   // 3 2 1
    print(mergeLists(build({1, 3, 5}), build({2, 4})));          // 1 2 3 4 5
    print(removeValue(build({6, 1, 6, 6, 2}), 6));               // 1 2
    print(removeNthFromEnd(build({1, 2, 3, 4, 5}), 2));          // 1 2 3 5
}
```

## Complexity

- **Reverse, merge, remove-from-end:** O(n) time, one pass each.
- **Space:** O(1) for these iterative versions. Recursive reversal is elegant but uses O(n) stack, which can overflow on long lists.

## Common mistakes

:::warning
Common misconception: "linked lists are fast because insertion is O(1)." Insertion is O(1) only once you are at the right node. Finding that node is O(n), and walking pointers is slower than scanning an array because nodes are scattered in memory. In practice, arrays and vectors win most of the time; linked lists matter for interviews and for specific structures like LRU caches.
:::

- **Overwriting `next` before saving it**, which loses the rest of the list.
- **Dereferencing null**: check `curr` and `curr->next` before following them, especially on empty or one-node lists.
- **Forgetting to cut links**, which leaves a cycle, for example in Reorder List when splitting the list in half.
- **Special-casing the head** instead of using a dummy node.
- **Advancing after a deletion,** which skips the node that just moved up and misses consecutive matches.
- **Removing the n-th node from the end without a dummy,** which breaks when the head itself must go.

## Practice problems

*Reverse Linked List* and *Merge Two Sorted Lists* are the core moves. *Remove Nth Node From End* uses the gap technique with a dummy. *Reverse Linked List II* reverses only a middle section, testing careful reconnection. *Reorder List* combines all of it: find the middle, reverse the second half, then merge alternately. *Remove Linked List Elements* is the look-one-ahead deletion from the table above.

## Key takeaways

- Linked lists are chains of nodes, each pointing to the next, and you can only reach a node by walking from the head.
- Draw the pointers before coding, and always save a node's next before overwriting it.
- Reverse in place with three pointers, prev, curr and next, returning prev as the new head.
- A dummy node before the head removes special cases for edits at the front.
- Two pointers with a fixed gap find positions measured from the end in a single pass.

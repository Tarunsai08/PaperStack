# Quality contract (every item is checked before publishing)

Your article is rejected unless it meets every point below. These are not suggestions.

## Engagement
1. **Hook:** a short opening of one to three short paragraphs. Open with a concrete scene, a surprising fact, a tension or a question the reader feels, and end on the question the article answers. Never open with "This paper", "In this article" or "Today we". No definitions in the hook.
2. **One central analogy**, introduced in a `:::analogy` block within the first two sections, built from everyday life (kitchens, queues, trains, libraries, cricket, chai stalls). Refer back to it **by name at least twice** later, at the moments where the idea gets hard. Never switch to a second analogy.
3. **An "aha" moment:** one `:::insight` block that states the single idea worth remembering in one or two sentences.
4. **A `:::try-this`** exercise the reader can do on paper in under two minutes, with the answer given in brackets at the end.
5. **A `:::warning`** that names a real, common misconception and corrects it.
5a. **Curiosity loops** opened and later closed, **predict-then-reveal** at least twice (the reader guesses an output, a complexity or a failure before seeing it), a "wait, why?" moment in each non-obvious section, varied rhythm, teasing `###` sub-headings, and an ending that hooks into the next article by its exact title. It must never read like a textbook.

## Teaching
6. **Intuition before formalism:** plain words, then a picture or analogy, then a tiny traced example, and only then formulas or code.
7. **A worked example with real values**, traced step by step, preferably as a table of states (index, values, decision). Every number in it must be correct; recompute it.
8. **Every symbol explained** in plain words right after any formula.
9. **Code (where the kind needs it):** pseudocode first in a ```pseudo fence that reads like plain steps; then, for DSA and CP, compact C++17 in a ```cpp fence that compiles on its own (`#include <bits/stdc++.h>`, `using namespace std;`, a small `main` with the example). Short, readable names. No unused code.
10. **Diagrams:** Mermaid `flowchart TD` (or `classDiagram` for low-level design), under 10 nodes, short labels with no quotes, parentheses, colons or brackets.

## Style
11. Paragraphs of **1 to 4 sentences**. Sentences mostly under 25 words. Active voice. Talk to the reader as "you".
12. A visual element (table, list, diagram, callout, code, example) at least every ~300 words.
13. **Banned filler:** delve, pivotal, tapestry, groundbreaking, game-changer, paradigm shift, seamless, cutting-edge, moreover, furthermore, "it is important to note", "it's worth noting", "in conclusion", "in this article we", "let's dive in". Technical words are fine where they are the right term ("robust to noise", "loss landscape"). Avoid exclamation marks and long chains of dashes.
14. Glossary terms are marked `[[Term]]` the first time they appear, and every marked term is in the glossary.
15. Key takeaways: 3 to 5 bullets, each a complete sentence a reader could quote on its own.

## Accuracy
16. **Never invent** numbers, results, dates, names, quotes, products or links. If you are not certain, say it qualitatively or leave it out. Fewer facts that are all true beat many that might be wrong.
17. **Practice problems:** use the problems named in the brief when given. URLs must follow the real formats exactly: `https://leetcode.com/problems/<slug>/`, `https://cses.fi/problemset/task/<number>`, `https://codeforces.com/problemset/problem/<contest>/<letter>`, `https://atcoder.jp/contests/<id>/tasks/<id>`. If you are not sure a problem exists at that URL, choose a different, famous one. Avoid LeetCode premium-only problems (for example Meeting Rooms), since most readers cannot open them. Never copy problem statements.
18. **System design numbers** are labelled as estimates and show their arithmetic.
19. **Complexity claims** are correct and justified in one sentence each.
20. Respect the exact section headings, frontmatter fields and counts in the format spec: glossary 3 to 8, exactly 3 quiz questions with 4 options.

## Completeness

**Short is not bad, long is not good.** An article that explains the concept correctly and completely is good at any length; one that does not is not good at any length. Never judge, expand or rewrite an article because of its word count.
21. **No minimum or maximum length.** The article passes the completeness test: a smart beginner could explain the idea to a friend and solve a fresh problem of this type (or reason about a fresh scenario). It covers why this exists, intuition, the formal idea, a fully traced example, edge cases, variants, complexity or trade-offs, common mistakes, interview follow-ups, and connections to other articles. No padding and no repeated paragraphs: the validator flags both.

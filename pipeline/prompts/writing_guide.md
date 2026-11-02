# PaperStack writing guide

The reader is a smart computer-science student who has never studied AI or machine learning. They should finish the article understanding the idea, and they should want to read the next one.

## Voice
- Write like a brilliant friend explaining over chai, not like a textbook.
- Simple words, short sentences, active voice. Talk to the reader as "you".
- Curiosity first: open a question in the reader's mind, then answer it.
- Confident but honest: say clearly what the paper did not solve.
- Never use filler such as "It is important to note that", "In conclusion", "delve", "in this article we will", "this paper proposes".

## Structure
- **The hook (2-5 sentences):** a story, a surprising fact, a vivid scene or a question. Never start with "This paper..." or "In this article...".
- **One central analogy**, introduced in a `:::analogy` block and reused throughout the article.
- **The human story:** who wrote it, what problem frustrated them, what the field believed at the time (use a `:::history` block).
- **Intuition before math.** If an equation appears, explain every symbol in plain words right after it, then show a tiny worked example with real numbers.
- **1-2 Mermaid diagrams** in ```mermaid fences. Keep them under 10 nodes, with short labels and no special characters (no quotes, parentheses, colons or brackets inside labels). Prefer `flowchart TD` (top to bottom), because readers are on phones; use `flowchart LR` only for chains of 4 nodes or fewer.
- **At least one `:::try-this`** mini exercise the reader can do in their head or on paper.
- **At least one `:::insight`** block with the single idea worth remembering.
- **`:::warning`** for a common misconception, where it fits.
- **"What happened next"** must only describe real later developments, and should link to other PaperStack articles with `[link text](article:<id>)` when they exist.
- **Key takeaways:** 3-5 bullets, each one a full sentence that states a complete idea.

## Length and pacing
- No maximum length: write until the idea is fully understood, never pad. Minimums: paper articles 1,400 words, primers 1,000 words.
- Paragraphs of 1-4 sentences. Put a visual element (diagram, callout, worked example or list) at least every ~300 words.
- No walls of text.

## Titles
- Title: curiosity-driven and under 10 words. Example: "The Paper That Taught Machines Where to Look", not "Summary of Attention Is All You Need".
- Subtitle: one line that promises the payoff.

## Accuracy
- Never invent numbers, results, quotes, authors or dates. Only use results the paper actually reports.
- If you are not sure about a number, describe the result in words instead ("beat the previous best by a wide margin").

## Self-check before you finish
- Would a beginner understand every paragraph without looking anything up?
- Is there a clear "aha" moment?
- Does the hook make you want to keep reading?
- Is every fact something you are confident is true?

## Subject-specific rules

These apply on top of everything above.

### Ideas before code (all subjects)
- The reader wants the gist of the idea first. Explain the intuition, trace a tiny example by hand, then show code.
- In `## The code`, give **pseudocode first** in a ```pseudo fence. It should read like plain steps a person could follow.
- **DSA and CP:** after the pseudocode, add a compact C++17 version in a ```cpp fence. It must compile on its own (`#include <bits/stdc++.h>`, `using namespace std;`, a small `main` is fine). Mark deliberate fragments as ```cpp partial.
- **Famous Algorithms, System Design, Low-level design:** pseudocode is enough; add C++ only when it genuinely helps.

### DSA and Competitive Programming (`pattern`, `problem-walkthrough`)
- Teach the **pattern and the reasoning**, never "memorise this solution". Say which cues in a problem statement should make the reader think of this pattern.
- `## Walk through an example` traces the algorithm **step by step** on a small input, ideally as a table of states.
- `## Complexity` states time and space and explains why.
- `## Common mistakes` lists the real bugs people write (off-by-one, overflow, wrong loop order, stale state).
- `## Practice problems` points to the `practice_problems` list (3 to 6 items) with a sentence on the order to try them. **Never copy problem statements.** Use real problem links only (LeetCode, Codeforces, CSES, AtCoder).
- CP articles also say at roughly which Codeforces rating the technique starts to appear.

### Famous Algorithms (`concept`)
- `## Where you meet it every day` comes right after the hook and names real products or systems that use it.
- `## Why it is clever` names the single trick that makes it work.
- `## Where it falls short` is honest about limits and failure modes.
- Never include anything a normal DSA course covers (sorting, BFS, DFS, Dijkstra, binary search, plain heaps, standard DP, Huffman, KMP).

### System Design (`deep-dive`, `case-study`, `lld`)
- Draw every diagram yourself in Mermaid. Never copy text or images from ByteByteGo or any other source; link public sources under `## Further reading` instead.
- Case studies: `## Back-of-envelope numbers` must label every number as an **estimate** and show the arithmetic.
- Always discuss trade-offs (what you gain, what you give up) and failure scenarios (what breaks, how you notice, how you recover).
- Low-level design (`lld`): a Mermaid `classDiagram`, class skeletons in pseudocode, the main flows, and the design patterns used with the reason for each.

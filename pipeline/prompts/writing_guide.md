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

## Completeness (replaces every word count)

**Short is not bad, long is not good.** An article that explains the concept correctly and completely is good at any length; one that does not is not good at any length. Never judge, expand or rewrite an article because of its word count.
There is **no minimum and no maximum length**. An article is finished only when it passes the **completeness test**: a smart beginner who reads it could (a) explain the idea to a friend and (b) solve a fresh problem of this type, or reason about a fresh scenario for system design.

Completeness checklist (add an `### Interview follow-ups` subsection with 3-5 questions and worked answers at the end of the mistakes or limits section): why this exists, intuition, the formal idea, a fully traced example, edge cases, variants, complexity or trade-offs, common mistakes, interview follow-ups, and how it connects to other articles.

Length must come from substance. Every paragraph must teach something or pull the reader forward. The validator lints for filler phrases and repeated paragraphs instead of counting words. Long articles stay easy to move around with `###` sub-headings; `read_minutes` is computed from the real word count.

## Engagement (never a textbook)
- **Hook:** open with a scene, a puzzle, a surprising fact or a real product problem. Never open with a definition or "In this article".
- **One running story or example** through the whole article, with one central analogy reused throughout.
- **Curiosity loops:** open them ("this breaks in a way you won't expect; we'll see why in a minute") and close them later.
- **Predict-then-reveal:** ask the reader to guess the output, the complexity or the failure before you show it. Do this at least twice.
- **Rhythm and voice:** short punchy paragraphs mixed with longer ones, teasing section titles (as `###` sub-headings), a light sense of humour where it fits, concrete numbers, and "you".
- **A "wait, why?" moment** at least once per section where the idea is non-obvious.
- **End with a hook into the next article**, linked with its exact title as `[Title](article:<id>)` (only if it exists).
- Intuition always comes before formulas.

> Bad: "Dijkstra's algorithm finds the shortest path from a source to all vertices in a weighted graph with non-negative weights."
> Good: "Your map app has about 200 milliseconds to pick one route out of billions. It cannot try them all. Here is the trick it uses instead: always be greedy about the *closest unfinished place*, and never look back."

## Pacing
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

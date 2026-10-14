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
- Paper articles: 1,400-2,200 words. Primers: 1,000-1,600 words.
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

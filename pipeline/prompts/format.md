# PaperStack file format

Output ONE markdown file and nothing else: no explanation before or after it, and do not wrap it in a code fence.

## Frontmatter
The file starts with YAML frontmatter between two `---` lines. Every field below is required (the `paper_*`, `authors`, `year` and `venue` fields only for `kind: "paper"`). Quote all strings.

```yaml
---
id: "paper-attention-is-all-you-need"     # "paper-" or "primer-" + slug
kind: "paper"                             # paper | primer
slug: "attention-is-all-you-need"         # lowercase words joined by dashes
title: "The Paper That Taught Machines Where to Look"
subtitle: "How one simple idea replaced decades of sequence models"
track: "transformers-llms"                # one of the track ids listed below
track_order: 1                            # position inside the track
prerequisites: ["primer-embeddings"]      # ids of existing articles, or []
difficulty: "intermediate"                # beginner | intermediate | advanced
read_minutes: 10
topics: ["transformers", "attention", "nlp"]
paper_title: "Attention Is All You Need"
authors: ["Ashish Vaswani", "Noam Shazeer", "et al."]
year: 2017
venue: "NeurIPS"
paper_url: "https://arxiv.org/abs/1706.03762"
glossary:                                 # 3 to 8 terms
  - term: "Attention"
    definition: "A way for a model to decide which parts of the input matter most for each output."
quiz:                                     # exactly 3 questions, each with exactly 4 options
  - q: "What did the Transformer remove that earlier sequence models depended on?"
    options: ["Embeddings", "Recurrence", "Softmax", "Training data"]
    answer: 1                             # index of the correct option, 0-3
    explain: "Transformers process all tokens at once with attention instead of step by step."
cover_seed: "attention-is-all-you-need"
generated_by: "manual-chatbot"
generated_at: "2026-10-14"
importance_score: 0.9                     # 0 to 1
---
```

## Body
Paper articles use exactly these `## ` headings, in this order, and no other `## ` headings (use `### ` for sub-headings):

1. `## The hook`
2. `## Before you start` (2-4 lines: what the reader should already know, linking prerequisite articles as `[text](article:<id>)`)
3. `## The world before this paper`
4. `## The big idea`
5. `## How it works`
6. `## What they found`
7. `## What it got wrong (or left open)`
8. `## What happened next`
9. `## Key takeaways`

Primer articles use exactly: `## The hook`, `## The intuition`, `## Let's build it up`, `## A tiny example`, `## Where you'll see this again`, `## Key takeaways`.

## Special blocks
```markdown
:::insight
The one idea to remember from this section.
:::

:::analogy
Think of attention like a student with a highlighter...
:::
```
Allowed block names: `insight`, `analogy`, `history`, `warning`, `try-this`. No others.

- Glossary terms are marked inline as `[[Attention]]` (or `[[Attention|attending]]` to show different text). Every marked term MUST appear in the glossary.
- Diagrams use ```mermaid fences. Paper articles need at least one.
- Math uses `$...$` inline and `$$...$$` on its own lines.
- Links to other PaperStack articles use `[text](article:<id>)` and must point to ids from the list provided.

---
id: "primer-sample"
kind: "primer"
slug: "sample"
title: "A Tiny Valid Primer"
subtitle: "Used only by the validator tests"
track: "nowhere"
track_order: 1
prerequisites: ["primer-missing"]
difficulty: "beginner"
read_minutes: 5
topics: ["testing"]
glossary:
  - term: "Model"
    definition: "A function with adjustable knobs."
  - term: "Token"
    definition: "A chunk of text."
  - term: "Loss"
    definition: "A number that says how wrong the model is."
quiz:
  - q: "One?"
    options: ["a", "b", "c", "d"]
    answer: 0
    explain: "Because."
  - q: "Two?"
    options: ["a", "b", "c", "d"]
    answer: 3
    explain: "Because."
  - q: "Three?"
    options: ["a", "b", "c", "d"]
    answer: 2
    explain: "Because."
cover_seed: "sample"
generated_by: "manual-test"
generated_at: 2026-10-14
importance_score: 0.5
---

## The hook

A [[model]] reads [[Tokens]] and reports a [[loss|Loss]].

## The intuition

:::tip
Small things add up.
:::

## Let's build it up

See [the paper](article:paper-ghost).

## A tiny example

```python
## Not a heading inside code
print("hi")
```

## Where you'll see this again

Everywhere.

## Key takeaways

- Done.

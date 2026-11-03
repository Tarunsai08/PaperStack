---
id: "famous-algos-minhash"
kind: "concept"
subject: "famous-algos"
slug: "minhash"
title: "Spotting Near-Duplicates Without Comparing Them"
subtitle: "MinHash turns 'how similar are these two documents?' into a quick vote among tiny signatures"
track: "fa-sketches"
track_order: 6
priority: "P1"
prerequisites: ["dsa-hashing-patterns"]
difficulty: "intermediate"
read_minutes: 9
topics: ["hashing", "similarity", "near-duplicates", "sketches"]
glossary:
  - term: "Jaccard similarity"
    definition: "The size of the overlap of two sets divided by the size of their union. 1 means identical, 0 means nothing in common."
  - term: "Shingle"
    definition: "A short overlapping piece of a document, such as every run of 5 consecutive words, used to turn text into a set."
  - term: "MinHash"
    definition: "For one hash function, the smallest hash value among a set's elements. Two sets share their MinHash with probability equal to their Jaccard similarity."
  - term: "Signature"
    definition: "A short list of MinHash values, one per hash function, that stands in for a whole set when estimating similarity."
  - term: "Near-duplicate"
    definition: "A document that is almost the same as another, such as a copied article with a different header or a few edited words."
quiz:
  - q: "A = {a, b, c, d} and B = {b, c, d, e}. What is their Jaccard similarity?"
    options: ["3/4", "3/5", "4/5", "1/2"]
    answer: 1
    explain: "The overlap {b, c, d} has 3 elements; the union {a, b, c, d, e} has 5. So the similarity is 3/5 = 0.6."
  - q: "Why does the probability that two sets have the same MinHash equal their Jaccard similarity?"
    options: ["By definition of hashing", "The element with the smallest hash in the union is equally likely to be any union element, and the MinHashes match exactly when it lies in the overlap", "Because hashes are sorted", "It only holds for equal-sized sets"]
    answer: 1
    explain: "A random hash makes every element of the union equally likely to be the minimum. The two MinHashes agree only when that minimum element is in both sets."
  - q: "How does using more hash functions in the signature help?"
    options: ["It makes signatures shorter", "Each hash is one vote, and more votes make the estimated similarity more precise", "It removes the need for shingles", "It makes the sets identical"]
    answer: 1
    explain: "The fraction of matching positions is an average of independent yes-or-no votes, so its error shrinks as the number of votes grows."
cover_seed: "minhash"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.78
---

## The hook

A search engine crawls billions of pages and finds that many are almost copies of each other: the same news story syndicated across hundreds of sites, product pages differing only in a header, mirrored documentation. Showing ten copies of one article in the results is useless. But comparing every page with every other page is a quintillion comparisons.

In the late 1990s, Andrei Broder developed a technique for exactly this problem at AltaVista, one of the big search engines of the time. It shrinks each document to a short signature, and two signatures can be compared in microseconds.

## Where you meet it every day

- **Search engines** detect [[near-duplicate]] pages so results are not cluttered with copies, which was the original motivation.
- **Large text datasets** for training language models are commonly deduplicated with MinHash-based pipelines, because repeated documents waste training and encourage memorisation.
- **Plagiarism and code-clone detection** tools use MinHash-style signatures to find documents that share large chunks of text.

Whenever the question is "which of these millions of items are almost the same?", MinHash is a standard first tool.

## The intuition

:::analogy
Picture two people who each own a bag of cards, and you want to know how much their collections overlap. Shuffle a big master deck containing every possible card, and have each person find the first card in that shuffled order that is also in their own bag. If both stop at the same card, it means that card is in both bags. Repeat with many independent shuffles: the fraction of times they stop at the same card is exactly how much their bags overlap.
:::

The "first card in a random shuffle" is what a [[MinHash]] computes: hash every element, take the smallest hash. A random hash function acts like a random shuffle, and the smallest hash is the first card.

## How it works

### Step 1: documents become sets

Break each document into [[shingle]]s: every run of, say, 5 consecutive words. Two near-duplicate documents share most of their shingles. Their similarity is the [[Jaccard similarity]]:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

- $A \cap B$ is the set of shingles in both documents.
- $A \cup B$ is the set of shingles in either.
- J is 1 for identical sets and 0 for disjoint ones.

### Step 2: the magic property

Pick a random hash function h. Let min_h(A) be the smallest hash among A's elements. Then:

$$P[\min\nolimits_h(A) = \min\nolimits_h(B)] = J(A, B)$$

Why: look at the union of A and B. The element with the smallest hash in the union is equally likely to be any of them. Both sets report the same minimum exactly when that element is in both sets, and the chance of that is |A ∩ B| / |A ∪ B|.

### Step 3: signatures

Use k different hash functions to get a [[signature]] of k numbers per document. To estimate similarity, count the positions where two signatures agree and divide by k. With k around 100 to 200, each document shrinks from thousands of shingles to a few hundred numbers.

```mermaid
flowchart TD
  A[Document] --> B[Split into shingles]
  B --> C[Hash every shingle with k functions]
  C --> D[Keep the minimum for each function]
  D --> E[Signature of k numbers]
  E --> F[Similarity = fraction of matching positions]
```

:::insight
MinHash replaces "compare two huge sets" with "compare two short lists of numbers", and the fraction of matches is an unbiased estimate of the true overlap. The cost of a comparison no longer depends on document size.
:::

## Walk through an example

Sets A = {a, b, c, d} and B = {b, c, d, e}. True Jaccard: overlap {b, c, d} is 3, union is 5, so J = 0.6.

Five hash functions (values made up for the example):

| Element | h1 | h2 | h3 | h4 | h5 |
|---|---|---|---|---|---|
| a | 3 | 2 | 9 | 5 | 6 |
| b | 7 | 8 | 4 | 3 | 1 |
| c | 1 | 6 | 7 | 9 | 4 |
| d | 9 | 5 | 2 | 6 | 8 |
| e | 4 | 1 | 8 | 2 | 7 |

- Signature of A (minimum over a, b, c, d): [1, 2, 2, 3, 1]
- Signature of B (minimum over b, c, d, e): [1, 1, 2, 2, 1]

They agree at h1, h3 and h5: 3 out of 5, giving an estimate of 0.6. Here it matches exactly; with real random hashes the estimate wobbles around the true value, and more hash functions make it tighter.

:::try-this
Add element f to set B with hash values h1 = 0, h2 = 9, h3 = 9, h4 = 9, h5 = 9. Recompute B's signature and the estimate. What is the true Jaccard now? (B's signature becomes [0, 1, 2, 2, 1], matching A at h3 and h5 only: estimate 0.4. True Jaccard is 3/6 = 0.5. A small signature is a noisy estimate.)
:::

## The code

```pseudo
signature(set, hashes):           // hashes = [h1 .. hk]
    sig = [infinity] * k
    for x in set:
        for i in 1 .. k:
            sig[i] = min(sig[i], hashes[i](x))
    return sig

estimate_similarity(sigA, sigB):
    matches = count of i where sigA[i] == sigB[i]
    return matches / k
```

Signatures are computed once per document. Comparing two documents is then O(k), independent of their length.

## Why it is clever

The trick is that a single random hash gives a yes-or-no event whose probability is exactly the similarity you want. Averaging many such events estimates it, with error shrinking roughly like one over the square root of k. And signatures are tiny and fixed-size, so they can be stored for billions of documents.

## Where it falls short

:::warning
Common misconception: "MinHash finds similar pairs among n documents quickly on its own." Comparing every pair of signatures is still about n² comparisons. To find candidate pairs fast, MinHash is combined with locality-sensitive hashing, which buckets signatures so only likely-similar documents are compared.
:::

- **It measures set overlap, not meaning.** Two paraphrased articles with different words look dissimilar; semantic similarity needs embeddings.
- **Shingle choice matters.** Too short and unrelated documents look similar; too long and small edits break many shingles.
- **Small signatures are noisy.** Thresholds need enough hash functions to separate "near-duplicate" from "somewhat related" reliably.

### Interview follow-ups

**"Why does the probability that two MinHash values match equal Jaccard similarity?"** Under a random permutation, the first element of A ∪ B to appear is equally likely to be any element of the union. Both sets share the same minimum exactly when that element is in A ∩ B, so the probability is |A ∩ B| / |A ∪ B|.

**"How does banding (LSH) find candidate pairs?"** Split each signature into b bands of r rows; two documents become candidates if any band matches exactly. With b = 20 and r = 5, a pair with similarity 0.8 becomes a candidate with probability 1 − (1 − 0.8⁵)²⁰ ≈ 0.9996, while a pair at 0.3 does so only about 4.7% of the time.

**"Where is it used?"** Near-duplicate detection for web crawling and search, deduplicating training data for language models, and plagiarism or similar-item detection.

## Key takeaways

- Jaccard similarity measures how much two sets overlap, and documents become sets of shingles.
- The probability that two sets share their minimum hash under a random hash function equals their Jaccard similarity.
- A signature of k MinHash values per document lets you estimate similarity by the fraction of matching positions.
- Comparisons cost O(k) regardless of document size, which makes near-duplicate detection feasible at web scale.
- MinHash alone still compares pairs; locality-sensitive hashing is used on top to find candidate pairs quickly.

---
id: "famous-algos-inverted-index"
kind: "concept"
subject: "famous-algos"
slug: "inverted-index"
title: "The Index at the Back of Every Search Engine"
subtitle: "Inverted indexes: map each word to the documents that contain it, intersect sorted lists to answer queries, and compress them to fit"
track: "fa-search"
track_order: 1
priority: "P0"
prerequisites: ["dsa-hashing-patterns"]
difficulty: "intermediate"
read_minutes: 11
topics: ["search", "information retrieval", "indexing", "posting lists"]
glossary:
  - term: "Inverted index"
    definition: "A map from each term to the list of documents that contain it, the reverse of storing each document's list of words."
  - term: "Posting list"
    definition: "The sorted list of document ids (and optionally positions or counts) stored for one term."
  - term: "Tokenisation"
    definition: "Splitting text into terms, usually by lowercasing and breaking on spaces and punctuation."
  - term: "Stemming"
    definition: "Reducing words to a common root, such as 'running' and 'runs' to 'run', so they match each other."
  - term: "Stop words"
    definition: "Very common words such as 'the' or 'and' that appear in almost every document and carry little meaning on their own."
  - term: "Gap encoding"
    definition: "Storing differences between consecutive sorted ids instead of the ids themselves, so the numbers are small and compress well."
  - term: "TF-IDF"
    definition: "A relevance score that grows with how often a term appears in a document and shrinks with how many documents contain it."
quiz:
  - q: "Postings: cat → [1, 3], dog → [2, 3]. Which documents match 'cat AND dog'?"
    options: ["[1, 2, 3]", "[3]", "[1]", "None"]
    answer: 1
    explain: "AND is the intersection of the two posting lists: only document 3 appears in both."
  - q: "Why are posting lists kept sorted by document id?"
    options: ["For display", "So intersections and unions can be done with a linear merge, and gaps between ids are small for compression", "Because hash maps require it", "To rank results"]
    answer: 1
    explain: "Sorted lists allow two-pointer merging in O(m + n) and make gap encoding effective."
  - q: "What is the cost of removing stop words from the index?"
    options: ["None", "Queries that depend on them, such as exact phrases like 'to be or not to be', can no longer be answered precisely", "The index grows", "Stemming stops working"]
    answer: 1
    explain: "Stop words carry little meaning alone but matter in phrases, so modern engines usually keep them and handle them at query time."
cover_seed: "inverted-index"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.88
---

## The hook

Type three words into a search box and results from billions of pages appear in a fraction of a second. Reading every page for those words would take far longer than that, even for a huge data centre. The search engine is not reading pages when you search. It did the reading long before, and built a structure that answers "which pages contain this word?" instantly.

That structure is the inverted index. It powers web search, Elasticsearch, the search bar in your email, the full-text search in PostgreSQL, and the "search in this repository" box on code hosting sites. It is also a favourite system design building block: "design search for X" almost always starts here.

## Where you meet it every day

- **Web search engines** keep inverted indexes over their crawled pages.
- **Elasticsearch and Apache Solr**, both built on the Lucene library, store every searchable text field as an inverted index.
- **PostgreSQL full-text search** uses GIN indexes, which are inverted indexes over terms.
- **Email, chat and note apps** use inverted indexes for their search boxes.

## The intuition

:::analogy
Think of the index at the back of a textbook. The book itself is organised page by page, each page listing its words. The index flips that around: each important word is listed once, in alphabetical order, followed by the page numbers where it appears. To find "photosynthesis" you do not read 400 pages; you look up one word and jump straight to pages 12, 87 and 203.
:::

A search engine's [[inverted index]] is that back-of-the-book index for every word in every document. "Inverted" because the natural storage is document → words, and the index flips it to word → documents.

## How it works

### Building the index

1. **[[Tokenisation]]**: split each document into terms, lowercase them, and strip punctuation.
2. **Normalisation (optional)**: apply [[stemming]] so "running" and "runs" both become "run", and decide what to do with [[stop words]].
3. **Record postings**: for each term, append the document id to its [[posting list]]. Optionally also store how many times the term appears (for ranking) and at which positions (for phrase queries).
4. **Sort and store**: keep each posting list sorted by document id, and keep the terms themselves in a dictionary (a hash map, sorted array or trie) for fast lookup.

```mermaid
flowchart LR
  A[Documents] --> B[Tokenise and normalise]
  B --> C[Term and document id pairs]
  C --> D[Group by term]
  D --> E[Dictionary of terms]
  E --> F[Sorted posting list per term]
  G[Query] --> H[Look up each query term]
  H --> F
  F --> I[Intersect or union lists]
  I --> J[Rank and return top results]
```

### Answering queries

- **AND** query: intersect the posting lists. Because they are sorted, walk them with two pointers, advancing whichever points to the smaller id, in O(m + n). Start with the shortest list, so the intermediate result stays small.
- **OR** query: merge the lists, also linear.
- **Phrase** query ("new york"): intersect, then check that the stored positions are consecutive.

### Ranking

Matching is not enough; results must be ordered. The classic score is [[TF-IDF]]: term frequency (how often the word appears in this document) times inverse document frequency (rarer words count more). Modern engines use refinements such as BM25, then add signals like freshness, popularity or learned models on top. The inverted index supplies the candidates and the counts that these scores need.

### Compression

Posting lists for common terms can contain millions of ids. Since they are sorted, store [[gap encoding]]: [3, 7, 21, 22] becomes [3, 4, 14, 1]. Small numbers fit in fewer bytes using variable-length encodings, so the index takes a fraction of the space and more of it fits in memory.

:::insight
Doing the expensive work at write time, reading every document once, makes every later read cheap. A query then costs time proportional to the lengths of a few posting lists, not to the size of the whole collection.
:::

## Walk through an example

Three documents:

- D1: "The cat sat on the mat"
- D2: "The dog sat on the log"
- D3: "The cat chased the dog"

After lowercasing and tokenising:

| Term | Posting list |
|---|---|
| cat | 1, 3 |
| chased | 3 |
| dog | 2, 3 |
| log | 2 |
| mat | 1 |
| on | 1, 2 |
| sat | 1, 2 |
| the | 1, 2, 3 |

- "cat AND dog": intersect [1, 3] and [2, 3]. Pointers at 1 and 2: advance the smaller (1 → 3). Now 3 and 2: advance 2 → 3. Both 3: match. Result **[3]**.
- "cat AND sat": [1, 3] ∩ [1, 2] = **[1]**.
- "mat OR log": [1] ∪ [2] = **[1, 2]**.
- "the" appears in every document, so it helps no query narrow anything down: that is why it is a stop word candidate, and why its IDF is lowest.

:::try-this
Using the table, answer "sat AND dog" and "cat OR log". (sat ∩ dog = [1, 2] ∩ [2, 3] = [2]. cat ∪ log = [1, 3] ∪ [2] = [1, 2, 3].)
:::

## The code

```pseudo
build(docs):
    index = map from term to list
    for id, text in docs (in increasing id order):
        for term in unique(tokenise(text)):
            index[term].append(id)            // stays sorted
    return index

intersect(a, b):                              // both sorted
    i = j = 0; out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]: out.append(a[i]); i++; j++
        else if a[i] < b[j]: i++
        else: j++
    return out

and_query(terms):
    lists = [index[t] for t in terms], sorted by length
    result = lists[0]
    for l in lists[1:]: result = intersect(result, l)
    return result
```

## Why it is clever

It turns search from scanning everything into looking up a few lists, and it relies on structures you already know: a hash map for the dictionary and the sorted-list merge from two pointers. Sorted posting lists make AND, OR and phrase queries linear merges, and also make compression easy. The design separates concerns: the index finds candidates quickly, and a separate ranking step orders them, so ranking can improve without rebuilding the index.

## Where it falls short

:::warning
Common misconception: "removing stop words and stemming always improves search." Both trade precision for recall and size. Stemming can merge words with different meanings, such as "university" and "universe" under some stemmers, and dropping stop words breaks phrase queries. Many modern engines keep stop words and apply language-specific normalisation carefully.
:::

- **Updates are expensive**: inserting into sorted, compressed lists is costly, so engines write new small index segments and merge them in the background, an idea close to LSM trees.
- **Exact terms only**: an inverted index finds words, not meanings. Searching "car" does not find "automobile" without synonyms, or without semantic vector search alongside.
- **Common terms have huge lists**: queries with very frequent words need skip pointers, early termination or caching to stay fast.
- **Sharding**: big indexes are split across machines, by document or by term, each with its own trade-offs for query fan-out.

## Key takeaways

- An inverted index maps each term to a sorted posting list of the documents that contain it.
- Building it means tokenising, optionally normalising, and recording postings, all done once at write time.
- AND, OR and phrase queries become linear merges of sorted lists, starting with the shortest list.
- Ranking scores such as TF-IDF and BM25 use the counts stored in postings to order matching documents.
- Gap encoding compresses sorted lists, and segments merged in the background make updates practical.

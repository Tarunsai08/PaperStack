---
id: "system-design-interview-framework"
kind: "primer"
subject: "system-design"
slug: "interview-framework"
title: "Forty-Five Minutes to Design Instagram"
subtitle: "A step-by-step framework that turns any open-ended design question into a structured conversation"
track: "sd-fundamentals"
track_order: 1
priority: "P0"
prerequisites: ["dsa-problem-solving-framework"]
difficulty: "beginner"
read_minutes: 7
topics: ["system design", "interview strategy", "requirements"]
glossary:
  - term: "Functional requirement"
    definition: "Something the system must do for users, such as post a photo or follow a friend."
  - term: "Non-functional requirement"
    definition: "A quality the system must have, such as low latency, high availability, durability or a target scale."
  - term: "Back-of-envelope estimate"
    definition: "A quick, rough calculation of load, storage or bandwidth, used to decide which design choices matter."
  - term: "High-level design"
    definition: "The big boxes of a system and how requests and data flow between them, before any detail."
  - term: "Deep dive"
    definition: "A focused, detailed discussion of one hard part of the design, such as how the feed is built or how data is sharded."
  - term: "Trade-off"
    definition: "A choice where gaining one property, like speed, costs you another, like consistency or money."
quiz:
  - q: "What should you do first when asked to 'design a chat app'?"
    options: ["Draw a database schema", "Pick Kafka or RabbitMQ", "Ask which features and what scale matter", "Start writing API code"]
    answer: 2
    explain: "The question is deliberately vague. Agreeing on features and scale first decides everything else and shows the interviewer you design for real needs."
  - q: "Why do back-of-envelope estimates matter in a design interview?"
    options: ["Interviewers check your arithmetic precisely", "They show which parts of the system are under real pressure, which tells you where to spend design effort", "They replace the need for a diagram", "They are only needed for databases"]
    answer: 1
    explain: "Knowing that reads outnumber writes 100 to 1, or that storage grows by terabytes a day, tells you where caching, sharding or queues are actually needed."
  - q: "Which statement best describes a good answer to a design question?"
    options: ["One perfect architecture with no weaknesses", "A design that matches the requirements, with trade-offs explained and weaknesses acknowledged", "The architecture of a famous company copied exactly", "As many components as possible"]
    answer: 1
    explain: "There is no perfect design. Interviewers look for designs that fit the stated needs and for honest reasoning about what each choice costs."
cover_seed: "interview-framework"
generated_by: "claude-seed"
generated_at: "2026-11-02"
importance_score: 0.92
---

## The hook

"Design Instagram." Three words, then silence. There is no input format, no constraints, no expected output. Just a whiteboard and forty-five minutes.

Candidates who freeze usually know plenty: caches, queues, databases. What they lack is a route through the conversation. The good news is that one route works for almost every design question, and once you have it, the blank whiteboard stops being scary.

## The intuition

:::analogy
An architect asked to "design a house" does not start by choosing door handles. They ask who will live there and on what budget, sketch the rooms and how people move between them, and only then zoom into the tricky parts, like the staircase or the plumbing. A system design interview is the same walk: from the people, to the floor plan, to the hard details.
:::

The interviewer is not grading whether you produce the "right" architecture. There is no single right one. They are watching how you clarify a vague problem, make reasonable choices, and explain what each choice costs. The framework below keeps you doing exactly that.

```mermaid
flowchart TD
  A[Clarify requirements] --> B[Estimate the scale]
  B --> C[Define APIs and data model]
  C --> D[Draw the high level design]
  D --> E[Deep dive into the hardest parts]
  E --> F[Discuss trade-offs and failures]
```

## Let's build it up

### Step 1: requirements (about 5 minutes)

Split them into two lists.

[[Functional requirement]]s are what users can do: "post a photo", "follow someone", "see a feed of people I follow". Pick the three or four that matter most and say out loud that you are leaving the rest, like stories or direct messages, for later.

[[Non-functional requirement]]s are qualities: how many users, how fast the feed must load, whether a lost photo is acceptable (it is not), and whether a slightly stale like count is fine (it usually is). These decide the design far more than the features do.

### Step 2: estimate the scale (about 5 minutes)

A [[back-of-envelope estimate]] turns vague words like "lots of users" into numbers that drive decisions. You will learn the technique properly in the next article; here is the flavour, with every number an **estimate**:

- 100 million daily active users, each viewing the feed 10 times a day, is about 1 billion feed reads a day, or roughly 12,000 reads per second on average, more at peak.
- If 10 million photos are posted a day at 1 MB each, that is about 10 TB of new storage every day.

Two conclusions fall out immediately. Reads vastly outnumber writes, so caching matters. Storage grows fast, so photos belong in blob storage, not the database.

### Step 3: APIs and data model (about 5 minutes)

Sketch the few endpoints that serve your functional requirements, such as `POST /photos` and `GET /feed?cursor=...`, and the core tables or objects: users, photos, follows. This makes the design concrete and catches gaps early.

### Step 4: high-level design (about 10 minutes)

Draw the [[high-level design]]: clients, load balancer, stateless application servers, database, cache, blob storage, maybe a queue. Walk one request through it from start to finish. Start simple; scale it up only where your estimates say it needs to.

:::insight
Start with the simplest design that works, then let the numbers force each addition. "Reads are 100 times writes, so I add a cache" is a far stronger sentence than adding a cache because big systems have caches.
:::

### Step 5: deep dives (about 15 minutes)

Pick the one or two hardest parts and go deep. For Instagram, that is probably building the feed: do you compute it when someone posts, or when someone opens the app? What about a celebrity with 100 million followers? A good [[deep dive]] compares options and picks one for stated reasons. Interviewers often steer this part; follow their lead.

### Step 6: trade-offs and failures (the last 5 minutes, and throughout)

Every choice has a [[trade-off]]. A cache makes reads fast but may serve stale data. Precomputing feeds makes reading instant but makes posting expensive. Say what you gave up. Then ask what breaks: a database replica dies, a region goes down, a hot key melts a cache server. Say how you would notice and recover.

:::warning
Common misconception: "the best answer uses the most impressive technology." Naming Kafka, Cassandra and Kubernetes without a reason from your requirements reads as memorisation. Every box on your diagram should exist because a requirement or an estimate demanded it.
:::

## A tiny example

Here is how the first two minutes of "design a URL shortener" might sound.

> "Before I design anything, let me pin down scope. Users submit a long URL and get a short one; visiting the short one redirects. Should links expire? Do we need click analytics? Let's say no expiry, basic click counts. For scale, I'll assume 100 million new links a month, and that each link is read about 100 times as often as it is created. Redirects should feel instant, say under 50 milliseconds, and a working link must never break."

In under a minute, the candidate has fixed the features, the read-to-write ratio and the latency goal, and the design that follows almost writes itself: a fast key-value lookup, aggressive caching, and a way to generate unique short keys.

:::try-this
Take "design a ride-sharing app" and write, in two minutes, three functional requirements and three non-functional ones. Then name the one requirement you think will make the design hardest. (Most people land on real-time driver locations and matching, which is exactly where the deep dive goes.)
:::

## Where you'll see this again

Every case study in this subject follows these six steps, from the URL shortener and rate limiter to chat, news feeds and payments. The next article, back-of-envelope estimates, sharpens step 2. If you have done the DSA framework in [What to Do When You Have Never Seen the Problem](article:dsa-problem-solving-framework), you will notice the same spirit: understand first, start simple, then let the bottleneck guide you.

## Key takeaways

- Every design question follows the same route: requirements, scale estimates, APIs and data model, high-level design, deep dives, and trade-offs.
- Non-functional requirements such as scale, latency and durability shape the design more than the feature list does.
- Rough estimates reveal where the pressure is, for example a 100 to 1 read-to-write ratio that makes caching essential.
- Start with the simplest working design and add components only when a requirement or an estimate demands them.
- Strong answers name what each choice costs and how the system behaves when parts of it fail.

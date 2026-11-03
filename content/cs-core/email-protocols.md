---
id: "cs-core-email-protocols"
kind: "deep-dive"
subject: "cs-core"
slug: "email-protocols"
title: "Postal Sorting Offices for Your Messages"
subtitle: "How email travels: SMTP for sending and relaying, MX records for finding the destination, IMAP and POP3 for reading, store-and-forward, and the SPF, DKIM and DMARC checks that fight spoofing"
track: "cs-networks"
track_order: 14
priority: "P2"
prerequisites: ["cs-core-http-https"]
difficulty: "beginner"
read_minutes: 10
topics: ["computer networks", "email", "smtp", "imap", "pop3", "spf dkim dmarc"]
glossary:
  - term: "SMTP"
    definition: "Simple Mail Transfer Protocol: used to submit mail from a client to its server and to relay mail between servers; it pushes messages."
  - term: "MX record"
    definition: "A DNS record naming the mail servers that accept email for a domain, each with a priority."
  - term: "IMAP"
    definition: "A protocol for reading mail that stays on the server, synchronising folders and read status across devices."
  - term: "POP3"
    definition: "An older protocol that downloads mail to one device, typically deleting it from the server."
  - term: "Store and forward"
    definition: "Each server stores a message and forwards it later, retrying if the next server is unreachable, so sender and receiver need not be online at once."
quiz:
  - q: "asha@college.edu sends mail to ravi@example.com. How does her mail server find where to deliver it?"
    options: ["It asks Ravi's laptop", "It looks up the MX records of example.com in DNS and connects by SMTP to the listed server", "It uses IMAP", "It broadcasts on the internet"]
    answer: 1
    explain: "MX records name the receiving mail servers, tried in order of priority."
  - q: "Which protocol keeps mail on the server so your phone and laptop show the same folders?"
    options: ["POP3", "IMAP", "SMTP", "DHCP"]
    answer: 1
    explain: "IMAP synchronises state on the server; POP3 downloads to one device."
  - q: "Why can SMTP alone not stop someone sending mail that claims to be from your bank?"
    options: ["SMTP is encrypted", "SMTP lets the sender write any From address; SPF, DKIM and DMARC were added to let receivers check the domain really sent it", "Banks do not use email", "SMTP checks passwords for every message"]
    answer: 1
    explain: "The original protocol trusted senders. The add-ons publish policy and signatures in DNS."
cover_seed: "email-protocols"
generated_by: "claude-seed"
generated_at: "2026-11-03"
importance_score: 0.5
---

## The hook

You send an email from your college account to a friend at a company. Your laptop is not talking to your friend's laptop: your friend's machine may be switched off, and they may read the message tomorrow on a phone. So where does the message wait, who carries it there, and how does the company's server know it really came from your college and not an impostor?

Email is one of the oldest internet applications and still a neat lesson in protocol design: different protocols for sending and reading, DNS to find the way, and security added decades later. Predict how many different protocols touch one message from your outbox to your friend's screen. (At least three: SMTP, DNS and IMAP.)

## The intuition

:::analogy
Email works like **postal sorting offices**. You drop a letter at your local post office (your mail server), which looks up the destination town's office (DNS MX records) and sends the letter there. That office keeps it in your friend's post box (the mailbox), and your friend collects it whenever they like (IMAP or POP3). If the destination office is closed, yours keeps the letter and tries again later.
:::

## How it works

```mermaid
sequenceDiagram
  participant A as Asha mail app
  participant S1 as College mail server
  participant DNS as DNS
  participant S2 as example com mail server
  participant R as Ravi mail app
  A->>S1: SMTP submission with login
  S1->>DNS: MX records for example com
  DNS-->>S1: mail example com, priority 10
  S1->>S2: SMTP relay of the message
  S2->>S2: Check SPF, DKIM, DMARC and store in mailbox
  R->>S2: IMAP fetch, later
```

### Sending: SMTP

**[[SMTP]]** pushes mail. Your app submits the message to your own server (on port 587 with login, encrypted with STARTTLS, or 465 with TLS from the start). Your server then relays it to the recipient's server, traditionally on port 25. An SMTP conversation is plain text commands: HELO or EHLO, MAIL FROM, RCPT TO, DATA, then the message, then QUIT.

### Finding the destination: MX records

The sending server asks DNS for the **[[MX record]]** of the recipient's domain. Each record has a priority; the lowest number is tried first, and others are backups. This is why a company's email can be handled by a provider entirely separate from its website.

### Store and forward

**[[Store and forward]]** means every hop keeps the message until the next hop accepts it. If the receiving server is down, the sender queues the message and retries for hours or days before giving up with a bounce. Wait, is that why email can arrive late but rarely vanishes? Yes: each server holds responsibility for the message until another one takes it.

### Reading: IMAP and POP3

| | **[[IMAP]]** | **[[POP3]]** |
|---|---|---|
| Where mail lives | on the server | downloaded to the device |
| Multiple devices | in sync (folders, read status) | each device sees a different picture |
| Offline | caches copies | everything local |
| Typical today | almost all clients | legacy setups |

Webmail and phone apps often use the provider's own HTTP APIs instead, but the idea is the same: the mailbox lives on the server.

### Fighting spoofing: SPF, DKIM and DMARC

SMTP originally trusted whatever "From" address the sender wrote. Three DNS-published mechanisms let receivers check:

| Check | Question it answers |
|---|---|
| SPF | Is the sending server's IP address on the domain's published list of allowed senders? |
| DKIM | Is the message signed with a key whose public half is published in the domain's DNS, and is the signature intact? |
| DMARC | Does the visible From domain align with SPF or DKIM, and what should be done (none, quarantine, reject) if not? |

:::insight
Email separates pushing from pulling: SMTP pushes a message from server to server, located through DNS MX records and held by each server until the next accepts it, while IMAP or POP3 lets the recipient pull it later. Spoofing protection was added afterwards through SPF, DKIM and DMARC records published in DNS.
:::

## Trade-offs

| Design | Gain | Cost |
|---|---|---|
| Store and forward | Works even when receivers are offline; resilient | Delivery can be delayed |
| Open relaying between any servers | Anyone can email anyone | Spam and spoofing, needing later fixes |
| IMAP | Multi-device sync | Mail lives on, and depends on, the server |
| Strict DMARC (reject) | Blocks impersonation | Misconfigured legitimate senders get rejected |

:::warning
Common misconception: "SMTP is used to read email." SMTP only sends and relays. Reading uses IMAP, POP3 or a provider's own API. In interviews, "sending versus retrieving" is exactly the distinction being tested.
:::

:::try-this
example.com publishes two MX records: mail1 with priority 10 and mail2 with priority 20. mail1 is down. What does a sending server do? (It tries mail1 first, since the lower number wins, fails to connect, then delivers to mail2. If both are down, it queues the message and retries later.)
:::

## What can go wrong

- **Open relays** that forward anyone's mail and get blacklisted for spam.
- **Missing SPF, DKIM or DMARC**, so a domain's mail lands in spam or the domain is easy to impersonate.
- **Phishing** with look-alike domains, which these checks do not catch.
- **Bounces and queues** filling up when a destination is down for long.

### Interview follow-ups

**"Which transport does SMTP use?"** TCP, since every byte of the message matters, as in [A Phone Call Where Both Sides Confirm They Can Hear](article:cs-core-tcp-deep-dive).

**"How is an email attachment sent if SMTP is text?"** MIME encodes binary attachments as text (base64) inside a multipart message.

**"Where does DNS appear in email?"** MX records for routing, and TXT records for SPF, DKIM keys and DMARC policy, as in [A Phone Book With Local Copies Everywhere](article:cs-core-dns-cs).

## In the real world

Large providers run the sending and receiving servers for most organisations, and they enforce SPF, DKIM and DMARC strictly. The "show original" or "view headers" option in a mail client shows every server hop and the results of these checks.

## Further reading

- RFC 5321, "Simple Mail Transfer Protocol", and RFC 9051, "IMAP Version 4rev2".
- RFC 7208 (SPF), RFC 6376 (DKIM) and RFC 7489 (DMARC).

## Key takeaways

- SMTP pushes mail from a client to its server and from server to server, while IMAP and POP3 let recipients retrieve mail later.
- The sending server finds the recipient's server through the domain's DNS MX records, trying the lowest priority number first.
- Store and forward lets each server hold a message and retry until the next server accepts it, so sender and recipient never need to be online together.
- IMAP keeps mail on the server and synchronises devices, while POP3 downloads mail to a single device.
- SPF, DKIM and DMARC, published in DNS, let receivers check that mail claiming to come from a domain was really sent by it.

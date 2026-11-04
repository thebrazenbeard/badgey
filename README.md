# Badgey — containment console (standalone prototype)

An unofficial, **alternate-fiction** Star Trek-inspired character console featuring Badgey. Designed as a tokenless, account-free, browser-local interactive prototype for eventual consideration as the replacement for Lore's optional interface in [trek-data-core](https://github.com/thebrazenbeard/trek-data-core).

## Run

The files are static. Serve them with any local HTTP server, for example:

```sh
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`. The page uses no external libraries or remote calls. No model or credentials are required.

## What it can (and cannot) do

- Render an original, responsive LCARS-inspired chat interface with keyboard and screen-reader affordances.
- Respond to a deliberately **limited** set of conversational intents, retain a few session-only user corrections, and clear memory on demand.
- Match several paraphrased questions through a tiny, inspectable weighted-phrase index. Those static weights select authored responses; they are **not learned language-model weights**, embeddings, or a claim of general semantic understanding.
- Link to two discoverable StarTrek.com editorial resources as **DISCOVERED** pointers. These have **not** been admitted into a governed Trek research corpus and are **not** primary-episode close reads.
- Override villain performance when common self-harm, violence-risk, or acute medical phrases appear. These pattern checks are incomplete and **not** a crisis-management service.
- Avoid persistent storage, tokens, telemetry, third-party requests, backend dependencies, or host/device control.

It **cannot** think or converse like a general language model. It cannot autonomously verify canon, browse, access files, operate a computer, or reliably identify every risk. The Starfleet imprisonment scenario is fictional; official Star Trek material does not establish Badgey in Starfleet custody.

## Research boundary

The test data in `data/leads.mjs` is a discovery aid, not accepted `trek-data-core` SOURCE/WORK/ENTITY/EVIDENCE/ASSERTION state. Source-local cards may only be joined after verified source binding. No output from this character is itself research evidence, even if its wording sounds authoritative.

## Verification

```sh
npm test
```

Uses the Node.js built-in test runner; no `npm install` required. The browser is also constrained by a `connect-src 'none'` Content Security Policy and avoids HTML injection by rendering user and source text with `textContent`.

## Deployment status

This is a local foundation, not a merged or deployed replacement. Integration into the accepted Trek Explorer requires coordinated UI/test/CSP updates and explicit authorization for protected effects. No license is asserted for the repository or Star Trek intellectual property.

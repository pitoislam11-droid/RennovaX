# Rennova

**Turn an ordinary homeowner's phone into a guided digital survey assistant, so contractors
receive information good enough to understand and price work quickly.**

Rennova is a mobile-first UK marketplace connecting homeowners with contractors for
renovation and home-improvement work. It is not a trades directory and not a job board.

The product is the **structured information layer** between the two sides:

```
HOMEOWNER KNOWS NOTHING ABOUT BUILDING WORK
            ↓
   RENNOVA GUIDES THEM STEP BY STEP
            ↓
      PHONE CAPTURES THE PROPERTY
            ↓
  RENNOVA STRUCTURES THE INFORMATION
            ↓
CONTRACTOR RECEIVES A PROFESSIONAL JOB PACK
            ↓
      CONTRACTOR QUOTES IN MINUTES
```

## Repository status

- [`mobile/`](mobile/) is the React Native + Expo app for homeowners and contractors. It runs
  end to end on demo data; see [`mobile/README.md`](mobile/README.md) to run it.
- [`docs/`](docs/), [`schemas/`](schemas/) and [`examples/`](examples/) hold the product and
  architecture thinking the app is built on.

## Reading order

| # | Document | What it settles |
|---|---|---|
| 0 | [North star](docs/00-north-star.md) | What we are building, what success looks like, what we refuse to become |
| 1 | [The translation problem](docs/01-the-translation-problem.md) | The core thesis and the four-layer model |
| 2 | [Domain model](docs/02-domain-model.md) | Entities, vocabulary, the disposition concept |
| 3 | [Guided capture](docs/03-guided-capture.md) | How the phone is driven; capture plans; device tiers |
| 4 | [Measurement and provenance](docs/04-measurement-and-provenance.md) | How we handle uncertainty honestly |
| 5 | [The project interview](docs/05-project-interview.md) | Question design, branching, the question budget |
| 6 | [The contractor job pack](docs/06-contractor-job-pack.md) | The actual deliverable of the whole system |
| 7 | [Quoting, trust and contact](docs/07-quoting-trust-and-contact.md) | Sealed quotes, contact control, anti-gaming |
| 8 | [Contractor profiles](docs/08-contractor-profiles.md) | Storefronts, verification, portfolios |
| 9 | [Competitive study](docs/09-competitive-study.md) | MyBuilder, Checkatrade, Houzz, Hover, Magicplan |
| 10 | [Failure modes](docs/10-failure-modes.md) | Marketplace problems we design against, and how we detect them |
| 11 | [MVP scope and roadmap](docs/11-mvp-scope-and-roadmap.md) | What ships first, what waits, and why |
| 12 | [Architecture for evolution](docs/12-architecture-for-evolution.md) | Technical shape that survives the roadmap |
| 13 | [Open questions](docs/13-open-questions.md) | Decisions needed before build starts |
| — | [Glossary](docs/glossary.md) | Homeowner language ↔ trade language |

Machine-readable definitions live in [`schemas/`](schemas/), with worked examples in
[`examples/`](examples/).

[`vendor/free-llm`](vendor/free-llm) is the [Free-LLM](https://github.com/nejib1/Free-LLM)
directory of free LLM API providers, vendored as a git submodule for reference when choosing
an AI backend. Fetch it with `git submodule update --init`.

## The three rules everything else follows from

1. **Never ask the homeowner a question that assumes trade knowledge.**
   Ask about the world they can see. Translate on their behalf.
2. **Never present an uncertain fact as a certain one.**
   Every fact carries its source, method and confidence, and the contractor can see them.
3. **Never ask for something we have already reliably captured.**
   Evidence suppresses questions. The interview shrinks as capture succeeds.

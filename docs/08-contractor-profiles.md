# 08 — Contractor profiles

The homeowner should feel they are browsing high-quality professionals, not scrolling
classified ads. The profile is a **storefront**, and its centrepiece is proof of work.

## Who a contractor is

Rennova serves companies, sole traders and self-employed tradespeople equally. A one-person
tiler with 30 immaculate jobs should be able to present as impressively as a twelve-person
building firm. The profile must not be designed in a way that makes a sole trader look
inadequate — no "team size" field competing for attention, no empty sections shouting about
what is missing.

## Profile anatomy

```
┌──────────────────────────────────────────────────┐
│  [logo]  ABC RENOVATIONS                         │
│          Bathroom & kitchen specialists          │
│          Richmond · covers 15 miles              │
│                                                  │
│          ★ 4.9  (47 reviews)                     │
│          ✓ Insurance  ✓ Company  ✓ Gas Safe      │
│                                                  │
│          Quote accuracy: 94% within quote        │
│          Typically responds in 3 hours           │
└──────────────────────────────────────────────────┘

PAST PROJECTS                                    (32)
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  BEFORE ▸   │ │  BEFORE ▸   │ │  BEFORE ▸   │
│   AFTER     │ │   AFTER     │ │   AFTER     │
│ Kitchen     │ │ Bathroom    │ │ Loft        │
│ Chelsea     │ │ Putney      │ │ Barnes      │
│ 16 days     │ │ 9 days      │ │ 24 days     │
└─────────────┘ └─────────────┘ └─────────────┘

ABOUT
SERVICES              Bathrooms · Kitchens · Tiling · Plastering
SERVICE AREA          [ map ]
BUSINESS DETAILS      Ltd company 09123456 · est. 2014 · VAT registered
INSURANCE             Public liability £2m · valid to 04/2027
REVIEWS
```

## Portfolio projects

The most important content on the platform after the job pack itself. A portfolio project
is a first-class object, not an image dump.

```
KITCHEN RENOVATION
Chelsea, London

  BEFORE  ◀────────────▶  AFTER        [ slider ]

12 photos · completed in 16 days

"Full removal of the existing kitchen, re-plastering,
new electrics and a new island unit. The main challenge
was working around a structural column..."

WHAT WAS INVOLVED
Strip out · Electrical first fix · Plastering ·
Kitchen installation · Tiling · Decorating

✓ VERIFIED — completed through Rennova
★ 5.0  "Absolutely spotless work, and they cleaned up
       every single day." — Sarah, Chelsea
```

Design notes:

- **Before/after is the hero.** It is the format that communicates craft fastest, and it is
  the one contractors are most willing to produce.
- **Photography quality is a platform problem.** Most contractors take bad photos in bad
  light. Give them the same treatment we give homeowners: a short guided capture for
  finished work — stand here, shoot wide, get the whole wall in, use the window light. This
  reuses the capture runtime for a completely different purpose and lifts the visual quality
  of the entire marketplace.
- **"What was involved" uses the same work-item vocabulary as job packs.** That makes
  portfolios searchable and lets us tell a homeowner "this contractor has done 14 projects
  like yours", which is far more persuasive than a star rating.
- **Verified provenance.** A project completed through Rennova is marked as such and linked
  to its review. Contractors may upload historical work from before joining, but it is
  visually distinct and never claims verification.

## Verification must mean something specific

"Verified" as a generic badge is worthless and eventually dishonest. Every badge names the
thing checked, the date, and its expiry.

| Badge | What was actually checked |
|---|---|
| Identity | Government ID matched to the named individual |
| Business | Companies House number active and matching, or sole-trader details confirmed |
| Insurance | Public liability certificate seen; insurer, cover level and expiry recorded |
| Gas Safe | Registration number checked against the Gas Safe Register |
| Electrical competent person | NICEIC, NAPIT or equivalent scheme membership confirmed |
| Trade body | FMB, TrustMark or equivalent membership confirmed |
| Reviews | Linked to verified completed projects |

Two rules:

**Expiry is enforced.** Insurance lapses. A badge past its expiry disappears and the
contractor is prompted, rather than quietly continuing to display. An expired insurance
badge shown to a homeowner is an actively dangerous piece of misinformation.

**Scheme membership is displayed where it is legally meaningful.** In the UK, gas work must
be done by a Gas Safe registered engineer, and notifiable electrical work under Part P is
usually self-certified through a competent person scheme. When a project's scope implies
notifiable work, the pack should say so and the platform should prefer contractors holding
the relevant registration. This is a genuine safety matter, not a badge-collecting exercise.

We do not give legal advice, and we do not certify anyone. We check specific documents,
record what we saw and when, and show it plainly.

## Reputation signals

Star rating alone is weak — everyone sits between 4.5 and 5.0, and it tells a homeowner
nothing actionable. Show what actually differentiates:

- **Quote accuracy** — the share of completed projects where the final price matched the
  quote. Derived from data only we have, and the single strongest anti-lowballing mechanism
  in the product.
- **Relevant experience** — count of completed projects matching this project's category.
- **Responsiveness** — typical time to respond, shown as a band, not a false precision.
- **Recency** — a contractor with 200 reviews, none in three years, is not the same as one
  working steadily.
- **Review text over review score.** Surface the substance, and prompt reviewers with
  specific questions (tidiness, communication, timekeeping, price accuracy) rather than a
  blank box that produces "great job, thanks".

## Cold start

A new contractor with no Rennova history must still be presentable, or supply never builds.
Accept imported portfolio work clearly marked as unverified, run verification checks
immediately at onboarding so badges exist on day one, and show "new to Rennova" as a neutral
fact rather than an absence. Consider a small, explicit early-adopter signal rather than
letting new profiles look abandoned.

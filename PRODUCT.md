# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Stack

Expo React Native (`mobile/`) + Hono API (`backend/`) + Prisma. Local Rennova app (not Vibecode-dependent for product decisions).

## Users

**Primary — UK homeowners** who need work done and lack construction knowledge. They want hiring a contractor to feel as easy as online shopping.

**Secondary — UK contractors / builders / tradespeople** on professional accounts (company or sole trader). They want clear briefs, private quotes, portfolio storefronts, and AI help sourcing materials and structuring quotes — without reverse auctions.

## Product Purpose

Rennova is the intelligent layer between homeowners and contractors. Homeowners describe work in plain language; AI asks only the questions a contractor needs, optionally collects a few useful photos, and produces a contractor-ready brief. Contractors receive opportunities, submit private quotations, showcase portfolios, and (over time) use in-app AI for materials and quoting.

Success: both sides think “that was surprisingly easy.”

## Positioning

Not “post a job and race to the bottom.” Advantage is:
1. AI turns homeowner conversation into a structured brief.
2. Private bids (homeowner-only visibility).
3. Portfolio-led trust.
4. Contractor AI for understanding, materials, and quote prep (help, not price control).

## Jobs & workflows

**Homeowner:** Intent → short AI Q&A (generated UI, not giant forms) → optional 3–5 photos → structured brief → publish → compare private quotes / profiles → message / approve call → select contractor.

**Contractor:** Opportunities → brief → private quote → messaging / call request → Ask Rennova (context-aware) → materials search UX (real data only when connected).

## Constraints

- No giant property surveys, room scanning, or dozens of mandatory photos.
- No trade jargon toward homeowners; translate into brief language.
- Never encourage unsafe photo capture (e.g. climbing roofs).
- Contractors never see each other’s quotes (not a live reverse auction).
- Call: contractor requests; homeowner approves. Homeowner may contact anytime.
- Material prices: never invent live prices; separate mock vs connected data; never invent manufacturer coverage.
- AI generates useful UI (chips, pickers, product cards, calcs), not ChatGPT-clone bubbles alone.

## Brand commitments

- UK English.
- Palette direction: **white / warm-white dominant**, charcoal typography, **Rennova yellow** as primary accent, **red** selective (not competing with errors). Trade identity as premium tech brand — not hazard-sign.
- iOS-first craft: spacing, type, sheets, haptics, clarity. Familiar iOS conventions; do not clone Apple apps.
- Photography carries premium feel (portfolios, home atmosphere).

## Terminology

- Homeowner / Contractor (company or sole trader)
- Project brief
- Private quotation
- Ask Rennova
- Opportunity (contractor view of a published project)

## Evidence / open

### In-scope complete (tree evidence)
- Product: auth, roles, intake+fallback, publish, private quotes, compare/select, messaging, calls, contractor setup (company/sole trader), opportunities, portfolio, Ask Rennova (no invented prices), notifications API+UI, in-app account deletion.
- Polish/hardening: DESIGN tokens, no eyebrow kickers on auth/intake/Ask, `useQuietEntrance` on welcome/auth/home/new-project/intake/jobs; empty/loading/error states; UK English; a11y labels on primary CTAs/menus.
- Launch drafts (acceptable under objective): icon/splash assets, App Store listing draft in About, marked placeholder emails, draft Privacy/Terms, EAS projectId placeholder, soft AI/upload fallbacks.

### Outside agent / paste-before-submit
- OpenAI + storage keys, real EAS projectId, live inboxes (swap when ready). Lawyer review optional and out of agent scope.

<!-- impeccable:inferred — PRODUCT.md written from the user’s explicit 2026-09-23 Rennova product definition plus codebase scan; no separate interview round. -->

# 10 — Failure modes we design against

Ten known ways marketplaces in this category fail. For each: the symptom, why it happens,
the structural response, and — the part usually missing — **how we would detect it happening
to us.** A design principle without a metric is a hope.

---

### 1. Low-quality project posts

*"Need bathroom done. Please quote."*

**Why it happens.** The homeowner is given a text box and no idea what to put in it. They do
not know what a contractor needs, so they write what they know.

**Response.** Guided project creation. There is no free-text-only path to a published
project. The pack is assembled from structured capture, and the homeowner's own words are an
addition to it rather than the whole of it.

**Detection.** Distribution of completeness grades. If C and D grades grow as a share of
published projects, the guidance is failing.

---

### 2. Contractors need more information than the post contains

**Why it happens.** The homeowner cannot supply what they were never asked for, and nobody
knows what is missing until a professional looks.

**Response.** Capture plans written from contractor requirements, not from what is easy to
ask. Plus the pooled information request loop: a contractor asks once, the homeowner answers
once, every contractor benefits.

**Detection.** Rate of information requests per pack, broken down by what was requested. A
request appearing on more than a quarter of packs in a category is a capture plan bug, and
should be fixed in the plan rather than handled per project.

---

### 3. Too many site visits

**Why it happens.** Visiting is the only reliable way to learn what a post omits, so
contractors visit defensively.

**Response.** Give contractors enough to decide whether a visit is genuinely necessary.
Make "firm, subject to visit" a legitimate quote confidence so the visit is a deliberate
choice rather than a default.

**Detection.** Share of quotes submitted without a preceding visit. This is the product's
headline metric. Segment it by category and by completeness grade — if grade A packs are not
visibly reducing visits, the grade is measuring the wrong things.

---

### 4. The homeowner does not know what to capture

**Why it happens.** "Upload photos of your bathroom" assumes knowledge the homeowner does
not have. They will photograph the room from the doorway and nothing else.

**Response.** Never ask for photos. Ask for one specific view at a time, over the camera,
with a direction or an illustration. *"Stand in the doorway."* *"Now show us the shower."*

**Detection.** Per-target completion rates. A target that is skipped far more than its peers
has a wording, illustration or feasibility problem — investigate the target, not the user.

---

### 5. Contractor spam

**Why it happens.** Contact details are released on posting, and every contractor's
incentive is to call first.

**Response.** Contact details are never released without homeowner approval. Messaging is
the default channel. Calls require per-project, per-contractor consent. Declines are silent.

**Detection.** Contact requests received per project, and homeowner approval rate. A falling
approval rate means contractors are requesting indiscriminately and the friction needs to
rise on their side.

---

### 6. Race to the bottom on price

**Why it happens.** Visible competing prices make undercutting the only visible lever, and
the margin is recovered later through variations and corner-cutting.

**Response.** Sealed quotes. No visibility of competitors, prices, or quote counts, and no
post-hoc feedback about where a quote ranked.

**Detection.** Price dispersion within a project, and the correlation between winning and
being cheapest. If the cheapest quote wins nearly always, sealing is not doing its work and
the comparison UI is the likely culprit.

---

### 7. Homeowners choose purely on price

**Why it happens.** With nothing else to compare, price is the only legible dimension.

**Response.** Comparison never sorts by price. Materials-excluded is flagged prominently.
Relevant experience, quote accuracy, warranty and portfolio are given equal visual weight.

**Detection.** Share of awards going to the lowest quote. Around 50–60% is a healthy market
where price matters but is not decisive; above 80% means the other signals are decorative.

---

### 8. Bad measurement data

**Why it happens.** Estimates get presented as facts because a number without a caveat is
tidier, and the caveat gets designed out.

**Response.** Provenance on every measurement, always displayed. Derived values inherit the
weakest confidence in their chain. Unconfirmed sensor and model output never reaches a
contractor.

**Detection.** Variance between Rennova measurements and contractor-verified corrections,
tracked by method. This also calibrates the tolerance table — and if a method's real-world
error consistently exceeds its stated tolerance, the stated tolerance changes that week.

---

### 9. Homeowner abandons a long questionnaire

**Why it happens.** The form is designed around what the business wants to know rather than
what the person can bear to answer, and progress is invisible.

**Response.** Progressive capture with a strict question budget. Every question must change
price, scope, risk or feasibility. Evidence suppresses questions. Honest progress. Save and
resume everywhere. Publication possible before perfection.

**Detection.** Funnel drop-off by step. Any single step losing a disproportionate share is a
design defect, not user behaviour. Also watch time-to-publish; if it exceeds twenty minutes
on Tier C devices, cut questions.

---

### 10. Contractors waste time on bad leads

**Why it happens.** Nothing in a job post distinguishes a serious project from idle
curiosity until the contractor has already invested.

**Response.** The triage header exists entirely for this. Scope, size, location, timing,
supply responsibility and completeness grade are readable in ten seconds. A homeowner who
has completed a guided capture has already demonstrated more intent than one who typed a
sentence.

**Detection.** Contractor time-on-pack before declining, and the ratio of packs viewed to
quotes submitted. High views with low quotes means triage is not doing its job. Ask
declining contractors why, in one tap, and read the answers.

---

## Two failure modes not on the original list

**11. The pack is complete but not trusted.** Contractors read it, then phone the homeowner
anyway. This is the most dangerous outcome, because every headline metric can look healthy
while the product delivers nothing. Navigable provenance, honest grading and visible
tolerances exist for this. Detect it by asking, on every quote: *did you contact the
homeowner before quoting, and why?*

**12. Supply liquidity fails before demand does.** A homeowner who completes a beautiful
capture and receives one quote has had a worse experience than on any existing platform.
Detect it with quotes-per-project: below three, the homeowner cannot meaningfully compare,
and the promise is broken regardless of how good the pack was. This risk is discussed in
[11 — MVP scope and roadmap](11-mvp-scope-and-roadmap.md) and is, realistically, the biggest
threat to the business.

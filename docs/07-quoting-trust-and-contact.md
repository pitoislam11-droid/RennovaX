# 07 — Quoting, trust and contact control

## Private sealed quotes

**Every contractor quotes independently and blind.** A contractor can never see:

- who else is quoting, or how many
- any competitor's price, duration, or inclusions
- any signal derived from those, such as "you are the highest of four"

Only the homeowner sees the full set.

### Why sealed

Open bidding creates a race to the bottom, and the bottom is where bad outcomes live.
Visible competing prices push contractors to shave the quote and recover the margin later
through variations, cheaper materials or rushed work. The homeowner "wins" a low number and
loses on delivery. Sealed quoting keeps the contest on value rather than on undercutting,
and it protects the good contractor who prices the job properly.

### Mechanics

- Quotes are **revealed to the homeowner as they arrive**. Holding them until a deadline
  adds anxiety and delay for no benefit; the homeowner is not bidding against anyone.
- The **contractor never learns the outcome of the comparison** beyond won or not selected.
  No ranking, no "you were 12% high", no post-hoc price feedback. That information is the
  homeowner's, and leaking it reconstructs open bidding one quote at a time.
- **Quote count is not shown to contractors.** Knowing a job has seven quotes changes
  pricing behaviour and encourages exactly the dynamic we are avoiding. The homeowner sees
  the count; the market does not.
- A contractor may **revise** their own quote until the homeowner responds. Revisions are
  versioned and the homeowner sees that a revision occurred.

## A quote is structured, not a number

The comparison is only meaningful if quotes are commensurable. A free-text price field
produces four documents that cannot be compared. So the quote is a structured object:

```
SUBMIT QUOTE

Price                    £ ______   ( inc / ex VAT )
Confidence               ○ Fixed price
                         ○ Firm, subject to a site visit
                         ○ Indicative estimate only
Duration                 ___ working days
Earliest start           [ date ]
Materials                ○ Included  ○ Excluded  ○ Provisional sum £____
Payment schedule         [ stages ]
Warranty                 ___ months on workmanship
Insurance                [ from profile ]

INCLUDED                 [ structured list, prefilled from the scope of works ]
EXCLUDED                 [ structured list ]
ASSUMPTIONS              [ structured list, prefilled from the pack's open items ]
NOTES TO HOMEOWNER       [ free text ]
```

Three design decisions inside that form carry most of the weight.

**Quote confidence is explicit.** Some jobs genuinely cannot be fixed-priced from a phone
scan, and pretending otherwise would discredit the whole product. Letting a contractor say
"indicative, I'd need to see it" is honest and useful — the homeowner can then choose to
invite the best two for visits instead of all six. Rennova's claim is that it removes
*unnecessary* visits, and this field is how that claim stays truthful.

**Assumptions are prefilled from open items.** Every open item in the pack appears in the
quote form asking to be addressed. This forces the ambiguity to be priced explicitly rather
than discovered on site, and it is the main structural defence against the "cheap quote,
expensive job" pattern.

**Inclusions and exclusions are structured**, drawn from the same work-item vocabulary as
the pack. That is what makes a side-by-side comparison real rather than cosmetic.

## How the homeowner compares

The comparison view must not be a price-sorted list. Sorting by price teaches choosing by
price.

```
                  ABC Renovations      Smith & Sons       Riverside Bath Co
Price             £8,400 inc VAT       £7,950 inc VAT     £9,100 inc VAT
Confidence        Fixed                Subject to visit   Fixed
Duration          12 working days      10 days            14 days
Earliest start    6 October            22 September       29 September
Materials         Included             Excluded  ⚠        Included
Warranty          24 months            12 months          36 months
Rating            4.9 (47 reviews)     4.6 (12 reviews)   4.8 (89 reviews)
Verified          ✓ ✓ ✓                ✓                  ✓ ✓ ✓
Similar projects  14 bathrooms         3 bathrooms        60+ bathrooms
```

Deliberate choices: price is a row, not the sort order; **materials excluded is flagged**,
because that is the single most common reason a cheap quote is not cheap; "similar
projects completed" is shown, because relevant experience is what a homeowner actually wants
and rarely knows to ask for.

Where quotes differ in what they include, say so in plain language above the table: *"Smith
& Sons have excluded materials. Ask them for an estimate of material cost before
comparing."* This is the translation layer doing its job on the commercial side as well as
the technical one.

## Contact control

Contractors cannot cold-call homeowners. This is non-negotiable and it is one of the most
tangible differences a homeowner will feel versus existing platforms, where posting a job
can mean a day of unsolicited calls.

```
CONTRACTOR                          HOMEOWNER

[ Request a call ]      ───────▶    ABC Renovations would like to
                                    discuss your bathroom project.

                                    [ APPROVE ]  [ MESSAGE INSTEAD ]
                                    [ DECLINE ]
```

- **Messaging is the default channel** and is available to a contractor who has quoted,
  in-app, without a phone number changing hands.
- **A call requires explicit approval**, per contractor, per project.
- **The homeowner can always initiate.** If they like a quote, they can call or message
  immediately — the restriction is one-directional by design.
- **Precise address is released only on approval**, and full contact details only when the
  homeowner chooses a contractor or explicitly shares them.
- **Declining is quiet.** The contractor sees "no response", not a rejection notice. There
  is no upside in making refusal feel confrontational.

### Anti-circumvention, honestly

Contractors will try to move conversations off-platform, both innocently and to avoid fees.
Detect phone numbers, emails and addresses in messages and warn before sending. Do not
claim this is watertight — anyone determined can spell a number in words. The realistic
defence is that staying on-platform is genuinely more useful: the pack, the media, the quote
history, the payment record and the dispute trail all live there.

Design so that leaving the platform is a downgrade, not a saving.

## Trust mechanisms beyond the quote

**Structured assumptions** mean surprises are surfaced before the job, not after.

**Variation tracking** after award: when the price changes, it is recorded against a reason
and linked back to the original quote and to any related open item. This produces the single
most valuable review question in the category.

**Review the accuracy, not just the work.** Standard reviews ask "were you happy?" Rennova
also asks:

> *"Did the final price match the quote?"*
> — Yes, exactly  /  Slightly more, and it was explained  /  Significantly more

Publishing quote accuracy alongside star ratings changes contractor behaviour more than any
other single mechanism, because it makes careful quoting a visible competitive asset and
makes lowballing visibly costly. It also directly rewards the contractors who engage
properly with the open items.

## Commercial model — noted, not decided

The revenue model shapes incentives more than any feature, so it belongs in the same
conversation.

| Model | Incentive it creates |
|---|---|
| Pay per lead | Maximise leads, including poor ones. The failure mode of existing platforms. |
| Subscription for contractors | Predictable, but decouples our revenue from outcome quality. |
| Commission on won work | Aligns us with successful jobs, but is hard to enforce and pushes work off-platform. |
| Fee on quote acceptance | Closest alignment: we are paid when the homeowner chooses someone. |
| Homeowner pays | Kills a two-sided marketplace at launch. |

The strong argument is for charging on **outcome, not access** — because our entire thesis
is that a Rennova project converts far better than a lead, and our economics should say so.
Flagged as a founder decision in [13 — Open questions](13-open-questions.md).

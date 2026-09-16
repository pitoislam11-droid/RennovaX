# 06 — The contractor job pack

**This is what Rennova is actually building.** The homeowner experience is simple; the job
pack is where all of that simplicity is converted into professional value.

## How contractors actually read

Contractors do not read a job pack top to bottom. They triage in about ten seconds, decide
whether to engage, and only then read properly. The pack is structured around that
behaviour, in three zones.

```
┌─────────────────────────────────────────┐
│ ZONE 1 — TRIAGE          (10 seconds)   │  Is this mine? Do I want it?
├─────────────────────────────────────────┤
│ ZONE 2 — UNDERSTANDING   (2 minutes)    │  What is it, exactly?
├─────────────────────────────────────────┤
│ ZONE 3 — PRICING         (as long as    │  What do I need to put numbers on it?
│                           it takes)     │
└─────────────────────────────────────────┘
```

Getting zone 1 wrong wastes contractor time on jobs they were never going to take, which is
the exact cost the product exists to remove.

## Zone 1 — Triage header

Everything a contractor needs to decide whether to continue, on one screen, above the fold.

```
┌──────────────────────────────────────────────────────┐
│  FULL BATHROOM RENOVATION                            │
│  Richmond, TW9  ·  6.2 miles                         │
│                                                      │
│  Bathroom · 7.3 m² · 2nd floor flat · lift           │
│  Start: within 4 weeks                               │
│  Materials: contractor to supply                     │
│                                                      │
│  ████████░░  PACK COMPLETENESS: B                    │
│  Scan · 14 photos · walkthrough video · 3 open items │
│                                                      │
│  Posted 2 hours ago  ·  4 contractors viewing        │
└──────────────────────────────────────────────────────┘
```

Deliberately included:

- **Trade and scope headline**, generated from the work items, not typed by the homeowner.
- **Approximate location and travel distance** from the contractor's base. Never the full
  address.
- **Size**, because it is the fastest proxy for value.
- **Timing and supply responsibility**, the two facts that most often disqualify a job.
- **Completeness grade**, so the contractor knows how much to trust the pack before reading.
- **Media inventory**, signalling that real evidence exists.

Deliberately excluded: anything about other contractors' interest beyond a viewer count, and
absolutely no pricing signal from anyone.

## Zone 2 — Understanding

### Property context

```
PROPERTY
2-bedroom flat · second floor · lift available
Built approx. 1930s · leasehold
Occupied during works · one cat
```

### The space

```
BATHROOM

Approx. dimensions   2.8 m × 2.6 m      ±5 cm
Approx. floor area   7.3 m²             ±0.4
Ceiling height       2.42 m             ±2 cm

MEASUREMENT SOURCE
LiDAR-assisted room scan · confirmed by homeowner
Contractors should verify before ordering materials.
```

The measurement source block is not boilerplate. It is the thing that lets a contractor
decide how much weight to place on the numbers, and it is the single clearest signal that
this pack is different from a job board post.

### Current condition

```
CURRENTLY IN THE ROOM
Bath with over-bath shower   ·   WC   ·   Basin with pedestal
Radiator   ·   Window (1)   ·   Door (1)   ·   Extractor fan

CURRENT FINISHES
Walls    Tiled around bath, painted elsewhere
Floor    Tile
Ceiling  Painted

NOTED CONDITION
Staining on ceiling above the bath  ▸ 2 photos
Grout in poor condition around bath  ▸ 3 photos
```

### Scope of works

Presented in trade sequence, not the order the homeowner mentioned things. Each line is
tappable to reveal its provenance.

```
SCOPE OF WORKS

STRIP OUT
  Remove existing bath, taps and screen
  Remove WC and basin
  Remove existing wall and floor tiling
  Remove radiator

SERVICES
  Alterations to hot, cold and waste services          ▸ why
  required to relocate shower to the opposite wall
  Electrical: existing extractor retained

INSTALL
  Walk-in shower, level access preferred                ▸ why
  New WC  ·  New basin
  New radiator (position unchanged)

FINISHES
  New wall tiling — extent to be confirmed  ⚠ open item
  New floor tiling
  Decorate remaining wall and ceiling areas
```

### The homeowner's own words

```
IN THE HOMEOWNER'S WORDS                            🎙 0:34

"The main thing is we want to get rid of the bath because
my mum struggles getting in and out of it. We'd like it
done before Christmas if possible."
```

Never omitted, never rewritten. Contractors report this is often the most useful section,
because it contains the *reason*, and the reason frequently changes the recommendation. A
contractor reading that paragraph may propose a different specification entirely — level
access, grab rails, a different door — which is the kind of expertise Rennova should make
easier to apply, not harder.

### Open items

```
OPEN ITEMS  (3)

⚠ Tiling height not decided
  Affects tile quantity and labour.
  Homeowner would like your recommendation.

⚠ Ceiling staining — cause not established
  Visible above bath. Homeowner unsure whether there
  has been a leak from above. ▸ 2 photos

⚠ Homeowner unsure whether the flat has a combi boiler
  Affects shower type. ▸ photo of boiler provided
```

Open items are a headline feature, not an apology. They are the pack telling the truth about
what it does not know, which is precisely what lets a contractor price confidently around
them.

### Access and logistics

```
ACCESS
Second floor · lift available
Parking: permit zone, restrictions 8am–6:30pm Mon–Fri
Stairs from lift to flat: 6 steps
Skip: no front garden — likely permit required
Working hours: building restricts to 8am–6pm weekdays
```

Access is where quotes go wrong. A second-floor flat with no lift and a permit zone is a
materially different job from the same bathroom at ground level, and contractors routinely
discover this on the day.

### Media

```
MEDIA
▶ Room walkthrough  0:48
  14 photos  ·  grouped by area
  Room scan  ·  floor layout
```

Photos are grouped by capture target and labelled with what they were meant to show, rather
than dumped as a grid. "Under the basin" is a more useful label than "IMG_0184".

## Zone 3 — Quoting

Covered in [07 — Quoting, trust and contact](07-quoting-trust-and-contact.md).

## Completeness grade

A single letter, computed from coverage against the capture plan, evidence quality,
measurement provenance and number of unresolved open items.

| Grade | Meaning |
|---|---|
| **A** | All required targets satisfied; measurements confirmed; few open items. Priceable without a visit for a competent contractor. |
| **B** | Most requirements met; some estimates unconfirmed or a few open items. Priceable with stated assumptions. |
| **C** | Significant gaps. Indicative pricing only; a visit or a conversation is likely needed. |
| **D** | Minimal information. Published at the homeowner's insistence. |

The grade serves three purposes at once: it sets contractor expectations honestly, it gives
the homeowner a concrete reason to complete capture ("two more photos moves you to A"), and
it gives us a north-star quality metric to optimise against.

The grade must never be inflated. The moment a B pack feels like a C, the signal is dead.

## Versioning and change notification

Packs are versioned. When a homeowner adds information after publication, a new version is
issued and contractors who have already viewed or quoted are notified with a specific diff:

> *"The homeowner added 3 photos of the area under the basin and confirmed the tiling
> height. Your quote may need updating."*

Never a bare "this project was updated". Say what changed.

## The feedback loop — the most important mechanism in the product

Every contractor interaction with a pack ends by asking one structured question. On quote
submission, on decline, and on "request a visit":

```
Was anything missing from this project?

  [ Nothing — I could price it ]
  [ Needed more photos of… ]
  [ Needed measurements of… ]
  [ Needed to know about… ]
  [ Had to visit to price this properly ]
```

Two things happen with the answer, and both matter enormously.

**Immediately — pooled information requests.** The request goes to the homeowner
anonymously and aggregated:

> *"A contractor has asked for a photo of the pipework under your basin. Adding it will
> help everyone quote more accurately."*  → one tap → camera opens on that target

The new evidence goes into the pack for **all** contractors, not just the one who asked.
This is a genuine three-way win: the homeowner does 20 seconds of work instead of taking
four phone calls, every contractor gets better information, and the asking contractor gets
their answer without ever contacting the homeowner directly. It preserves the sealed model
while routing information exactly where it needs to go.

**Over time — capture plan evolution.** Missing-information tags aggregate by category. When
"pipework under basin" is requested on 30% of bathroom projects, it becomes a required
capture target in the next capture plan version, and no homeowner is ever asked for it
again.

This loop is how Rennova gets smarter without any machine learning at all. It should be
built into the MVP, not deferred. It is cheap to build and it is the thing that compounds.

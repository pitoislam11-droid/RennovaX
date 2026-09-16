# 02 — Domain model

The vocabulary below is the shared language of the codebase, the schemas and the product
conversations. Where a term is defined here, it is not redefined elsewhere.

## Core entities

```
Property
 └── Space                 (a room or area: bathroom, kitchen, hallway, loft, garden)
      ├── Element          (a thing in the space: bath, WC, window, radiator, wall, floor)
      │    └── Condition   (an observed defect or state attached to an element)
      └── Measurement      (a dimension of a space or element, with provenance)

Project
 ├── CaptureSession        (one guided walkthrough; produces Evidence)
 │    └── Evidence         (photo, video segment, scan, depth frame, voice note)
 ├── Fact                  (typed assertion with provenance; the Layer 3 store)
 ├── WorkItem              (a unit of intended work: element + disposition + notes)
 ├── OpenItem              (a known unknown, surfaced to contractors deliberately)
 └── JobPack               (the published, contractor-facing rendering of all of the above)

Quote                      (one contractor's sealed response to a JobPack)
ContractorProfile
 ├── PortfolioProject
 ├── Verification          (a specific, named check with an expiry)
 └── Review                (linked to a completed project)

Conversation               (homeowner ↔ contractor, post-quote)
ContactRequest             (contractor asks; homeowner grants or refuses)
```

## Property

A physical address plus its structural context. Deliberately holds the things that change
cost but have nothing to do with the room being worked on:

- Property type (flat, terraced, semi, detached, maisonette, bungalow)
- Floor / storeys, and whether there is a lift
- Approximate age band (pre-1919, interwar, post-war, 1980s+, new build) — drives
  assumptions about construction and likely surprises
- Tenure (owner-occupier, landlord, leaseholder) — leaseholders may need freeholder consent
- Listed building or conservation area flag
- Access: parking, permit zones, skip permit likely, stair width, working-hours restrictions
- Occupancy during works, pets, children

Precise address is **not** disclosed to contractors before contact is approved. See
[07 — Quoting, trust and contact](07-quoting-trust-and-contact.md).

## Space

A room or defined area. Spaces are the unit of capture — a capture session addresses one
space at a time.

Holds: type, name, measurements, finishes, and the elements within it.

## Element and disposition

An Element is a thing a contractor cares about: fixtures (bath, WC, basin, shower,
radiator, boiler), openings (door, window), surfaces (wall, floor, ceiling), services
(sockets, switches, lights, extractor, pipework).

**Disposition is the heart of renovation scoping.** It is the answer to "what is happening
to this?" and it is what turns a room inventory into a scope of works. The vocabulary is
small on purpose, because each value must map to a question an ordinary person can answer:

| Disposition | Homeowner-facing phrasing |
|---|---|
| `KEEP` | Staying exactly as it is |
| `KEEP_PROTECT` | Staying, and must be protected during the work |
| `REPLACE_LIKE_FOR_LIKE` | Replacing with something similar in the same place |
| `REPLACE_DIFFERENT` | Replacing with something different |
| `RELOCATE` | Same item, different position |
| `REMOVE` | Taking it out and not replacing it |
| `ADD_NEW` | Something new that is not there today |
| `REFINISH` | Staying, but being repaired, painted or re-covered |
| `UNDECIDED` | Homeowner does not know yet — becomes an OpenItem |

Two dispositions carry disproportionate cost signal and should always be asked explicitly
rather than inferred: `RELOCATE` (implies services move, which is where bathroom and
kitchen budgets are won and lost) and `UNDECIDED` (implies the contractor must price a
provisional sum or exclude it).

## Condition

An observed problem attached to an element: crack, damp or staining, rot, mould, uneven
surface, missing finish, previous poor workmanship, corrosion.

Each condition records: what, where (element + optionally a region of a photo), severity as
the homeowner perceives it, who observed it (homeowner, detection, contractor), and whether
remediation is in scope. Conditions are the most common source of quote variance, so a
condition that exists but has **not** been resolved into a work item must appear as an open
item rather than being dropped.

## Fact and provenance

Every structured assertion is a Fact:

```jsonc
{
  "key": "space.bathroom.floor_area",
  "value": { "magnitude": 7.3, "unit": "m2" },
  "provenance": {
    "source": "DERIVED",           // DECLARED | OBSERVED | ESTIMATED | MEASURED | DERIVED | INFERRED
    "method": "room_scan_lidar",
    "confidence": 0.86,            // 0–1, calibrated per method
    "tolerance": { "value": 0.4, "unit": "m2" },
    "capturedAt": "2026-09-14T10:22:31Z",
    "derivedFrom": ["space.bathroom.length", "space.bathroom.width"],
    "confirmedBy": "HOMEOWNER",    // null | HOMEOWNER | CONTRACTOR
    "confirmedAt": "2026-09-14T10:24:02Z",
    "evidenceIds": ["ev_8812", "ev_8813"]
  }
}
```

Source values:

| Source | Meaning |
|---|---|
| `DECLARED` | The homeowner told us directly |
| `OBSERVED` | Visible in evidence and confirmed by a human |
| `ESTIMATED` | Produced by AR/photogrammetry without a precise sensor |
| `MEASURED` | From a precise instrument: LiDAR scan, laser measure, or a tape reading typed in |
| `DERIVED` | Computed from other facts (inherits the weakest confidence in its chain) |
| `INFERRED` | Produced by a model or rule, **not yet confirmed** — may never be shown to a contractor while in this state |

The rule for `DERIVED` is strict and load-bearing: **a derived fact can never be more
confident than the least confident fact it derives from.** Wall area computed from an
estimated ceiling height is an estimate, no matter how precise the arithmetic looks.

The rule for `INFERRED` is equally strict: inferred facts are homeowner-confirmable
proposals, not facts. They are promoted to `OBSERVED` on confirmation, or discarded. A pack
never ships raw model output.

## WorkItem

The bridge between facts and specification. A WorkItem binds an element to a disposition,
plus quantities, materials responsibility, and any conditions to be remedied. WorkItems are
what the contractor prices, and their ordering in the pack follows trade sequence (strip
out → first fix → substrate → second fix → finishes) rather than the order the homeowner
happened to mention them.

## OpenItem

A deliberately surfaced unknown. Created when the homeowner answers "not sure", when
capture could not satisfy a required target, or when a condition was observed but not
resolved into scope.

Each open item states the question, why it matters to pricing, and what would resolve it.
Contractors handle them as provisional sums, exclusions, or a reason to visit. **Open items
are a feature.** A pack with three clearly stated unknowns is far more useful than a pack
that appears complete and is quietly wrong.

## JobPack

The published, immutable-at-version rendering of a project for contractors. Versioned: if
the homeowner adds information after publication, a new version is issued and contractors
who already quoted are notified of what changed.

Specified in full in [06 — The contractor job pack](06-contractor-job-pack.md).

## Naming conventions

- Spaces, elements and facts use snake_case keys, namespaced by owner: `space.bathroom.ceiling_height`.
- Enum values are SCREAMING_SNAKE_CASE.
- Homeowner-facing labels never live in code; they live in the capture plan and the
  translation ruleset, both of which are versioned data. This is what lets us change
  wording, add Welsh or another language, or A/B test a question without shipping an app
  release.

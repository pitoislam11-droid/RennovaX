# Glossary

Two parts: the translation dictionary that the product depends on, and the internal terms
used across this repository.

---

## Part 1 — Homeowner language ↔ trade language

The core asset of the translation layer. The left column is what we say to homeowners; the
right is what appears in the job pack. **The direction is one-way.** Trade terms never
appear in a question.

### Plumbing and services

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Are you moving the sink, toilet or shower to a different position?" | Alterations to hot, cold and waste services; first-fix plumbing |
| "Is your boiler the type with a hot water tank in a cupboard?" | System vs combination boiler; affects shower pressure and pump requirement |
| "Does the shower feel weak?" | Low mains pressure; pump or pressure survey may be required |
| "Where does the water come into the room?" | Existing supply positions |
| "Do you want a heated towel rail instead of the radiator?" | Replace radiator with heated towel rail; alteration to heating circuit |

### Electrical

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Are you adding any new lights, sockets or switches?" | New circuits or spurs; notifiable work under Part P |
| "Do you want the lights in different places?" | Alteration to lighting circuit; second-fix electrical |
| "Is there a fan in the room, and does it work?" | Existing extraction; ventilation compliance may apply |
| "Roughly when was the house last rewired, if you know?" | Age of installation; possible consumer unit or circuit upgrade |

### Surfaces and substrate

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Are the walls cracked, damaged or uneven?" | Substrate preparation required prior to finishing |
| "Is there any damp, staining or peeling paint?" | Possible moisture ingress; investigation required before finishing |
| "Are the walls solid brick or hollow when you knock?" | Masonry vs stud partition; affects fixings and boarding |
| "Would you like tiles all the way up to the ceiling?" | Full-height tiling vs splashback-height tiling |
| "Is the floor level and solid, or does it bounce?" | Timber vs solid floor; possible overboarding or levelling compound |
| "Is there anything stuck to the walls now — tiles, panels, wallpaper?" | Existing finishes to be removed; making good required |

### Structure and openings

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Are you taking down or moving any walls?" | Structural alteration; structural engineer and building control likely |
| "Do you want the door moved or made wider?" | Alteration to opening; lintel may be required |
| "Does the door open into the room or out?" | Door swing; affects layout constraints |

### Scope and disposition

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Is this staying, or going?" | Element disposition |
| "Same again, or something different?" | Like-for-like vs specification change |
| "Is it staying exactly where it is?" | Relocation required (yes/no) |
| "Who's buying the bath, tiles and taps?" | Material supply responsibility |
| "Do you already know what you want, or would you like advice?" | Specification defined vs contractor to advise |

### Access and logistics

| Ask the homeowner | Produces, in the pack |
|---|---|
| "How would someone get materials in?" | Access route; manual handling constraints |
| "Is there a lift?" | Vertical access |
| "Where would a van park?" | Parking restrictions; permit requirements |
| "Is there anywhere to put a skip?" | Waste removal; skip permit likely |
| "Will anyone be living there while the work happens?" | Occupied works; dust protection and staged working |
| "Are there any restrictions on when work can happen?" | Working hours restrictions; lease or building management terms |

### Condition

| Ask the homeowner | Produces, in the pack |
|---|---|
| "Has anything leaked recently?" | Possible water damage; investigation required |
| "Is there black mould anywhere?" | Mould presence; ventilation and remediation |
| "Does anything feel soft or spongy?" | Possible rot or failed substrate |
| "Is anything cracked, chipped or coming loose?" | Defects requiring making good |

---

## Part 2 — Internal terms

**Capture plan** — versioned data describing what must be collected for a project category.
Interpreted by the capture runtime. Never hard-coded.

**Capture runtime** — the generic client-side state machine that executes a capture plan.

**Capture target** — one item within a plan: a photo, a video segment, a scan, a
measurement, or a question.

**Capture session** — one guided walkthrough, producing evidence.

**Completeness grade** — A to D, describing how priceable a pack is. See
[06](06-contractor-job-pack.md).

**Condition** — an observed defect or state attached to an element.

**Disposition** — what is happening to an element: keep, replace, relocate, remove, add,
refinish, undecided. The heart of scoping. See [02](02-domain-model.md).

**Element** — a thing in a space that a contractor cares about.

**Evidence** — an immutable captured asset: photo, video segment, scan, depth frame, voice
note.

**Fact** — a typed assertion with provenance. The Layer 3 store.

**Job pack** — the published, contractor-facing rendering of a project. The product's actual
deliverable.

**Navigable provenance** — the property that every line of a job pack can be traced back,
in the interface, to the answer or evidence that produced it.

**Open item** — a deliberately surfaced unknown, stated in the pack so contractors can price
around it.

**Pooled information request** — a contractor's request for missing information, delivered
anonymously to the homeowner and shared with all contractors on that project.

**Provenance** — source, method, confidence, tolerance, confirmation state and evidence
links attached to every fact.

**Quote confidence** — fixed, firm subject to visit, or indicative. Stated by the contractor.

**Satisfier** — the mechanism that fulfils a capture target: human capture, manual entry,
answer, detection, room scan, AR measurement.

**Space** — a room or defined area; the unit of capture.

**Tier (A–D)** — device capability level determining which measurement methods are
available. See [03](03-guided-capture.md).

**Translation ruleset** — versioned rules converting facts into contractor-facing
specification language.

**Work item** — element plus disposition plus quantities and materials responsibility. The
unit a contractor prices.

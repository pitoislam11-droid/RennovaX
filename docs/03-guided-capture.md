# 03 — Guided capture

## The idea

Do not ask the homeowner to upload photos. Stand next to them and tell them where to point
the phone.

```
STEP 4 OF 9

Show us your bathroom

        ┌─────────────────┐
        │   [ diagram ]   │
        │  person in door │
        └─────────────────┘

Stand in the doorway and point your
camera into the room.

        [  START CAMERA  ]
```

then, live, over the viewfinder:

```
    ←  Now slowly turn to the left wall
                                    ●○○○○
```

```
    ↑  Great. Now show us the ceiling
                                    ●●○○○
```

The homeowner never needs to know *why* any of this matters. Rennova knows what contractors
need; the homeowner just follows instructions.

## Capture plans are data, not screens

This is the single most important architectural decision in the product.

A **capture plan** is a versioned, server-delivered document that describes what must be
collected for a given project category. It is interpreted by a generic capture runtime in
the app. There is no hand-built "bathroom screen".

```
Project category  ──▶  Capture plan (data)  ──▶  Capture runtime (app)
"bathroom_renovation"    v3, 14 targets          generic interpreter
```

Why this matters more than it first appears:

- **The MVP and the far future run the same schema.** In the MVP, a target is satisfied by
  a human pointing a camera and tapping the shutter. Later, the identical target is
  satisfied automatically by object detection or a room scan. The plan does not change; the
  *satisfier* changes. Nothing is thrown away.
- **Capture plans improve without app releases.** Contractor feedback says bathroom packs
  keep missing the underside of the basin? Add a target, bump the version, ship it that
  afternoon to every user.
- **Trade knowledge lives in data where domain experts can edit it**, not buried in React
  components. We can have an actual builder review a capture plan.
- **Plans are versioned and pinned.** A project in progress keeps the plan version it
  started with, so a homeowner is never half-way through a flow that changes under them.

The schema is in [`schemas/capture-plan.schema.json`](../schemas/capture-plan.schema.json),
with a full worked example in
[`examples/capture-plans/bathroom-renovation.json`](../examples/capture-plans/bathroom-renovation.json).

## Anatomy of a capture target

```jsonc
{
  "id": "bath_area_wide",
  "mode": "PHOTO",                       // PHOTO | VIDEO_SEGMENT | SCAN | MEASUREMENT | ANSWER
  "requirement": "REQUIRED",             // REQUIRED | RECOMMENDED | CONDITIONAL | OPTIONAL
  "condition": "element.bath.present == true",
  "subject": "element.bath",

  "instruction": "Show us the bath",     // homeowner-facing, plain English, imperative
  "hint": "Stand back far enough to get the whole bath and the wall behind it",
  "guidance": { "type": "DIRECTION", "value": "FORWARD" },
  "illustration": "bath_wide.svg",

  "rationale": "Contractors need to see the bath, its taps and the tiling behind it to price removal and making good.",

  "acceptance": { "minPhotos": 1, "requireLevelHorizon": false, "minLuxWarn": 40 },
  "satisfiedBy": ["HUMAN_CAPTURE", "DETECTION:bath"],
  "fallback": "SKIP_WITH_REASON"
}
```

Two fields deserve attention.

**`rationale`** is never shown to the homeowner. It is shown to *contractors* when they ask
why a piece of evidence exists, and to us when we review plans. Writing it forces the
discipline that every target must justify its cost in homeowner effort.

**`satisfiedBy`** is the evolution hook. `HUMAN_CAPTURE` is the MVP. Adding `DETECTION:bath`
later means that when the scan confidently finds a bath, this target is auto-satisfied and
the homeowner is asked to confirm rather than to perform.

## Device capability tiers

Never assume LiDAR. Detect capability at runtime and degrade honestly.

| Tier | Devices | Capture experience | Measurement result |
|---|---|---|---|
| **A — Depth sensor** | iPhone 12 Pro / Pro Max and later Pro models, iPad Pro 2020+ | Guided room scan via Apple RoomPlan; walls, doors, windows and openings detected automatically | `MEASURED`, centimetre-level, homeowner confirms |
| **B — AR capable** | Most modern iOS and ARCore-supported Android | Guided AR walkthrough; plane detection, point-to-point estimates; depth-from-motion where available | `ESTIMATED`, coarser tolerance, homeowner confirms |
| **C — Camera only** | Older or unsupported devices, or AR declined/failed | Guided photo and video capture only | Manual entry: "Measure this wall from corner to corner", with an illustration |
| **D — Assisted** | Any tier, any time | Homeowner opts out of scanning entirely | Manual entry throughout |

Rules across tiers:

- **Tier is never a wall.** Every project must be completable on Tier C. A Tier A device
  produces a *better* pack, not the only possible pack.
- **Fall back silently and gracefully.** If a scan fails or the room is too dark, do not
  show an error — move to the next-best method and carry on. The homeowner should not feel
  they failed.
- **Never let tier leak into homeowner-facing copy.** They do not need to hear "LiDAR" or
  "ARKit". The contractor-facing pack, by contrast, states the method precisely.

Grounding for these tiers: Apple's RoomPlan requires a LiDAR-equipped device and is
documented as accurate to within a few centimetres, with sessions best kept short and rooms
within roughly 9 × 9 m. ARCore provides a Depth API (depth-from-motion, optionally fused
with time-of-flight) rather than a structured room-model API, so an Android equivalent of
RoomPlan has to be assembled from lower-level primitives. Plan for asymmetry between the
platforms rather than hoping for parity.

## Guided video versus guided stills

Both, for different jobs.

**Guided video walkthrough** is the primary spatial record. One continuous pass produces
context, adjacency and a sense of the room that a set of stills never conveys. It is also
far less work for the homeowner — one take rather than fourteen decisions. The app drives it
live: "start at the doorway", "slowly turn left", "now show the ceiling", "move towards the
window".

**Guided stills** are for detail that must be sharp: the underside of the basin, the crack
by the window, the boiler data plate, the meter, the tap type, the existing tile.

Practically, the video pass comes first and builds coverage; the stills pass is then short
and targeted, and can be narrowed by what the video already showed.

Frames extracted from a walkthrough are evidence in their own right and are the natural
input for later detection work. Capture them at a known cadence with device pose attached
where available, because that decision is expensive to retrofit.

## Coverage and sufficiency

The capture runtime tracks coverage against the plan and can be honest about it:

- Every `REQUIRED` target either satisfied or explicitly skipped with a reason.
- Conditional targets evaluated as facts arrive (no bath present → bath targets drop out).
- Spatial coverage for video: did we see all four walls, the ceiling and the floor? On
  AR-capable devices this can be tracked from device heading; on Tier C it is inferred from
  the instruction sequence the homeowner completed.

Coverage feeds the pack's completeness grade (see
[06 — The contractor job pack](06-contractor-job-pack.md)) and drives gentle nudges: *"Two
quick photos would make your project much easier to price."* Never a hard block. A homeowner
who wants to publish an incomplete project may do so; the pack states plainly what is
missing.

## UX rules for capture

1. **One instruction on screen at a time.** Never a checklist of things to photograph.
2. **Imperative, verb-first, plain English.** "Show us the ceiling." Not "ceiling imagery
   required."
3. **Large type, high contrast, glanceable.** They are holding the phone at arm's length,
   often in a small, badly lit room.
4. **Confirm progress immediately.** "Got it." A visible step counter. Momentum is what
   carries someone through fourteen targets.
5. **Always allow skip**, and always ask why in one tap (can't reach, not applicable, will
   do later, don't want to). The reason goes in the pack — a skipped target with a reason is
   information; a silently missing one is a hole.
6. **Allow retake, always.** Show the captured frame briefly with a retake affordance.
7. **Save continuously.** Someone will be interrupted mid-bathroom. They must be able to
   resume on the exact target they left, hours later.
8. **Never show a fake progress bar.** If the number of remaining steps can change, say
   "about 4 more" rather than inventing precision. Honesty here is consistent with the rest
   of the product and homeowners detect the difference.
9. **Voice input over typing.** Free-text notes should default to a microphone with
   transcription. Nobody wants to type in a bathroom.

## Safety, physical limits and accessibility

The app is instructing a member of the public to move around their home holding a phone.

- **Never instruct anyone to climb**, lean out of a window, go onto a roof, enter a loft
  via a ladder, or move heavy items. Where a high or awkward view is needed, ask for the
  best available angle and mark the target as partially satisfied.
- **Never instruct anyone to touch services.** No opening consumer units, no isolating
  valves, no removing panels that are not obviously removable.
- **Offer a no-camera path.** Some people cannot comfortably perform a walkthrough — mobility,
  anxiety, a phone they are not confident with. Manual entry plus free-text must reach a
  publishable pack, with the completeness grade reflecting reality.
- **Low light is common in bathrooms.** Detect it, offer the torch, warn before accepting
  an unusable frame.
- **Do not demand two hands.** Any interaction that needs the other hand while holding a
  phone up is a design failure.

## Privacy — this is not optional

The homeowner is photographing the inside of their home, and that pack goes to several
contractors they have not met and have not chosen.

- **Strip EXIF location** from every captured asset at ingest, without exception.
- **Warn before publication** about what is visible: people, documents, keys, valuables,
  screens. Offer per-asset review with a blur or delete affordance.
- **Face blurring** should be automatic where anyone is visible, with the homeowner able to
  restore it.
- **Precise address is withheld** until the homeowner approves contact. Contractors see an
  approximate area ("Richmond, TW9") and a travel distance, not a doorstep.
- **Media access is scoped and expiring.** Signed, short-lived URLs tied to the contractor
  who was granted the pack. No permanently public asset URLs, ever.
- **Retention is stated and enforced.** Media for projects that were never published, or
  that completed long ago, is deleted on a schedule the homeowner is told about at capture
  time. UK GDPR makes this a legal duty as well as a trust one.

## Offline-first is a requirement, not a nicety

Bathrooms, basements, lofts and rural properties have poor signal. Capture must work fully
offline: plans cached, evidence written to local storage, facts queued, everything uploaded
opportunistically with resumable transfer. A homeowner who has just completed a walkthrough
must never be told their work was lost.

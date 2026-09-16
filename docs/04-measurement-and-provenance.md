# 04 — Measurement and provenance

## The governing rule

**Never present an uncertain measurement as a certain one.**

A contractor who orders 40 m² of tile against a number we implied was exact, and finds the
room is 44 m², will never trust another Rennova pack. The reputational asymmetry is brutal:
one confidently wrong number costs more than fifty honestly hedged ones.

So Rennova never displays a bare measurement. Every dimension appears with its source and
its tolerance, in both the app and the pack.

```
Floor area        7.3 m²  ±0.4       LiDAR scan · confirmed by homeowner
Ceiling height    2.42 m  ±0.02      LiDAR scan · confirmed by homeowner
Window width      0.9 m   ±0.10      AR estimate · not confirmed
Bath length       1.70 m  exact      Tape measure · entered by homeowner
```

## The measurement ladder

Best available method wins, and we record which one ran.

**Tier A — Depth-sensor room scan.** Apple RoomPlan on LiDAR-equipped devices produces
walls, openings, doors, windows and a parametric room model, accurate to within a few
centimetres. Recorded as `MEASURED`, method `room_scan_lidar`. Best case: the homeowner
walks the room once and dimensions, layout and an element inventory all fall out.

**Tier B — AR estimation.** Plane detection and point-to-point measurement on ARCore or
non-LiDAR ARKit, using depth-from-motion where available. Usable, visibly coarser. Recorded
as `ESTIMATED`, method `ar_plane_estimate`, with a wider tolerance. Always homeowner-confirmed
before it reaches a pack.

**Tier C — Guided manual entry.** The app shows an illustration of exactly what to measure
and asks for a number.

```
        ┌───────────────────────────┐
        │  ┌─────────────────────┐  │
        │  │                     │  │
        │  │                     │  │
        │  └─────────────────────┘  │
        │  ↤─────────────────────↦  │
        │    corner to corner       │
        └───────────────────────────┘

Measure this wall from corner to corner,
along the floor.

        [  3.62  ] m        ( switch to feet )
```

Recorded as `MEASURED`, method `manual_tape`. Note that a carefully taken tape measurement
is **more** accurate than a phone estimate — manual entry is a fallback in convenience, not
in quality, and the pack should not imply otherwise.

**Tier D — Bluetooth laser distance meter.** Later, but the integration is small and some
homeowners own one. Recorded as `MEASURED`, method `laser_ble`, tolerance from the device
spec. Magicplan's pairing with laser meters for near-exact capture is the precedent.

**Tier E — Nothing.** No measurement. The pack says so, and the affected quantities become
open items. This is an acceptable outcome, not a failure state.

## Confirmation is a separate axis from method

A measurement has both a *method* and a *confirmation state*, and they are independent:

```
                  not confirmed          homeowner confirmed      contractor verified
room_scan_lidar   internal only          shown in pack            shown, flagged
ar_plane_estimate internal only          shown in pack, hedged    shown, flagged
manual_tape       shown in pack          shown in pack            shown, flagged
```

Rule: **anything produced by a sensor or a model must be confirmed by the homeowner before
it reaches a contractor.** Confirmation is cheap and conversational:

```
We measured your bathroom as

    2.8 m  ×  2.6 m

Does that look about right?

    [ LOOKS RIGHT ]   [ NOT QUITE ]   [ NO IDEA ]
```

"No idea" is a legitimate answer and is recorded as such — it marks the measurement as
unconfirmed rather than forcing a false confirmation. This is better data than a homeowner
tapping "looks right" to make the screen go away.

## Detection confirmation

The same pattern applies to anything a model detects:

```
We found 1 window in this room.
Is that right?

    [ YES ]    [ NO — there are... ]
```

```
We found 2 doors. Is that right?

    [ YES ]    [ NO — there are... ]
```

Until confirmed, a detection is an `INFERRED` fact and **must not appear in a job pack.**
Confirmed, it is promoted to `OBSERVED`. Contradicted, it is discarded and replaced with the
homeowner's count, which is recorded as `DECLARED`.

This is what makes optimistic computer vision safe to ship: the model's job is to *reduce
typing*, not to *assert truth*.

## Derived quantities

Material quantities are where uncertainty compounds silently, so the rule is strict:

> **A derived value inherits the weakest provenance in its derivation chain.**

Wall area derived from a confirmed LiDAR perimeter and an estimated ceiling height is an
**estimate**. Tile quantity derived from that wall area is an **estimate**, and the pack
must present it as one.

Derived values also carry their derivation, visible to the contractor:

```
Wall area (approx)    28.4 m²  ±1.8
  ▸ perimeter 10.8 m (LiDAR, confirmed)
    × height 2.42 m (LiDAR, confirmed)
    − openings 1.7 m² (AR estimate, unconfirmed)
```

Rennova should be conservative about publishing quantities at all in early versions. Showing
room dimensions and letting the contractor do their own take-off is defensible. Showing a
tile count that turns out to be wrong is the kind of error that ends the relationship. Start
with dimensions; earn quantities.

## Units

The UK is genuinely bimodal. Homeowners often think about rooms in feet and inches and
materials in metres; the trade works in metric.

- **Store metric, always.** Millimetres for element dimensions, metres for room dimensions,
  square metres for areas.
- **Accept either on input**, with an obvious unit toggle that remembers the choice.
- **Display metric primary with imperial secondary** to homeowners: `3.62 m (11' 11")`.
- **Display metric only** to contractors, unless they set otherwise.
- Never round in storage. Round only at display, and round *outward* when showing a range.

## Tolerances

Every method carries a default tolerance, and those numbers should be calibrated against
real measurements rather than guessed once and forgotten. Build the mechanism to correct
them from day one, because the first honest calibration exercise will move them.

| Method | Working default until calibrated |
|---|---|
| `room_scan_lidar` | ±2 cm on lengths under 5 m |
| `ar_plane_estimate` | ±5–10 cm, degrading with distance |
| `manual_tape` | ±1 cm, assuming a careful homeowner |
| `laser_ble` | Per device spec, typically ±3 mm |
| `photogrammetry` | Not offered until measured against ground truth |

Tolerances are an honest product feature, not a legal disclaimer. Put them in the interface.

## Contractor verification and the sealed-quote boundary

A contractor who visits and measures properly has better data than we do. Let them record
it, but respect the sealed model: **a contractor's corrections are private to that
contractor.** They are not shared with competitors, because a rival knowing that someone
visited, and what they found, is exactly the competitive leakage sealed quoting exists to
prevent.

The homeowner is told a correction was made, and may choose to update the project — at which
point the pack version increments and every contractor is notified of the change. That keeps
the data improving without leaking anyone's effort to their competitors.

## What we never do

- Never show a measurement without its source.
- Never let an unconfirmed sensor or model output reach a contractor.
- Never round an estimate to a suspiciously precise-looking figure. `7.3 m²` not `7.31 m²`.
- Never let a derived value look more certain than its inputs.
- Never imply our measurements remove the contractor's duty to check before ordering. The
  pack says this in plain words, once, without drowning the page in disclaimers.

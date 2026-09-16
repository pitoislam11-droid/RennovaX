# 01 — The translation problem

## The problem, stated precisely

A contractor cannot price "I need my bathroom renovated" because that sentence contains
almost none of the information that determines cost. Cost is determined by things the
homeowner has never been asked to think about: whether services move, what is behind the
walls, what is being kept, how materials get in, what condition the substrate is in, who
buys the fixtures.

The homeowner is not being lazy or unhelpful. They are being asked to produce a
specification in a language they do not speak, about a domain whose cost drivers are
invisible to them. **The failure is in the interface, not the person.**

Today that gap is closed by the contractor, at their own expense: phone calls, photo
requests, a site visit, measuring, clarifying. That cost is real, it is paid on jobs that
never convert, and it is ultimately priced back into every job the contractor does win.

Rennova's thesis is that a large part of that gap can be closed by software driving a
phone, before the contractor is ever involved.

## The four layers

Everything in the system is one of four layers. Keeping them separate is what makes the
product tractable.

```
┌─ LAYER 1 ─ INTENT ──────────────────────────────────────────────┐
│ What the homeowner says they want, in their own words.          │
│ "I want a walk-in shower instead of the bath."                  │
│ Vague, partial, sometimes contradictory. Always preserved       │
│ verbatim — never silently rewritten.                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌─ LAYER 2 ─ EVIDENCE ────────────────────────────────────────────┐
│ What the phone captured. Photos, video segments, room scans,    │
│ depth data, typed measurements, voice notes.                    │
│ Immutable. Timestamped. Each item linked to the capture target  │
│ that requested it.                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌─ LAYER 3 ─ FACTS ───────────────────────────────────────────────┐
│ Typed, structured assertions about the property and the job.    │
│ room.floor_area = 7.3 m²                                        │
│ element.bath.disposition = REMOVE                               │
│ services.relocation_required = true                             │
│ Every fact carries provenance: where it came from, by what      │
│ method, how confident we are, and who confirmed it.             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌─ LAYER 4 ─ SPECIFICATION ───────────────────────────────────────┐
│ The contractor-facing reading of the facts, in trade language.  │
│ "Remove existing bath; form level access shower; alterations    │
│  to hot/cold supply and waste required."                        │
│ Generated from Layer 3. Never authored independently of it.     │
└──────────────────────────────────────────────────────────────────┘
```

The homeowner only ever interacts with Layer 1 and the capture that produces Layer 2. They
never see Layer 4. The contractor reads Layer 4 and can drill down into 3, 2 and 1 at will.

## The rule that makes it trustworthy: provenance is navigable

Layer 4 is a *derived view*. No line in it may exist without a traceable path back to a
homeowner answer or a piece of evidence.

In the contractor's app, every line of the specification is tappable:

```
SCOPE                                            ⌄
Alterations to hot, cold and waste services required

    ▸ Why this is here
      Homeowner was asked: "Are you moving the sink, toilet
      or shower to a different position?"
      They answered: "Yes — shower to the opposite wall"
      [ 3 related photos ]  [ room scan ]
```

This single mechanism does more work than any other in the product:

- It lets a sceptical contractor verify the pack in seconds instead of re-gathering it.
- It makes disagreement productive. If the contractor thinks the translation is wrong, they
  can see exactly which answer produced it and flag it.
- It prevents us from ever quietly inventing scope. If a line cannot be traced, it cannot
  be printed.

**Design constraint:** the translation engine must record its inputs for every output it
produces. A translation rule that cannot cite its sources is not allowed to run.

## Rules of the translation layer

1. **Trade terminology never appears in a question.** It may appear in the job pack. The
   direction is one-way: homeowner language in, trade language out.

2. **Ask about the observable world.** Not "do you require first-fix plumbing alterations?"
   but "are you moving the sink, toilet or shower to a different position?" Not "is
   substrate preparation required?" but "are the walls cracked, damaged or uneven?"

3. **Never ask what evidence already answers.** If the scan found a window, do not ask how
   many windows there are. Ask the homeowner to confirm what we found.

4. **Uncertainty is preserved, not resolved.** If the homeowner does not know, that becomes
   an explicit open item in the pack, not a guess and not a silent omission. See
   [05 — The project interview](05-project-interview.md).

5. **The homeowner's own words survive.** Their free-text description and voice notes are
   attached to the pack verbatim alongside the structured version. Contractors consistently
   value the unfiltered sentence, and it is our safety net when translation misses nuance.

6. **Translation is versioned.** Rules change as we learn. A pack records which ruleset
   generated it, so a pack from six months ago can still be explained.

## What this buys each side

**Homeowner:** never has to know what a builder needs to know. They answer questions about
things they can see and point a camera where they are told.

**Contractor:** receives a specification in their own language, with the evidence attached,
and can audit any part of it in seconds.

**Rennova:** owns the layer that neither side can build alone, and accumulates the only
asset that compounds — a structured, provenance-tagged corpus of what real renovation
projects actually contain.

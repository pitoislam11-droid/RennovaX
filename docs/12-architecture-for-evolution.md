# 12 — Architecture for evolution

The goal: an MVP that is genuinely simple, on foundations that reach the full vision without
being rewritten. Three decisions do almost all of that work.

## The three load-bearing decisions

### 1. Capture plans are versioned data, interpreted by a generic runtime

There is no bathroom screen. There is a capture runtime that executes a plan.

```
  ┌──────────────────┐        ┌────────────────────────┐
  │  Capture plan    │  ───▶  │   Capture runtime      │
  │  (JSON, v3)      │        │   (generic, in app)    │
  │  server-delivered│        └───────────┬────────────┘
  └──────────────────┘                    │
                                          ▼
                              ┌────────────────────────┐
                              │  Target satisfiers     │
                              ├────────────────────────┤
                              │  HUMAN_CAPTURE   (MVP) │
                              │  MANUAL_ENTRY    (MVP) │
                              │  ANSWER          (MVP) │
                              │  DETECTION       later │
                              │  ROOM_SCAN       later │
                              │  AR_MEASURE      later │
                              └────────────────────────┘
```

Adding LiDAR scanning later means registering a new satisfier, not rewriting a flow. The
plan schema does not change; targets simply start being satisfied by a different mechanism.

Plans are fetched, cached and **pinned per project**. A project started on plan v3 finishes
on v3 even if v4 ships mid-capture.

### 2. Everything lands in a provenance-carrying fact store

Capture, interview and future detection all write Facts through one interface. Nothing
writes a bare value anywhere.

```
capture ─┐
answers ─┼──▶  recordFact(key, value, provenance)  ──▶  Fact store
scans   ─┘                                                  │
                                                            ▼
                                            translation ruleset (versioned)
                                                            │
                                                            ▼
                                                        Job pack
```

Because the pack is generated from facts rather than authored, improving the translation
ruleset improves every future pack, and any pack can explain itself by walking back through
provenance to evidence.

### 3. Device capability is one abstraction with graceful tiers

```ts
interface MeasurementProvider {
  readonly method: MeasurementMethod;
  readonly tolerance: Tolerance;
  isAvailable(): Promise<boolean>;
  measure(target: MeasurementTarget): Promise<MeasurementResult>;
}
```

MVP ships `ManualEntryProvider` alone. Later, `RoomPlanProvider`, `ARCoreDepthProvider` and
`BluetoothLaserProvider` register themselves; the runtime picks the best available and
records which one ran. No feature detection leaks into screens, and the manual path stays
the universal fallback rather than becoming legacy code.

## Client

**React Native with Expo**, using development builds so native modules are available.

Rationale: one codebase across iOS and Android with a small team, mature camera and media
libraries, and over-the-air updates for the JavaScript layer — which pairs well with
server-delivered capture plans, since most product iteration is content, not code.

The caveat is honest: RoomPlan, ARKit and ARCore work needs native modules behind config
plugins. That is exactly why capability sits behind the provider interface, and why none of
it is in the MVP.

Client principles:

- **Offline-first.** Local database as the source of truth during capture; the server is a
  sync target. Media written to the filesystem, uploaded opportunistically with resumable
  transfer. Nothing is ever lost because a bathroom has no signal.
- **The capture runtime is a state machine**, driven by the plan, and it is the most heavily
  tested part of the client. Interruption, backgrounding, a phone call mid-capture, battery
  death — all must resume cleanly.
- **Media processed on device before upload**: downscale for preview, strip EXIF location
  immediately, keep the original for server processing, generate perceptual hashes for
  deduplication.
- **Screens are thin.** Almost all product logic lives in the runtime and in plan data.

## Server

A conventional API with a relational core. Postgres is the right default: facts, projects,
quotes and profiles are highly relational, and JSONB covers plans, packs and provenance
without giving up query power.

```
API  ──  Postgres          projects, facts, quotes, profiles, plans, packs
     ──  Object storage    media, signed short-lived URLs only
     ──  Job queue         transcoding, frame extraction, thumbnails,
                           pack generation, notifications, (later) inference
     ──  Search            project/contractor matching by geo + trade + category
```

**Asynchronous processing is the model**, following Hover's precedent: the phone captures
quickly, the server does the heavy work, the result arrives shortly after. This keeps the
app responsive on modest devices and means future inference work slots into an existing
pipeline rather than requiring a new one.

**Media access is always via short-lived signed URLs** scoped to the contractor granted the
pack. No permanently public asset URLs at any point, including in development.

## Data model notes

- **Facts are append-only.** Corrections write a new fact superseding the old one; nothing
  is overwritten. This is what makes provenance and the pack version diff possible.
- **Job packs are snapshots.** Generating a pack freezes the facts that produced it, so a
  contractor's quote always refers to a stable document.
- **Capture plans, translation rulesets and pack templates are all versioned**, and every
  pack records the version of each that produced it.
- **Media is immutable.** Blurring and redaction produce derived assets; originals are
  retained per the retention policy and never silently altered.

## Localisation and copy

No homeowner-facing string lives in a component. All instruction text, hints, option labels
and illustrations live in capture plans and translation rulesets, keyed and versioned. This
gives us wording changes without app releases, A/B testing of instructions, and a path to
additional languages.

Given the UK market, plan for English first with the structure ready for Welsh, and expect
significant demand for a simplified-language mode. Plain, short, imperative copy is not only
an accessibility feature here — it is the core interaction.

## Testing where it matters

- **Capture runtime state machine**: exhaustively. Interruption and resumption especially.
- **Provenance rules**: property-based tests that a derived fact can never exceed the
  confidence of its weakest input. This invariant is the product's integrity, and it should
  be impossible to violate without a test failing.
- **Translation rules**: golden tests from fact sets to specification output, so ruleset
  changes have visible, reviewable diffs.
- **Pack rendering**: snapshot tests across grades A to D, so a degraded pack is never
  accidentally made to look complete.

## What to resist

- **Do not build a CMS for capture plans before there are three plans.** JSON in the repo,
  reviewed in pull requests, is correct until it is not.
- **Do not abstract across categories prematurely.** Write the bathroom plan concretely,
  then the kitchen plan, and let the shared structure reveal itself.
- **Do not build contractor estimating tools.** That is Houzz Pro's business and it is
  enormous. Our job ends at handing over an excellent pack.
- **Do not add payments to the MVP.** It multiplies compliance surface and answers none of
  the questions that matter yet.

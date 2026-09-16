# Examples

Worked examples of the two core documents. Both validate against
[`../schemas/`](../schemas/) — run `python3 schemas/validate.py`.

## `capture-plans/bathroom-renovation.json`

A complete first capture plan: 33 targets across 6 steps, covering the interview, the guided
walkthrough, fixture photography, measurements with a scan-or-manual fallback, disposition
questions and access.

Things worth reading it for:

- **Instructions are imperative and jargon-free.** "Now crouch down and show us underneath
  the sink." Never "capture basin service void imagery."
- **`rationale` is written for every target** and never shown to the homeowner. The one on
  `under_basin` records *why* it is a required target rather than something contractors have
  to ask for each time.
- **`satisfiedBy` shows the evolution path.** `bath_or_shower` lists
  `["HUMAN_CAPTURE", "DETECTION:bath", "DETECTION:shower"]`. Today a person takes the photo.
  When detection ships, the same target is auto-satisfied and the homeowner just confirms.
  The plan does not change.
- **Measurement targets are conditional on the scan not having run.** Tier A devices skip
  them entirely; Tier C devices get an illustration and a number field. Neither path is a
  dead end.
- **Trade concepts are reached indirectly.** `q_shower_position` asks where the shower would
  go, and the answer produces "alterations to hot, cold and waste services". The homeowner is
  never asked about first fix.
- **Every single-choice question has a "not sure" option**, most flagged
  `opensOpenItem: true`.

## `job-packs/bathroom-renovation-richmond.json`

The output side: the Richmond bathroom from the product brief, rendered as a pack a
contractor would actually read.

Things worth reading it for:

- **Grade B, honestly.** Capture was complete and dimensions confirmed, but three open items
  remain. The grade is not inflated to look impressive.
- **Provenance varies by fact, visibly.** Room dimensions are `MEASURED` by LiDAR and
  homeowner-confirmed. Floor area is `DERIVED` from them, carries a wider tolerance, and is
  marked `confirmedBy: NONE` — it inherits the weakest link in its chain.
- **Every work item cites its sources.** `wi_services` traces back to
  `services.relocation_required` and `element.bath.disposition`, so a contractor can tap
  through to the exact question and answer that produced the line.
- **The ceiling stain is an open item, not a work item.** It was observed but not resolved
  into scope, so it is surfaced as a known unknown with photographs attached rather than
  quietly dropped or speculatively priced.
- **The homeowner's own words are verbatim**, and they contain the reason ("my mum struggles
  getting in and out of it"). That sentence is why `el_shower_new` notes level access, and
  it is the kind of context that changes a contractor's recommendation.
- **No precise address.** `TW9` and a travel distance.
- **`viewerCount` is present; there is no quote count.** Deliberate.

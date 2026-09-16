# Schemas

Machine-readable definitions of the two objects the whole product turns on.

| Schema | What it defines |
|---|---|
| [`capture-plan.schema.json`](capture-plan.schema.json) | What must be collected for a project category, and how the phone is driven to collect it |
| [`job-pack.schema.json`](job-pack.schema.json) | The contractor-facing rendering of a project — the system's actual deliverable |

Both are JSON Schema draft 2020-12. Worked examples live in [`../examples/`](../examples/).

## Why these two are schemas rather than code

A capture plan is **data**, interpreted by a generic runtime in the app. There is no
hand-built bathroom screen. This is what lets the MVP and the fully automated future run the
same structure: a target satisfied today by a person pointing a camera is satisfied later by
a room scan or an object detector, and only the `satisfiedBy` entry changes.

A job pack is **generated**, never authored. It is a projection of the fact store through a
versioned translation ruleset. Because it is generated, every line can cite the facts that
produced it, which is what makes the pack auditable by a sceptical contractor.

Full reasoning: [03 — Guided capture](../docs/03-guided-capture.md) and
[06 — The contractor job pack](../docs/06-contractor-job-pack.md).

## Invariants the schemas encode

These are the rules that must not be violated, wherever the code touching them lives.

1. **Every capture target carries a `rationale`.** Not shown to homeowners; shown to
   contractors and to us. It forces each target to justify its cost in homeowner effort.

2. **Every work item carries `derivedFromFactKeys`, with at least one entry.** A line that
   cannot cite its sources must not be printed. This is navigable provenance, and it is the
   mechanism that earns contractor trust in a pack they did not gather.

3. **Every measurement carries provenance and tolerance.** A bare number is never rendered.

4. **`INFERRED` facts never reach a contractor.** Model and detection output is a proposal
   awaiting homeowner confirmation, promoted to `OBSERVED` when confirmed or discarded when
   contradicted.

5. **A `DERIVED` value can never be more confident than the weakest fact it derives from.**
   Worth a property-based test: it is the product's integrity in one line.

6. **Quote count is never exposed to contractors.** Viewer count may be. Exposing quote
   counts reconstructs open bidding and undermines sealed quoting.

7. **Precise address is never in a job pack.** Approximate area and travel distance only,
   until the homeowner approves contact.

8. **Every single-choice question offers a "not sure" option**, and choosing it creates an
   open item rather than a guess.

## Validating

```
pip install jsonschema
python3 schemas/validate.py
```

Run it in CI once there is a build. A schema change that invalidates the examples is a
signal to check whether the change was intended.

# 05 — The project interview

Capture collects what the phone can see. The interview collects what it cannot: intent,
preference, decisions, logistics, and the homeowner's own words.

Eventually this should behave like an intelligent project interviewer that adapts to what
has already been learned. It starts as a well-designed branching questionnaire, and the
schema is the same either way.

## The question budget

Every question costs completion rate. Treat questions as a scarce budget, not a free
resource.

**A question earns its place only if the answer changes price, scope, risk or
feasibility.** If two different answers lead to the same pack and the same quote, delete the
question. "Nice to know" is not a justification; the contractor can ask once they are
talking.

Working targets, to be revised against real completion data:

| | Target |
|---|---|
| Questions before the homeowner sees value | ≤ 3 |
| Questions in a typical single-room project | 8–15 |
| Time from start to publishable pack (Tier A device) | Under 10 minutes |
| Time from start to publishable pack (Tier C device) | Under 20 minutes |

## Question taxonomy

Five kinds, and they are asked in this order because commitment escalates:

1. **Qualifying** — what and where. Cheap, high signal, asked first. Category, room, rough
   timing.
2. **Scope-defining** — what is happening to each thing. The disposition questions. This is
   the bulk of the value.
3. **Risk-revealing** — what might surprise a contractor. Moving services, condition,
   access, age of property, previous work.
4. **Preference** — finishes, materials, style, who supplies. Often genuinely undecided, and
   that is fine.
5. **Logistics and commercial** — timing, occupancy, budget posture, decision process.

Budget is spent in that order. If a homeowner abandons after category 2, we still have
something worth publishing.

## Writing a question

Rules, each of which exists because the opposite is the industry default:

**Ask about the observable world, never the trade concept.**

| Never ask | Ask instead |
|---|---|
| "Do you require first-fix plumbing alterations?" | "Are you moving the sink, toilet or shower to a different position?" |
| "Is substrate preparation required?" | "Are the walls cracked, damaged or uneven?" |
| "Specify tiling extent." | "Would you like tiles all the way up to the ceiling?" |
| "Is the existing installation compliant?" | "Do you know roughly when the bathroom was last done?" |
| "Confirm material supply responsibility." | "Who should buy the bath, tiles and taps?" |
| "Are there any notifiable works?" | Never asked. Derived from other answers. |

**One decision per screen.** Full-screen, large type, two to four tappable options. No
multi-field forms, no dropdowns of trade terms.

**Options must be mutually exclusive and exhaustive in the homeowner's world.** If a real
person's situation does not fit any option, the question is wrong.

**Always offer an out**, and make it safe. See below.

**Never ask a number where a range will do.** "Roughly how old is the house?" with four
bands beats a year field that people guess at.

**Show, do not describe.** A small illustration of "tiles to ceiling" versus "tiles to
splashback height" settles in one glance what a paragraph cannot.

## "Not sure" is first-class

Most questionnaires punish uncertainty: the homeowner must guess, and the guess becomes
indistinguishable from knowledge. That is how packs become confidently wrong.

In Rennova, every question offers `NOT SURE` / `I DON'T KNOW`, and choosing it is a real
answer with real consequences:

```
Would you like tiles all the way to the ceiling?

    [ YES ]     [ NO — just around the bath/shower ]     [ NOT SURE ]
```

Choosing `NOT SURE` creates an **OpenItem** in the job pack:

```
OPEN ITEMS  (3)

▸ Tiling height not yet decided
  Homeowner unsure whether tiling goes full height or to
  splashback only. Affects tile quantity and labour.
  Suggested: price to splashback, note full-height as an option.
```

This is strictly better for everyone. The homeowner is not forced into a decision they are
not ready to make. The contractor knows precisely what is undecided and can price a
provisional sum, quote an option, or ask. And nobody discovers it half way through the job.

Where useful, offer a third path: **"help me decide"**, which defers the question into a
short explainer or simply notes that the homeowner would like the contractor's advice. "I'd
like your recommendation" is a perfectly good line in a job pack.

## Branching and suppression

Questions are a graph, not a list. Three mechanisms shape it:

**Conditional questions.** Asked only when a prior fact makes them relevant. No bath present
→ never ask about the bath.

**Evidence suppression.** The most valuable mechanism, and the one that makes the product
feel intelligent. If the scan reliably established a fact, the question is never asked — it
is replaced at most by a confirmation. The interview visibly shrinks as capture succeeds,
and the homeowner feels the app is paying attention.

**Escalation.** An answer can *add* questions. "Yes, I'm moving the shower" opens a short
branch about where it is moving to and what is on the other side of that wall.

A worked branch:

```
"I want my bedroom painted."
        ↓
"Just the walls, or the ceiling and woodwork too?"
        → EVERYTHING
        ↓
"Great. Let's take a quick look at the room."
        ↓  [ guided capture ]
        ↓
"We found one door and one window. Is that right?"     ← confirmation, not a question
        → YES
        ↓
"There looks to be some damage on the wall near the
 window. Should we ask contractors to repair that
 before painting?"                                      ← raised by evidence
        → YES / NO / NOT SURE
        ↓
"Are you happy with the colour you have, or changing it?"
        ↓
"Who's buying the paint?"
```

Note that the damage question exists only because capture surfaced it. That is the loop the
whole product is built to run: **capture raises questions that a form could never have known
to ask.**

## Free text and voice

Always end with an open invitation, defaulted to voice:

> *"Anything else you'd like contractors to know?"*  🎙

Transcribe it, attach the audio, and put the verbatim text in the pack. Homeowners disclose
things here that no structured question would have elicited — a difficult neighbour, a
deadline, a bad previous experience, exactly what they care about. Contractors read it
first. Do not rewrite it, and do not bury it.

## Progress, resumption and honesty

- Show real progress: completed steps and an honest estimate of what remains. If branching
  can change the count, say "about 4 more".
- Save after every answer. Resume exactly where they left off.
- Let them go back and change any answer. Changing an answer may invalidate later answers —
  say so and re-ask, rather than silently keeping stale facts.
- Never trap them. Publishing is available once minimum viable information exists, with the
  pack honestly graded.

## Minimum viable pack

The floor below which a project cannot be published at all:

- Project category and at least one space
- At least one piece of evidence, or an explicit statement that none could be provided
- At least one work item with a disposition
- Location to postcode-district level
- Timing posture (urgent / within weeks / flexible / planning ahead)

Everything beyond this improves the completeness grade rather than gating publication. The
grade is the incentive; the gate is the floor.

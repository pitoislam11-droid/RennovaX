# 11 — MVP scope and roadmap

## The shape of the first version

The strong recommendation is **one category, end to end, done properly** — rather than
shallow coverage of many categories.

Bathroom renovation is the right first category:

- High value, so the quality of information genuinely matters to both sides.
- Single, enclosed, small room — the easiest possible case for guided capture and room
  scanning, and well within RoomPlan's practical envelope.
- Bounded and repeatable element vocabulary: bath, shower, WC, basin, radiator, extractor,
  window, door, tiling. A capture plan can be genuinely comprehensive.
- Cost is dominated by a small number of knowable decisions: are services moving, what is
  being kept, who supplies, what is the tiling extent.
- Frequent enough to generate learning volume.

Kitchens are more valuable but far more complex (appliances, units, worktops, services,
structural openings). Decorating is simpler but too low-value to prove the thesis. Bathrooms
sit exactly where the product's claim is testable.

**The test of the MVP is not "did we ship an app". It is: did contractors quote real
bathroom projects, without visiting first, and did homeowners accept those quotes?**

## MVP — build this

**Homeowner**
- Sign up, single project creation flow
- Category selection (bathroom renovation only, plus a generic "other" path)
- Guided interview driven by a versioned capture plan
- Guided photo capture with per-target instructions, illustrations and skip-with-reason
- Guided video walkthrough with live instruction overlay
- Manual measurement entry with illustrations showing exactly what to measure
- Voice notes with transcription
- Review and publish, with the completeness grade and a privacy review of media
- Receive quotes, compare side by side, message, approve or decline call requests
- Award a project; review on completion, including quote-accuracy

**Contractor**
- Sign up, verification submission
- Profile with services, service area, business details, insurance
- Portfolio with guided before/after capture
- Project feed filtered by trade, distance and category
- Job pack view with triage header, full detail and navigable provenance
- Structured quote submission with confidence tier, assumptions, inclusions and exclusions
- Contact request, messaging
- **The feedback question on every quote, decline and visit request**

**Platform**
- Capture plan authoring and versioning, server-delivered
- Fact store with full provenance
- Job pack generation and versioning with change notifications
- Pooled, anonymised information requests back to homeowners
- Media pipeline: EXIF stripping, face blurring, signed expiring URLs, retention policy
- Offline capture with resumable upload
- Notifications
- Admin and manual operations tooling — see below

### Explicitly out of MVP

Computer vision and object detection. AR and LiDAR scanning. Automatic floor plans. Material
quantity calculation. Payments and escrow. Scheduling and project management. Multi-room
projects. Web app for homeowners. Anything for contractors that resembles estimating
software.

Note what this means: **the MVP contains no scanning technology at all.** Guided capture
with a plain camera, honest manual measurements and a well-structured pack is enough to test
the central claim. If contractors will not quote from a well-made pack, no amount of LiDAR
will save it. If they will, we know exactly what to automate next.

## Next level

Once the loop is proven and there is data to learn from:

- Object detection on captured media (fixtures, openings, surfaces), always
  homeowner-confirmed
- AR measurement on capable devices, with honest tolerances
- LiDAR room scanning via RoomPlan on Tier A devices
- Automatic room layouts and floor plans
- Calibrated measurement confidence, driven by contractor corrections
- Damage and condition detection as *prompts for questions*, never as assertions
- Draft specification generation from facts, reviewed before publication
- More categories: kitchens, then decorating, flooring, plastering, extensions
- Bluetooth laser measure integration

## Later

- Material quantity calculation with provenance-aware tolerances
- Contractor estimating assistance built on their own historical rates
- 3D property models and multi-room capture
- Visualisation and before/after rendering of proposed work
- Remote surveys — live video with a professional walking the homeowner through
- A property record that persists across projects, so the second project starts from the
  first

## Sequencing principle

Build in the order that reduces the most uncertainty per unit of effort:

1. **Will contractors quote from a pack?** Cheapest to test. Test first, with no scanning.
2. **Will homeowners complete a guided capture?** Test with plain camera guidance.
3. **Does better capture produce better quoting?** Requires the feedback loop running.
4. **Does automation improve capture enough to justify the cost?** Only now is scanning
   worth building.

Building LiDAR scanning first would be building the most expensive thing to answer the
least important question.

## The risk nobody puts in the product brief

**Contractor liquidity, not capture technology, is the most likely cause of failure.**

A marketplace with no contractors is worthless no matter how good the job packs are. The
first homeowner who completes a beautiful twelve-minute capture and receives one quote has
had a *worse* experience than posting on MyBuilder, and will not return. Every metric in
this repository is downstream of having enough contractors.

Three consequences for the plan:

**Go supply-first.** Recruit contractors before marketing to homeowners. Target a specific
number of active, verified bathroom contractors in one area before a single homeowner is
invited.

**Go geographically narrow.** One borough or one city, not "the UK". Density is what
produces three-plus quotes per project; national coverage produces one quote everywhere.
This is unglamorous and it is the difference between working and not.

**Be prepared to be unscalable at first.** Onboard early contractors by hand. Sit with them
while they read the first packs. Phone them when a project matches. Manually chase quotes.
Take the feedback in person rather than through a form. The manual work is not a stopgap to
be automated away — it is how the capture plans get good enough to automate at all.

The founding question to answer before writing much code is not "can we build this?" It is
**"can we get twenty good bathroom contractors in one London borough to look at a job
pack?"** Answering that is cheap, and it can be tested with a PDF and a phone.

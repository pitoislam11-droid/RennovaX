# 13 — Open questions

Decisions needed before or during build. Each carries a recommendation so the default is
never "unresolved".

## Commercial

**1. How does Rennova make money?**
The most consequential open question, because it determines incentives everywhere else.
*Recommendation:* charge contractors on outcome — a fee when the homeowner accepts a quote —
rather than per lead or per month. Our thesis is that a Rennova project converts far better
than a lead; the pricing should assert that. Per-lead pricing recreates the incentive to
maximise volume over quality, which is the failure mode we exist to fix.

**2. Free for homeowners?**
*Recommendation:* yes, unconditionally, and say so loudly. Every UK competitor is free to
homeowners; charging would be an adoption tax on the side we need to delight.

**3. Is there a contractor subscription tier?**
*Recommendation:* not at launch. One pricing mechanism until the core loop is proven.

## Product scope

**4. Which category ships first?**
*Recommendation:* bathroom renovation, argued in
[11 — MVP scope and roadmap](11-mvp-scope-and-roadmap.md).

**5. Is there a path for projects that do not fit any capture plan?**
There will be: odd jobs, emergencies, "something is leaking".
*Recommendation:* yes — a generic plan with light guidance and free-text plus voice. Never
turn a homeowner away. But keep it visibly secondary, and track how often it is used; heavy
use of the generic path is a signal about which plan to write next.

**6. Multi-room projects in MVP?**
*Recommendation:* no. One space per project initially. Multi-room multiplies capture
complexity and interview length, and the thesis is testable on one room.

**7. Are urgent and emergency jobs in scope?**
A burst pipe does not want a twelve-minute guided capture.
*Recommendation:* out of scope for MVP. The product's value is proportional to how much
planning a job deserves, and emergencies are a different business.

## Trust and safety

**8. How much verification is required before a contractor can quote?**
*Recommendation:* identity and insurance are mandatory before quoting; trade-specific
registrations mandatory before quoting on work that requires them. Gate on the minimum that
keeps homeowners safe, because over-gating starves supply and supply is the binding
constraint.

**9. What is Rennova's liability position on measurements?**
*Recommendation:* take legal advice early. Product position: we provide information with
stated provenance and tolerance, we do not certify it, and contractors must verify before
ordering. That statement appears in the pack, once, in plain words. The honest presentation
of provenance is itself the mitigation.

**10. Dispute handling when a job goes wrong.**
Not an MVP feature but it will happen in the first month.
*Recommendation:* manual, human, and fast at first. Document what actually occurs before
building process around it.

**11. Data retention.**
*Recommendation:* publish a specific policy and enforce it in code from day one. Interior
photographs of people's homes are sensitive personal data and UK GDPR obligations are real.
Deleting unpublished project media on a schedule is easy now and expensive to retrofit.

## Capture and technology

**12. Guided video or guided stills as the primary capture mode?**
*Recommendation:* video walkthrough first for coverage, then a short targeted stills pass
for detail. Test the ordering with real users early — this is a genuine unknown and the
answer may differ by category.

**13. Do we extract and store frames from walkthrough video at capture time?**
*Recommendation:* yes, at a fixed cadence with device pose attached where available. Storage
is cheap; retrofitting pose data onto old video is impossible, and this is the training
corpus for everything in the "next level" roadmap.

**14. iOS first, or both platforms at launch?**
*Recommendation:* both, because UK Android share is too large to ignore for a consumer
marketplace and the MVP needs no platform-specific capability. Accept that Tier A scanning,
when it comes, will be iOS-only for a while — RoomPlan has no ARCore equivalent — and design
the pack so an Android-captured project never looks second class.

**15. How much should the app do on-device versus server-side?**
*Recommendation:* capture on device, everything heavy on the server, following Hover's
model. Revisit only if latency becomes a real complaint.

## Marketplace mechanics

**16. Should contractors see how many others are viewing a project?**
*Recommendation:* show a viewer count but never a quote count. Viewers create healthy
urgency; quote counts change pricing behaviour and undermine sealing.

**17. Is there a quote deadline?**
*Recommendation:* a soft one — "most quotes arrive within 48 hours" — with no hard cutoff.
Deadlines punish good contractors who are busy on site, which is most of the good ones.

**18. Can a homeowner re-open a project after awarding it?**
*Recommendation:* yes, with the original quotes preserved and contractors notified. Jobs
fall through and the alternative is a wasted capture.

**19. How are contractors matched to projects?**
*Recommendation:* trade plus distance plus category experience, with an explicit cap on how
many contractors see a project at once — enough for the homeowner to get four or five quotes
without wasting the time of twenty firms. Contractor time is the resource we promised to
protect, and unbounded distribution breaks that promise.

## Naming and brand

**20. Rennova, RennovaX, or something else?**
The repository is `RennovaX`, and the product is referred to throughout this documentation
as Rennova.
*Recommendation:* settle this before any user-facing copy is written, and check UK trade
mark availability early — "Renova" and near-variants are widely used.

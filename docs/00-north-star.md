# 00 — North star

## The statement

> Turn an ordinary homeowner's phone into a guided digital survey assistant that gives
> contractors the information they need to understand and price work quickly.

## What this is not

It is worth being precise about the things Rennova deliberately is not, because each one
is a gravitational pull that marketplaces in this category fall into.

**Not a directory.** Checkatrade's core object is a *company*. Rennova's core object is a
*project*. A directory's job is finished when the homeowner has a phone number; ours has
barely started.

**Not a lead-generation business.** If the unit we sell is an unqualified introduction, we
are incentivised to maximise introductions rather than quotes, and contractor trust decays.
Our unit is a **priceable project**.

**Not a job board.** A job board accepts whatever text the poster types. We refuse to let a
project become "need bathroom done, please quote". The guided capture *is* the product.

**Not a surveying company.** We are not certifying measurements or taking liability for
them. We are collecting better-than-nothing, honestly-labelled information so a professional
can exercise judgement earlier and more cheaply.

**Not an estimator.** Rennova does not tell the homeowner what work should cost, and does
not tell the contractor what to charge. We structure information; pricing is the
contractor's expertise and their commercial risk.

## Who we serve, and what each side actually wants

**The homeowner** wants a good job done at a fair price without being exploited, and
without having to become an amateur project manager. They do not want to learn construction
vocabulary. They are frightened of being ripped off and of making an expensive decision
badly. Their scarcest resource is *confidence*, not time.

**The contractor** wants work that is real, nearby, within their competence, and worth
pricing. Their scarcest resource is *time*, and their single biggest waste of it is
gathering basic facts about jobs that will never convert. A good contractor is not short of
leads; they are short of hours.

Rennova earns its place by giving the homeowner confidence and giving the contractor their
hours back. Those are different currencies, which is why the same job pack has to read as
reassuring to one side and as efficient to the other.

## The binding constraint

The intuitive assumption is that the hard part is getting homeowners to complete a guided
capture. It is not. The hard part is **getting contractors to trust a pack they did not
gather themselves.**

A contractor who half-trusts the pack will still phone the homeowner and still visit, and
then Rennova has added a step rather than removed one. Everything in this repository that
looks like fussiness about provenance, confidence, open items and traceability exists to
serve that one constraint. The pack must be *auditable*: any contractor, at any line, must
be able to see where that line came from.

If we get this wrong, we have built a prettier job board.

## What success looks like

These are the measures that tell us the thesis is working, rather than vanity numbers.

| Measure | Why it matters |
|---|---|
| Share of quoted projects where no site visit preceded the quote | The central claim of the product, measured directly |
| Contractor time from opening a project to submitting a quote | Should be minutes, not a day |
| Contractor "information sufficiency" rating per job pack | Our only honest feedback signal on capture quality |
| Homeowner completion rate: capture started → project published | Tells us whether guidance is genuinely easy |
| Quotes received per published project | Liquidity; below three, the homeowner cannot meaningfully compare |
| Variance between quoted price and final price | Whether structured assumptions actually prevented surprise |
| Share of projects where the homeowner never had to type a trade term | The translation layer working |

The single most important of these is **contractor information sufficiency**, because it is
the only metric that closes the loop. Every quote submission and every decline asks the
contractor what was missing. Those answers are the training signal that improves capture
plans. We do not need computer vision to get smarter; we need this loop running.

## The ten-second test

Open any contractor's view of any project. Within ten seconds a competent tradesperson
should be able to answer: *Is this my trade? Is it near me? Roughly how big is it? When is
it? Am I pricing materials? Is there enough here to price from?*

If they cannot, the job pack has failed, regardless of how much information is further down
the page.

## The honest limits

Rennova should never pretend these away.

- Some projects genuinely require a site visit. Structural work, anything touching drainage
  below ground, unclear existing services, listed buildings, anything where getting it
  wrong is dangerous. The goal is to **remove unnecessary visits, not professional
  judgement**, and to make the necessary visit better-informed when it happens.
- Phone-derived measurements are estimates. They are useful for sizing and material
  quantities to a first approximation, and they are not a substitute for a tape measure
  before ordering.
- Computer vision will be wrong sometimes. Everything it asserts is confirmable by the
  homeowner before it reaches a contractor.
- A homeowner who does not know what they want cannot be made to know by better forms. We
  can structure indecision honestly ("not sure" is a first-class answer that becomes a
  stated open item) but we cannot resolve it for them.

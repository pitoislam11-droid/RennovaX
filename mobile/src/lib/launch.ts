/**
 * Launch / App Store contact strings.
 * USER-OWNED: replace these with your real production inboxes before public release.
 */
export const launchContacts = {
  supportEmail: 'support@rennova.app',
  privacyEmail: 'privacy@rennova.app',
  /** Shown next to emails so counsel/ops know to swap before submit */
  userOwnedNote: 'Replace with your live inbox before App Store release.',
} as const;

export const launchVersionLabel = 'Version 1.0.0 · Made for iPhone';

/** Draft App Store listing copy — USER-OWNED final polish before submit. */
export const appStoreListingDraft = {
  name: 'Rennova',
  subtitle: 'Smarter home project briefs',
  promotionalText:
    'Describe the work in your own words. Rennova shapes a contractor-ready brief, then brings private quotations — not a reverse auction.',
  description: `Rennova is the intelligent layer between UK homeowners and contractors.

Homeowners
• Tell Rennova what needs doing in plain English
• Answer a short, tailored set of questions — no giant forms
• Optionally add a few useful photos
• Publish a clear brief and compare private quotations
• Message and approve call requests when you’re ready

Contractors
• Set up as a company or sole trader
• Browse opportunities with complete briefs
• Send private quotations the homeowner alone can see
• Showcase finished work in your portfolio
• Ask Rennova for quote structure and materials checklists (never invented live prices)

Built for calm, confident decisions — premium craft, UK English, and private bids.`,
  keywords: 'home renovation,contractor quotes,builders,home improvement,UK trades,project brief',
} as const;

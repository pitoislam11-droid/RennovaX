/// <reference types="jest" />
import { reducer } from '../reducer';
import {
  applySelection,
  canLeaveReview,
  canRequestCall,
  canSeeHomeownerContact,
  canSubmitQuote,
  canTransition,
  comparisonOrder,
  contractorMayCall,
  contractorQuoteStatusLabel,
  isOpenOpportunity,
  visibleQuotes,
} from '../rules';
import { createSeed } from '../seed';
import type { Quote } from '../types';

const NOW = Date.UTC(2026, 8, 27);
const seed = () => createSeed(NOW);
const flat = (s = seed()) => s.projects.find((p) => p.id === 'p-flat')!;

describe('sealed quotes', () => {
  it('shows the project owner every quote', () => {
    const s = seed();
    expect(visibleQuotes({ role: 'homeowner', homeownerId: 'h-alex' }, flat(s), s.quotes)).toHaveLength(3);
  });

  it('shows a contractor only their own quote', () => {
    const s = seed();
    const seen = visibleQuotes({ role: 'contractor', contractorId: 'c-prime' }, flat(s), s.quotes);
    expect(seen.map((q) => q.contractorId)).toEqual(['c-prime']);
  });

  it('shows another homeowner nothing', () => {
    const s = seed();
    expect(visibleQuotes({ role: 'homeowner', homeownerId: 'h-sophie' }, flat(s), s.quotes)).toEqual([]);
  });

  it('never tells a contractor more than won / not won / pending', () => {
    const q = seed().quotes[0];
    expect(contractorQuoteStatusLabel({ ...q, status: 'submitted' })).toBe('Awaiting homeowner');
    expect(contractorQuoteStatusLabel({ ...q, status: 'accepted' })).toBe('You won this job');
    expect(contractorQuoteStatusLabel({ ...q, status: 'not_selected' })).not.toMatch(/£|cheap|rank|\d/);
  });
});

describe('comparison order', () => {
  it('orders by arrival, not price', () => {
    const s = seed();
    const shuffled: Quote[] = [s.quotes[2], s.quotes[0], s.quotes[1]];
    expect(comparisonOrder(shuffled).map((q) => q.id)).toEqual(['q-bh', 'q-lc', 'q-prime']);
  });
});

describe('contact control', () => {
  it('hides the homeowner address from contractors until selected', () => {
    const s = seed();
    expect(canSeeHomeownerContact({ role: 'contractor', contractorId: 'c-brighthome' }, flat(s))).toBe(false);
    const after = applySelection(s, 'q-bh');
    expect(canSeeHomeownerContact({ role: 'contractor', contractorId: 'c-brighthome' }, flat(after))).toBe(true);
    expect(canSeeHomeownerContact({ role: 'contractor', contractorId: 'c-prime' }, flat(after))).toBe(false);
  });

  it('only lets a contractor call after the homeowner approves', () => {
    let s = seed();
    expect(contractorMayCall('c-prime', flat(s), s.callRequests)).toBe(false);
    s = reducer(s, { type: 'respondCall', id: 'cr-prime', status: 'declined' });
    expect(contractorMayCall('c-prime', flat(s), s.callRequests)).toBe(false);

    s = seed();
    s = reducer(s, { type: 'respondCall', id: 'cr-prime', status: 'approved' });
    expect(contractorMayCall('c-prime', flat(s), s.callRequests)).toBe(true);
  });

  it('allows one pending call request per contractor per project', () => {
    const s = seed();
    expect(canRequestCall('c-prime', flat(s), s.callRequests)).toBe(false);
    expect(canRequestCall('c-londoncoats', flat(s), s.callRequests)).toBe(true);
  });
});

describe('project stages', () => {
  it('follows Draft → Published → Receiving quotes → Selected → In progress → Completed', () => {
    expect(canTransition('draft', 'published')).toBe(true);
    expect(canTransition('receiving_quotes', 'contractor_selected')).toBe(true);
    expect(canTransition('contractor_selected', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('published', 'completed')).toBe(false);
    expect(canTransition('completed', 'in_progress')).toBe(false);
  });

  it('moves a published project to receiving quotes on the first quote', () => {
    let s = seed();
    const hall = s.projects.find((p) => p.id === 'p-hall')!;
    expect(hall.stage).toBe('published');
    s = reducer(s, { type: 'submitQuote', quote: { ...s.quotes[0], id: 'q-new', projectId: 'p-hall' } });
    expect(s.projects.find((p) => p.id === 'p-hall')!.stage).toBe('receiving_quotes');
  });

  it('accepts the chosen quote and closes the rest', () => {
    const s = applySelection(seed(), 'q-lc');
    expect(flat(s).stage).toBe('contractor_selected');
    expect(flat(s).selectedContractorId).toBe('c-londoncoats');
    const status = Object.fromEntries(s.quotes.filter((q) => q.projectId === 'p-flat').map((q) => [q.id, q.status]));
    expect(status).toEqual({ 'q-bh': 'not_selected', 'q-lc': 'accepted', 'q-prime': 'not_selected' });
  });

  it('rejects a second quote from the same contractor and quotes on closed projects', () => {
    const s = seed();
    expect(canSubmitQuote('c-brighthome', flat(s), s.quotes)).toBe(false);
    const selected = applySelection(s, 'q-bh');
    expect(canSubmitQuote('c-hartley', flat(selected), selected.quotes)).toBe(false);
    expect(reducer(s, { type: 'submitQuote', quote: s.quotes[0] }).quotes).toHaveLength(s.quotes.length);
  });
});

describe('reviews', () => {
  it('allows one review, only once the project is completed', () => {
    const s = seed();
    expect(canLeaveReview(flat(s), s.reviews)).toBe(false);
    const bath = s.projects.find((p) => p.id === 'p-bath')!;
    expect(canLeaveReview(bath, s.reviews)).toBe(true);
    const review = { ...s.reviews[0], id: 'r-new', projectId: 'p-bath', contractorId: 'c-nova' };
    const after = reducer(s, { type: 'addReview', review });
    expect(canLeaveReview(bath, after.reviews)).toBe(false);
    expect(after.contractors.find((c) => c.id === 'c-nova')!.reviewCount).toBe(62);
  });
});

describe('opportunities', () => {
  it('shows open projects in the contractor’s trades', () => {
    const s = seed();
    const brighthome = s.contractors.find((c) => c.id === 'c-brighthome')!;
    const nova = s.contractors.find((c) => c.id === 'c-nova')!;
    expect(isOpenOpportunity(flat(s), brighthome)).toBe(true);
    expect(isOpenOpportunity(flat(s), nova)).toBe(false);
    expect(isOpenOpportunity(s.projects.find((p) => p.id === 'p-bath')!, nova)).toBe(false);
  });
});

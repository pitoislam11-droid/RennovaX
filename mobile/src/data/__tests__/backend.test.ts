/// <reference types="jest" />
import type { SupabaseClient } from '@supabase/supabase-js';

import { performRemote } from '../backend/remote';
import { buildState, type Snapshot } from '../backend/rows';
import { reducer } from '../reducer';
import { visibleQuotes } from '../rules';

jest.mock('../backend/client', () => ({ PROJECT_PHOTOS_BUCKET: 'project-photos', backendEnabled: false, supabase: null }));

const ME = 'aaaaaaaa-0000-4000-8000-000000000001';
const DAN = 'bbbbbbbb-0000-4000-8000-000000000002';
const BH = 'cccccccc-0000-4000-8000-000000000003';
const P = 'dddddddd-0000-4000-8000-000000000004';

function snapshot(over: Partial<Snapshot> = {}): Snapshot {
  return {
    userId: ME,
    profiles: [
      { id: ME, first_name: 'Alex', last_name: 'Morgan', postcode: 'SW4', role: 'homeowner' },
      { id: DAN, first_name: 'Dan', last_name: 'Carter', postcode: 'SW11', role: 'contractor' },
    ],
    myPrivate: { id: ME, email: 'alex@example.com', phone: '07700 900123' },
    releasedPhones: {},
    contractors: [
      {
        id: BH, owner_id: DAN, name: 'BrightHome Decor', business_type: 'company', categories: ['painting'], about: '', services: [],
        areas: [], base_area: 'Clapham', years_experience: 8, logo_color: '#123F35', cover_url: '', reply_time: '', phone: '020 7946 0101',
        verified_business: true, insured: true, insurance_cover: '£2m public liability',
      },
    ],
    stats: [{ contractor_id: BH, rating: '4.9', review_count: 12, projects_completed: 30 }],
    portfolio: [],
    projects: [
      {
        id: P, owner_id: ME, title: '2-Bed Flat Redecoration', category_id: 'painting', answers: { rooms: 5 }, description: '',
        photos: [`${ME}/a.jpg`, `${ME}/missing.jpg`], area: 'Clapham', postcode: 'SW4', stage: 'receiving_quotes',
        selected_contractor_id: null, created_at: '2026-09-20T10:00:00Z', published_at: '2026-09-20T10:00:00Z',
      },
    ],
    addresses: [{ project_id: P, address_line: 'Flat 12, 48 Elm Park Road' }],
    invites: [{ project_id: P, contractor_id: BH }],
    quotes: [
      {
        id: 'q1', project_id: P, contractor_id: BH, price: '4100.00', price_type: 'fixed', vat_included: true, materials_included: true,
        duration_days: 10, earliest_start: '2026-10-12', warranty_months: 24, included: ['Walls'], exclusions: [], assumptions: '',
        notes: '', status: 'submitted', revision: 1, submitted_at: '2026-09-21T10:00:00Z',
      },
    ],
    calls: [],
    messages: [
      { id: 'm2', project_id: P, contractor_id: BH, sender_role: 'homeowner', body: 'Bare.', created_at: '2026-09-21T12:00:00Z' },
      { id: 'm1', project_id: P, contractor_id: BH, sender_role: 'contractor', body: 'Painted over?', created_at: '2026-09-21T11:00:00Z' },
    ],
    reviews: [],
    blocks: [],
    photoUrls: { [`${ME}/a.jpg`]: 'https://signed.example/a.jpg' },
    ...over,
  };
}

describe('buildState', () => {
  it('maps a homeowner snapshot into app state', () => {
    const s = buildState(snapshot());
    expect(s.session).toEqual({ onboarded: true, role: 'homeowner', homeownerId: ME, contractorId: '' });
    const p = s.projects[0];
    expect(p.photos).toEqual(['https://signed.example/a.jpg']);
    expect(p.location.addressLine).toBe('Flat 12, 48 Elm Park Road');
    expect(p.invitedContractorIds).toEqual([BH]);
    expect(s.quotes[0].price).toBe(4100);
    expect(s.quotes[0].earliestStart.startsWith('2026-10-12')).toBe(true);
    expect(s.contractors[0]).toMatchObject({ initials: 'BD', rating: 4.9, reviewCount: 12, projectsCompleted: 30 });
    expect(s.threads[0].messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(visibleQuotes({ role: 'homeowner', homeownerId: ME }, p, s.quotes)).toHaveLength(1);
  });

  it('only shows my own private details, and phones released to me', () => {
    const s = buildState(snapshot());
    expect(s.homeowners.find((h) => h.id === ME)?.phone).toBe('07700 900123');
    expect(s.homeowners.find((h) => h.id === DAN)?.phone).toBe('');
    const released = buildState(snapshot({ userId: DAN, myPrivate: null, releasedPhones: { [ME]: '07700 900123' } }));
    expect(released.homeowners.find((h) => h.id === ME)?.phone).toBe('07700 900123');
  });

  it('puts a contractor with a business into contractor mode', () => {
    const s = buildState(
      snapshot({ userId: DAN, profiles: [{ id: DAN, first_name: 'Dan', last_name: 'Carter', postcode: 'SW11', role: 'contractor' }] }),
    );
    expect(s.session.role).toBe('contractor');
    expect(s.session.contractorId).toBe(BH);
  });
});

/** Records every call the app makes, so we can check what reaches the server. */
function recorder() {
  const calls: { table?: string; rpc?: string; op: string; payload?: unknown; filter?: unknown }[] = [];
  const ok = Promise.resolve({ data: null, error: null });
  const db = {
    from: (table: string) => ({
      insert: (payload: unknown) => (calls.push({ table, op: 'insert', payload }), ok),
      upsert: (payload: unknown) => (calls.push({ table, op: 'upsert', payload }), ok),
      update: (payload: unknown) => ({ eq: (col: string, val: unknown) => (calls.push({ table, op: 'update', payload, filter: [col, val] }), ok) }),
    }),
    rpc: (name: string, payload: unknown) => (calls.push({ rpc: name, op: 'rpc', payload }), ok),
  } as unknown as SupabaseClient;
  return { db, calls };
}

describe('performRemote', () => {
  it('sends stage changes through server functions, never direct updates', async () => {
    const { db, calls } = recorder();
    await performRemote(db, ME, { type: 'selectQuote', quoteId: 'q1' });
    await performRemote(db, ME, { type: 'advanceStage', projectId: P, to: 'in_progress' });
    await performRemote(db, ME, { type: 'respondCall', id: 'c1', status: 'approved' });
    expect(calls.map((c) => c.rpc)).toEqual(['select_quote', 'advance_project', 'respond_call']);
    expect(calls.every((c) => c.op === 'rpc')).toBe(true);
  });

  it('never sends a quote status or revision from the device', async () => {
    const { db, calls } = recorder();
    const s = buildState(snapshot());
    await performRemote(db, DAN, { type: 'reviseQuote', quote: { ...s.quotes[0], price: 3900, status: 'accepted', revision: 9 } });
    expect(calls[0]).toMatchObject({ table: 'quotes', op: 'update', filter: ['id', 'q1'] });
    const payload = calls[0].payload as Record<string, unknown>;
    expect(payload.price).toBe(3900);
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('revision');
    expect(payload.earliest_start).toBe('2026-10-12');
  });

  it('posts messages under the sender’s own role', async () => {
    const { db, calls } = recorder();
    await performRemote(db, ME, { type: 'sendMessage', id: 'm9', projectId: P, contractorId: BH, from: 'homeowner', text: '  Hello  ', at: '' });
    expect(calls[0]).toMatchObject({ table: 'messages', op: 'insert', payload: { sender_role: 'homeowner', body: 'Hello' } });
  });
});

describe('safety actions', () => {
  it('sends reports and blocks to their tables', async () => {
    const { db, calls } = recorder();
    await performRemote(db, ME, { type: 'report', targetType: 'message', targetId: 'm1', reason: 'Spam or scam' });
    await performRemote(db, ME, { type: 'block', profileId: DAN });
    expect(calls[0]).toMatchObject({ table: 'reports', op: 'insert', payload: { target_type: 'message', target_id: 'm1', reason: 'Spam or scam' } });
    expect(calls[1]).toMatchObject({ table: 'blocks', op: 'upsert', payload: { blocked_id: DAN } });
    // The reporter and blocker are always the signed-in user, set by the database.
    expect(calls[0].payload).not.toHaveProperty('reporter_id');
    expect(calls[1].payload).not.toHaveProperty('blocker_id');
  });

  it('keeps a block list that can be undone', () => {
    const s = buildState(snapshot({ blocks: [DAN] }));
    expect(s.blockedIds).toEqual([DAN]);
    const unblocked = reducer(s, { type: 'unblock', profileId: DAN });
    expect(unblocked.blockedIds).toEqual([]);
    expect(reducer(unblocked, { type: 'block', profileId: DAN }).blockedIds).toEqual([DAN]);
  });
});

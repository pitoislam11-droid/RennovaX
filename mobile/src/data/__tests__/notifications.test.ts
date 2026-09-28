/// <reference types="jest" />
import { noticeForDevice, notificationPath } from '../notifications';
import { createSeed } from '../seed';

const seed = () => createSeed(Date.UTC(2026, 8, 27));

describe('push notification copy', () => {
  it('tells the homeowner a quote arrived, without the price or address', () => {
    const state = seed();
    const quote = state.quotes.find((q) => q.id === 'q-bh')!;
    const project = state.projects.find((p) => p.id === quote.projectId)!;
    const notice = noticeForDevice(state, { type: 'submitQuote', quote });
    expect(notice).toEqual({
      kind: 'quote',
      title: 'New quote',
      body: 'BrightHome Decor quoted for 2-Bed Flat Redecoration.',
      url: '/project/p-flat',
    });
    expect(notice!.body).not.toContain(String(quote.price));
    expect(notice!.body).not.toContain(project.location.addressLine);
    expect(notice!.body).not.toContain(state.homeowners[0].phone);
  });

  it('does not tell a different homeowner about the quote', () => {
    const state = seed();
    state.session.homeownerId = 'h-sophie';
    const quote = state.quotes.find((q) => q.id === 'q-bh')!;
    expect(noticeForDevice(state, { type: 'submitQuote', quote })).toBeNull();
  });

  it('tells the other person about a message, and not the sender', () => {
    const state = seed();
    const incoming = noticeForDevice(state, {
      type: 'sendMessage',
      id: 'm1',
      projectId: 'p-flat',
      contractorId: 'c-londoncoats',
      from: 'contractor',
      text: 'Is the wallpaper\npainted over?',
      at: '2026-09-27T12:00:00Z',
    });
    expect(incoming?.title).toBe('New message');
    expect(incoming?.body).toBe('London Coats: Is the wallpaper painted over?');
    expect(incoming?.url).toBe('/chat/p-flat/c-londoncoats');

    const own = noticeForDevice(state, {
      type: 'sendMessage',
      id: 'm2',
      projectId: 'p-flat',
      contractorId: 'c-londoncoats',
      from: 'homeowner',
      text: 'No, it is bare.',
      at: '2026-09-27T12:01:00Z',
    });
    expect(own).toBeNull();
  });

  it('tells this business when the homeowner messages them', () => {
    const state = seed();
    const notice = noticeForDevice(state, {
      type: 'sendMessage',
      id: 'm3',
      projectId: 'p-flat',
      contractorId: 'c-brighthome',
      from: 'homeowner',
      text: 'Can you start Monday?',
      at: '2026-09-27T12:02:00Z',
    });
    expect(notice?.body).toBe('Alex: Can you start Monday?');
    expect(notice?.url).toBe('/chat/p-flat/c-brighthome');
  });

  it('tells the homeowner about a call request without the note', () => {
    const state = seed();
    const project = state.projects.find((p) => p.id === 'p-flat')!;
    const notice = noticeForDevice(state, {
      type: 'requestCall',
      id: 'cr-1',
      projectId: 'p-flat',
      contractorId: 'c-londoncoats',
      note: 'Call me on 07700 900111',
      at: '2026-09-27T12:00:00Z',
    });
    expect(notice).toEqual({
      kind: 'call_request',
      title: 'Call request',
      body: 'London Coats would like to call you about 2-Bed Flat Redecoration.',
      url: '/call/cr-1',
    });
    expect(notice!.body).not.toContain('07700');
    expect(notice!.body).not.toContain(project.location.addressLine);
  });

  it('tells the chosen contractor, and not a rival', () => {
    const state = seed();
    const chosen = noticeForDevice(state, { type: 'selectQuote', quoteId: 'q-bh' });
    expect(chosen).toEqual({
      kind: 'chosen',
      title: 'You were chosen',
      body: 'Alex chose you for 2-Bed Flat Redecoration.',
      url: '/opportunity/p-flat',
    });
    expect(chosen!.body).not.toContain('4100');
    expect(noticeForDevice(state, { type: 'selectQuote', quoteId: 'q-lc' })).toBeNull();
  });

  it('ignores revisions and other actions', () => {
    const state = seed();
    const quote = state.quotes.find((q) => q.id === 'q-bh')!;
    expect(noticeForDevice(state, { type: 'reviseQuote', quote })).toBeNull();
    expect(noticeForDevice(state, { type: 'declineQuote', quoteId: 'q-bh' })).toBeNull();
  });
});

describe('notification taps', () => {
  it('opens the four known screens', () => {
    expect(notificationPath({ url: '/project/p-flat' })).toBe('/project/p-flat');
    expect(notificationPath({ url: '/opportunity/p-flat' })).toBe('/opportunity/p-flat');
    expect(notificationPath({ url: '/call/cr-1' })).toBe('/call/cr-1');
    expect(notificationPath({ url: '/chat/p-flat/c-brighthome' })).toBe('/chat/p-flat/c-brighthome');
  });

  it('ignores anything that is not one of those paths', () => {
    expect(notificationPath({ url: 'https://example.com' })).toBeNull();
    expect(notificationPath({ url: '/find' })).toBeNull();
    expect(notificationPath({ url: '/project/p-flat/extra' })).toBeNull();
    expect(notificationPath(undefined)).toBeNull();
  });
});

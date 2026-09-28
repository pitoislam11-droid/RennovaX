import type { Action } from './reducer';
import type { AppState } from './types';

/** The four events that raise a push. Wording matches the database triggers. */
export type PushKind = 'quote' | 'message' | 'call_request' | 'chosen';

export interface PushNotice {
  kind: PushKind;
  title: string;
  body: string;
  url: string;
}

const PREVIEW = 80;

/** One short line, safe to show on a lock screen. */
export function messagePreview(body: string): string {
  return body.replace(/[\r\n]+/g, ' ').trim().slice(0, PREVIEW);
}

/**
 * Where a notification tap should open. Only the four in-app paths the server sends.
 * Anything else (a full URL, a different screen) is ignored.
 */
export function notificationPath(data: Record<string, unknown> | null | undefined): string | null {
  const url = data?.url;
  if (typeof url !== 'string') return null;
  if (/^\/project\/[\w-]+$/.test(url)) return url;
  if (/^\/opportunity\/[\w-]+$/.test(url)) return url;
  if (/^\/call\/[\w-]+$/.test(url)) return url;
  if (/^\/chat\/[\w-]+\/[\w-]+$/.test(url)) return url;
  return null;
}

/**
 * The notice this phone should show for an action, or null when this phone is not the recipient.
 * Demo mode uses this for a local notification. Live mode sends the same words from Postgres.
 * The price, address, phone number and call note are never included.
 */
export function noticeForDevice(state: AppState, action: Action): PushNotice | null {
  const { session } = state;
  switch (action.type) {
    case 'submitQuote': {
      const project = state.projects.find((p) => p.id === action.quote.projectId);
      if (!project || project.ownerId !== session.homeownerId) return null;
      const name = state.contractors.find((c) => c.id === action.quote.contractorId)?.name ?? 'A contractor';
      return {
        kind: 'quote',
        title: 'New quote',
        body: `${name} quoted for ${project.title}.`,
        url: `/project/${project.id}`,
      };
    }
    case 'sendMessage': {
      const project = state.projects.find((p) => p.id === action.projectId);
      const contractor = state.contractors.find((c) => c.id === action.contractorId);
      if (!project || !contractor) return null;
      const forHomeowner = action.from === 'contractor' && project.ownerId === session.homeownerId;
      const forBusiness = action.from === 'homeowner' && contractor.id === session.contractorId;
      if (!forHomeowner && !forBusiness) return null;
      const name =
        action.from === 'contractor'
          ? contractor.name
          : state.homeowners.find((h) => h.id === project.ownerId)?.firstName.trim() || 'A homeowner';
      return {
        kind: 'message',
        title: 'New message',
        body: `${name}: ${messagePreview(action.text)}`,
        url: `/chat/${project.id}/${contractor.id}`,
      };
    }
    case 'requestCall': {
      const project = state.projects.find((p) => p.id === action.projectId);
      if (!project || project.ownerId !== session.homeownerId) return null;
      const name = state.contractors.find((c) => c.id === action.contractorId)?.name ?? 'A contractor';
      return {
        kind: 'call_request',
        title: 'Call request',
        body: `${name} would like to call you about ${project.title}.`,
        url: `/call/${action.id}`,
      };
    }
    case 'selectQuote': {
      const quote = state.quotes.find((q) => q.id === action.quoteId);
      if (!quote || quote.contractorId !== session.contractorId) return null;
      const project = state.projects.find((p) => p.id === quote.projectId);
      if (!project) return null;
      const first = state.homeowners.find((h) => h.id === project.ownerId)?.firstName.trim() || 'A homeowner';
      return {
        kind: 'chosen',
        title: 'You were chosen',
        body: `${first} chose you for ${project.title}.`,
        url: `/opportunity/${project.id}`,
      };
    }
    default:
      return null;
  }
}

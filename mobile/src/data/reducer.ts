import { applySelection, canTransition } from './rules';
import { createSeed } from './seed';
import type { AppState, CallRequestStatus, Project, ProjectStage, Quote, ReportTarget, Review, Role } from './types';

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'reset' }
  | { type: 'onboard' }
  | { type: 'setRole'; role: Role }
  | { type: 'publishProject'; project: Project }
  | { type: 'inviteContractor'; projectId: string; contractorId: string }
  | { type: 'submitQuote'; quote: Quote }
  | { type: 'reviseQuote'; quote: Quote }
  | { type: 'declineQuote'; quoteId: string }
  | { type: 'selectQuote'; quoteId: string }
  | { type: 'advanceStage'; projectId: string; to: ProjectStage }
  | { type: 'addReview'; review: Review }
  | { type: 'requestCall'; id: string; projectId: string; contractorId: string; note: string; at: string }
  | { type: 'respondCall'; id: string; status: CallRequestStatus }
  | { type: 'sendMessage'; id: string; projectId: string; contractorId: string; from: Role; text: string; at: string }
  | { type: 'report'; targetType: ReportTarget; targetId: string; reason: string }
  | { type: 'block'; profileId: string }
  | { type: 'unblock'; profileId: string };

/**
 * A random UUID (v4). The prefix is ignored; it documents what the id is for at the call site.
 * Ids are made on the device so an action can be applied locally and sent to the server as-is.
 */
export function newId(_prefix: string): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.random() * 4) | 8];
    else out += hex[(Math.random() * 16) | 0];
  }
  return out;
}

function updateProject(state: AppState, id: string, fn: (p: Project) => Project): AppState {
  return { ...state, projects: state.projects.map((p) => (p.id === id ? fn(p) : p)) };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      // Older saved demo data may predate newer fields.
      return { ...action.state, blockedIds: action.state.blockedIds ?? [] };
    case 'reset':
      return { ...createSeed(), session: { ...createSeed().session, onboarded: true } };
    case 'onboard':
      return { ...state, session: { ...state.session, onboarded: true } };
    case 'setRole':
      return { ...state, session: { ...state.session, role: action.role } };
    case 'publishProject':
      return { ...state, projects: [action.project, ...state.projects] };
    case 'inviteContractor':
      return updateProject(state, action.projectId, (p) =>
        p.invitedContractorIds.includes(action.contractorId)
          ? p
          : { ...p, invitedContractorIds: [...p.invitedContractorIds, action.contractorId] },
      );
    case 'submitQuote': {
      const project = state.projects.find((p) => p.id === action.quote.projectId);
      if (!project) return state;
      const open = project.stage === 'published' || project.stage === 'receiving_quotes';
      const duplicate = state.quotes.some(
        (q) => q.projectId === action.quote.projectId && q.contractorId === action.quote.contractorId,
      );
      if (!open || duplicate) return state;
      const next = { ...state, quotes: [...state.quotes, action.quote] };
      return project.stage === 'published'
        ? updateProject(next, project.id, (p) => ({ ...p, stage: 'receiving_quotes' }))
        : next;
    }
    case 'reviseQuote':
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          q.id === action.quote.id && q.status === 'submitted'
            ? { ...action.quote, revision: q.revision + 1 }
            : q,
        ),
      };
    case 'declineQuote':
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          q.id === action.quoteId && q.status === 'submitted' ? { ...q, status: 'declined' } : q,
        ),
      };
    case 'selectQuote':
      return applySelection(state, action.quoteId);
    case 'advanceStage':
      return updateProject(state, action.projectId, (p) =>
        canTransition(p.stage, action.to) ? { ...p, stage: action.to } : p,
      );
    case 'addReview': {
      if (state.reviews.some((r) => r.projectId === action.review.projectId)) return state;
      return {
        ...state,
        reviews: [action.review, ...state.reviews],
        contractors: state.contractors.map((c) => {
          if (c.id !== action.review.contractorId) return c;
          const count = c.reviewCount + 1;
          const rating = Math.round(((c.rating * c.reviewCount + action.review.overall) / count) * 10) / 10;
          return { ...c, reviewCount: count, rating, projectsCompleted: c.projectsCompleted + 1 };
        }),
      };
    }
    case 'requestCall':
      return {
        ...state,
        callRequests: [
          ...state.callRequests,
          { id: action.id, projectId: action.projectId, contractorId: action.contractorId, note: action.note, status: 'pending', createdAt: action.at },
        ],
      };
    case 'respondCall':
      return {
        ...state,
        callRequests: state.callRequests.map((r) =>
          r.id === action.id && r.status === 'pending' ? { ...r, status: action.status } : r,
        ),
      };
    case 'report':
      // Reports go to Rennova's moderation queue; nothing changes on the reporter's screen.
      return state;
    case 'block':
      return state.blockedIds.includes(action.profileId) ? state : { ...state, blockedIds: [...state.blockedIds, action.profileId] };
    case 'unblock':
      return { ...state, blockedIds: state.blockedIds.filter((id) => id !== action.profileId) };
    case 'sendMessage': {
      const text = action.text.trim();
      if (!text) return state;
      const message = { id: action.id, from: action.from, text, at: action.at };
      const existing = state.threads.find(
        (t) => t.projectId === action.projectId && t.contractorId === action.contractorId,
      );
      if (existing) {
        return {
          ...state,
          threads: state.threads.map((t) => (t === existing ? { ...t, messages: [...t.messages, message] } : t)),
        };
      }
      return {
        ...state,
        threads: [
          ...state.threads,
          { id: newId('t'), projectId: action.projectId, contractorId: action.contractorId, messages: [message] },
        ],
      };
    }
  }
}

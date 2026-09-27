/**
 * Marketplace rules. Pure functions only, so they can be tested and later reused server-side.
 * The server must enforce the same rules; the client uses them to decide what to render.
 */
import type {
  AppState,
  CallRequest,
  Contractor,
  CostMatch,
  Project,
  ProjectStage,
  Quote,
  Review,
  Viewer,
} from './types';

export const STAGE_ORDER: ProjectStage[] = [
  'draft',
  'published',
  'receiving_quotes',
  'contractor_selected',
  'in_progress',
  'completed',
];

export const STAGE_LABEL: Record<ProjectStage, string> = {
  draft: 'Draft',
  published: 'Published',
  receiving_quotes: 'Receiving quotes',
  contractor_selected: 'Contractor selected',
  in_progress: 'In progress',
  completed: 'Completed',
};

const ALLOWED_TRANSITIONS: Record<ProjectStage, ProjectStage[]> = {
  draft: ['published'],
  published: ['receiving_quotes', 'contractor_selected'],
  receiving_quotes: ['contractor_selected'],
  contractor_selected: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
};

export function canTransition(from: ProjectStage, to: ProjectStage): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function stageIndex(stage: ProjectStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Sealed quotes: the project owner sees every quote; a contractor sees only their own.
 * Nobody else sees anything.
 */
export function visibleQuotes(viewer: Viewer, project: Project, quotes: Quote[]): Quote[] {
  const forProject = quotes.filter((q) => q.projectId === project.id);
  if (viewer.role === 'homeowner') {
    return viewer.homeownerId === project.ownerId ? forProject : [];
  }
  return forProject.filter((q) => q.contractorId === viewer.contractorId);
}

/**
 * Order for the homeowner's comparison: by arrival, never by price.
 * The design must not steer the homeowner to the cheapest quote.
 */
export function comparisonOrder(quotes: Quote[]): Quote[] {
  return [...quotes].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

/** Quotes the homeowner is still choosing between. */
export function openQuotes(quotes: Quote[]): Quote[] {
  return quotes.filter((q) => q.status === 'submitted');
}

/**
 * The homeowner's exact address and phone are revealed only to the contractor they select.
 */
export function canSeeHomeownerContact(viewer: Viewer, project: Project): boolean {
  if (viewer.role === 'homeowner') return viewer.homeownerId === project.ownerId;
  return project.selectedContractorId === viewer.contractorId;
}

/**
 * A contractor may call the homeowner only after the homeowner approved a call request for this
 * project, or after the homeowner selected them.
 */
export function contractorMayCall(
  contractorId: string,
  project: Project,
  callRequests: CallRequest[],
): boolean {
  if (project.selectedContractorId === contractorId) return true;
  return callRequests.some(
    (r) => r.projectId === project.id && r.contractorId === contractorId && r.status === 'approved',
  );
}

/** A contractor can have at most one pending call request per project. */
export function canRequestCall(
  contractorId: string,
  project: Project,
  callRequests: CallRequest[],
): boolean {
  if (contractorMayCall(contractorId, project, callRequests)) return false;
  if (project.stage === 'completed' || project.stage === 'draft') return false;
  return !callRequests.some(
    (r) => r.projectId === project.id && r.contractorId === contractorId && r.status === 'pending',
  );
}

/** Projects a contractor can see in their opportunities feed. */
export function isOpenOpportunity(project: Project, contractor: Contractor): boolean {
  const open = project.stage === 'published' || project.stage === 'receiving_quotes';
  if (!open) return false;
  return (
    contractor.categories.includes(project.categoryId) ||
    project.invitedContractorIds.includes(contractor.id)
  );
}

export function canSubmitQuote(contractorId: string, project: Project, quotes: Quote[]): boolean {
  const open = project.stage === 'published' || project.stage === 'receiving_quotes';
  return open && !quotes.some((q) => q.projectId === project.id && q.contractorId === contractorId);
}

/** A contractor may revise their quote until the homeowner responds to it. */
export function canReviseQuote(quote: Quote, project: Project): boolean {
  return quote.status === 'submitted' && stageIndex(project.stage) < stageIndex('contractor_selected');
}

/**
 * What a contractor is told about their quote. Only won / not selected / pending: never rank,
 * price comparison or count of competing quotes.
 */
export function contractorQuoteStatusLabel(quote: Quote): string {
  switch (quote.status) {
    case 'accepted':
      return 'You won this job';
    case 'declined':
    case 'not_selected':
      return 'Homeowner chose another option';
    default:
      return 'Awaiting homeowner';
  }
}

export function canLeaveReview(project: Project, reviews: Review[]): boolean {
  return (
    project.stage === 'completed' &&
    !!project.selectedContractorId &&
    !reviews.some((r) => r.projectId === project.id)
  );
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.overall, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Share of reviews saying the final cost matched (or came in under) the quote. */
export function costMatchRate(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const good: CostMatch[] = ['exact', 'less', 'more_agreed'];
  return Math.round((reviews.filter((r) => good.includes(r.costMatch)).length / reviews.length) * 100);
}

/** Selecting a contractor accepts their quote and closes every other open quote. */
export function applySelection(state: AppState, quoteId: string): AppState {
  const quote = state.quotes.find((q) => q.id === quoteId);
  if (!quote) return state;
  const project = state.projects.find((p) => p.id === quote.projectId);
  if (!project || !canTransition(project.stage, 'contractor_selected')) return state;
  return {
    ...state,
    projects: state.projects.map((p) =>
      p.id === project.id ? { ...p, stage: 'contractor_selected', selectedContractorId: quote.contractorId } : p,
    ),
    quotes: state.quotes.map((q) => {
      if (q.projectId !== project.id) return q;
      if (q.id === quoteId) return { ...q, status: 'accepted' };
      return q.status === 'submitted' ? { ...q, status: 'not_selected' } : q;
    }),
  };
}

/** Prices are whole pounds. */
export function formatPrice(pounds: number): string {
  return `£${Math.round(pounds).toLocaleString('en-GB')}`;
}

export type Role = 'homeowner' | 'contractor';

export type CategoryId =
  | 'painting'
  | 'bathroom'
  | 'kitchen'
  | 'flooring'
  | 'roofing'
  | 'plumbing'
  | 'electrical'
  | 'landscaping'
  | 'extensions'
  | 'loft'
  | 'general';

/** Draft → Published → Receiving quotes → Contractor selected → In progress → Completed */
export type ProjectStage =
  | 'draft'
  | 'published'
  | 'receiving_quotes'
  | 'contractor_selected'
  | 'in_progress'
  | 'completed';

export type AnswerValue = string | string[] | number;

export interface Homeowner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  area: string;
  durationDays: number;
  year: number;
  description: string;
  before: string;
  after: string;
  gallery: string[];
}

export interface Contractor {
  id: string;
  /** The member account that runs this business. */
  ownerId: string;
  name: string;
  initials: string;
  logoColor: string;
  businessType: 'company' | 'sole_trader';
  categories: CategoryId[];
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  projectsCompleted: number;
  verifiedBusiness: boolean;
  insured: boolean;
  insuranceCover: string;
  about: string;
  services: string[];
  areas: string[];
  baseArea: string;
  replyTime: string;
  phone: string;
  cover: string;
  portfolio: PortfolioItem[];
}

export interface ProjectLocation {
  area: string;
  postcode: string;
  /** Only ever shown to the contractor the homeowner selects. */
  addressLine: string;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  categoryId: CategoryId;
  answers: Record<string, AnswerValue>;
  description: string;
  photos: string[];
  location: ProjectLocation;
  stage: ProjectStage;
  createdAt: string;
  publishedAt?: string;
  selectedContractorId?: string;
  invitedContractorIds: string[];
}

export type PriceType = 'fixed' | 'site_visit' | 'estimate';
export type QuoteStatus = 'submitted' | 'accepted' | 'declined' | 'not_selected';

export interface Quote {
  id: string;
  projectId: string;
  contractorId: string;
  price: number;
  priceType: PriceType;
  vatIncluded: boolean;
  materialsIncluded: boolean;
  durationDays: number;
  earliestStart: string;
  warrantyMonths: number;
  included: string[];
  exclusions: string[];
  assumptions: string;
  notes: string;
  submittedAt: string;
  status: QuoteStatus;
  revision: number;
}

export type CallRequestStatus = 'pending' | 'approved' | 'declined' | 'message_instead';

export interface CallRequest {
  id: string;
  projectId: string;
  contractorId: string;
  note: string;
  status: CallRequestStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  from: Role;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  projectId: string;
  contractorId: string;
  messages: Message[];
}

export type ReportTarget = 'message' | 'review' | 'contractor' | 'project' | 'profile';

export type CostMatch = 'exact' | 'more_agreed' | 'more_unagreed' | 'less';

export interface Review {
  id: string;
  projectId: string;
  contractorId: string;
  authorName: string;
  overall: number;
  quality: number;
  communication: number;
  timekeeping: number;
  cleanliness: number;
  value: number;
  costMatch: CostMatch;
  text: string;
  createdAt: string;
}

export interface Session {
  onboarded: boolean;
  role: Role;
  homeownerId: string;
  /** The contractor business this account operates when in contractor mode. */
  contractorId: string;
}

export interface AppState {
  session: Session;
  homeowners: Homeowner[];
  contractors: Contractor[];
  projects: Project[];
  quotes: Quote[];
  callRequests: CallRequest[];
  threads: Thread[];
  reviews: Review[];
  /** Member (profile) ids this user has blocked. */
  blockedIds: string[];
}

/** Who is looking at something. Every visibility rule takes one of these. */
export type Viewer = { role: 'homeowner'; homeownerId: string } | { role: 'contractor'; contractorId: string };

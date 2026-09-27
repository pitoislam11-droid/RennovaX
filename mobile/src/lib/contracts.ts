export type UserRole = 'HOMEOWNER' | 'CONTRACTOR';

export type AccountKind = 'COMPANY' | 'SOLE_TRADER';

export type ContractorProfile = {
  id: string;
  userId: string;
  accountKind: AccountKind | string;
  businessName: string;
  about: string | null;
  logoUrl: string | null;
  serviceArea: string | null;
  servicesJson: string[] | null;
  verification: string;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  activeRole: UserRole;
  roles: UserRole[];
  contractorProfile: ContractorProfile | null;
};

export type PortfolioMedia = {
  id: string;
  url: string;
  kind: string;
  sortOrder: number;
};

export type PortfolioProject = {
  id: string;
  title: string;
  area: string | null;
  description: string | null;
  servicesJson: string[] | null;
  media: PortfolioMedia[];
  createdAt: string;
};

export type ContractorMe = ContractorProfile & {
  portfolioProjects: PortfolioProject[];
  _count: { quotes: number };
};

export type OpportunityListItem = {
  id: string;
  title: string;
  category: string;
  locationLabel: string | null;
  publishedAt: string | null;
  mediaCount: number;
  previewMedia: ProjectMedia[];
  briefPreview: {
    timing: string | null;
    materials: string | null;
    summary: string | null;
  };
  myQuote: { id: string; status: string; submittedAt: string | null } | null;
};

export type OpportunityDetail = {
  id: string;
  title: string;
  category: string;
  locationLabel: string | null;
  publishedAt: string | null;
  briefJson: ProjectBrief;
  media: ProjectMedia[];
  myQuote: Quote | null;
};

export type OpportunityStats = {
  newOpportunities: number;
  awaitingResponse: number;
  activeProjects: number;
};

export type Quote = {
  id: string;
  projectId: string;
  contractorProfileId: string;
  status: string;
  labourPence: number;
  materialsPence: number;
  wastePence: number;
  otherPence: number;
  durationText: string | null;
  materialsIncluded: boolean;
  warrantyText: string | null;
  scopeText: string | null;
  assumptionsText: string | null;
  exclusionsText: string | null;
  submittedAt: string | null;
  totalPence?: number;
  isSelected?: boolean;
  contractorProfile?: Pick<
    ContractorProfile,
    'id' | 'businessName' | 'accountKind' | 'about' | 'serviceArea' | 'logoUrl' | 'servicesJson' | 'verification'
  > & {
    portfolioProjects?: PortfolioProject[];
  };
};

export type MessageThread = {
  id: string;
  projectId: string;
  updatedAt: string;
  project?: { id: string; title: string; locationLabel: string | null; status: string };
  messages: Message[];
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type CallRequest = {
  id: string;
  projectId: string;
  contractorProfileId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | string;
  note: string | null;
  createdAt: string;
  contractorProfile?: Pick<ContractorProfile, 'id' | 'businessName' | 'accountKind' | 'logoUrl' | 'verification'>;
};

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  dataJson?: { projectId?: string; callRequestId?: string; quoteId?: string } | null;
  readAt: string | null;
  createdAt: string;
};

export type UpsertContractorProfileRequest = {
  accountKind: AccountKind;
  businessName: string;
  about?: string | null;
  serviceArea?: string | null;
  services?: string[];
  logoUrl?: string | null;
};

export type SubmitQuoteRequest = {
  labourPence: number;
  materialsPence: number;
  wastePence?: number;
  otherPence?: number;
  durationText?: string | null;
  materialsIncluded?: boolean;
  warrantyText?: string | null;
  scopeText?: string | null;
  assumptionsText?: string | null;
  exclusionsText?: string | null;
};

export type CreatePortfolioRequest = {
  title: string;
  area?: string | null;
  description?: string | null;
  services?: string[];
  mediaUrls: string[];
};

export type AskCard = {
  kind: 'checklist' | 'quote_structure' | 'materials_categories' | 'risk_notes' | 'next_step';
  title: string;
  items: string[];
  note?: string | null;
};

export type AskResponse = {
  acknowledgement: string;
  cards: AskCard[];
};

export type AskRequest = {
  prompt: string;
  projectId?: string;
  brief?: {
    title?: string;
    category?: string;
    summary?: string;
    materials?: string;
    timing?: string;
  };
};

export type IntakeOption = {
  id: string;
  label: string;
  detail: string | null;
};

export type IntakeQuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'yes_no'
  | 'short_text'
  | 'measurement'
  | 'date_choice'
  | 'media_upload';

export type IntakeQuestion = {
  id: string;
  type: IntakeQuestionType;
  title: string;
  helperText: string | null;
  required: boolean;
  options: IntakeOption[];
  placeholder: string | null;
  unitOptions: string[];
  mediaGuidance: string[];
  minSelections: number;
  maxSelections: number;
};

export type IntakeAnswer = {
  selectedOptionIds?: string[];
  text?: string;
  value?: number;
  unit?: string;
  mediaCount?: number;
};

export type IntakeTurn = {
  question: IntakeQuestion;
  answer: IntakeAnswer;
};

export type ProjectBriefSection = {
  title: string;
  items: string[];
};

export type ProjectBrief = {
  title: string;
  category: string;
  location: string;
  property: string;
  summary: string;
  sections: ProjectBriefSection[];
  materials: string;
  timing: string;
  photosSummary: string;
  safetyNotes: string[];
};

export type IntakeStep = {
  kind: 'question' | 'complete';
  category: string;
  progress: {
    answeredCount: number;
    estimatedRemaining: number | null;
    label: string;
  };
  question: IntakeQuestion | null;
  brief: ProjectBrief | null;
  acknowledgement: string;
};

export type NextIntakeRequest = {
  initialRequest: string;
  location?: string;
  turns: IntakeTurn[];
};

export type UploadAsset = {
  id: string;
  fileId: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ProjectMedia = {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'AWARDED' | string;
  initialRequest: string;
  locationLabel: string | null;
  briefJson: ProjectBrief;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProjectMedia[];
  _count: { quotes: number };
};

export type CreateProjectRequest = {
  initialRequest: string;
  brief: ProjectBrief;
  turns: IntakeTurn[];
  media: { assetId: string; caption?: string }[];
  publish: boolean;
};

export type PublishProjectRequest = {
  publish: true;
};

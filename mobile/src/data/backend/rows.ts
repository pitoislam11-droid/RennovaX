/**
 * Database rows as the API returns them, and the pure mapping into the app's AppState.
 * Kept free of network code so it can be unit tested.
 */
import type {
  AnswerValue,
  AppState,
  CallRequestStatus,
  CategoryId,
  Contractor,
  CostMatch,
  Homeowner,
  PriceType,
  Project,
  ProjectStage,
  QuoteStatus,
  Role,
  Thread,
} from '../types';

export interface ProfileRow { id: string; first_name: string; last_name: string; postcode: string; role: Role }
export interface PrivateRow { id: string; email: string; phone: string }
export interface ContractorRow {
  id: string; owner_id: string; name: string; business_type: 'company' | 'sole_trader'; categories: CategoryId[];
  about: string; services: string[]; areas: string[]; base_area: string; years_experience: number; logo_color: string;
  cover_url: string; reply_time: string; phone: string; verified_business: boolean; insured: boolean; insurance_cover: string;
}
export interface StatsRow { contractor_id: string; rating: number | string; review_count: number; projects_completed: number }
export interface PortfolioRow {
  id: string; contractor_id: string; title: string; area: string; duration_days: number; year: number;
  description: string; before_url: string; after_url: string; gallery: string[];
}
export interface ProjectRow {
  id: string; owner_id: string; title: string; category_id: CategoryId; answers: Record<string, AnswerValue>;
  description: string; photos: string[]; area: string; postcode: string; stage: ProjectStage;
  selected_contractor_id: string | null; created_at: string; published_at: string | null;
}
export interface AddressRow { project_id: string; address_line: string }
export interface InviteRow { project_id: string; contractor_id: string }
export interface QuoteRow {
  id: string; project_id: string; contractor_id: string; price: number | string; price_type: PriceType; vat_included: boolean;
  materials_included: boolean; duration_days: number; earliest_start: string; warranty_months: number; included: string[];
  exclusions: string[]; assumptions: string; notes: string; status: QuoteStatus; revision: number; submitted_at: string;
}
export interface CallRow { id: string; project_id: string; contractor_id: string; note: string; status: CallRequestStatus; created_at: string }
export interface MessageRow { id: string; project_id: string; contractor_id: string; sender_role: Role; body: string; created_at: string }
export interface ReviewRow {
  id: string; project_id: string | null; contractor_id: string; author_display: string; overall: number; quality: number;
  communication: number; timekeeping: number; cleanliness: number; value: number; cost_match: CostMatch; body: string; created_at: string;
}

export interface Snapshot {
  userId: string;
  profiles: ProfileRow[];
  myPrivate: PrivateRow | null;
  /** Phone numbers the homeowner has released to me (chosen, or approved a call), by owner id. */
  releasedPhones: Record<string, string>;
  contractors: ContractorRow[];
  stats: StatsRow[];
  portfolio: PortfolioRow[];
  projects: ProjectRow[];
  addresses: AddressRow[];
  invites: InviteRow[];
  quotes: QuoteRow[];
  calls: CallRow[];
  messages: MessageRow[];
  reviews: ReviewRow[];
  /** Member ids I have blocked. */
  blocks: string[];
  /** Storage path → signed URL, for project photos. */
  photoUrls: Record<string, string>;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

export function buildState(s: Snapshot): AppState {
  const me = s.profiles.find((p) => p.id === s.userId);
  const myBusiness = s.contractors.find((c) => c.owner_id === s.userId);

  const homeowners: Homeowner[] = s.profiles.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    postcode: p.postcode,
    email: p.id === s.userId ? s.myPrivate?.email ?? '' : '',
    phone: p.id === s.userId ? s.myPrivate?.phone ?? '' : s.releasedPhones[p.id] ?? '',
  }));

  const contractors: Contractor[] = s.contractors.map((c) => {
    const st = s.stats.find((x) => x.contractor_id === c.id);
    return {
      id: c.id,
      ownerId: c.owner_id,
      name: c.name,
      initials: initials(c.name),
      logoColor: c.logo_color,
      businessType: c.business_type,
      categories: c.categories,
      rating: Number(st?.rating ?? 0),
      reviewCount: st?.review_count ?? 0,
      yearsExperience: c.years_experience,
      projectsCompleted: st?.projects_completed ?? 0,
      verifiedBusiness: c.verified_business,
      insured: c.insured,
      insuranceCover: c.insurance_cover,
      about: c.about,
      services: c.services,
      areas: c.areas,
      baseArea: c.base_area,
      replyTime: c.reply_time || 'Usually within a day',
      phone: c.phone,
      cover: c.cover_url,
      portfolio: s.portfolio
        .filter((p) => p.contractor_id === c.id)
        .map((p) => ({
          id: p.id,
          title: p.title,
          area: p.area,
          durationDays: p.duration_days,
          year: p.year,
          description: p.description,
          before: p.before_url,
          after: p.after_url,
          gallery: p.gallery,
        })),
    };
  });

  const projects: Project[] = s.projects.map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    categoryId: p.category_id,
    answers: p.answers ?? {},
    description: p.description,
    photos: p.photos.map((path) => s.photoUrls[path] ?? '').filter(Boolean),
    location: {
      area: p.area,
      postcode: p.postcode,
      addressLine: s.addresses.find((a) => a.project_id === p.id)?.address_line ?? '',
    },
    stage: p.stage,
    createdAt: p.created_at,
    publishedAt: p.published_at ?? undefined,
    selectedContractorId: p.selected_contractor_id ?? undefined,
    invitedContractorIds: s.invites.filter((i) => i.project_id === p.id).map((i) => i.contractor_id),
  }));

  const threads = new Map<string, Thread>();
  for (const m of [...s.messages].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const key = `${m.project_id}:${m.contractor_id}`;
    const t = threads.get(key) ?? { id: key, projectId: m.project_id, contractorId: m.contractor_id, messages: [] };
    t.messages.push({ id: m.id, from: m.sender_role, text: m.body, at: m.created_at });
    threads.set(key, t);
  }

  return {
    session: {
      onboarded: true,
      role: me?.role === 'contractor' && myBusiness ? 'contractor' : 'homeowner',
      homeownerId: s.userId,
      contractorId: myBusiness?.id ?? '',
    },
    homeowners,
    contractors,
    projects,
    quotes: s.quotes.map((q) => ({
      id: q.id,
      projectId: q.project_id,
      contractorId: q.contractor_id,
      price: Number(q.price),
      priceType: q.price_type,
      vatIncluded: q.vat_included,
      materialsIncluded: q.materials_included,
      durationDays: q.duration_days,
      earliestStart: new Date(`${q.earliest_start}T09:00:00Z`).toISOString(),
      warrantyMonths: q.warranty_months,
      included: q.included,
      exclusions: q.exclusions,
      assumptions: q.assumptions,
      notes: q.notes,
      submittedAt: q.submitted_at,
      status: q.status,
      revision: q.revision,
    })),
    callRequests: s.calls.map((c) => ({
      id: c.id,
      projectId: c.project_id,
      contractorId: c.contractor_id,
      note: c.note,
      status: c.status,
      createdAt: c.created_at,
    })),
    threads: [...threads.values()],
    reviews: s.reviews.map((r) => ({
      id: r.id,
      projectId: r.project_id ?? '',
      contractorId: r.contractor_id,
      authorName: r.author_display || 'Verified homeowner',
      overall: r.overall,
      quality: r.quality,
      communication: r.communication,
      timekeeping: r.timekeeping,
      cleanliness: r.cleanliness,
      value: r.value,
      costMatch: r.cost_match,
      text: r.body,
      createdAt: r.created_at,
    })),
    blockedIds: s.blocks,
  };
}

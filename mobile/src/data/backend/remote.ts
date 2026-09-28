/** Reads and writes against Supabase. Row-level security decides what each user gets back. */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Action } from '../reducer';
import { newId } from '../reducer';
import type { Project } from '../types';
import { PROJECT_PHOTOS_BUCKET } from './client';
import type {
  AddressRow,
  CallRow,
  ContractorRow,
  InviteRow,
  MessageRow,
  PortfolioRow,
  PrivateRow,
  ProfileRow,
  ProjectRow,
  QuoteRow,
  ReviewRow,
  Snapshot,
  StatsRow,
} from './rows';

const SIGNED_URL_SECONDS = 60 * 60;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function loadSnapshot(db: SupabaseClient, userId: string): Promise<Snapshot> {
  const [myPrivate, contractors, stats, portfolio, projects, addresses, invites, quotes, calls, messages, reviews, blocks] = await Promise.all([
    db.from('profile_private').select('id, email, phone').eq('id', userId).maybeSingle().then(check<PrivateRow | null>),
    db.from('contractors').select('*').order('created_at', { ascending: false }).limit(300).then(check<ContractorRow[]>),
    db.from('contractor_stats').select('contractor_id, rating, review_count, projects_completed').then(check<StatsRow[]>),
    db.from('portfolio_items').select('*').order('created_at', { ascending: false }).limit(600).then(check<PortfolioRow[]>),
    db.from('projects').select('*').order('created_at', { ascending: false }).limit(200).then(check<ProjectRow[]>),
    db.from('project_private').select('project_id, address_line').then(check<AddressRow[]>),
    db.from('project_invites').select('project_id, contractor_id').then(check<InviteRow[]>),
    db.from('quotes').select('*').then(check<QuoteRow[]>),
    db.from('call_requests').select('*').then(check<CallRow[]>),
    db.from('messages').select('id, project_id, contractor_id, sender_role, body, created_at').order('created_at').limit(2000).then(check<MessageRow[]>),
    db.from('reviews').select('*').order('created_at', { ascending: false }).limit(300).then(check<ReviewRow[]>),
    db.from('blocks').select('blocked_id').then(check<{ blocked_id: string }[]>),
  ]);

  const peopleIds = [...new Set([userId, ...projects.map((p) => p.owner_id)])];
  const profiles = await db.from('profiles').select('id, first_name, last_name, postcode, role').in('id', peopleIds).then(check<ProfileRow[]>);

  // Phone numbers the homeowner has released to me: I was chosen, or they approved my call request.
  const myContractor = contractors.find((c) => c.owner_id === userId);
  const releasedPhones: Record<string, string> = {};
  if (myContractor) {
    const released = projects.filter(
      (p) =>
        p.owner_id !== userId &&
        (p.selected_contractor_id === myContractor.id ||
          calls.some((c) => c.project_id === p.id && c.contractor_id === myContractor.id && c.status === 'approved')),
    );
    await Promise.all(
      released.map(async (p) => {
        const rows = await db.rpc('get_project_contact', { p_project_id: p.id }).then(check<{ phone: string }[]>);
        if (rows?.[0]?.phone) releasedPhones[p.owner_id] = rows[0].phone;
      }),
    );
  }

  const paths = [...new Set(projects.flatMap((p) => p.photos))];
  const photoUrls: Record<string, string> = {};
  if (paths.length > 0) {
    const { data } = await db.storage.from(PROJECT_PHOTOS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    for (const item of data ?? []) if (item.path && item.signedUrl) photoUrls[item.path] = item.signedUrl;
  }

  return {
    userId, profiles, myPrivate, releasedPhones, contractors, stats, portfolio, projects, addresses, invites, quotes, calls, messages, reviews,
    blocks: blocks.map((b) => b.blocked_id),
    photoUrls,
  };
}

/** Uploads local photo files and returns their storage paths. */
export async function uploadPhotos(db: SupabaseClient, userId: string, uris: string[]): Promise<string[]> {
  const paths: string[] = [];
  for (const uri of uris) {
    const body = await (await fetch(uri)).arrayBuffer();
    const path = `${userId}/${newId('photo')}.jpg`;
    const { error } = await db.storage.from(PROJECT_PHOTOS_BUCKET).upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(error.message);
    paths.push(path);
  }
  return paths;
}

const dateOnly = (iso: string) => iso.slice(0, 10);

async function publishProject(db: SupabaseClient, userId: string, project: Project) {
  const photos = await uploadPhotos(db, userId, project.photos);
  check(
    await db.from('projects').insert({
      id: project.id,
      title: project.title,
      category_id: project.categoryId,
      answers: project.answers,
      description: project.description,
      photos,
      area: project.location.area,
      postcode: project.location.postcode,
      stage: 'published',
    }),
  );
  if (project.location.addressLine) {
    check(await db.from('project_private').insert({ project_id: project.id, address_line: project.location.addressLine }));
  }
}

/** Sends one app action to the server. The server re-checks every rule. */
export async function performRemote(db: SupabaseClient, userId: string, action: Action): Promise<void> {
  switch (action.type) {
    case 'publishProject':
      return publishProject(db, userId, action.project);
    case 'inviteContractor':
      check(await db.from('project_invites').upsert({ project_id: action.projectId, contractor_id: action.contractorId }, { ignoreDuplicates: true }));
      return;
    case 'submitQuote':
    case 'reviseQuote': {
      const q = action.quote;
      const fields = {
        price: q.price,
        price_type: q.priceType,
        vat_included: q.vatIncluded,
        materials_included: q.materialsIncluded,
        duration_days: q.durationDays,
        earliest_start: dateOnly(q.earliestStart),
        warranty_months: q.warrantyMonths,
        included: q.included,
        exclusions: q.exclusions,
        assumptions: q.assumptions,
        notes: q.notes,
      };
      if (action.type === 'submitQuote') {
        check(await db.from('quotes').insert({ id: q.id, project_id: q.projectId, contractor_id: q.contractorId, ...fields }));
      } else {
        check(await db.from('quotes').update(fields).eq('id', q.id));
      }
      return;
    }
    case 'declineQuote':
      check(await db.rpc('decline_quote', { p_quote_id: action.quoteId }));
      return;
    case 'selectQuote':
      check(await db.rpc('select_quote', { p_quote_id: action.quoteId }));
      return;
    case 'advanceStage':
      check(await db.rpc('advance_project', { p_project_id: action.projectId, p_to: action.to }));
      return;
    case 'addReview': {
      const r = action.review;
      check(
        await db.from('reviews').insert({
          id: r.id,
          project_id: r.projectId,
          contractor_id: r.contractorId,
          author_display: r.authorName,
          overall: r.overall,
          quality: r.quality,
          communication: r.communication,
          timekeeping: r.timekeeping,
          cleanliness: r.cleanliness,
          value: r.value,
          cost_match: r.costMatch,
          body: r.text,
        }),
      );
      return;
    }
    case 'requestCall':
      check(await db.from('call_requests').insert({ id: action.id, project_id: action.projectId, contractor_id: action.contractorId, note: action.note }));
      return;
    case 'respondCall':
      check(await db.rpc('respond_call', { p_request_id: action.id, p_status: action.status }));
      return;
    case 'sendMessage':
      check(
        await db.from('messages').insert({
          id: action.id,
          project_id: action.projectId,
          contractor_id: action.contractorId,
          sender_role: action.from,
          body: action.text.trim(),
        }),
      );
      return;
    case 'setRole':
      check(await db.from('profiles').update({ role: action.role }).eq('id', userId));
      return;
    case 'report':
      check(await db.from('reports').insert({ target_type: action.targetType, target_id: action.targetId, reason: action.reason }));
      return;
    case 'block':
      check(await db.from('blocks').upsert({ blocked_id: action.profileId }, { ignoreDuplicates: true }));
      return;
    case 'unblock':
      check(await db.from('blocks').delete().eq('blocked_id', action.profileId));
      return;
    case 'hydrate':
    case 'reset':
    case 'onboard':
      return;
  }
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  postcode: string;
  phone: string;
  role: 'homeowner' | 'contractor';
}

export async function saveProfile(db: SupabaseClient, userId: string, p: ProfileInput): Promise<void> {
  check(
    await db
      .from('profiles')
      .update({ first_name: p.firstName.trim(), last_name: p.lastName.trim(), postcode: p.postcode.trim().toUpperCase(), role: p.role })
      .eq('id', userId),
  );
  check(await db.from('profile_private').update({ phone: p.phone.trim() }).eq('id', userId));
}

export interface BusinessInput {
  name: string;
  businessType: 'company' | 'sole_trader';
  categories: string[];
  baseArea: string;
  areas: string[];
  yearsExperience: number;
  phone: string;
  about: string;
}

export async function createBusiness(db: SupabaseClient, userId: string, b: BusinessInput): Promise<void> {
  check(
    await db.from('contractors').insert({
      owner_id: userId,
      name: b.name.trim(),
      business_type: b.businessType,
      categories: b.categories,
      base_area: b.baseArea.trim(),
      areas: b.areas,
      years_experience: b.yearsExperience,
      phone: b.phone.trim(),
      about: b.about.trim(),
      services: [],
    }),
  );
  check(await db.from('profiles').update({ role: 'contractor' }).eq('id', userId));
}

/**
 * Deletes the signed-in user's photos, then their account. The database removes everything that
 * belonged only to them (see delete_my_account in the migrations).
 */
export async function deleteAccount(db: SupabaseClient, userId: string): Promise<void> {
  const { data: files } = await db.storage.from(PROJECT_PHOTOS_BUCKET).list(userId, { limit: 1000 });
  if (files && files.length > 0) {
    await db.storage.from(PROJECT_PHOTOS_BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
  }
  check(await db.rpc('delete_my_account'));
  await db.auth.signOut();
}

-- Rennova marketplace schema.
--
-- The rules that make the product trustworthy live here, not in the app:
--   * sealed quotes: a contractor only ever reads their own quote; the homeowner reads all of theirs
--   * contact control: address and phone reach a contractor only when the homeowner chooses them
--     (phone also after the homeowner approves a call request)
--   * stage order: Draft → Published → Receiving quotes → Contractor selected → In progress → Completed
--   * one verified review per completed project, by its homeowner, about the chosen contractor
-- The mobile app mirrors these in src/data/rules.ts for rendering, but this file is the authority.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------

create type public.user_role as enum ('homeowner', 'contractor');
create type public.business_type as enum ('company', 'sole_trader');
create type public.project_stage as enum ('draft', 'published', 'receiving_quotes', 'contractor_selected', 'in_progress', 'completed');
create type public.price_type as enum ('fixed', 'site_visit', 'estimate');
create type public.quote_status as enum ('submitted', 'accepted', 'declined', 'not_selected');
create type public.call_status as enum ('pending', 'approved', 'declined', 'message_instead');
create type public.cost_match as enum ('exact', 'more_agreed', 'more_unagreed', 'less');

create domain public.category_id as text check (value in (
  'painting', 'bathroom', 'kitchen', 'flooring', 'roofing', 'plumbing',
  'electrical', 'landscaping', 'extensions', 'loft', 'general'
));

-- ---------------------------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------------------------

-- Public profile: only what another member may see (first name, area).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 60),
  last_name text not null default '' check (char_length(last_name) <= 60),
  postcode text not null default '' check (char_length(postcode) <= 10),
  role public.user_role not null default 'homeowner',
  created_at timestamptz not null default now()
);

-- Private contact details: readable only by their owner (and through get_project_contact).
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  email text not null default '',
  phone text not null default '' check (char_length(phone) <= 30)
);

-- Every new auth user gets a profile and a private row.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.profile_private (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  business_type public.business_type not null default 'company',
  categories public.category_id[] not null default '{}',
  about text not null default '' check (char_length(about) <= 2000),
  services text[] not null default '{}',
  areas text[] not null default '{}',
  base_area text not null default '',
  years_experience int not null default 0 check (years_experience between 0 and 80),
  logo_color text not null default '#123F35',
  cover_url text not null default '',
  reply_time text not null default '',
  phone text not null default '' check (char_length(phone) <= 30),
  -- Set by Rennova after checking documents; contractors cannot change these themselves.
  verified_business boolean not null default false,
  insured boolean not null default false,
  insurance_cover text not null default '',
  created_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  area text not null default '',
  duration_days int not null default 1 check (duration_days > 0),
  year int not null default extract(year from now()),
  description text not null default '',
  before_url text not null default '',
  after_url text not null default '',
  gallery text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  category_id public.category_id not null,
  answers jsonb not null default '{}',
  description text not null default '' check (char_length(description) <= 4000),
  photos text[] not null default '{}',
  area text not null check (char_length(area) between 2 and 80),
  postcode text not null check (char_length(postcode) between 2 and 10),
  stage public.project_stage not null default 'published',
  selected_contractor_id uuid references public.contractors (id),
  created_at timestamptz not null default now(),
  published_at timestamptz default now()
);
create index projects_open_idx on public.projects (category_id, stage);

-- The exact address: only the owner and the chosen contractor.
create table public.project_private (
  project_id uuid primary key references public.projects (id) on delete cascade,
  address_line text not null default ''
);

create table public.project_invites (
  project_id uuid not null references public.projects (id) on delete cascade,
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, contractor_id)
);

-- ---------------------------------------------------------------------------------------------
-- Quotes, calls, messages, reviews
-- ---------------------------------------------------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  price numeric(10, 2) not null check (price > 0 and price < 10000000),
  price_type public.price_type not null default 'fixed',
  vat_included boolean not null default true,
  materials_included boolean not null default true,
  duration_days int not null check (duration_days between 1 and 1000),
  earliest_start date not null,
  warranty_months int not null default 0 check (warranty_months between 0 and 240),
  included text[] not null default '{}',
  exclusions text[] not null default '{}',
  assumptions text not null default '',
  notes text not null default '',
  status public.quote_status not null default 'submitted',
  revision int not null default 1,
  submitted_at timestamptz not null default now(),
  unique (project_id, contractor_id)
);

create table public.call_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 500),
  status public.call_status not null default 'pending',
  created_at timestamptz not null default now()
);
-- At most one pending request per contractor per project.
create unique index call_requests_one_pending on public.call_requests (project_id, contractor_id) where status = 'pending';

-- A thread is (project, contractor): the homeowner and one contractor.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  sender_role public.user_role not null,
  sender_id uuid not null default auth.uid() references public.profiles (id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (project_id, contractor_id, created_at);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  author_display text not null default '',
  overall smallint not null check (overall between 1 and 5),
  quality smallint not null check (quality between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  timekeeping smallint not null check (timekeeping between 1 and 5),
  cleanliness smallint not null check (cleanliness between 1 and 5),
  value smallint not null check (value between 1 and 5),
  cost_match public.cost_match not null,
  body text not null check (char_length(body) between 10 and 4000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Helpers (security definer, so policies can ask questions RLS would otherwise hide)
-- ---------------------------------------------------------------------------------------------

create function public.my_contractor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.contractors where owner_id = auth.uid()
$$;

create function public.is_project_owner(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id = p and owner_id = auth.uid())
$$;

-- Can the calling contractor see this project? Open projects in their trades, invites,
-- projects they quoted on, and projects that selected them.
create function public.contractor_can_see_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.projects pr
    join public.contractors c on c.owner_id = auth.uid()
    where pr.id = p
      and (
        pr.selected_contractor_id = c.id
        or exists (select 1 from public.quotes q where q.project_id = pr.id and q.contractor_id = c.id)
        or (
          pr.stage in ('published', 'receiving_quotes')
          and (pr.category_id = any (c.categories)
               or exists (select 1 from public.project_invites i where i.project_id = pr.id and i.contractor_id = c.id))
        )
      )
  )
$$;

create function public.project_is_open(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id = p and stage in ('published', 'receiving_quotes'))
$$;

-- ---------------------------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.contractors enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.projects enable row level security;
alter table public.project_private enable row level security;
alter table public.project_invites enable row level security;
alter table public.quotes enable row level security;
alter table public.call_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Nothing is readable without signing in.
revoke all on all tables in schema public from anon;

-- profiles: public names; you edit only yourself.
create policy "profiles readable by members" on public.profiles for select to authenticated using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, postcode, role) on public.profiles to authenticated;

create policy "private self read" on public.profile_private for select to authenticated using (id = auth.uid());
create policy "private self update" on public.profile_private for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profile_private from authenticated;
grant update (phone) on public.profile_private to authenticated;

-- contractors: public storefronts; owners edit their own, but never the verification columns.
create policy "contractors readable by members" on public.contractors for select to authenticated using (true);
create policy "contractors self insert" on public.contractors for insert to authenticated
  with check (owner_id = auth.uid() and not verified_business and not insured);
create policy "contractors self update" on public.contractors for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- A table-wide UPDATE grant covers every column, so take it away and grant back only what owners may edit.
revoke update on public.contractors from authenticated;
grant update (name, business_type, categories, about, services, areas, base_area, years_experience,
  logo_color, cover_url, reply_time, phone) on public.contractors to authenticated;

create policy "portfolio readable by members" on public.portfolio_items for select to authenticated using (true);
create policy "portfolio owner writes" on public.portfolio_items for all to authenticated
  using (contractor_id = public.my_contractor_id()) with check (contractor_id = public.my_contractor_id());

-- projects
create policy "projects visible to owner and relevant contractors" on public.projects for select to authenticated
  using (owner_id = auth.uid() or public.contractor_can_see_project(id));
create policy "projects owner insert" on public.projects for insert to authenticated
  with check (owner_id = auth.uid() and stage in ('draft', 'published') and selected_contractor_id is null);
create policy "projects owner edit" on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- Stage and selection only change through the functions below.
revoke update on public.projects from authenticated;
grant update (title, answers, description, photos, area, postcode) on public.projects to authenticated;
create policy "projects owner delete" on public.projects for delete to authenticated using (owner_id = auth.uid());

create policy "address for owner and chosen contractor" on public.project_private for select to authenticated
  using (
    public.is_project_owner(project_id)
    or exists (select 1 from public.projects p where p.id = project_id and p.selected_contractor_id = public.my_contractor_id())
  );
create policy "address owner writes" on public.project_private for all to authenticated
  using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));

create policy "invites visible to both sides" on public.project_invites for select to authenticated
  using (public.is_project_owner(project_id) or contractor_id = public.my_contractor_id());
create policy "invites by owner" on public.project_invites for insert to authenticated
  with check (public.is_project_owner(project_id) and public.project_is_open(project_id));

-- quotes: sealed.
create policy "quotes: owner sees all, contractor sees own" on public.quotes for select to authenticated
  using (public.is_project_owner(project_id) or contractor_id = public.my_contractor_id());
create policy "quotes: contractor submits on visible open project" on public.quotes for insert to authenticated
  with check (
    contractor_id = public.my_contractor_id()
    and status = 'submitted'
    and revision = 1
    and public.project_is_open(project_id)
    and public.contractor_can_see_project(project_id)
    and not public.is_project_owner(project_id)
  );
create policy "quotes: contractor revises while open" on public.quotes for update to authenticated
  using (contractor_id = public.my_contractor_id() and status = 'submitted' and public.project_is_open(project_id))
  with check (contractor_id = public.my_contractor_id() and status = 'submitted');
revoke update on public.quotes from authenticated;
grant update (price, price_type, vat_included, materials_included, duration_days, earliest_start,
  warranty_months, included, exclusions, assumptions, notes) on public.quotes to authenticated;

-- call requests: contractors ask, homeowners answer (through respond_call).
create policy "calls visible to both sides" on public.call_requests for select to authenticated
  using (public.is_project_owner(project_id) or contractor_id = public.my_contractor_id());
create policy "calls requested by a contractor who can see the project" on public.call_requests for insert to authenticated
  with check (
    contractor_id = public.my_contractor_id()
    and status = 'pending'
    and public.contractor_can_see_project(project_id)
    and not exists (
      select 1 from public.projects p where p.id = project_id and (p.stage in ('draft', 'completed') or p.selected_contractor_id = contractor_id)
    )
  );

-- messages: the homeowner and the contractor of that thread.
create policy "thread members read" on public.messages for select to authenticated
  using (public.is_project_owner(project_id) or contractor_id = public.my_contractor_id());
create policy "thread members write" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      (sender_role = 'homeowner' and public.is_project_owner(project_id))
      or (sender_role = 'contractor' and contractor_id = public.my_contractor_id() and public.contractor_can_see_project(project_id))
    )
  );

-- reviews: public; only the homeowner of a completed project, about the contractor they chose, once.
create policy "reviews readable by members" on public.reviews for select to authenticated using (true);
create policy "reviews by the homeowner of a completed project" on public.reviews for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid() and p.stage = 'completed' and p.selected_contractor_id = contractor_id
    )
  );

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

-- First quote moves a published project to receiving quotes.
create function public.on_quote_inserted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.projects set stage = 'receiving_quotes' where id = new.project_id and stage = 'published';
  return new;
end $$;
create trigger quote_inserted after insert on public.quotes for each row execute function public.on_quote_inserted();

-- Revisions are counted by the server.
create function public.on_quote_revised() returns trigger
language plpgsql as $$
begin
  if new.status = old.status then
    new.revision := old.revision + 1;
  end if;
  return new;
end $$;
create trigger quote_revised before update on public.quotes for each row execute function public.on_quote_revised();

-- ---------------------------------------------------------------------------------------------
-- Actions (the only way stages and statuses change)
-- ---------------------------------------------------------------------------------------------

create function public.select_quote(p_quote_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_quote_id;
  if q.id is null or not public.is_project_owner(q.project_id) then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if q.status <> 'submitted' or not public.project_is_open(q.project_id) then
    raise exception 'This quote can no longer be accepted' using errcode = 'P0001';
  end if;
  update public.quotes set status = 'accepted' where id = q.id;
  update public.quotes set status = 'not_selected' where project_id = q.project_id and id <> q.id and status = 'submitted';
  update public.projects set stage = 'contractor_selected', selected_contractor_id = q.contractor_id where id = q.project_id;
end $$;

create function public.decline_quote(p_quote_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_quote_id;
  if q.id is null or not public.is_project_owner(q.project_id) then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  update public.quotes set status = 'declined' where id = q.id and status = 'submitted';
end $$;

create function public.advance_project(p_project_id uuid, p_to public.project_stage) returns void
language plpgsql security definer set search_path = public as $$
declare cur public.project_stage;
begin
  select stage into cur from public.projects where id = p_project_id and owner_id = auth.uid();
  if cur is null then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;
  if not ((cur = 'draft' and p_to = 'published')
       or (cur = 'contractor_selected' and p_to = 'in_progress')
       or (cur = 'in_progress' and p_to = 'completed')) then
    raise exception 'Cannot move a project from % to %', cur, p_to using errcode = 'P0001';
  end if;
  update public.projects set stage = p_to, published_at = case when p_to = 'published' then now() else published_at end
  where id = p_project_id;
end $$;

create function public.respond_call(p_request_id uuid, p_status public.call_status) returns void
language plpgsql security definer set search_path = public as $$
declare r public.call_requests;
begin
  if p_status = 'pending' then
    raise exception 'Choose approve, decline or message instead' using errcode = 'P0001';
  end if;
  select * into r from public.call_requests where id = p_request_id;
  if r.id is null or not public.is_project_owner(r.project_id) then
    raise exception 'Call request not found' using errcode = 'P0002';
  end if;
  update public.call_requests set status = p_status where id = r.id and status = 'pending';
end $$;

-- Contact details for a project, released only as far as the homeowner has allowed.
create function public.get_project_contact(p_project_id uuid)
returns table (first_name text, phone text, address_line text)
language plpgsql stable security definer set search_path = public as $$
declare
  pr public.projects;
  me uuid := public.my_contractor_id();
  chosen boolean;
  approved boolean;
begin
  select * into pr from public.projects where id = p_project_id;
  if pr.id is null then return; end if;
  -- coalesce: a project with no chosen contractor yet must count as "not chosen", never as unknown.
  chosen := coalesce(pr.owner_id = auth.uid(), false)
         or coalesce(me is not null and pr.selected_contractor_id = me, false);
  approved := me is not null and exists (
    select 1 from public.call_requests where project_id = pr.id and contractor_id = me and status = 'approved'
  );
  if not chosen and not approved then return; end if;
  return query
    select p.first_name,
           pp.phone,
           case when chosen then coalesce(ppr.address_line, '') else '' end
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    left join public.project_private ppr on ppr.project_id = pr.id
    where p.id = pr.owner_id;
end $$;

revoke execute on function public.select_quote, public.decline_quote, public.advance_project,
  public.respond_call, public.get_project_contact from public, anon;
grant execute on function public.select_quote, public.decline_quote, public.advance_project,
  public.respond_call, public.get_project_contact to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Public contractor view with live reputation numbers
-- ---------------------------------------------------------------------------------------------

-- Runs as its owner so it can count completed projects the viewer cannot see; it exposes aggregates only.
create view public.contractor_stats as
select
  c.id as contractor_id,
  coalesce(round(avg(r.overall)::numeric, 1), 0) as rating,
  count(r.id)::int as review_count,
  (select count(*)::int from public.projects p where p.selected_contractor_id = c.id and p.stage = 'completed') as projects_completed,
  coalesce(round(100.0 * count(r.id) filter (where r.cost_match in ('exact', 'less', 'more_agreed')) / nullif(count(r.id), 0)), 0)::int as cost_match_rate
from public.contractors c
left join public.reviews r on r.contractor_id = c.id
group by c.id;

grant select on public.contractor_stats to authenticated;

-- Live updates for the tables the app listens to.
alter publication supabase_realtime add table public.projects, public.quotes, public.call_requests, public.messages;

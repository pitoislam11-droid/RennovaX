-- Safety and account controls the app stores require:
--   * report: anyone can report a message, review, profile or project for Rennova to look at
--   * block: stops another member messaging you, requesting calls or quoting on your projects
--   * delete account: removes the user and everything that belongs only to them

-- ---------------------------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------------------------

create type public.report_target as enum ('message', 'review', 'contractor', 'project', 'profile');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 80),
  details text not null default '' check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);
create index reports_open_idx on public.reports (status, created_at);

alter table public.reports enable row level security;
-- Reporters can file and see their own reports. Rennova reviews them with the service role.
create policy "file a report" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "see own reports" on public.reports for select to authenticated using (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;
create policy "manage own blocks" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- True when either person has blocked the other.
create function public.blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

-- The owner of the project and the owner of the contractor business, as profile ids.
create function public.project_owner_id(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select owner_id from public.projects where id = p
$$;

create function public.contractor_owner_id(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select owner_id from public.contractors where id = c
$$;

-- Messages: nobody can write into a conversation where either side has blocked the other.
drop policy "thread members write" on public.messages;
create policy "thread members write" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and not public.blocked_between(public.project_owner_id(project_id), public.contractor_owner_id(contractor_id))
    and (
      (sender_role = 'homeowner' and public.is_project_owner(project_id))
      or (sender_role = 'contractor' and contractor_id = public.my_contractor_id() and public.contractor_can_see_project(project_id))
    )
  );

-- Call requests and quotes: a blocked contractor can't reach the homeowner.
drop policy "calls requested by a contractor who can see the project" on public.call_requests;
create policy "calls requested by a contractor who can see the project" on public.call_requests for insert to authenticated
  with check (
    contractor_id = public.my_contractor_id()
    and status = 'pending'
    and public.contractor_can_see_project(project_id)
    and not public.blocked_between(auth.uid(), public.project_owner_id(project_id))
    and not exists (
      select 1 from public.projects p where p.id = project_id and (p.stage in ('draft', 'completed') or p.selected_contractor_id = contractor_id)
    )
  );

drop policy "quotes: contractor submits on visible open project" on public.quotes;
create policy "quotes: contractor submits on visible open project" on public.quotes for insert to authenticated
  with check (
    contractor_id = public.my_contractor_id()
    and status = 'submitted'
    and revision = 1
    and public.project_is_open(project_id)
    and public.contractor_can_see_project(project_id)
    and not public.is_project_owner(project_id)
    and not public.blocked_between(auth.uid(), public.project_owner_id(project_id))
  );

-- ---------------------------------------------------------------------------------------------
-- Deleting an account
-- ---------------------------------------------------------------------------------------------

-- Keep other people's history intact when someone leaves: their messages in shared threads and
-- the reviews they wrote stay, without a link to the deleted account.
alter table public.messages alter column sender_id drop not null;
alter table public.messages drop constraint messages_sender_id_fkey;
alter table public.messages add constraint messages_sender_id_fkey
  foreign key (sender_id) references public.profiles (id) on delete set null;

-- A contractor's reviews are part of their reputation, so they survive the homeowner deleting
-- their account (and with it the project).
alter table public.reviews alter column project_id drop not null;
alter table public.reviews drop constraint reviews_project_id_fkey;
alter table public.reviews add constraint reviews_project_id_fkey
  foreign key (project_id) references public.projects (id) on delete set null;

alter table public.reviews alter column author_id drop not null;
alter table public.reviews drop constraint reviews_author_id_fkey;
alter table public.reviews add constraint reviews_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- Deletes the calling user. Their profile, contact details, projects (with quotes, messages and
-- call requests on them), contractor business, portfolio and blocks go with them.
-- Uploaded photos are removed by the app through the Storage API before calling this.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end $$;

revoke execute on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;

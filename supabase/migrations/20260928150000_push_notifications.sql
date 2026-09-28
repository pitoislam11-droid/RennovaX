-- Push notifications for the four events a person is waiting on:
--   * a new quote, to the homeowner
--   * a new message, to the other person in the thread
--   * a call request, to the homeowner
--   * "you were chosen", to that contractor
--
-- The phone stores its Expo push token through register_push_token. Triggers only write a row
-- to notification_outbox. A database webhook calls the send-push Edge Function, which looks up
-- tokens and talks to Expo. The outbox is not readable by the app.
--
-- A notification never carries the price, the address, the phone number, or the call note.
-- Those stay behind the same rules as the rest of the product.

-- ---------------------------------------------------------------------------------------------
-- Tokens: one row per phone. A token moves when someone else signs in on that phone.
-- ---------------------------------------------------------------------------------------------

create table public.push_tokens (
  token text primary key check (char_length(token) between 20 and 200),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public, anon, authenticated;
grant select, delete on public.push_tokens to authenticated;
grant select, delete on public.push_tokens to service_role;

create policy "read own push tokens" on public.push_tokens for select to authenticated
  using (user_id = auth.uid());
create policy "remove own push tokens" on public.push_tokens for delete to authenticated
  using (user_id = auth.uid());

create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to register this phone' using errcode = 'P0001';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Unknown platform' using errcode = 'P0001';
  end if;
  if p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,180}\]$' then
    raise exception 'That is not an Expo push token' using errcode = 'P0001';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end $$;

create function public.unregister_push_token(p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to unregister this phone' using errcode = 'P0001';
  end if;
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
end $$;

revoke all on function public.register_push_token(text, text), public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text), public.unregister_push_token(text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Outbox: written only by the triggers below. Members cannot read or write it.
-- ---------------------------------------------------------------------------------------------

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('quote', 'message', 'call_request', 'chosen')),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 240),
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notification_outbox_unsent_idx on public.notification_outbox (created_at) where sent_at is null;

alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public, anon, authenticated;
grant select, update on public.notification_outbox to service_role;

-- ---------------------------------------------------------------------------------------------
-- Enqueue. Each trigger reads only the names it is allowed to show on a lock screen.
-- ---------------------------------------------------------------------------------------------

create function public.notify_on_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
  v_contractor_owner uuid;
begin
  select p.owner_id, p.title, c.name, c.owner_id
    into v_owner, v_title, v_name, v_contractor_owner
  from public.projects p
  join public.contractors c on c.id = new.contractor_id
  where p.id = new.project_id;
  if v_owner is null or v_owner = v_contractor_owner then
    return new;
  end if;
  insert into public.notification_outbox (recipient_id, kind, title, body, data)
  values (
    v_owner,
    'quote',
    'New quote',
    v_name || ' quoted for ' || v_title || '.',
    jsonb_build_object('kind', 'quote', 'projectId', new.project_id, 'quoteId', new.id, 'url', '/project/' || new.project_id)
  );
  return new;
end $$;
create trigger quote_notify after insert on public.quotes
  for each row execute function public.notify_on_quote();

create function public.notify_on_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
  v_name text;
  v_preview text;
begin
  if new.sender_role = 'contractor' then
    select p.owner_id, c.name into v_recipient, v_name
    from public.projects p
    join public.contractors c on c.id = new.contractor_id
    where p.id = new.project_id;
  else
    select c.owner_id, coalesce(nullif(btrim(pr.first_name), ''), 'A homeowner')
      into v_recipient, v_name
    from public.contractors c
    join public.projects p on p.id = new.project_id
    join public.profiles pr on pr.id = p.owner_id
    where c.id = new.contractor_id;
  end if;
  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;
  v_preview := left(btrim(replace(replace(new.body, chr(10), ' '), chr(13), ' ')), 80);
  insert into public.notification_outbox (recipient_id, kind, title, body, data)
  values (
    v_recipient,
    'message',
    'New message',
    v_name || ': ' || v_preview,
    jsonb_build_object('kind', 'message', 'projectId', new.project_id, 'contractorId', new.contractor_id, 'url', '/chat/' || new.project_id || '/' || new.contractor_id)
  );
  return new;
end $$;
create trigger message_notify after insert on public.messages
  for each row execute function public.notify_on_message();

create function public.notify_on_call_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
  v_contractor_owner uuid;
begin
  select p.owner_id, p.title, c.name, c.owner_id
    into v_owner, v_title, v_name, v_contractor_owner
  from public.projects p
  join public.contractors c on c.id = new.contractor_id
  where p.id = new.project_id;
  if v_owner is null or v_owner = v_contractor_owner then
    return new;
  end if;
  insert into public.notification_outbox (recipient_id, kind, title, body, data)
  values (
    v_owner,
    'call_request',
    'Call request',
    v_name || ' would like to call you about ' || v_title || '.',
    jsonb_build_object('kind', 'call_request', 'callId', new.id, 'projectId', new.project_id, 'url', '/call/' || new.id)
  );
  return new;
end $$;
create trigger call_notify after insert on public.call_requests
  for each row execute function public.notify_on_call_request();

create function public.notify_on_chosen() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
  v_name text;
begin
  if new.selected_contractor_id is not distinct from old.selected_contractor_id or new.selected_contractor_id is null then
    return new;
  end if;
  select c.owner_id, coalesce(nullif(btrim(pr.first_name), ''), 'A homeowner')
    into v_recipient, v_name
  from public.contractors c
  join public.profiles pr on pr.id = new.owner_id
  where c.id = new.selected_contractor_id;
  if v_recipient is null or v_recipient = new.owner_id then
    return new;
  end if;
  insert into public.notification_outbox (recipient_id, kind, title, body, data)
  values (
    v_recipient,
    'chosen',
    'You were chosen',
    v_name || ' chose you for ' || new.title || '.',
    jsonb_build_object('kind', 'chosen', 'projectId', new.id, 'url', '/opportunity/' || new.id)
  );
  return new;
end $$;
create trigger chosen_notify after update on public.projects
  for each row execute function public.notify_on_chosen();

revoke all on function public.notify_on_quote(), public.notify_on_message(), public.notify_on_call_request(), public.notify_on_chosen() from public, anon, authenticated;

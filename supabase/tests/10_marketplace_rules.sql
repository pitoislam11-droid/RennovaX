-- Plays a whole job through as five different accounts and checks every rule the database
-- promises: sealed quotes, contact control, call approval, stage order and verified reviews.
-- Run with: supabase/tests/run.sh  (plain Postgres 15+, no Supabase needed)
\set ON_ERROR_STOP on

create schema test;
grant usage on schema test to authenticated, anon;

create function test.act_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', false);
  perform set_config('request.jwt.claim.sub', u::text, false);
end $$;

create function test.act_as_admin() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', false);
  perform set_config('request.jwt.claim.sub', '', false);
end $$;

create function test.ok(condition boolean, label text) returns void language plpgsql as $$
begin
  if condition is not true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

-- Passes when the statement is refused (policy, privilege, constraint or function check).
create function test.refused(statement text, label text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    raise notice 'ok - % (refused: %)', label, sqlerrm;
    return;
  end;
  raise exception 'FAILED: % (statement was allowed)', label;
end $$;

grant execute on all functions in schema test to authenticated, anon;

-- ---- People -------------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a1e7', 'alex@example.com'),
  ('00000000-0000-0000-0000-0000000050f1', 'sophie@example.com'),
  ('00000000-0000-0000-0000-000000000b01', 'dan@brighthome.example'),
  ('00000000-0000-0000-0000-000000000c01', 'lee@londoncoats.example'),
  ('00000000-0000-0000-0000-000000000d01', 'nia@novabathrooms.example');

\set alex   '''00000000-0000-0000-0000-00000000a1e7'''
\set sophie '''00000000-0000-0000-0000-0000000050f1'''
\set dan    '''00000000-0000-0000-0000-000000000b01'''
\set lee    '''00000000-0000-0000-0000-000000000c01'''
\set nia    '''00000000-0000-0000-0000-000000000d01'''

select test.ok((select count(*) from public.profiles) = 5, 'signing up creates a profile for each user');

select test.act_as(:alex);
update public.profiles set first_name = 'Alex', postcode = 'SW4' where id = auth.uid();
update public.profile_private set phone = '07700 900123' where id = auth.uid();
update public.profiles set first_name = 'Hacked' where id <> auth.uid();
select test.ok((select count(*) from public.profile_private) = 1, 'a user reads only their own private details');
select test.ok((select count(*) from public.profiles where first_name = 'Hacked') = 0, 'a user cannot edit someone else''s profile');

select test.act_as(:dan);
select test.refused($$ insert into public.contractors (owner_id, name, categories, verified_business) values (auth.uid(), 'Fake Verified Ltd', '{painting}', true) $$,
  'a contractor cannot mark themselves verified on sign-up');
insert into public.contractors (id, owner_id, name, categories) values ('00000000-0000-0000-0000-0000000000b1', auth.uid(), 'BrightHome Decor', '{painting,general}');
select test.refused($$ update public.contractors set verified_business = true where owner_id = auth.uid() $$, 'a contractor cannot verify themselves later');
update public.contractors set about = 'Decorators in south London' where owner_id = auth.uid();

select test.act_as(:lee);
insert into public.contractors (id, owner_id, name, categories) values ('00000000-0000-0000-0000-0000000000c1', auth.uid(), 'London Coats', '{painting}');
select test.act_as(:nia);
insert into public.contractors (id, owner_id, name, categories) values ('00000000-0000-0000-0000-0000000000d1', auth.uid(), 'Nova Bathrooms', '{bathroom}');

\set bh   '''00000000-0000-0000-0000-0000000000b1'''
\set lc   '''00000000-0000-0000-0000-0000000000c1'''
\set nova '''00000000-0000-0000-0000-0000000000d1'''
\set p    '''00000000-0000-0000-0000-00000000f1a7'''

-- ---- A homeowner posts a project ----------------------------------------------------------

select test.act_as(:alex);
select test.refused($$ insert into public.projects (title, category_id, area, postcode, stage) values ('Sneaky', 'painting', 'Clapham', 'SW4', 'completed') $$,
  'a project cannot be created already completed');
insert into public.projects (id, title, category_id, area, postcode, photos)
  values (:p, '2-Bed Flat Redecoration', 'painting', 'Clapham, London', 'SW4', '{00000000-0000-0000-0000-00000000a1e7/living.jpg}');
insert into public.project_private (project_id, address_line) values (:p, 'Flat 12, 48 Elm Park Road, SW4 7AB');
insert into storage.objects (bucket_id, name) values ('project-photos', '00000000-0000-0000-0000-00000000a1e7/living.jpg');
select test.refused($$ insert into storage.objects (bucket_id, name) values ('project-photos', '00000000-0000-0000-0000-000000000b01/x.jpg') $$,
  'a homeowner cannot upload into someone else''s folder');

select test.act_as(:sophie);
select test.ok((select count(*) from public.projects) = 0, 'another homeowner cannot see the project');
select test.ok((select count(*) from storage.objects) = 0, 'another homeowner cannot see its photos');

select test.act_as(:nia);
select test.ok((select count(*) from public.projects) = 0, 'a contractor in another trade cannot see it');

select test.act_as(:dan);
select test.ok((select count(*) from public.projects where id = :p) = 1, 'a painter sees the painting project');
select test.ok((select count(*) from storage.objects) = 1, 'and can see its photos');
select test.ok((select count(*) from public.project_private) = 0, 'but not the address');
select test.ok((select count(*) from public.get_project_contact(:p)) = 0, 'and gets no contact details');
select test.refused($$ update public.projects set stage = 'completed' $$, 'a contractor cannot change a project''s stage');

-- ---- Sealed quotes --------------------------------------------------------------------------

insert into public.quotes (id, project_id, contractor_id, price, duration_days, earliest_start, warranty_months)
  values ('00000000-0000-0000-0000-00000000900b', :p, :bh, 4100, 10, current_date + 14, 24);
select test.refused($$ insert into public.quotes (project_id, contractor_id, price, duration_days, earliest_start) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1', 3900, 10, current_date + 7) $$,
  'a contractor can send only one quote per project');
select test.refused($$ insert into public.quotes (project_id, contractor_id, price, duration_days, earliest_start) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000c1', 1, 1, current_date) $$,
  'a contractor cannot quote in another contractor''s name');

select test.act_as(:lee);
insert into public.quotes (id, project_id, contractor_id, price, duration_days, earliest_start, warranty_months)
  values ('00000000-0000-0000-0000-00000000900c', :p, :lc, 4250, 12, current_date + 21, 24);
select test.ok((select count(*) from public.quotes) = 1, 'a contractor sees only their own quote');
select test.ok((select contractor_id from public.quotes) = :lc::uuid, 'and it is their own');

select test.act_as(:nia);
select test.refused($$ insert into public.quotes (project_id, contractor_id, price, duration_days, earliest_start) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000d1', 100, 1, current_date) $$,
  'a contractor cannot quote on a project they cannot see');

select test.act_as(:sophie);
select test.ok((select count(*) from public.quotes) = 0, 'another homeowner sees no quotes');

select test.act_as(:alex);
select test.ok((select count(*) from public.quotes where project_id = :p) = 2, 'the homeowner sees every quote');
select test.ok((select stage from public.projects where id = :p) = 'receiving_quotes', 'the first quote moves the project to receiving quotes');
select test.refused($$ update public.projects set stage = 'completed' $$, 'the homeowner cannot skip stages directly');

select test.act_as(:dan);
update public.quotes set price = 4050 where id = '00000000-0000-0000-0000-00000000900b';
select test.ok((select revision from public.quotes where id = '00000000-0000-0000-0000-00000000900b') = 2, 'revising a quote increases its revision');
select test.refused($$ update public.quotes set status = 'accepted' $$, 'a contractor cannot accept their own quote');
select test.refused($$ select public.select_quote('00000000-0000-0000-0000-00000000900b') $$, 'a contractor cannot call select_quote');

-- ---- Contact control: call requests and messages ------------------------------------------

select test.act_as(:lee);
insert into public.call_requests (id, project_id, contractor_id, note)
  values ('00000000-0000-0000-0000-0000000ca111', :p, :lc, 'Quick call about access?');
select test.refused($$ insert into public.call_requests (project_id, contractor_id) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000c1') $$,
  'only one pending call request per contractor per project');
select test.ok((select count(*) from public.get_project_contact(:p)) = 0, 'no phone number before the homeowner approves');
insert into public.messages (project_id, contractor_id, sender_role, body) values (:p, :lc, 'contractor', 'Is the wallpaper painted over?');
select test.refused($$ insert into public.messages (project_id, contractor_id, sender_role, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1', 'contractor', 'Hi') $$,
  'a contractor cannot write into another contractor''s thread');
select test.refused($$ insert into public.messages (project_id, contractor_id, sender_role, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000c1', 'homeowner', 'Fake') $$,
  'a contractor cannot post as the homeowner');

select test.act_as(:dan);
insert into public.messages (project_id, contractor_id, sender_role, body) values (:p, :bh, 'contractor', 'Thanks for the photos!');
select test.ok((select count(*) from public.messages) = 1, 'a contractor reads only their own thread');
select test.refused($$ select public.respond_call('00000000-0000-0000-0000-0000000ca111', 'approved') $$, 'a contractor cannot approve a call request');
select test.ok((select count(*) from public.call_requests) = 0, 'and cannot see a rival''s call requests');

select test.act_as(:alex);
select test.ok((select count(*) from public.messages where project_id = :p) = 2, 'the homeowner reads every thread on their project');
insert into public.messages (project_id, contractor_id, sender_role, body) values (:p, :lc, 'homeowner', 'No, it''s bare.');
select public.respond_call('00000000-0000-0000-0000-0000000ca111', 'approved');

select test.act_as(:lee);
select test.ok((select phone from public.get_project_contact(:p)) = '07700 900123', 'an approved call releases the phone number');
select test.ok((select address_line from public.get_project_contact(:p)) = '', 'but not the address');

-- ---- Choosing a contractor ------------------------------------------------------------------

select test.act_as(:alex);
select public.select_quote('00000000-0000-0000-0000-00000000900b');
select test.ok((select stage from public.projects where id = :p) = 'contractor_selected', 'choosing a quote selects the contractor');
select test.ok((select status from public.quotes where id = '00000000-0000-0000-0000-00000000900c') = 'not_selected', 'the other quotes are closed');
select test.refused($$ select public.select_quote('00000000-0000-0000-0000-00000000900c') $$, 'a second quote cannot be accepted');

select test.act_as(:dan);
select test.ok((select address_line from public.get_project_contact(:p)) = 'Flat 12, 48 Elm Park Road, SW4 7AB', 'the chosen contractor gets the address');
select test.ok((select count(*) from public.project_private) = 1, 'and can read it directly');
select test.refused($$ insert into public.call_requests (project_id, contractor_id) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1') $$,
  'the chosen contractor has no need to request a call');

select test.act_as(:lee);
select test.ok((select status from public.quotes) = 'not_selected', 'the unsuccessful contractor sees only that they were not selected');
select test.ok((select count(*) from public.project_private) = 0, 'and never sees the address');
update public.quotes set price = 1;
select test.ok((select price from public.quotes) = 4250, 'a closed quote cannot be revised');

-- ---- Completing and reviewing ---------------------------------------------------------------

select test.act_as(:alex);
select test.refused($$ insert into public.reviews (project_id, contractor_id, overall, quality, communication, timekeeping, cleanliness, value, cost_match, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1', 5,5,5,5,5,5,'exact','Great work, very tidy.') $$,
  'no review before the job is completed');
select test.refused($$ select public.advance_project('00000000-0000-0000-0000-00000000f1a7', 'completed') $$, 'a project cannot jump straight to completed');
select public.advance_project(:p, 'in_progress');
select public.advance_project(:p, 'completed');
select test.refused($$ insert into public.reviews (project_id, contractor_id, overall, quality, communication, timekeeping, cleanliness, value, cost_match, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000c1', 1,1,1,1,1,1,'more_unagreed','Never even did the job.') $$,
  'a review can only be about the contractor who did the job');
insert into public.reviews (project_id, contractor_id, author_display, overall, quality, communication, timekeeping, cleanliness, value, cost_match, body)
  values (:p, :bh, 'Alex, Clapham', 5, 5, 5, 4, 5, 5, 'exact', 'Tidy, on time and the finish is lovely.');
select test.refused($$ insert into public.reviews (project_id, contractor_id, overall, quality, communication, timekeeping, cleanliness, value, cost_match, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1', 5,5,5,5,5,5,'exact','Second review attempt.') $$,
  'one review per project');

select test.act_as(:sophie);
select test.refused($$ insert into public.reviews (project_id, contractor_id, overall, quality, communication, timekeeping, cleanliness, value, cost_match, body) values ('00000000-0000-0000-0000-00000000f1a7', '00000000-0000-0000-0000-0000000000b1', 1,1,1,1,1,1,'exact','Fake review from a stranger.') $$,
  'someone who did not hire the contractor cannot review them');
select test.ok((select review_count from public.contractor_stats where contractor_id = :bh) = 1, 'reviews are public');
select test.ok((select projects_completed from public.contractor_stats where contractor_id = :bh) = 1, 'completed jobs count towards the storefront');
select test.ok((select cost_match_rate from public.contractor_stats where contractor_id = :bh) = 100, 'and so does quote accuracy');

-- ---- Signed out -----------------------------------------------------------------------------

select test.act_as_admin();
set role anon;
select test.refused($$ select count(*) from public.projects $$, 'signed-out visitors can read nothing');
reset role;

\echo 'All marketplace rule tests passed.'

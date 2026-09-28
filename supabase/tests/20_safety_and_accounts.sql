-- Reporting, blocking and deleting an account.
-- Runs after 10_marketplace_rules.sql and reuses its helpers.
\set ON_ERROR_STOP on

select test.act_as_admin();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000e001', 'emma@example.com'),
  ('00000000-0000-0000-0000-00000000e002', 'rob@roguebuilders.example');

\set emma  '''00000000-0000-0000-0000-00000000e001'''
\set rob   '''00000000-0000-0000-0000-00000000e002'''
\set rogue '''00000000-0000-0000-0000-0000000000e2'''
\set job   '''00000000-0000-0000-0000-00000000e0b1'''
\set job2  '''00000000-0000-0000-0000-00000000e0b2'''

select test.act_as(:rob);
insert into public.contractors (id, owner_id, name, categories) values (:rogue, auth.uid(), 'Rogue Builders', '{painting}');

select test.act_as(:emma);
update public.profiles set first_name = 'Emma' where id = auth.uid();
insert into public.projects (id, title, category_id, area, postcode) values (:job, 'Kitchen repaint', 'painting', 'Balham', 'SW12');
insert into public.projects (id, title, category_id, area, postcode) values (:job2, 'Hallway repaint', 'painting', 'Balham', 'SW12');

select test.act_as(:rob);
insert into public.messages (project_id, contractor_id, sender_role, body) values (:job, :rogue, 'contractor', 'Cash only, no paperwork?');

-- ---- Reporting ------------------------------------------------------------------------------

select test.act_as(:emma);
insert into public.reports (target_type, target_id, reason, details)
  select 'message', id, 'Spam or scam', 'Asked for cash with no paperwork' from public.messages where contractor_id = :rogue;
select test.ok((select count(*) from public.reports) = 1, 'a member can report a message');
select test.refused($$ insert into public.reports (reporter_id, target_type, target_id, reason) values ('00000000-0000-0000-0000-00000000a1e7', 'profile', '00000000-0000-0000-0000-00000000e002', 'Fake') $$,
  'a report cannot be filed in someone else''s name');

select test.act_as(:rob);
select test.ok((select count(*) from public.reports) = 0, 'the reported person cannot see who reported them');

-- ---- Blocking -------------------------------------------------------------------------------

select test.act_as(:emma);
insert into public.blocks (blocked_id) values (:rob);

select test.act_as(:rob);
select test.ok((select count(*) from public.blocks) = 0, 'a blocked person cannot see the block');
select test.refused($$ insert into public.messages (project_id, contractor_id, sender_role, body) values ('00000000-0000-0000-0000-00000000e0b1', '00000000-0000-0000-0000-0000000000e2', 'contractor', 'Hello?') $$,
  'a blocked contractor cannot message the homeowner');
select test.refused($$ insert into public.call_requests (project_id, contractor_id) values ('00000000-0000-0000-0000-00000000e0b1', '00000000-0000-0000-0000-0000000000e2') $$,
  'or request a call');
select test.refused($$ insert into public.quotes (project_id, contractor_id, price, duration_days, earliest_start) values ('00000000-0000-0000-0000-00000000e0b2', '00000000-0000-0000-0000-0000000000e2', 900, 3, current_date + 7) $$,
  'or quote on their other projects');

select test.act_as(:emma);
select test.refused($$ insert into public.messages (project_id, contractor_id, sender_role, body) values ('00000000-0000-0000-0000-00000000e0b1', '00000000-0000-0000-0000-0000000000e2', 'homeowner', 'Hi') $$,
  'the blocker cannot write into the blocked thread either');
delete from public.blocks where blocked_id = :rob;
insert into public.messages (project_id, contractor_id, sender_role, body) values (:job, :rogue, 'homeowner', 'Sorry, wrong button.');
select test.ok((select count(*) from public.messages where contractor_id = :rogue) = 2, 'unblocking lets the conversation continue');

-- ---- Deleting an account --------------------------------------------------------------------

select test.act_as(:rob);
select public.delete_my_account();

select test.act_as_admin();
select test.ok(not exists (select 1 from auth.users where id = :rob), 'deleting an account removes the user');
select test.ok(not exists (select 1 from public.contractors where id = :rogue), 'and their business');
select test.ok((select count(*) from public.messages where project_id = :job) = 0, 'and the conversations that belonged to that business');

select test.act_as(:dan);
select test.ok((select count(*) from public.reviews) >= 1, 'reviews written by other people are unaffected');

select test.act_as(:alex);
select public.delete_my_account();
select test.act_as_admin();
select test.ok(not exists (select 1 from public.projects where owner_id = :alex), 'a homeowner''s projects go with their account');
select test.ok((select author_id from public.reviews where contractor_id = :bh) is null, 'reviews they wrote stay, no longer linked to them');

set role anon;
select test.refused($$ select public.delete_my_account() $$, 'signed-out visitors cannot call delete_my_account');
reset role;

\echo 'All safety and account tests passed.'

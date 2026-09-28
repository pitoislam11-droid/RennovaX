-- Push notifications: the right person is told, and the lock screen never shows a price,
-- an address, a phone number or the note on a call request.
-- Runs after the other rule files and reuses their helpers and accounts.
\set ON_ERROR_STOP on

\set sophie '''00000000-0000-0000-0000-0000000050f1'''
\set lee    '''00000000-0000-0000-0000-000000000c01'''
\set lc     '''00000000-0000-0000-0000-0000000000c1'''
\set job    '''00000000-0000-0000-0000-00000000f30a'''
\set quote  '''00000000-0000-0000-0000-00000000930a'''
\set call   '''00000000-0000-0000-0000-0000000ca30a'''
\set token  '''ExponentPushToken[rennovaPhone123456]'''

select test.act_as(:sophie);
update public.profiles set first_name = 'Sophie' where id = auth.uid();
update public.profile_private set phone = '07700 900999' where id = auth.uid();
insert into public.projects (id, title, category_id, area, postcode)
  values (:job, 'Spare room painting', 'painting', 'Battersea', 'SW11');
insert into public.project_private (project_id, address_line) values (:job, '99 Secret Lane, SW11 1AA');

select test.act_as(:lee);
insert into public.quotes (id, project_id, contractor_id, price, duration_days, earliest_start)
  values (:quote, :job, :lc, 1900, 4, current_date + 10);

select test.act_as_admin();
select test.ok(
  (select count(*) from public.notification_outbox where recipient_id = :sophie and kind = 'quote' and data->>'projectId' = :job) = 1,
  'a new quote notifies the homeowner');
select test.ok(
  (select body from public.notification_outbox where recipient_id = :sophie and kind = 'quote' and data->>'projectId' = :job)
    = 'London Coats quoted for Spare room painting.',
  'the quote notification names the contractor and the project');
select test.ok(
  (select data->>'url' from public.notification_outbox where kind = 'quote' and data->>'projectId' = :job) = '/project/' || :job,
  'the quote notification opens the project');
select test.ok(
  not exists (select 1 from public.notification_outbox where recipient_id = :lee and kind = 'quote' and data->>'projectId' = :job),
  'the contractor who sent the quote is not notified about it');
select test.ok(
  not exists (
    select 1 from public.notification_outbox
    where data->>'projectId' = :job
      and (body like '%1900%' or body like '%Secret%' or body like '%07700%' or data::text like '%1900%' or data::text like '%Secret%' or data::text like '%07700%')
  ),
  'a quote notification has no price, address or phone number');

select test.act_as(:lee);
update public.quotes set price = 1800 where id = :quote;
select test.act_as_admin();
select test.ok(
  (select count(*) from public.notification_outbox where kind = 'quote' and data->>'projectId' = :job) = 1,
  'revising a quote does not send another notification');

select test.act_as(:lee);
insert into public.messages (project_id, contractor_id, sender_role, body)
  values (:job, :lc, 'contractor', 'Can I see the' || chr(10) || 'window?');
select test.act_as_admin();
select test.ok(
  (select body from public.notification_outbox where recipient_id = :sophie and kind = 'message' and data->>'projectId' = :job)
    = 'London Coats: Can I see the window?',
  'a contractor message notifies the homeowner, on one line');
select test.ok(
  not exists (select 1 from public.notification_outbox where recipient_id = :lee and kind = 'message' and data->>'projectId' = :job and body like 'London Coats:%'),
  'a contractor is not notified about their own message');

select test.act_as(:sophie);
insert into public.messages (project_id, contractor_id, sender_role, body)
  values (:job, :lc, 'homeowner', 'Yes, the sash window.');
select test.act_as_admin();
select test.ok(
  (select body from public.notification_outbox where recipient_id = :lee and kind = 'message' and data->>'projectId' = :job)
    = 'Sophie: Yes, the sash window.',
  'a homeowner message notifies the contractor');
select test.ok(
  (select data->>'url' from public.notification_outbox where recipient_id = :lee and kind = 'message' and data->>'projectId' = :job)
    = '/chat/' || :job || '/' || :lc,
  'a message notification opens that conversation');

select test.act_as(:lee);
insert into public.call_requests (id, project_id, contractor_id, note)
  values (:call, :job, :lc, 'My number is 07700 900111');
select test.act_as_admin();
select test.ok(
  (select body from public.notification_outbox where recipient_id = :sophie and kind = 'call_request' and data->>'callId' = :call)
    = 'London Coats would like to call you about Spare room painting.',
  'a call request notifies the homeowner');
select test.ok(
  (select data->>'url' from public.notification_outbox where kind = 'call_request' and data->>'callId' = :call) = '/call/' || :call,
  'a call notification opens the request');
select test.ok(
  not exists (
    select 1 from public.notification_outbox
    where kind = 'call_request' and data->>'callId' = :call
      and (body like '%07700%' or data::text like '%07700%' or body like '%900111%')
  ),
  'a call notification leaves out the note and any phone number');

select test.act_as(:sophie);
select public.select_quote(:quote);
select test.act_as_admin();
select test.ok(
  (select body from public.notification_outbox where recipient_id = :lee and kind = 'chosen' and data->>'projectId' = :job)
    = 'Sophie chose you for Spare room painting.',
  'choosing a quote tells that contractor they were chosen');
select test.ok(
  (select data->>'url' from public.notification_outbox where kind = 'chosen' and data->>'projectId' = :job) = '/opportunity/' || :job,
  'the chosen notification opens the job');
select test.ok(
  not exists (select 1 from public.notification_outbox where recipient_id = :sophie and kind = 'chosen'),
  'the homeowner is not told they chose someone');
select test.ok(
  not exists (
    select 1 from public.notification_outbox
    where kind = 'chosen' and data->>'projectId' = :job
      and (body like '%Secret%' or data::text like '%Secret%' or body like '%07700%' or body like '%1900%' or body like '%1800%')
  ),
  'being chosen does not reveal the address, phone or price');

-- ---- Tokens stay with their owner -----------------------------------------------------------

select test.act_as(:lee);
select public.register_push_token(:token, 'ios');
select test.ok((select count(*) from public.push_tokens) = 1, 'a member can register the phone they are using');
select test.refused($$ select public.register_push_token('not-a-token', 'ios') $$, 'a random string is not an Expo push token');
select test.refused($$ insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[stolen0000000000]', '00000000-0000-0000-0000-0000000050f1', 'ios') $$,
  'a member cannot write a token row directly');

select test.act_as(:sophie);
select test.ok((select count(*) from public.push_tokens) = 0, 'a member cannot see someone else''s push token');
select public.register_push_token(:token, 'ios');
select test.ok((select user_id from public.push_tokens) = :sophie::uuid, 'signing in on the same phone moves the token');
select public.unregister_push_token(:token);
select test.ok((select count(*) from public.push_tokens) = 0, 'signing out removes that phone''s token');

select test.act_as(:sophie);
select test.refused($$ select * from public.notification_outbox $$, 'members cannot read the notification queue');
select test.refused($$ insert into public.notification_outbox (recipient_id, kind, title, body) values ('00000000-0000-0000-0000-000000000c01', 'chosen', 'You were chosen', 'Fake.') $$,
  'members cannot queue a notification themselves');

set role anon;
select test.refused($$ select public.register_push_token('ExponentPushToken[rennovaPhone123456]', 'ios') $$, 'signed-out visitors cannot register a phone');
select test.refused($$ select * from public.notification_outbox $$, 'signed-out visitors cannot read the notification queue');
reset role;

\echo 'All push notification tests passed.'

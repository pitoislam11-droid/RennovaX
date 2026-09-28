-- Signed-out visitors reach none of the helpers, trigger functions or member-only views.
-- Runs after the other rule files and reuses their helpers.
\set ON_ERROR_STOP on

select test.act_as_admin();
set role anon;
select test.refused($$ select public.my_contractor_id() $$, 'signed-out visitors cannot call my_contractor_id');
select test.refused($$ select public.project_owner_id('00000000-0000-0000-0000-00000000f30a') $$, 'or look up who owns a project');
select test.refused($$ select public.blocked_between('00000000-0000-0000-0000-00000000a1e7', '00000000-0000-0000-0000-000000000b01') $$, 'or check who has blocked whom');
select test.refused($$ select * from public.contractor_stats $$, 'or read contractor stats');
select test.refused($$ select * from public.reports $$, 'or read reports');
select test.refused($$ select * from public.blocks $$, 'or read blocks');
reset role;

select test.act_as('00000000-0000-0000-0000-0000000050f1');
select test.ok(public.my_contractor_id() is null, 'signed-in members can still use the helpers the rules rely on');
select test.ok((select count(*) from public.contractor_stats) >= 0, 'and read contractor stats');

\echo 'All grant tests passed.'

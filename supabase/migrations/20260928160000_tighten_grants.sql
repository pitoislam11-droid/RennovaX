-- Close what Supabase's security advisor flagged on a fresh project.
--
-- Supabase grants EXECUTE on new functions and SELECT on new tables and views to anon by default.
-- The first migration revoked table access from anon before some objects existed, so later ones
-- kept the default. Signed-out visitors should reach none of them.
--
-- Signed-in members keep EXECUTE on the helpers, because row-level security policies call them as
-- the member. Trigger functions are never called directly, so nobody needs EXECUTE on them.
--
-- contractor_stats stays a security definer view on purpose: it counts completed projects the
-- viewer cannot see and exposes aggregates only.
--
-- notification_outbox has row-level security on and no policies on purpose: only the service role
-- (the send-push function) touches it.

revoke execute on function
  public.blocked_between(uuid, uuid),
  public.contractor_can_see_project(uuid),
  public.contractor_owner_id(uuid),
  public.is_project_owner(uuid),
  public.my_contractor_id(),
  public.project_is_open(uuid),
  public.project_owner_id(uuid)
from public, anon;

revoke execute on function
  public.handle_new_user(),
  public.on_quote_inserted(),
  public.on_quote_revised()
from public, anon, authenticated;

alter function public.on_quote_revised() set search_path = public;

revoke all on public.contractor_stats, public.reports, public.blocks from anon;

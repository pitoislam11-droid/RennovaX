# Rennova backend (Supabase)

Postgres database, sign-in, photo storage and live updates for the mobile app.

The marketplace rules are enforced here, by row-level security and a few server functions. The
app can't bypass them, even if someone tampers with it:

| Rule | Where |
| --- | --- |
| Contractors see only their own quote; the homeowner sees all of theirs | `quotes` policies |
| The address goes only to the chosen contractor | `project_private` policies, `get_project_contact` |
| The phone number goes to the chosen contractor, or after the homeowner approves a call | `get_project_contact`, `respond_call` |
| Stages move in order and only through actions | `select_quote`, `advance_project`, column grants |
| Contractors can't mark themselves verified or insured | `contractors` column grants |
| One review per completed project, by its homeowner, about the chosen contractor | `reviews` policies |
| Contractors see photos only for projects they can see | `storage.objects` policies |
| Blocked people can't message, request calls or quote | `blocks`, message/call/quote policies |
| Reports go to a private moderation queue | `reports` |
| Deleting an account removes everything that was only theirs; reviews they wrote stay, unlinked | `delete_my_account` |
| A new quote, message, call request or selection notifies only the person it is for, with no price, address or phone number | `notification_outbox` triggers |

## Set it up (about 10 minutes)

1. Create a free project at [supabase.com](https://supabase.com). Choose the **London (eu-west-2)**
   region.
2. Open **SQL Editor**, then paste and run each file in `migrations/`, in name order.
   With the Supabase CLI you can instead run `supabase link` and then `supabase db push`.
3. Set up sign-in codes: go to **Authentication → Emails → Magic Link** and put `{{ .Token }}` in
   the email body, so people get a 6-digit code instead of a link.
4. Copy **Project Settings → API → Project URL** and the **anon public** key into
   `mobile/.env.local`, following `mobile/.env.example`.
5. Restart the app (`npx expo start --clear`). It now signs people in and uses the live database.
   Without `.env.local` it keeps running on demo data.

**Verifying a contractor:** after checking their ID and insurance certificate, open
**Table Editor → contractors** and tick `verified_business` and `insured`, then fill in
`insurance_cover`. Contractors can't change these columns themselves.

## Push notifications

A trigger writes a row to `notification_outbox` when a quote, message or call request is created,
and when a project’s chosen contractor changes. The row names the job and the person. It does not
include the price, the address, the phone number, or the note on a call request. Members cannot
read this table. Phones register through `register_push_token` and are removed on sign-out.

To actually deliver them:

1. Deploy the function: `supabase functions deploy send-push --no-verify-jwt`
2. In the dashboard, open **Database → Webhooks** and create a hook on `public.notification_outbox`,
   event **Insert**, pointing at the `send-push` Edge Function. Add an auth header with the service
   role key.
3. If you turn on Expo’s enhanced push security, set the `EXPO_ACCESS_TOKEN` secret.
4. Put the EAS project id on the app (a development or store build does this) so the phone can
   obtain an Expo push token. Apply this migration to the project first.

## Test the rules

The tests play a whole job through as seven accounts and check 108 rules. They need only a local
Postgres 15 or later, not Supabase:

```bash
PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
```

`tests/00_supabase_shim.sql` stands in for Supabase's `auth` and `storage` schemas so the tests
run anywhere. Never apply it to a real project.

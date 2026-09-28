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

## Test the rules

The tests play a whole job through as seven accounts and check 71 rules. They need only a local
Postgres 15 or later, not Supabase:

```bash
PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
```

`tests/00_supabase_shim.sql` stands in for Supabase's `auth` and `storage` schemas so the tests
run anywhere. Never apply it to a real project.

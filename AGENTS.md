# Rennova: notes for coding agents (Cursor, Claude Code, others)

Rennova is a UK marketplace app that connects homeowners with contractors for renovation work.
It should feel like online shopping for contractors: the homeowner describes the job once,
receives private quotes, compares them and chooses. It is free for everyone, with no payments.

## Where things are

| Path | What |
| --- | --- |
| `mobile/` | React Native + Expo SDK 57 app (Expo Router, TypeScript). See `mobile/README.md`. |
| `supabase/` | Postgres schema, row-level security, server functions and tests. See `supabase/README.md`. |
| `PUBLISHING.md` | App Store / Google Play checklist. |
| `docs/` | Product thinking: capture model, quoting, trust, profiles, MVP scope. |
| `vendor/free-llm` | Git submodule: a directory of free LLM APIs, for reference only. |

## Commands

```bash
cd mobile && npm install
npx expo start                  # scan the QR code with Expo Go; add --tunnel if needed
npm test                        # 22 app tests
npm run typecheck
PGHOST=localhost PGUSER=postgres ../supabase/tests/run.sh   # 71 database rule checks, needs local Postgres 15+
```

Use `npx expo install <pkg>` to add packages so versions match SDK 57. After changing
`EXPO_PUBLIC_*` values, restart with `npx expo start --clear`.

## How the app works

- **Two modes.** Without `mobile/.env.local` the app runs on demo data stored on the device
  (`src/data/seed.ts`, `demo.ts`). With `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` it signs people in by email code and uses Supabase.
- **One state shape.** Screens read `AppState` from `useStore()` (`src/data/store.tsx`) and change
  it with `dispatch(action)` (`src/data/reducer.ts`). In live mode an action is applied locally,
  sent by `performRemote` (`src/data/backend/remote.ts`), then reloaded. Screens don't know which
  mode they're in.
- **Rules live in two places on purpose.** `src/data/rules.ts` decides what to render. The
  database (`supabase/migrations/`) is the authority and enforces the same rules.
- **Design.** `src/theme.ts` holds the tokens. `src/components/Glass.tsx` provides Apple Liquid
  Glass on iOS 26+ with fallbacks elsewhere. `src/components/ui.tsx` and `marketplace.tsx` hold
  the shared pieces. The look: photo-led cards, pastel category tiles, black pill buttons and a
  floating glass tab bar.

## Rules that must not be broken

These protect homeowners and are the product's promise. The database enforces each one, and the
tests prove it:

1. Sealed quotes: a contractor sees only their own quote; the homeowner sees all of theirs.
2. The address goes only to the chosen contractor. The phone number goes to the chosen
   contractor, or after the homeowner approves a call request.
3. Stages move Draft → Published → Receiving quotes → Contractor selected → In progress →
   Completed, and change only through `select_quote` / `advance_project`.
4. Quote comparison is ordered by arrival and never ranks or highlights the cheapest.
5. Contractors can't mark themselves verified or insured.
6. One review per completed project, by its homeowner, about the chosen contractor.
7. Blocked people can't message, request calls or quote.

Never loosen a row-level security policy or grant to make an error go away. Add a migration
(never edit an applied one) and a test in `supabase/tests/` for every rule change.

## Status (end of September 2026)

Done: every homeowner and contractor screen, guided questions for 11 categories, photos, quote
comparison, messaging, call requests, reviews, the Supabase backend with realtime updates,
sign-in by email code or password, report, block, delete account, privacy and terms templates,
and EAS build config.

Next, in order:
1. Push notifications for new quotes, messages, call requests and "you were chosen"
   (`expo-notifications`, store Expo push tokens, send from a Supabase Edge Function or database
   webhook).
2. Strip location data from photos before upload (`expo-image-manipulator`).
3. Contractor portfolio uploads (the `portfolio` bucket exists) and verification document upload.
4. Moderation / admin screen for reports and verification.
5. Launch items in `PUBLISHING.md`: own photos, icon, bundle ID, legal text, reviewer account.

## Conventions

- British English in all user-facing copy. Plain, short sentences.
- Keep screens thin; put logic in `src/data/`.
- Run `npm test` and `npm run typecheck` before committing. Never commit `.env.local`, tokens or
  passwords.

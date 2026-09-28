# Rennova mobile app

React Native + Expo (SDK 57) app for homeowners and contractors. It uses Expo Router for
navigation and Apple Liquid Glass for the floating tab bar and the buttons over photos.

It runs in two modes:

- **Demo** (the default): sample data on the device, and fake quotes arrive after you publish.
- **Live**: sign-in by email code and a shared Supabase database, so homeowners and contractors
  on different phones see the same projects. Set it up with [`../supabase/README.md`](../supabase/README.md),
  then copy `.env.example` to `.env.local` and fill it in.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for the iOS Simulator or `a` for
Android.

- **Liquid Glass** needs iOS 26 or later. Older iOS versions get a frosted blur instead, and
  Android and web get a translucent surface.
- **Web** (`npx expo start --web`) works for quick checks. The design is built for phones.

## Checks

```bash
npm test            # marketplace rules and the live data layer
npm run typecheck
```

## What works

**Homeowner:** onboarding, home ("What do you need done?"), guided questions for all 11
categories, photos from the library or camera, review and publish, receiving quotes, comparing
them as cards or side by side, quote detail, choosing a contractor, In progress, Completed, a
verified review, contractor search and invites, storefront profiles, a before/after portfolio
slider, messages, and approving, declining or redirecting call requests.

**Contractor** (Profile → *Switch to contractor mode*): opportunities feed, project view with
the address hidden until chosen, structured quote form, revising a quote, "My work"
(quotes, won, active, done), messaging and call requests.

**Demo mode:** after you publish a project, matching contractors send quotes over the next
~15 seconds (`src/data/demo.ts`). Profile → *Reset demo data* restores the sample data.

## Structure

```
src/
  app/            screens (Expo Router: every file is a route)
    (tabs)/       Home, Projects, Post, Messages, Profile, with the glass tab bar
    new/          post-a-project flow (category → questions → details → photos → review)
    project/      homeowner project, quote comparison
    quote/        quote detail, choose / decline
    contractor/   storefront profile
    portfolio/    before/after project
    opportunity/  contractor view of a project
    submit-quote/ contractor quote form
    chat/         conversation with call-request handling
    call/         call-request approval sheet
    review/       verified review
  components/     Glass (Liquid Glass + fallbacks), GlassTabBar, ui, marketplace cards
  data/
    rules.ts      marketplace rules (pure, tested); the server must enforce the same
    questionFlows.ts  per-category questionnaires, kept as data
    reducer.ts        app state changes
    store.tsx         demo store (device) or live store (Supabase), same interface for screens
    backend/          Supabase client, loading what RLS allows, sending actions
    seed.ts, demo.ts, media.ts  demo data and photos
  theme.ts
```

## Before launch

- **Photos:** `src/data/media.ts` points at Unsplash placeholders. Replace them with your own
  images or storage URLs.
- **Push:** quotes, messages, call requests and "you were chosen" notify the right person.
  Demo mode shows them on this phone. Live mode stores an Expo push token and sends from the
  `send-push` Edge Function; see [`../supabase/README.md`](../supabase/README.md). A remote
  token needs an EAS project id, which a development or store build provides.
- **Also needed:** stripping location data from photos before upload
  (`expo-image-manipulator`), masked phone numbers for approved calls, uploads for
  portfolio photos and verification documents, and an admin screen for verifying contractors.

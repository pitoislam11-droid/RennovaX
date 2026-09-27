# Rennova mobile app

React Native + Expo (SDK 57) app for homeowners and contractors. It uses Expo Router for
navigation and Apple Liquid Glass for the floating tab bar and the buttons over photos.

It runs end to end on demo data, so every flow can be tried before the backend exists.

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
npm test            # marketplace rules: sealed quotes, contact control, stages, reviews
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
    reducer.ts, store.tsx  app state, saved on the device
    seed.ts, demo.ts, media.ts  demo data and photos
  theme.ts
```

## Before launch

- **Photos:** `src/data/media.ts` points at Unsplash placeholders. Replace them with your own
  images or storage URLs.
- **Backend:** state lives on the device (AsyncStorage). Swap `store.tsx` for API calls, and
  enforce `rules.ts` on the server.
- **Also needed:** auth, push notifications, real media upload with location data stripped,
  masked phone numbers for approved calls, and contractor verification checks.

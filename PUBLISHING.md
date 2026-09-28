# Publishing Rennova to the App Store and Google Play

Tick these off in order. Commands run from `mobile/`.

## 1. Before the first build

- [ ] **Bundle ID.** Change `ios.bundleIdentifier` and `android.package` in `mobile/app.json` to
      an id you own, e.g. `uk.co.yourdomain.rennova`. It can't be changed after the first
      release.
- [ ] **Icon and splash.** Replace the Expo placeholders in `mobile/assets/`: a 1024×1024 icon,
      the Android adaptive-icon layers and the splash image.
- [ ] **Photos.** Replace the Unsplash demo photos in `mobile/src/data/media.ts` with images you
      own.
- [ ] **Legal text.** Fill in every `[BRACKETED]` value in `mobile/src/content/legal.ts`, have a
      solicitor review it, and publish the same text on your website. The stores need both URLs.
- [ ] **Backend.** Set up Supabase (`supabase/README.md`) and apply all three migrations.
- [ ] **Reviewer account.** In Supabase → Authentication → Users → **Add user**, create
      `appreview@yourdomain.co.uk` with a password. Sign in once, complete the profile and post a
      sample project. Apple and Google can't receive email codes, so give them this login
      ("Use a password instead" on the sign-in screen).
- [ ] **Moderation.** Someone must check reports every day. The app promises action within 24
      hours, and Apple requires that for apps with user content. Open reports:
      `select * from reports where status = 'open' order by created_at;`

## 2. Accounts

- [ ] Apple Developer Program: about £79 a year. Enrol as an organisation if you trade as a
      company; that needs a free D-U-N-S number.
- [ ] Google Play Console: $25 once. New personal accounts must run a closed test with 12 or
      more testers for 14 days before they can publish publicly.
- [ ] Expo account: free.
- [ ] ICO data protection fee (UK), because you store customers' personal data.

## 3. Build and test

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # links the project to your Expo account
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-REF.supabase.co --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR-ANON-KEY --visibility plaintext
npx eas-cli@latest build --platform all --profile production
```

`.env.local` stays on your computer, so cloud builds read the Supabase settings from the EAS
environment instead. Repeat `env:create` with `--environment preview` for test builds.

- [ ] Upload to TestFlight: `npx eas-cli@latest submit --platform ios`
- [ ] Upload to Google's closed test: `npx eas-cli@latest submit --platform android`
- [ ] Test with real homeowners and contractors: sign-up, posting with photos, quoting, choosing,
      messaging, call requests, reviews, report, block and delete account.

## 4. Store listings

- [ ] Name, subtitle, description and keywords (e.g. decorator, builder, quotes, renovation).
- [ ] Screenshots: iPhone 6.9" (1320×2868) and Android phone. The home, quote comparison and
      contractor profile screens show the product best.
- [ ] Category: House & Home (Google) or Lifestyle (Apple).
- [ ] Privacy answers. Collected: name, email, phone, precise address, photos, user content;
      used for app functionality; linked to the user; not used for tracking.
- [ ] Age rating questionnaire. The app has user-generated content with reporting and blocking.
- [ ] Availability: United Kingdom only at first.
- [ ] Review notes: the reviewer login, and a note that quotes come from contractor accounts.

## 5. After launch

- JavaScript-only fixes can go out without a store review:
  `npx eas-cli@latest update --channel production`.
- New native modules or permissions need a new build and review.
- Before adding a migration, run `supabase/tests/run.sh`, then `npx supabase db push`.

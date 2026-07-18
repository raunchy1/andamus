# Loop Backlog — prioritized work queue

> The loop picks the topmost UNBLOCKED, uncompleted items each iteration (1–3 items,
> prefer small + safe + verifiable). Mark items `[x]` when shipped, add a journal entry.
> Add newly discovered issues in the right priority band. Never delete items — strike through obsolete ones.

## P0 — infrastructure & correctness

- [ ] **Pin Vercel functions to EU**: add `"regions": ["dub1"]` to vercel.json (DB is eu-west-1). Verify deploy region in the deployment metadata afterwards. (~100ms saved per server-side query)
- [ ] **Supabase keep-alive**: the free-tier DB auto-pauses after ~7d inactivity. Add a lightweight daily cron (or extend an existing cron route) that performs a trivial SELECT so the project never idles. NOTE: if the DB is currently paused, code cannot fix it — flag "OWNER ACTION: restore project in Supabase dashboard" in the report and skip DB-dependent verification.
- [ ] **Cron consolidation**: 4 crons configured; verify Vercel plan limits are respected and each cron route logs failures visibly (Sentry capture on error path).

## P1 — launch blockers

- [ ] **Professional copywriting overhaul (owner-requested, HIGH)**: rewrite ALL user-facing copy so it reads like a professional copywriter wrote it, not AI slop. Work through messages/{it,en,de}.json namespace by namespace AND hardcoded strings in components. Rules: (1) no redundancy — never state the same fact twice on one screen (e.g. level shown in ring AND pill); (2) no emoji in UI text or labels (lucide icons only); (3) no fake/simulated stats presented as real — hide rating until reviews exist, don't show "100% affidabilità" for brand-new users, drop gimmicky labels like "Alle prime armi"; (4) concise, concrete, benefit-first Italian as the reference language, then align en/de; (5) sentence case for titles ("Notifiche email", not "Preferenze Notifiche Email"); (6) no truncated strings — copy must fit its container at mobile widths; (7) every t() key must exist in all 3 locales — add a CI-runnable script that diffs used keys vs defined keys and fails on missing ones (the profile page shipped with raw "referrals.inviteFriends" visible). Iteration 0.2 fixed the profile screens; continue with: home, cerca, offri, corsa, chat, onboarding, premium, gruppi, eventi, verifica, emails.
- [ ] **i18n key coverage check in CI**: script that extracts all useTranslations namespaces + t() keys and verifies presence in it/en/de; wire into build (fail on missing). Prevents raw-key regressions permanently.
- [ ] **Stripe refunds flow**: cancellation exists but no refund handling. Implement refund on driver-cancellation of paid bookings (Connect: cancel/refund PaymentIntent; webhook path; UI status).
- [ ] **E2E tests for the 3 critical flows**: (a) search → ride detail → booking request, (b) offer ride happy path, (c) login redirect + locale preservation. Playwright, CI-runnable, no live Stripe.
- [ ] **Chat message pagination**: all messages load at once; add cursor-based pagination (50/page) + "load earlier" UI.
- [ ] **German i18n completion**: messages/de.json ~90% — diff against it.json, fill gaps (machine-translate + mark for review).

## P2 — performance

- [ ] **Split monolithic pages**: profilo/page.tsx (~1.7k lines) into tab components with dynamic imports; then cerca/page.tsx; then components/chat/ChatWindow.tsx.
- [ ] **i18n payload trim**: NextIntlClientProvider ships whole locale (~55-60KB); pick namespaces per layout/page.
- [ ] **Bundle analyzer pass**: add @next/bundle-analyzer, identify top 5 offenders, code-split (framer-motion usage audit; dynamic-import modals).
- [ ] **LCP images**: mark hero/LCP images `priority`, add blur placeholders.

## P3 — code health

- [ ] Remove `@ts-nocheck` from server utility files (May 25 build workaround) — type them properly.
- [ ] Consolidate scattered types into `types/` (start with Ride/Booking/Profile shared shapes).
- [ ] Drop legacy duplicate Italian-alias columns on rides (migration 017 leftovers) — forward migration, after verifying zero code references.
- [ ] Replace remaining `any` in app/[locale] pages (grep `: any` / `as any`).
- [ ] Unit tests for lib/: rate-limit, date-utils, reputation, gamification scoring.

## Discovered by the loop (append below)

<!-- iteration N: - [ ] item -->

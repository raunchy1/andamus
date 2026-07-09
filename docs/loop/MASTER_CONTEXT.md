# Andamus — Loop Engineering Master Context

> Read this first in every loop iteration. It is the condensed, authoritative context.
> Full detail lives in `docs/audit/*` and the repo itself. Last updated: 2026-07-02 (commit 9b413c3).

## What this app is

Andamus is a carpooling marketplace for Sardinia, Italy. Drivers publish rides between
Sardinian municipalities; passengers search, book seats, pay (optionally, via Stripe),
chat with drivers, and review each other. Mobile-first dark-themed PWA. Locales: it
(default), en, de — `localePrefix: "always"`, so ALL internal URLs must carry `/${locale}/`.

- Production: https://andamus.vercel.app (Vercel project `andamus`, team `cristiermurache-1102s-projects`)
- Repo: github.com/raunchy1/andamus — production deploys automatically on push/merge to `main`
- Database: Supabase project `ntcofaxoxjvzovkqgypy`, region eu-west-1, PostgreSQL 17
- Owner/admin: cristiermurache@gmail.com

## Stack

Next.js 16.2.6 (App Router, Turbopack) · TypeScript strict · Tailwind 4 + shadcn/Radix ·
Supabase (Auth PKCE + Postgres + Realtime + Storage) · Stripe (subscriptions + Connect Express) ·
next-intl 4.8 · Serwist 9 PWA · Resend email · Web Push (VAPID) · Sentry (EU) · PostHog (EU, consent-gated) · GA4.

## Non-negotiable invariants (learned the hard way — do not regress)

1. **Locale prefixes everywhere**: every `router.push`/`<Link href>` to an internal page needs `/${locale}/`.
2. **Service worker must NEVER cache page HTML** (`app/sw.ts` — documented stale-HTML incident).
3. **Middleware auth uses `getClaims()` (local JWT), not `getUser()`** — a network call per request was the #1 TTFB killer. Onboarding state is cached in the `anb_onb` cookie.
4. **Auth callback path bypasses middleware cookie mutation** — protects the PKCE code-verifier cookie.
5. **Design system v2 only** (globals.css tokens): `bg/surface/surface-2/elevated`, `fg/muted/dim/faint`, `line`, accent `#4FB3C9`, states `ok/pending/bad`. Never reintroduce `#e63946`, navy `#1e2a4a/#0f1729/#1a1a2e`, or Material tokens (`on-surface`, `surface-container-*`).
6. **Double-submit guards**: async button handlers use a synchronous `useRef` guard, not just `disabled={state}`.
7. **STRIPE_WEBHOOK_SECRET and CRON_SECRET are required** — never make them optional.
8. **Email templates HTML-escape all user data** (`lib/emails/escape.ts`).
9. **No down-migrations exist** — write forward-fix migrations only; make them idempotent.
10. Build gate: `npx tsc --noEmit` clean + `next build` passes (use dummy env vars locally: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).

## Architecture quick map

- `middleware.ts` — locale routing (it/en/de), claims-based session refresh, admin/push API guards, onboarding gate (cookie-cached), waitlist gating, security headers.
- `app/[locale]/` — 36 pages: home, cerca (search), offri (publish), corsa/[id] (ride detail), chat/[bookingId], profilo (+veicoli, stripe-status), richieste, gruppi/gruppo, eventi, hubs, premium, verifica, statistiche, invita, join, onboarding, admin (+feedback, diagnostics), u/[id] (public profile), lansare, cancella/[bookingId], legal, offline.
- `app/api/` — 51 routes: stripe (checkout/portal/webhook/connect/*), cron (4, Bearer CRON_SECRET), emails (Resend), push, vehicles, admin, referrals, alerts, maps proxy, waiting-list.
- `lib/` — supabase clients, auth (locale-aware OAuth), rate-limit + redis, emails, gamification, reputation, driver-ranking, posthog, logger.
- DB: 44 migrations in `supabase/migrations/`. Core tables: profiles, rides, ride_stops, ride_templates, bookings, messages, reviews, notifications, ride_alerts, push_subscriptions, user_actions, badges, referrals, groups(+memberships), events, vehicles, locations, user_roles, verifications, safety_reports, feedback_reports, waiting_list, stripe_events, email_preferences. RLS on everything (hardened in migrations 025/032/043).

## History in one paragraph

Built Mar 28–29 2026 as a 2-day sprint, then: premium design v1 (red #e63946), launch-prep
sprints, full i18n, 40+ numbered bug fixes, May hardening waves (security, memory leaks,
locale routing, stress-test race conditions), a 10-part beta quality program (trust/safety,
reputation, growth, viral sharing, public profiles), production recovery + marketplace seeder,
June security remediation (OAuth/RLS/rate-limits/XSS), visual redesign v2 (dark mono + teal,
phases 1→2H, 100% coverage as of Jul 2), and a July performance overhaul (middleware getClaims,
parallel home fetch, preconnect, lazy Sentry Replay). 239 commits total.

## Known context for prioritization

- Supabase free tier auto-pauses the DB after ~7 days inactivity → the app hangs entirely. Restore requires owner action in the dashboard.
- Vercel functions run in iad1 (US); DB is eu-west-1 → pin `"regions": ["dub1"]` in vercel.json (top backlog item).
- Vercel Hobby tier: watch cron limits (4 configured).
- Testing is thin: 3 Playwright e2e tests, no unit tests.

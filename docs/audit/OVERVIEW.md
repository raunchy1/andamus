# Andamùs — Production Audit Overview

> **Audit Date:** 2026-05-20  
> **Auditor:** Kimi Code CLI (Multi-Agent Audit Swarm)  
> **Commit Range:** `main` HEAD (post-waitlist-flag & ride-expiration fixes)  
> **Production URL:** https://andamus.vercel.app  
> **Repository:** github.com:raunchy1/andamus  

---

## 1. Project Snapshot

| Dimension | Detail |
|-----------|--------|
| **Framework** | Next.js 16.2.4 with Turbopack |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.x |
| **UI Library** | shadcn/ui + Radix primitives |
| **Database** | Supabase (PostgreSQL 15) |
| **Auth** | Supabase Auth (OAuth + Email/OTP) |
| **Payments** | Stripe Connect (Express accounts) |
| **i18n** | next-intl (it default, en, de) |
| **PWA** | Serwist v9 (service worker + manifest) |
| **Monitoring** | Sentry |
| **Deployment** | Vercel Hobby tier |
| **Cron Limits** | 1 schedule per day (Hobby tier) |

---

## 2. Audit Scope

This audit covers the entire production codebase across five domains:

1. **Architecture & Routing** — Build system, middleware, API routes, component structure
2. **Database & Supabase** — Schema, RLS policies, migrations, indexes, data integrity
3. **Auth & Security** — Authentication flow, authorization, secrets management, XSS, CSRF
4. **Features & Flows** — Feature completeness, user journeys, business logic correctness
5. **UI/UX & Performance** — Component quality, accessibility, bundle size, data fetching patterns

---

## 3. Executive Summary

### Overall Health: 🟡 **FAIR** — Launch-viable with significant hardening required

The application is **functionally complete** for core ride-sharing flows (search, book, pay, chat, review). Recent fixes (waitlist flag, ride expiration, review UX) addressed immediate pain points. However, **critical security and data-access bugs remain** that could block or compromise production operations.

### Severity Distribution

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 **P0 — Critical** | 4 | Data loss, security breach, or core feature broken |
| 🟡 **P1 — High** | 8 | Significant user impact or architectural risk |
| 🟢 **P2 — Medium** | 6 | UX friction, tech debt, or missing optimizations |
| ⚪ **P3 — Low** | 4 | Polish, documentation, or minor improvements |

---

## 4. Critical Findings (P0)

| # | Finding | Domain | Impact |
|---|---------|--------|--------|
| P0-1 | **Open redirect in OAuth callback** — `X-Forwarded-Host` header allows arbitrary URL injection in `app/[locale]/auth/callback/route.ts` | Security | Account takeover, phishing |
| P0-2 | **Missing OAuth `state` parameter** — No CSRF protection on OAuth flows | Security | CSRF attacks, session fixation |
| P0-3 | **Drivers cannot see chat messages** — `messages` RLS policy only checks `passenger_id`, not `driver_id` | Database | Driver chat completely broken |
| P0-4 | **Drivers cannot update booking status** — No `UPDATE` policy on `bookings` for drivers | Database | Driver cannot accept/reject bookings |

---

## 5. High-Priority Findings (P1)

| # | Finding | Domain |
|---|---------|--------|
| P1-1 | `lib/rate-limit.ts` exists but is **imported nowhere** | Security |
| P1-2 | Email templates interpolate user data into HTML **without escaping** | Security |
| P1-3 | Wide-open `INSERT` policies on `notifications`, `badges`, `referrals`, `user_actions`, `push_subscriptions` | Database |
| P1-4 | **Missing `waiting_list` table** — referenced by coming-soon realtime but no migration exists | Database |
| P1-5 | Duplicate group systems: `carpool_groups` vs `public.groups` | Database |
| P1-6 | Monolithic client components: `profilo/page.tsx` (1,705 lines), `cerca/page.tsx` (1,192 lines), `ChatWindow.tsx` (1,190 lines) | Performance |
| P1-7 | No code-splitting for `recharts` (admin) or `@react-google-maps/api` (RouteMap) | Performance |
| P1-8 | Stripe API version `"    ` is future-dated | Integrations |

---

## 6. Medium-Priority Findings (P2)

| # | Finding | Domain |
|---|---------|--------|
| P2-1 | No focus trapping in any modals; missing ARIA attributes | UX/Accessibility |
| P2-2 | `useDeviceType` returns `"mobile"` on server, may cause hydration mismatch | UX/Performance |
| P2-3 | All key public pages are `"use client"` with `useEffect` fetching — no SSR for SEO | Architecture |
| P2-4 | Aggressive 24h PWA caching of Supabase GETs may show stale ride data | Performance |
| P2-5 | Duplicate Italian/English columns in `rides` table | Database |
| P2-6 | Missing German i18n strings (~90% coverage) | UX |

---

## 7. Document Index

| Document | Contents |
|----------|----------|
| [OVERVIEW.md](./OVERVIEW.md) | This file — executive summary and severity matrix |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, directory structure, middleware, build config |
| [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md) | Schema, RLS policies, migrations, indexes |
| [AUTH_AND_SECURITY.md](./AUTH_AND_SECURITY.md) | Auth flows, vulnerabilities, secrets, headers |
| [FEATURES_AND_FLOWS.md](./FEATURES_AND_FLOWS.md) | Feature inventory, user journeys, Stripe, PWA |
| [UI_UX_AUDIT.md](./UI_UX_AUDIT.md) | Design system, accessibility, modals, responsive patterns |
| [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) | Bundle size, code splitting, caching, Core Web Vitals |
| [BUGS_AND_TECH_DEBT.md](./BUGS_AND_TECH_DEBT.md) | Bug catalog, tech debt, deprecated patterns |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | Go/no-go criteria, checklist, rollback plan |
| [DEBUGGING_PLAYBOOK.md](./DEBUGGING_PLAYBOOK.md) | Common issues, debugging commands, troubleshooting |

---

## 8. Quick Action Items

### Do This Week (P0 Fixes)

1. Fix OAuth callback open redirect
2. Add OAuth `state` parameter
3. Fix `messages` RLS for drivers
4. Fix `bookings` RLS for drivers

### Do Next Week (P1 Hardening)

5. Wire up rate limiting
6. Fix email template XSS
7. Tighten INSERT policies
8. Create `waiting_list` table
9. Add missing indexes
10. Dynamic import heavy dependencies

### Do This Month (P2 Polish)

11. Add focus trapping to modals
12. Fix `useDeviceType` hydration
13. Reduce PWA cache TTL
14. Complete German translations
15. Begin Server Component migration

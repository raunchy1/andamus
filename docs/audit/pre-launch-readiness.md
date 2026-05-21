# Andamus — Pre-Launch Readiness Audit

**Date:** 2026-05-20  
**Version:** Closed Beta → Public Launch  
**Auditor:** Growth, Retention & Premium Experience Sprint  
**Overall Score:** 8.4 / 10

---

## Executive Summary

Andamus has matured significantly since the closed-beta readiness audit. The Trust & Safety sprint hardened the platform against abuse, the Reputation system adds social proof, and this Growth sprint introduced retention mechanics, premium enforcement, viral sharing, and beta feedback loops. The app is **ready for a phased public launch** with the following caveats:

| Area | Score | Status |
|------|-------|--------|
| Authentication & Onboarding | 9.0 | ✅ Ready |
| Core Ride Flow | 9.2 | ✅ Ready |
| Trust & Safety | 8.8 | ✅ Ready |
| Payments & Premium | 7.5 | ⚠️ Soft-launch ready |
| Notifications & Retention | 8.0 | ✅ Ready |
| Mobile UX / PWA | 8.5 | ✅ Ready |
| Internationalization | 7.0 | ⚠️ Needs attention |
| Performance & Reliability | 8.5 | ✅ Ready |
| Analytics & Observability | 8.0 | ✅ Ready |
| Viral & Growth Mechanics | 8.2 | ✅ Ready |

**Overall: 8.4 / 10 — LAUNCH RECOMMENDED (phased)**

---

## 1. Authentication & Onboarding

### What's Working
- ✅ Google OAuth only — reduces friction, no password management
- ✅ Referral system with 25-point bonus and leaderboard
- ✅ Onboarding modal (6 slides) with skip/complete persistence
- ✅ Launch checklist (`/lansare`) for progressive onboarding in waitlist mode
- ✅ Post-login redirect logic: new users → checklist, existing → profile

### What's New (This Sprint)
- 🎉 Celebration modal on first ride / first booking / level-up / badge earned
- 🎉 Confetti animation with haptic feedback
- 🎉 One-time persistence via localStorage

### Pre-Launch Checklist
- [x] OAuth callback validates state (CSRF protection)
- [x] Referral bonus applied server-side via RPC
- [x] Onboarding shown only once per device
- [x] Empty states guide users to action

### Known Gaps
- [ ] **Email/password fallback**: Some users may not have Google or prefer email. Consider adding email OTP login post-launch.
- [ ] **Onboarding localization**: The `BetaFeedback` component uses hardcoded Italian strings. Must be internationalized before EN/DE launch.

---

## 2. Core Ride Flow

### What's Working
- ✅ Ride creation with server-side validation, rate limiting, duplicate detection
- ✅ Atomic booking with seat validation
- ✅ Booking lifecycle: pending → confirmed / rejected / cancelled
- ✅ Chat auto-created on booking with initial message
- ✅ Ride status computation: `expired` → `completed` mapping
- ✅ Cron jobs: daily ride reminders (17:00) + expiration (midnight)

### What's New (This Sprint)
- 🎉 **Server-side ride limit enforcement**: Free users capped at 3 rides/month
- 🎉 **Streak tracking**: Weekly activity recorded in `user_activity_weeks`
- 🎉 **Activity recording**: Ride publish, booking, review all tracked
- 🎉 **Trust badges on search results**: Score shown on every ride card

### Pre-Launch Checklist
- [x] Rate limit: 10 rides/24h per user
- [x] Duplicate detection: 5-minute window
- [x] Anti-spam heuristics on price/seat combos
- [x] Seat availability checked atomically at booking time
- [x] Driver cannot book their own ride
- [x] Past rides cannot be booked

### Known Gaps
- [ ] **Recurring rides**: `generate_rides_from_templates` runs but verify it handles daylight saving correctly
- [ ] **Ride editing**: No edit flow after publishing. Users must cancel and re-create.

---

## 3. Trust & Safety

### What's Working
- ✅ Server-side review submission with participation verification
- ✅ Rate limits on reviews (5/24h), messages (30/5min), reports (5/24h)
- ✅ Self-review prevention
- ✅ Safety reports with categorization
- ✅ User reputation system (0-100 trust score)
- ✅ Admin diagnostics page with safety feed

### What's New (This Sprint)
- 🎉 Trust score visible on search cards and ride detail
- 🎉 Driver verification badges prominently displayed

### Pre-Launch Checklist
- [x] Reviews require confirmed booking participation
- [x] Safety report cooldowns prevent spam
- [x] Trust score computed from account age + reviews + rides + verifications
- [x] Admin can view suspicious activity

### Known Gaps
- [ ] **Photo ID verification**: Currently only Google-authenticated. True ID verification (document upload) is not implemented.
- [ ] **Content moderation**: No AI-based content scanning on chat messages or ride notes.

---

## 4. Payments & Premium

### What's Working
- ✅ Stripe Checkout for Premium (€4.99/mo) and Driver Pro (€9.99/mo)
- ✅ Stripe Connect Express for driver payouts
- ✅ Webhook handles subscription lifecycle
- ✅ Customer portal for subscription management
- ✅ 10% platform fee on driver payouts

### What's New (This Sprint)
- 🎉 **Server-side ride limit enforcement** for free tier
- 🎉 Premium badges visible in search

### Pre-Launch Checklist
- [x] Subscription status synced from Stripe webhooks
- [x] Downgrade to free on cancellation
- [x] `past_due` handling
- [x] Connect onboarding status tracked

### Known Gaps
- [ ] **`STRIPE_PREMIUM_PRICE_ID` / `STRIPE_DRIVER_PRICE_ID`**: Environment variables not yet set in production. Must be configured before premium launch.
- [ ] **Stripe Connect account requirements**: Verify Sardinian drivers can onboard (some countries blocked).
- [ ] **Refund policy**: No refund logic implemented. Consider adding a 14-day cooling-off period for EU compliance.
- [ ] **Receipts / Invoices**: Not emailed to users. Stripe handles this but Andamus branding is missing.

**Recommendation:** Launch as **free-only initially**. Enable premium gating only after price IDs are configured and tested end-to-end in production.

---

## 5. Notifications & Retention

### What's Working
- ✅ In-app notifications (6 types) with real-time updates
- ✅ Email notifications (6 types) via Resend with unsubscribe tokens
- ✅ Push notifications for ride alerts via Web Push
- ✅ Notification bell with unread badge
- ✅ Smart throttling: email skipped if user was online < 5 min ago

### What's New (This Sprint)
- 🎉 **Weekly digest email** (Mondays 9:00 AM) with upcoming rides + streak status
- 🎉 **Streak tracking** in `user_activity_weeks` table
- 🎉 **Re-engagement API** for inactive users

### Pre-Launch Checklist
- [x] Cron jobs protected by `CRON_SECRET`
- [x] Push subscription cleanup on 410/404
- [x] Email preferences stored per-user
- [x] Real-time notification updates via Supabase Realtime

### Known Gaps
- [ ] **Push for messages/bookings**: Only ride alerts send push. High-value events (booking accepted, new message) should also trigger push.
- [ ] **SMS notifications**: No SMS fallback for critical reminders.
- [ ] **Weekly digest translations**: Template is Italian-only. EN/DE users will receive Italian emails.

---

## 6. Mobile UX / PWA

### What's Working
- ✅ Responsive design (mobile-first)
- ✅ Bottom navigation on mobile
- ✅ Haptic feedback on booking actions
- ✅ Pull-to-refresh on profile page
- ✅ Service Worker with Serwist (caching, offline fallback)
- ✅ Safe-area insets for notched devices

### What's New (This Sprint)
- 🎉 **PWA install prompt**: Floating banner with native install support
- 🎉 **Improved offline page**: Shows saved ride history hint + PWA install nudge
- 🎉 **Beta feedback floating button**: Always-available feedback widget

### Pre-Launch Checklist
- [x] App icons in all required sizes (72, 96, 128, 144, 152, 192, 384, 512)
- [x] Manifest configured
- [x] Apple Web App meta tags
- [x] Theme color set to brand red
- [x] Offline fallback page exists

### Known Gaps
- [ ] **iOS standalone mode**: Test that `display-mode: standalone` works correctly on iOS Safari (known issues with bottom nav height)
- [ ] **Android splash screen**: Consider adding a branded splash screen for standalone launch
- [ ] **BetaFeedback i18n**: Hardcoded Italian strings

---

## 7. Internationalization

### What's Working
- ✅ Three locales: `it` (default), `en`, `de`
- ✅ `next-intl` with prefix: `always`
- ✅ All core UI strings externalized

### Known Gaps
- [ ] **`BetaFeedback` component**: Uses hardcoded Italian text. Must add keys to `messages/*.json`.
- [ ] **`FirstRideCelebration` component**: Hardcoded Italian text in defaults.
- [ ] **`PWAInstallPrompt` component**: Hardcoded Italian text.
- [ ] **`ShareRide` component**: Uses `t("ride.share")` — verify EN/DE have this key.
- [ ] **Email templates**: All email templates are Italian-only.
- [ ] **Weekly digest cron**: Italian-only content.

**Impact:** MEDIUM. Italian is the primary market, but German/English users will have a degraded experience.

**Recommendation:** Add i18n to new components before marketing to EN/DE audiences. Italian-only launch is acceptable.

---

## 8. Performance & Reliability

### What's Working
- ✅ Turbopack dev mode
- ✅ Sentry error tracking
- ✅ PostHog analytics
- ✅ Rate limiting on all critical endpoints
- ✅ Service Worker caching strategy (no stale HTML)
- ✅ Skeleton loading on search results

### What's New (This Sprint)
- 🎉 **Trust badge computed client-side**: Zero additional DB queries
- 🎉 **Efficient activity tracking**: Upsert on conflict, indexed by `user_id,week_key`

### Metrics (Estimated)
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint | < 1.5s | ~1.2s | ✅ |
| Time to Interactive | < 3.5s | ~2.8s | ✅ |
| Lighthouse PWA | > 90 | ~85 | ⚠️ |
| Lighthouse Accessibility | > 90 | ~88 | ⚠️ |

### Known Gaps
- [ ] **Image optimization**: Driver avatars use `fill` layout but may lack `priority` for above-fold content.
- [ ] **Bundle size**: Framer Motion + multiple premium UI components may bloat the bundle. Consider lazy-loading below-fold components.

---

## 9. Analytics & Observability

### What's Working
- ✅ PostHog event tracking (page views, searches, bookings)
- ✅ Sentry error monitoring
- ✅ Google Analytics (if `NEXT_PUBLIC_GA_ID` set)
- ✅ Custom analytics events in `lib/analytics.ts`

### What's New (This Sprint)
- 🎉 **Beta feedback collected** in `beta_feedback` table with ratings
- 🎉 **Streak/activity data** available for cohort analysis

### Pre-Launch Checklist
- [x] Analytics fire on key conversion events
- [x] Error tracking covers API routes and client components

### Known Gaps
- [ ] **`NEXT_PUBLIC_POSTHOG_KEY`**: Not set in production yet. Must configure before launch.
- [ ] **Funnel tracking**: No explicit funnel for onboarding → first booking.
- [ ] **Retention metrics**: Need dashboard query for D1/D7/D30 retention.

---

## 10. Viral & Growth Mechanics

### What's Working
- ✅ Referral system with code + points
- ✅ Invite page with social share (WhatsApp, Telegram, Facebook)
- ✅ Leaderboard for top referrers

### What's New (This Sprint)
- 🎉 **Ride-specific sharing**: Share individual rides with pre-filled message including driver name, route, price
- 🎉 **Share modal**: Copy link, WhatsApp, Telegram with rich context
- 🎉 **Beta feedback loop**: Always-visible floating button for continuous feedback

### Pre-Launch Checklist
- [x] Referral link includes `?ref=CODE`
- [x] Referral persisted through OAuth flow
- [x] Social share buttons on invite page

### Known Gaps
- [ ] **Deep linking**: Shared ride links open the web app but not the native app (if installed). Consider Universal Links / App Links post-launch.
- [ ] **Referral incentives**: Only points awarded. Consider ride credits or premium trials for stronger viral loops.

---

## 11. Database & Migrations

### Pending Migrations (Must Apply Before Launch)

| Migration | File | Status |
|-----------|------|--------|
| 028 | `028_reputation_system.sql` | ⏳ Pending (from previous sprint) |
| 029 | `029_growth_retention.sql` | ⏳ Pending (this sprint) |

**Application method:** Supabase Dashboard → SQL Editor (IPv6-only DB blocks CLI)

### New Tables (029)
- `beta_feedback` — user feedback with type, rating, message
- `user_activity_weeks` — streak tracking with upsert semantics

### Updated Schema
- `profiles.last_active_at` — added if missing, indexed

---

## 12. Environment Variables

### Required for Launch

| Variable | Status | Action |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | — |
| `STRIPE_SECRET_KEY` | ✅ Set | — |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Set | — |
| `CRON_SECRET` | ✅ Set | — |
| `RESEND_API_KEY` | ✅ Set | — |
| `VAPID_PRIVATE_KEY` | ✅ Set | — |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Set | — |

### Required for Full Experience

| Variable | Status | Action |
|----------|--------|--------|
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ Missing | Add in PostHog Project Settings |
| `SENTRY_AUTH_TOKEN` | ❌ Missing | Optional — only needed for source maps in CI |
| `STRIPE_PREMIUM_PRICE_ID` | ❌ Missing | Add when enabling premium payments |
| `STRIPE_DRIVER_PRICE_ID` | ❌ Missing | Add when enabling premium payments |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ Set | — |

---

## 13. Launch Recommendations

### Phase 1: Soft Launch (Week 1-2)
- [ ] Apply pending migrations (028 + 029)
- [ ] Deploy current `main` to production
- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] Monitor Sentry for new errors
- [ ] Collect beta feedback actively
- [ ] Track onboarding completion rate

### Phase 2: Public Launch (Week 3-4)
- [ ] Fix i18n gaps in new components
- [ ] Add push notifications for messages/bookings
- [ ] Enable premium payments (set Stripe price IDs)
- [ ] Launch referral campaign with social media
- [ ] Monitor retention metrics (D1/D7)

### Phase 3: Scale (Month 2+)
- [ ] A/B test onboarding flow
- [ ] Implement true ID verification
- [ ] Add SMS notifications for critical events
- [ ] Optimize bundle size / Core Web Vitals
- [ ] Expand to mainland Italy routes

---

## 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Free ride limit bypass | Low | High | Server-side enforcement now active |
| Stripe Connect onboarding fails | Medium | Medium | Test with Sardinian bank accounts first |
| Push notifications not delivered | Medium | Low | Email fallback in place |
| i18n gaps confuse EN/DE users | Medium | Low | Launch IT-first, add i18n before marketing abroad |
| Supabase IPv6 connectivity issues | Medium | High | All migrations applied via SQL Editor; monitor |
| Abuse/spam during public launch | Medium | High | Rate limits + anti-spam heuristics active |

---

## Conclusion

**Andamus is ready for a phased public launch.** The core product is solid, trust & safety is hardened, and growth mechanics are in place. The primary blockers are:

1. Apply pending database migrations
2. Set `NEXT_PUBLIC_POSTHOG_KEY` for analytics
3. Internationalize new components (BetaFeedback, PWAInstallPrompt, FirstRideCelebration)
4. Test premium flow end-to-end before enabling payments

With these items addressed, Andamus can confidently open to the public and begin scaling the Sardinian carpooling community.

---

*Audit generated automatically as part of the Growth, Retention & Premium Experience Sprint.*

# Andamus — Closed Beta Readiness Audit

**Date:** 2026-05-20
**Commit:** `main` (post-sprint)
**Auditor:** Autonomous sprint review

---

## Executive Summary

Andamus has undergone a comprehensive trust, safety, lifecycle, and UX hardening sprint. The platform is now **significantly more trustworthy and production-ready** than before the sprint. All critical abuse vectors have server-side guards, ride lifecycle is consistent, chat is resilient, and user reputation is visible.

**Recommendation:** Proceed with a **small closed beta (20-50 users)** with active monitoring. Scale gradually based on diagnostics data.

---

## Scoring Matrix

| Category | Score (1-10) | Notes |
|----------|-------------|-------|
| **Stability** | 8 | TypeScript clean, build passes, hydration fixed |
| **UX** | 7 | Premium feel, some mobile polish remaining |
| **Trust** | 8 | Reputation system, verification visibility, reviews hardened |
| **Performance** | 7 | Memoization, parallel queries, no major leaks |
| **Scalability** | 6 | Good for beta; needs pagination at 1000+ rides |
| **Safety** | 8 | Rate limiting, server actions, anti-spam heuristics |
| **Mobile Experience** | 7 | Pull-to-refresh, haptics, PWA solid |
| **Production Confidence** | 7 | Monitoring in place, some env vars missing |

**Overall Beta Readiness: 7.3/10**

---

## 1. Trust & Safety

### Implemented

| Protection | Status | Location |
|-----------|--------|----------|
| Ride creation server action | ✅ | `lib/ride-actions.ts` |
| Ride creation rate limit (10/24h) | ✅ | `lib/ride-actions.ts` |
| Duplicate ride detection (5min) | ✅ | `lib/ride-actions.ts` |
| Anti-spam heuristics | ✅ | `lib/security.ts` |
| Review server action | ✅ | `lib/review-actions.ts` |
| Review rate limit (5/24h) | ✅ | `lib/review-actions.ts` |
| Strict participation check | ✅ | `lib/review-actions.ts` |
| Self-review prevention | ✅ | `lib/review-actions.ts` |
| Safety report server action | ✅ | `lib/safety-actions.ts` |
| Safety report rate limit (5/24h) | ✅ | `lib/safety-actions.ts` |
| Chat rate limit (30/5min) | ✅ | `lib/chat-actions.ts` |
| Booking rate limit (10/24h) | ✅ | `lib/booking-actions.ts` |
| Stripe checkout rate limit (10/hr) | ✅ | `app/api/stripe/connect/checkout` |
| Notification cooldown dedup | ✅ | `lib/notification-actions.ts` |
| IP-based feedback rate limit | ✅ | `app/api/feedback/route.ts` |

### Gaps
- No profanity/content filter on chat messages
- No automated account suspension logic
- No CAPTCHA on signup

---

## 2. Reputation System

### Implemented

- **Trust score** (0-100) computed from: account age, reviews, rides, verifications
- **Trust level labels**: "Molto affidabile" → "Appena arrivato"
- **Review count** on profiles and ride cards
- **Account age** displayed on profile
- **Pre-populated reviewedRides** from DB on profile load

### Database
- `profiles.review_count` — auto-updated by trigger
- `profiles.completed_rides_count` — new column
- Migration: `028_reputation_system.sql`

---

## 3. Ride Lifecycle

### Implemented

- Centralized status computation: `lib/ride-status.ts`
- `computeRideStatus()` handles: `active`, `cancelled`, `expired` → `upcoming|active|completed|cancelled`
- `isRideBookable()` — single source of truth
- `canReviewRide()` — only completed rides
- Cron job uses `getAppNow()` for timezone consistency
- `acceptBooking` / `rejectBooking` server actions with atomic seat checks

### Fixed
- `"cancelled"` vs `"canceled"` inconsistency
- `"expired"` DB status now properly mapped to `"completed"` computed status

---

## 4. Chat Reliability

### Implemented

- Draft persistence via localStorage
- Offline banner with `WifiOff` icon
- Realtime reconnect strategy (3s retry on error)
- Cross-tab unread sync via BroadcastChannel
- Mark-as-read on tab visibility change
- Send buttons disabled when offline
- Rate limiting: 30 messages per 5 minutes

---

## 5. Search Quality

### Implemented

- Driver rating descending as tertiary sort
- Review count displayed on ride cards
- `review_count` and `rides_count` in search query
- Nearby date fallback (±1 day) when exact search empty
- Refactored `applyFilters` helper to reduce duplication

---

## 6. Mobile UX

### Implemented

- Pull-to-refresh on search page (existing)
- Pull-to-refresh on profile page (new)
- Haptic feedback on booking accept/reject
- `lib/haptic.ts` wrapper for Vibration API
- Offline banner in chat

---

## 7. Admin & Moderation

### Implemented

- Diagnostics page at `/admin/diagnostics`
- Stats grid: users, rides, bookings, pending
- Recent feedback viewer
- Recent bookings viewer
- **NEW**: Safety reports feed
- **NEW**: Suspicious activity feed (`suspicious_ride` actions)

---

## 8. Performance & Scale

### Already in Place (Runtime Sprint)

- Memoized chat sub-components
- Parallel queries on profile and ride detail
- Service worker: NetworkOnly for Supabase REST
- Image optimization (avif/webp)
- Package import optimization

### Remaining
- Pagination on search results (currently limited to 200)
- Virtualization for long chat histories
- Profile query could be further optimized

---

## 9. PWA & Install

### Status

| Item | Status |
|------|--------|
| Serwist service worker | ✅ |
| Offline fallback page | ✅ |
| Manifest | ✅ (via next.config) |
| Security headers | ✅ (HSTS, CSP, etc.) |
| Push notification support | ✅ (SW handles push) |
| Install icons | ✅ (192x192, 512x512) |

---

## 10. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| IPv6-only DB blocks CLI migrations | Medium | Manual SQL Editor application |
| `NEXT_PUBLIC_POSTHOG_KEY` missing in prod | Low | Set env var before beta |
| `SENTRY_AUTH_TOKEN` missing in CI | Low | Add to GitHub secrets |
| No automated account suspension | Medium | Monitor diagnostics, manual action |
| No CAPTCHA | Medium | OAuth-only signup reduces bot risk |
| Pagination missing | Low | 200 result limit is fine for beta |
| Unapplied migration `028` | High | Apply in Supabase SQL Editor |

---

## 11. Recommended Beta Size

**Start with 20-50 users** in Sardinia with the following criteria:
- Mix of drivers and passengers
- At least 10 users with verified phone numbers
- Active in Cagliari-Sassari-Olbia triangle
- Willing to provide feedback via in-app tool

**Growth plan:**
- Week 1-2: 20 users, monitor diagnostics daily
- Week 3-4: 50 users if no critical issues
- Month 2: 100-200 users with referral program

---

## 12. Pre-Launch Checklist

- [ ] Apply migration `028_reputation_system.sql` in Supabase
- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY` in Vercel
- [ ] Set `SENTRY_AUTH_TOKEN` in GitHub secrets
- [ ] Verify Stripe Connect onboarding flow with test user
- [ ] Test push notifications on iOS and Android
- [ ] Confirm email delivery (booking confirmations, reminders)
- [ ] Run end-to-end booking flow with real payment
- [ ] Verify admin diagnostics page loads correctly
- [ ] Test offline mode (airplane mode)
- [ ] Confirm rate limiting works (try rapid actions)

---

## Conclusion

Andamus is **ready for a cautious closed beta**. The trust & safety hardening is the most important improvement — users will feel the platform is legitimate and protected. The reputation system adds social proof. The lifecycle fixes prevent broken booking flows.

**Biggest win:** Moving ride creation, review submission, and safety reports from client-side direct inserts to validated server actions with rate limiting.

**Biggest remaining risk:** Database migrations must be applied manually due to IPv6 constraints. Ensure `028_reputation_system.sql` is applied before beta users join.

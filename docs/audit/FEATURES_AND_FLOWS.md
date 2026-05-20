# Andamùs — Features & Flows Audit

> **Domain:** Feature completeness, user journeys, business logic, integrations  
> **Status:** 🟡 Core flows complete; edge cases and integrations need hardening  

---

## 1. Feature Inventory

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| User registration (OAuth + Email) | ✅ | OAuth missing `state` param |
| User profile management | ✅ | Avatar upload via Supabase Storage |
| Offer a ride | ✅ | With Google Maps route visualization |
| Search rides | ✅ | Date/time + location filters |
| Book a ride | ✅ | Stripe checkout integration |
| Chat between driver/passenger | ⚠️ | Driver cannot read messages (RLS bug) |
| Driver accept/reject booking | ⚠️ | Driver cannot update status (RLS bug) |
| Leave a review | ✅ | Recent UX improvements |
| Notifications | ✅ | Realtime + push |
| Recurring rides | ✅ | Template-based generation |
| Admin dashboard | ✅ | Limited to hardcoded admin email |
| Gamification (badges) | ✅ | Points system |
| Referral system | ✅ | Track referrals |
| PWA (offline, installable) | ✅ | Serwist v9 |
| i18n (it/en/de) | ✅ | `prefix: always` |
| Waitlist mode | ✅ | Env flag + middleware gating |
| Email notifications | ✅ | Resend integration |
| Push notifications | ✅ | Web Push API |

### Missing Features (Not Blockers)

| Feature | Priority | Reason |
|---------|----------|--------|
| Cancellation policy | P2 | No explicit cancellation flow |
| Refund handling | P2 | Stripe refunds not implemented |
| Driver verification | P2 | No ID/document verification |
| Insurance integration | P3 | Nice-to-have |
| Carpool group management | P2 | `carpool_groups` table exists but UI unclear |

---

## 2. User Journey: Passenger

```
1. Landing page (/it)
   → 2. Search rides (/it/cerca)
      → 3. View ride detail (/it/tratta/[id])
         → 4. Book ride → Stripe checkout
            → 5. Chat with driver
               → 6. Complete ride
                  → 7. Leave review
```

### Journey Analysis

| Step | UX Quality | Issue |
|------|-----------|-------|
| 1. Landing | 🟢 Good | Clear CTA to search |
| 2. Search | 🟡 Okay | Client-side fetch = loading delay |
| 3. Ride detail | 🟡 Okay | No SSR = SEO issue |
| 4. Booking | 🟡 Okay | Stripe checkout works |
| 5. Chat | 🔴 Broken | Driver cannot see messages |
| 6. Complete | 🟢 Good | Auto-completes on date pass |
| 7. Review | 🟢 Good | Recent improvements |

---

## 3. User Journey: Driver

```
1. Landing page (/it)
   → 2. Offer ride (/it/offri)
      → 3. Set route, date, price
         → 4. Publish ride
            → 5. Receive booking requests
               → 6. Accept/reject booking
                  → 7. Chat with passenger
                     → 8. Complete ride
                        → 9. Receive payment
```

### Journey Analysis

| Step | UX Quality | Issue |
|------|-----------|-------|
| 1. Landing | 🟢 Good | Clear CTA |
| 2. Offer form | 🟡 Okay | Large form, no progress save |
| 3. Route setting | 🟢 Good | Google Maps autocomplete |
| 4. Publish | 🟢 Good | Instant listing |
| 5. Booking requests | 🟢 Good | Realtime notifications |
| 6. Accept/reject | 🔴 Broken | Cannot update status (RLS bug) |
| 7. Chat | 🔴 Broken | Cannot read messages (RLS bug) |
| 8. Complete | 🟢 Good | Auto-completes |
| 9. Payment | 🟡 Okay | Stripe Connect disbursement |

---

## 4. Stripe Integration

### Configuration

```typescript
// lib/stripe.ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "    };
```

⚠️ **API Version Warning:** `"    ` is a future-dated API version. Stripe may reject or change behavior.

**Recommendation:** Use a current stable version (e.g., `"    `) or let Stripe auto-select.

### Checkout Flow

1. Passenger clicks "Book" → calls `/api/stripe/checkout`
2. Server creates Stripe Checkout Session
3. Passenger redirected to Stripe
4. Payment completes → Stripe redirects to success URL
5. Webhook `/api/stripe/webhook` confirms payment
6. Booking status updated to `confirmed`

### Edge Cases Handled

| Case | Handled | Note |
|------|---------|------|
| Ride expires before checkout | ✅ | Recent fix rejects expired rides |
| Duplicate booking attempts | ⚠️ | No idempotency key on Stripe session |
| Payment failure | ✅ | Redirects to cancel URL |
| Webhook replay | ⚠️ | No idempotency check on webhook handler |

### Stripe Connect

- Drivers create Express accounts via `/api/stripe/connect`
- Platform fee is configured in Stripe Dashboard
- Payout schedule managed by Stripe

---

## 5. Chat System

### Architecture

- Messages stored in `messages` table
- Realtime subscription per `booking_id`
- Messages marked as read via `/api/chat/mark-read`

### Known Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Driver cannot read messages | P0 | RLS SELECT policy missing driver check |
| No message encryption | P2 | Messages stored plaintext |
| No message deletion | P2 | Users cannot delete sent messages |
| No chat history pagination | P2 | All messages loaded at once |

---

## 6. Notification System

### Types

| Type | Trigger | Channel |
|------|---------|---------|
| Booking request | Passenger books | Realtime + Push + Email |
| Booking accepted | Driver accepts | Realtime + Push + Email |
| New message | Chat message sent | Realtime + Push |
| Ride reminder | 24h before ride | Email (cron) |
| Badge earned | Gamification | Realtime + Push |

### Implementation

- **Realtime:** Supabase realtime channels
- **Push:** Web Push API with service worker
- **Email:** Resend API

### Issues

- `notifications` INSERT policy is wide open (P1) — any user can spam notifications.
- No deduplication logic for similar notifications.

---

## 7. Gamification

### System

- `user_actions` logs actions (offer ride, book ride, complete ride, review)
- Points accumulate per action type
- `badges` table stores achievements
- Badges awarded based on point thresholds

### Configuration

```typescript
// lib/gamification-config.ts
export const POINTS = {
  OFFER_RIDE: 10,
  BOOK_RIDE: 5,
  COMPLETE_RIDE: 20,
  LEAVE_REVIEW: 5,
  REFER_USER: 15,
};
```

### Issues

- `user_actions` and `badges` INSERT policies are wide open — users can self-award.
- No anti-gaming measures (e.g., rate limiting on action logging).

---

## 8. Recurring Rides

### How It Works

1. Driver creates a `ride_template` with recurrence rules (weekly, etc.)
2. `generate_rides_from_templates()` SQL function runs (likely via cron)
3. Function creates `rides` rows for future dates only

### Safety

- ✅ Function only generates rides with `date >= CURRENT_DATE`
- ✅ No expired recurring rides created
- ⚠️ No cleanup of old templates

---

## 9. PWA (Serwist v9)

### Configuration

- Service worker caches static assets and API responses
- 24-hour cache for Supabase GET requests
- Offline fallback page at `/offline`

### Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Aggressive caching | P2 | 24h cache on Supabase GETs may show stale ride data |
| No cache invalidation | P2 | Users may see old search results |
| Large precache | P2 | All static assets precached = large initial install |

**Recommendation:** Reduce Supabase GET cache to 1 hour or use `stale-while-revalidate`.

---

## 10. i18n (next-intl)

### Configuration

- Default locale: `it`
- Supported: `it`, `en`, `de`
- Routing: `prefix: always` (e.g., `/it/cerca`, `/en/search`)

### Completeness

| Locale | Coverage | Status |
|--------|----------|--------|
| `it` | 100% | ✅ Complete |
| `en` | ~95% | ⚠️ Some strings missing |
| `de` | ~90% | ⚠️ More strings missing |

### Issues

- No locale detection (always requires prefix)
- Locale switcher may not preserve query parameters
- Some hardcoded Italian strings in components

---

## 11. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Fix driver chat (RLS) | Low |
| P0 | Fix driver booking status update (RLS) | Low |
| P1 | Add idempotency key to Stripe checkout | Low |
| P1 | Reduce PWA cache TTL for ride data | Low |
| P1 | Complete German i18n coverage | Medium |
| P2 | Add chat message pagination | Medium |
| P2 | Add message encryption (or at least mark sensitive) | High |
| P2 | Implement cancellation & refund flow | High |
| P2 | Add anti-gaming to gamification | Medium |

# Andamùs — Bugs & Technical Debt Catalog

> **Domain:** Known bugs, deprecated patterns, code smells, duplicate code  
> **Status:** 🔴 Multiple critical bugs; significant tech debt in component architecture  

---

## 1. Critical Bugs (P0)

### P0-1: Open Redirect in OAuth Callback

**File:** `app/[locale]/auth/callback/route.ts`  
**Impact:** Account takeover, phishing  
**Fix:** Whitelist redirects, use fixed base URL. See [AUTH_AND_SECURITY.md](./AUTH_AND_SECURITY.md#p0-1-open-redirect-via-x-forwarded-host)

### P0-2: Missing OAuth `state` Parameter

**File:** `app/[locale]/auth/callback/route.ts`  
**Impact:** CSRF attacks  
**Fix:** Generate and verify `state` parameter. See [AUTH_AND_SECURITY.md](./AUTH_AND_SECURITY.md#p0-2-missing-oauth-state-parameter-csrf)

### P0-3: Drivers Cannot See Chat Messages

**File:** Supabase RLS policy on `messages`  
**Impact:** Driver chat completely broken  
**Fix:** Add driver_id check to SELECT policy. See [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md#p0-1-drivers-cannot-read-chat-messages)

### P0-4: Drivers Cannot Update Booking Status

**File:** Supabase RLS policy on `bookings`  
**Impact:** Driver cannot accept/reject bookings  
**Fix:** Add driver UPDATE policy. See [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md#p0-2-drivers-cannot-update-booking-status)

---

## 2. High-Priority Bugs (P1)

### P1-1: Rate Limiting Not Applied

**File:** `lib/rate-limit.ts`  
**Impact:** All endpoints vulnerable to abuse  
**Fix:** Import and apply to API routes and server actions.

### P1-2: Email Template XSS

**File:** `lib/emails/`  
**Impact:** Potential XSS in email clients  
**Fix:** Escape user data or use React Email with auto-escaping.

### P1-3: Wide-Open INSERT Policies

**Files:** Supabase policies on `notifications`, `badges`, `referrals`, `user_actions`, `push_subscriptions`  
**Impact:** Data pollution, gamification abuse, spam  
**Fix:** Add `WITH CHECK (auth.uid() = user_id)` constraints.

### P1-4: Missing `waiting_list` Table

**File:** `app/coming-soon/page.tsx`  
**Impact:** Realtime subscription fails  
**Fix:** Create migration for `waiting_list` table.

### P1-5: Duplicate Group Systems

**Tables:** `carpool_groups` vs `public.groups`  
**Impact:** Confusion, potential data inconsistency  
**Fix:** Audit usage, drop unused table.

### P1-6: Monolithic Client Components

**Files:**
- `app/[locale]/profilo/page.tsx` — 1,705 lines
- `app/[locale]/cerca/page.tsx` — 1,192 lines
- `components/ChatWindow.tsx` — 1,190 lines

**Impact:** Maintainability, testing, bundle size  
**Fix:** Extract sub-components, custom hooks, and server components.

### P1-7: No Code-Splitting for Heavy Deps

**Files:** `admin/page.tsx`, `offri/page.tsx`, `tratta/[id]/page.tsx`  
**Impact:** Large initial bundles  
**Fix:** Dynamic import `recharts` and `@react-google-maps/api`.

### P1-8: Stripe API Version Future-Dated

**File:** `lib/stripe.ts`  
**Impact:** Potential breaking changes when Stripe updates  
**Fix:** Use stable API version.

---

## 3. Medium-Priority Issues (P2)

### P2-1: No Focus Trapping in Modals

**Files:** `AuthModal.tsx`, `RatingModal.tsx`, `AlertModal.tsx`, `OnboardingModal.tsx`, `SafetyButton.tsx`  
**Impact:** Accessibility violation, keyboard trap escape  
**Fix:** Use Radix Dialog focus trap or `react-focus-lock`.

### P2-2: Missing `aria-label` on Icon Buttons

**Files:** Navbar, chat, search components  
**Impact:** Screen readers announce "button" with no context  
**Fix:** Add `aria-label` or `aria-labelledby` to all icon buttons.

### P2-3: `useDeviceType` Hydration Risk

**File:** `lib/hooks.ts`  
**Impact:** Hydration mismatch, React warnings  
**Fix:** Use CSS-only responsive patterns.

### P2-4: Aggressive PWA Caching

**File:** Serwist config  
**Impact:** Stale ride data for up to 24 hours  
**Fix:** Reduce Supabase GET cache to 5 minutes.

### P2-5: No SSR for Public Pages

**Files:** All public pages  
**Impact:** SEO, performance, UX  
**Fix:** Convert data fetching to Server Components.

### P2-6: Duplicate Columns in `rides`

**Migration:** 017  
**Impact:** Schema bloat, confusion  
**Fix:** Standardize on English names, drop Italian aliases.

---

## 4. Low-Priority Issues (P3)

### P3-1: Hardcoded Admin Email

**File:** `lib/admin-config.ts`  
**Impact:** Requires code deploy to change admins  
**Fix:** Store in database or env var.

### P3-2: Missing German i18n Strings

**File:** `messages/de.json`  
**Impact:** German users see fallback/missing text  
**Fix:** Complete German translations.

### P3-3: No Cancellation/Refund Flow

**Impact:** Users cannot cancel bookings  
**Fix:** Design and implement cancellation policy.

### P3-4: No Down-Migrations

**Files:** `supabase/migrations/`  
**Impact:** Hard to rollback schema changes  
**Fix:** Document rollback steps or add down migrations.

---

## 5. Tech Debt Inventory

### Component Architecture Debt

| Debt Item | Location | Effort to Fix |
|-----------|----------|---------------|
| Monolithic profile page | `profilo/page.tsx` | High |
| Monolithic search page | `cerca/page.tsx` | High |
| Monolithic chat window | `ChatWindow.tsx` | High |
| Mixed concerns in modals | Various | Medium |
| Inline styles alongside Tailwind | Various | Low |

### Data Fetching Debt

| Debt Item | Impact | Effort |
|-----------|--------|--------|
| All pages are `"use client"` | SEO + Performance | Very High |
| `useEffect` fetching everywhere | Maintainability | High |
| No React Query/SWR | Caching, deduping | Medium |
| No Suspense boundaries | UX | Medium |

### Testing Debt

| Debt Item | Impact | Effort |
|-----------|--------|--------|
| Only 3 E2E tests | Coverage | High |
| No unit tests for server actions | Reliability | Medium |
| No RLS policy tests | Security | Medium |
| No visual regression tests | UX consistency | Medium |

---

## 6. Deprecated Patterns

### Pattern 1: `useEffect` for Data Fetching

**Status:** Anti-pattern in Next.js App Router  
**Replacement:** Server Components + Server Actions

### Pattern 2: Client-Side Supabase Queries in Pages

**Status:** Anti-pattern for public content  
**Replacement:** Server-side queries with `createClient()` (server version)

### Pattern 3: Inline Zod-less Validation

**Status:** Fragile  
**Replacement:** Zod schemas for all API inputs

---

## 7. Code Smells

### Smell 1: Magic Strings

```tsx
// Hardcoded Italian strings
<span>Recensisci</span>
<button>Accetta</button>
```
**Fix:** Use `t("key")` from next-intl.

### Smell 2: Deep Nesting

```tsx
// 5+ levels of nesting in JSX
<div><div><div><div><div>...</div></div></div></div></div>
```
**Fix:** Extract sub-components.

### Smell 3: `any` Types

```tsx
// eslint-disable or implicit any
const data: any = await response.json();
```
**Fix:** Add proper TypeScript interfaces.

### Smell 4: Commented-Out Code

**Fix:** Remove or document why code is commented.

---

## 8. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Fix all 4 critical bugs (security + RLS) | Low |
| P1 | Wire up rate limiting | Medium |
| P1 | Fix email XSS | Low |
| P1 | Tighten INSERT policies | Low |
| P1 | Create `waiting_list` table | Low |
| P1 | Resolve duplicate group tables | Medium |
| P1 | Dynamic import heavy deps | Low |
| P2 | Extract sub-components from monolithic pages | High |
| P2 | Add focus trapping and ARIA | Low |
| P2 | Fix `useDeviceType` hydration | Low |
| P3 | Complete German translations | Medium |
| P3 | Move admin email to DB | Low |

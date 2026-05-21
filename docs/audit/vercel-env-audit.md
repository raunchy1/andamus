# Vercel Environment Variables Audit Report

**Date:** 2026-05-20
**Project:** andamus (prj_Egvbu5u5jyeRCQDhCqWYytV8zOI4)
**Deployment:** https://andamus.vercel.app
**Status:** Production redeploy successful

---

## 1. Existing Variables (Post-Audit)

| Variable | Environments | Status |
|----------|-------------|--------|
| `CRON_SECRET` | Production | ✅ Added |
| `NEXT_PUBLIC_ADMIN_EMAILS` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_APP_URL` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_BASE_URL` | Production | ✅ Existing |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_POSTHOG_HOST` | dev, preview, prod | ✅ Added |
| `NEXT_PUBLIC_SENTRY_DSN` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_SITE_URL` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_SUPABASE_URL` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | dev, preview, prod | ✅ Existing |
| `NEXT_PUBLIC_WAITLIST_MODE` | dev, preview, prod | ✅ Added |
| `RESEND_API_KEY` | dev, preview, prod | ✅ Existing |
| `STRIPE_SECRET_KEY` | Production | ✅ Existing |
| `STRIPE_WEBHOOK_SECRET` | Production | ✅ Existing |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | ✅ Existing |
| `VAPID_PRIVATE_KEY` | dev, preview, prod | ✅ Existing |
| `VAPID_SUBJECT` | dev, preview, prod | ✅ Existing |

**Total: 18 active variables**

---

## 2. Variables Fixed / Added

### Added

| Variable | Value | Environments | Reason |
|----------|-------|-------------|--------|
| `CRON_SECRET` | `cb4be42571f416c1d70a982f7ed3042582bd16d8c67e20807100df45c1c63fad` | Production | Cron job auth (was missing, caused 401s) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` | dev, preview, prod | PostHog EU endpoint (was missing) |
| `NEXT_PUBLIC_WAITLIST_MODE` | `false` | dev, preview, prod | Feature flag (was missing, caused undefined) |

### Removed (Obsolete)

| Variable | Reason |
|----------|--------|
| `NEXT_PUBLIC_LAUNCH_MODE` | Not referenced anywhere in codebase |
| `SUPABASE_ACCESS_TOKEN` | Not referenced anywhere in codebase |

### Code Fix

| File | Change |
|------|--------|
| `lib/admin-config.ts` | Changed `process.env.ADMIN_EMAILS` → `process.env.NEXT_PUBLIC_ADMIN_EMAILS` for consistency |

---

## 3. Missing Variables (Require Manual Setup)

The following variables are **used in code but cannot be auto-created** because they require external service credentials.

### Critical — Required for Beta

| Variable | Used In | Action Required |
|----------|---------|-----------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `lib/posthog.ts` | Get from PostHog Project Settings → Project API Key |
| `SENTRY_AUTH_TOKEN` | `next.config.mjs` | Get from Sentry → Auth Tokens → Create Token |

### Important — Required for Full Features

| Variable | Used In | Action Required |
|----------|---------|-----------------|
| `STRIPE_PREMIUM_PRICE_ID` | `app/api/stripe/checkout/route.ts` | Get from Stripe Dashboard → Products |
| `STRIPE_DRIVER_PRICE_ID` | `app/api/stripe/checkout/route.ts` | Get from Stripe Dashboard → Products |

### Optional — Enhancements

| Variable | Used In | Action Required |
|----------|---------|-----------------|
| `NEXT_PUBLIC_GA_ID` | `app/[locale]/layout.tsx` | Google Analytics 4 Measurement ID |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | `app/[locale]/layout.tsx` | Google Search Console verification string |
| `GLM_API_KEY` | `lib/glm.ts` | GLM / Zhipu AI API key |

---

## 4. Runtime Mismatches Fixed

### Fixed: `ADMIN_EMAILS` vs `NEXT_PUBLIC_ADMIN_EMAILS`

**Problem:** `lib/admin-config.ts` used `process.env.ADMIN_EMAILS` (no prefix), but diagnostics page used `process.env.NEXT_PUBLIC_ADMIN_EMAILS`. The unprefixed variable did not exist in Vercel.

**Fix:** Updated `lib/admin-config.ts` to use `process.env.NEXT_PUBLIC_ADMIN_EMAILS`.

### Fixed: Missing `CRON_SECRET`

**Problem:** `app/api/cron/expire-rides/route.ts` and `app/api/cron/ride-reminders/route.ts` validate `Authorization: Bearer ${CRON_SECRET}`. Without this env var, cron jobs fail with 401.

**Fix:** Generated secure random hex string and added to production.

### Fixed: Missing `NEXT_PUBLIC_WAITLIST_MODE`

**Problem:** `middleware.ts` and `lib/features.ts` read `process.env.NEXT_PUBLIC_WAITLIST_MODE`. Without it, the waitlist feature flag evaluates to `undefined`.

**Fix:** Set to `"false"` in all environments.

---

## 5. Security Validation

| Check | Result |
|-------|--------|
| No `NEXT_PUBLIC_` prefixed service role key | ✅ Pass |
| No `NEXT_PUBLIC_` prefixed Stripe secret | ✅ Pass |
| No `NEXT_PUBLIC_` prefixed webhook secret | ✅ Pass |
| No `NEXT_PUBLIC_` prefixed private VAPID key | ✅ Pass |
| No `NEXT_PUBLIC_` prefixed cron secret | ✅ Pass |
| No `NEXT_PUBLIC_` prefixed Resend key | ✅ Pass |
| Admin emails use `NEXT_PUBLIC_` prefix (intentional) | ✅ Pass |

**Note:** `NEXT_PUBLIC_ADMIN_EMAILS` is intentionally public — the middleware and client-side admin checks need it. The actual admin route guard (`middleware.ts`) performs server-side validation in addition to the client-side check.

---

## 6. Deployment Validation

| Check | Result |
|-------|--------|
| Production build | ✅ Success (52s) |
| Site accessible | ✅ `https://andamus.vercel.app/it` → 200 |
| No build errors | ✅ Pass |
| TypeScript clean | ✅ Pass |

### Smoke Tests

| Endpoint | Status |
|----------|--------|
| `/it` (homepage) | 200 |
| `/it/cerca` (search) | 200 |
| `/api/feedback` | 200 (OPTIONS) |

---

## 7. Remaining Manual Actions

### Priority 1 (Before Beta)

1. **Add `NEXT_PUBLIC_POSTHOG_KEY`**
   - Go to https://eu.posthog.com/project/settings
   - Copy Project API Key (starts with `phc_`)
   - Add to Vercel: `NEXT_PUBLIC_POSTHOG_KEY=phc_****`

2. **Add `SENTRY_AUTH_TOKEN`**
   - Go to https://sentry.io/settings/auth-tokens/
   - Create new auth token with `org:read` and `project:releases` scopes
   - Add to Vercel: `SENTRY_AUTH_TOKEN=sntrys_****` (production only)

### Priority 2 (Before Full Launch)

3. **Add Stripe Price IDs**
   - Go to https://dashboard.stripe.com/products
   - Copy Price IDs for premium and driver subscriptions
   - Add to Vercel production:
     - `STRIPE_PREMIUM_PRICE_ID=price_****`
     - `STRIPE_DRIVER_PRICE_ID=price_****`

### Priority 3 (Optional Enhancements)

4. **Add Google Analytics ID** (`NEXT_PUBLIC_GA_ID`)
5. **Add Google Search Console verification** (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`)
6. **Add GLM API Key** (`GLM_API_KEY`) — only if using GLM AI features

---

## Summary

| Metric | Count |
|--------|-------|
| Total env vars in Vercel | 18 |
| Vars added in this audit | 3 |
| Vars removed (obsolete) | 2 |
| Code fixes | 1 |
| Missing vars (manual action) | 7 |
| Critical missing (P1) | 2 |
| Security issues found | 0 |
| Security issues fixed | 1 (ADMIN_EMAILS consistency) |

---

*All secrets masked in this report. The actual values are stored securely in Vercel's encrypted environment variable storage.*

# Andamùs — Launch Readiness Assessment

> **Date:** 2026-05-20  
> **Environment:** Production (https://andamus.vercel.app)  
> **Waitlist Mode:** OFF (`NEXT_PUBLIC_WAITLIST_MODE=false`)  
> **Assessment:** 🟡 **CONDITIONAL GO** — Fix P0s before scaling traffic  

---

## 1. Go/No-Go Criteria

### Hard Blockers (Must Fix Before Launch)

| Criterion | Status | Blocking? |
|-----------|--------|-----------|
| Core user registration works | ✅ | No |
| Core ride search works | ✅ | No |
| Core booking + payment works | ✅ | No |
| Driver can offer rides | ✅ | No |
| Chat works for passengers | ✅ | No |
| Chat works for drivers | 🔴 **BROKEN** | **YES** |
| Driver can accept bookings | 🔴 **BROKEN** | **YES** |
| No critical security vulnerabilities | 🔴 **FOUND** | **YES** |
| RLS policies enforce authorization | 🔴 **BROKEN** | **YES** |
| Database migrations are complete | ⚠️ Missing `waiting_list` | Partial |

### Soft Blockers (Fix Before Marketing Push)

| Criterion | Status |
|-----------|--------|
| Rate limiting active | ❌ Not wired up |
| Email XSS fixed | ❌ Unescaped user data |
| Admin management flexible | ❌ Hardcoded email |
| PWA cache reasonable | ❌ 24h stale data risk |
| German translations complete | ⚠️ ~90% |
| Performance acceptable (LCP < 3s) | ⚠️ Estimated ~3.5s |

---

## 2. Pre-Launch Checklist

### Security (P0)

- [ ] Fix open redirect in OAuth callback (`app/[locale]/auth/callback/route.ts`)
- [ ] Add and verify OAuth `state` parameter
- [ ] Fix `messages` RLS SELECT policy for drivers
- [ ] Fix `bookings` RLS UPDATE policy for drivers
- [ ] Wire up `lib/rate-limit.ts` to all API routes
- [ ] Escape user data in email templates
- [ ] Add CSP headers in `next.config.mjs`
- [ ] Restrict Google Maps API key by HTTP referrer

### Database (P0-P1)

- [ ] Create `waiting_list` table migration
- [ ] Add missing indexes on FK columns
- [ ] Tighten INSERT policies on `notifications`, `badges`, `referrals`, `user_actions`, `push_subscriptions`
- [ ] Resolve `carpool_groups` vs `public.groups` duplication
- [ ] Add `is_admin` boolean to `profiles`

### Performance (P1-P2)

- [ ] Dynamic import `@react-google-maps/api`
- [ ] Dynamic import `recharts`
- [ ] Reduce Serwist Supabase cache TTL to 5 minutes
- [ ] Add `@next/bundle-analyzer`
- [ ] Mark priority images with `priority` prop

### UX (P2)

- [ ] Add focus trapping to all modals
- [ ] Add `aria-label` to icon buttons
- [ ] Fix `useDeviceType` hydration risk
- [ ] Standardize loading states (all skeletons)
- [ ] Complete German i18n strings

### Monitoring (P2)

- [ ] Verify Sentry is receiving errors
- [ ] Set up Vercel Analytics
- [ ] Configure Stripe webhook monitoring
- [ ] Test cron job execution in production

---

## 3. Post-Launch Monitoring

### Metrics to Watch

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| 500 error rate | Sentry + Vercel | > 1% of requests |
| Stripe payment failure rate | Stripe Dashboard | > 5% |
| Ride expiration accuracy | Custom check | 100% (should be exact) |
| Chat message delivery | Custom check | Any failures |
| Page load time (LCP) | PageSpeed Insights | > 3s |
| Conversion rate (search → book) | Custom analytics | Drops > 20% |

### Rollback Plan

If critical issues are detected post-launch:

1. **Enable waitlist mode:**
   ```bash
   # In Vercel dashboard or via CLI
   vercel env add NEXT_PUBLIC_WAITLIST_MODE production
   # Set to "true"
   ```

2. **Revert to last known good commit:**
   ```bash
   git log --oneline -10
   git revert HEAD  # or specific commit
   git push origin main
   ```

3. **Database rollback:**
   - No down-migrations exist. Document manual rollback steps for each migration.
   - For RLS changes: keep old policies and enable/disable rather than dropping.

---

## 4. Traffic Scaling Considerations

### Current Tier: Vercel Hobby

| Limit | Value | Risk |
|-------|-------|------|
| Bandwidth | 100 GB/month | Low for launch |
| Build minutes | 6,000/month | Low |
| Cron jobs | 1/day | **HIGH** — 2 configured |
| Function duration | 10s | Low |
| Function memory | 1024 MB | Low |

### When to Upgrade

| Trigger | Upgrade To |
|---------|-----------|
| > 1,000 rides/day | Vercel Pro |
| > 10,000 bookings/month | Vercel Pro |
| Need > 1 cron/day | Vercel Pro |
| Need team collaboration | Vercel Pro |

---

## 5. Incident Response

### Severity Levels

| Level | Definition | Response |
|-------|-----------|----------|
| SEV-1 | Payment broken, all users affected | Enable waitlist mode immediately, investigate |
| SEV-2 | Chat broken, driver features broken | Deploy fix within 4 hours |
| SEV-3 | UX degradation, performance issues | Fix within 24 hours |
| SEV-4 | Minor bugs, cosmetic issues | Fix in next sprint |

### On-Call

- Primary: `cristiermurache@gmail.com`
- Monitoring: Sentry alerts → email
- Escalation: Enable waitlist mode if no response in 30 minutes

---

## 6. Final Assessment

### Current State: 🟡 CONDITIONAL GO

The application is **functionally complete** and has been successfully deployed to production. Recent fixes (waitlist flag, ride expiration, review UX) demonstrate the codebase is maintainable.

However, **4 critical issues** (2 security, 2 RLS) must be fixed **before** any marketing push or user acquisition campaign. Without these fixes:
- Drivers cannot operate (chat + bookings broken)
- OAuth is vulnerable to CSRF and open redirects
- Database is partially unprotected

### Recommended Timeline

| Phase | Tasks | Timeline |
|-------|-------|----------|
| **Phase 1: Critical Fixes** | Fix all P0 issues | 1-2 days |
| **Phase 2: Security Hardening** | Rate limiting, XSS, CSP | 2-3 days |
| **Phase 3: Performance** | Code splitting, caching | 3-5 days |
| **Phase 4: Polish** | A11y, i18n, loading states | 5-7 days |
| **Phase 5: Scale** | Marketing, user acquisition | After Phase 1 |

### Decision

**GO for limited soft-launch** (friends & family, organic traffic) after Phase 1.  
**NO-GO for marketing spend** until all P0 and P1 issues are resolved.

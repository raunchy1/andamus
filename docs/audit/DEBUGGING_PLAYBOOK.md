# Andamùs — Debugging Playbook

> **Purpose:** Quick reference for common issues, debugging commands, and troubleshooting steps  
> **Audience:** Developers and on-call engineers  

---

## 1. Common Issues Quick Reference

### Issue: "Ride not showing in search"

| Check | Command/Action |
|-------|---------------|
| Is ride status `active`? | `SELECT status FROM rides WHERE id = '...';` |
| Is ride date in the future? | `SELECT date, time FROM rides WHERE id = '...';` |
| Is cron job running? | Check Vercel dashboard → Cron executions |
| Check `expire-rides` cron | `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/expire-rides` |
| Is search filter too strict? | Check `searchRides()` in `lib/rides-actions.ts` |

### Issue: "Driver cannot see chat messages"

| Check | Command/Action |
|-------|---------------|
| RLS policy on `messages` | `SELECT * FROM pg_policies WHERE tablename = 'messages';` |
| Is driver the ride owner? | `SELECT driver_id FROM rides WHERE id = '...';` |
| Is realtime subscription active? | Check browser DevTools → Network → WS |
| Check Supabase realtime logs | Supabase Dashboard → Logs |

**Fix:** Update RLS policy. See [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md#p0-1-drivers-cannot-read-chat-messages)

### Issue: "Driver cannot accept booking"

| Check | Command/Action |
|-------|---------------|
| RLS policy on `bookings` | `SELECT * FROM pg_policies WHERE tablename = 'bookings';` |
| Booking status | `SELECT status FROM bookings WHERE id = '...';` |
| Error in browser console | Check for 403/RLS errors |

**Fix:** Update RLS policy. See [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md#p0-2-drivers-cannot-update-booking-status)

### Issue: "OAuth redirect goes to wrong URL"

| Check | Command/Action |
|-------|---------------|
| `X-Forwarded-Host` header | Check if being injected |
| Callback route code | `app/[locale]/auth/callback/route.ts` |
| `next` parameter | Is it validated against a whitelist? |

**Fix:** Whitelist redirects. See [AUTH_AND_SECURITY.md](./AUTH_AND_SECURITY.md#p0-1-open-redirect-via-x-forwarded-host)

### Issue: "Stripe payment failed"

| Check | Command/Action |
|-------|---------------|
| Stripe Dashboard | Check for failed payments |
| Webhook delivery | Stripe Dashboard → Webhooks → Logs |
| Webhook signature | Is `STRIPE_WEBHOOK_SECRET` correct? |
| API version mismatch | Check `lib/stripe.ts` apiVersion |
| Ride expired before checkout | Check `expire-rides` cron timing |

### Issue: "User sees stale ride data"

| Check | Command/Action |
|-------|---------------|
| Serwist cache | Clear site data in browser |
| Service worker | Check `chrome://serviceworker-internals` |
| Supabase cache TTL | Check Serwist config (currently 24h) |
| Browser cache | Hard refresh (Ctrl+Shift+R) |

---

## 2. Environment Debugging

### Check Environment Variables

```bash
# Local
cat .env.local

# Vercel (production)
vercel env ls

# Verify in build
npm run build 2>&1 | grep -i "env\|stripe\|supabase"
```

### Verify Stripe Configuration

```typescript
// Test script: scripts/test-stripe.ts
import { stripe } from "@/lib/stripe";

async function testStripe() {
  const balance = await stripe.balance.retrieve();
  console.log("Stripe connected:", balance);
}

testStripe();
```

### Verify Supabase Connection

```typescript
// Test script: scripts/test-supabase.ts
import { createClient } from "@/lib/supabase/server";

async function testSupabase() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rides").select("count");
  console.log("Supabase connected:", data, error);
}

testSupabase();
```

---

## 3. Database Debugging

### Connect to Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run queries directly

### Common Queries

```sql
-- Check ride status
SELECT id, status, date, time FROM rides WHERE id = '...';

-- Check bookings for a ride
SELECT b.*, p.name as passenger_name 
FROM bookings b 
JOIN profiles p ON b.passenger_id = p.id 
WHERE b.ride_id = '...';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('rides', 'bookings', 'messages', 'profiles')
ORDER BY tablename, policyname;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bookings';

-- Check waiting_list table exists
SELECT * FROM information_schema.tables WHERE table_name = 'waiting_list';

-- Check migrations applied
SELECT * FROM schema_migrations ORDER BY version DESC;
```

### Reset Test Data

```sql
-- WARNING: Only in development!
TRUNCATE TABLE rides, bookings, messages, reviews, notifications;
```

---

## 4. Build & Deploy Debugging

### Local Build

```bash
# Clean build
rm -rf .next && npm run build

# With environment
NODE_ENV=production npm run build

# Analyze bundle
ANALYZE=true npm run build
```

### Vercel Deploy

```bash
# Preview deploy
vercel

# Production deploy
vercel --prod

# Check deploy logs
vercel logs andamus.vercel.app

# Check function logs
vercel logs andamus.vercel.app --all
```

### Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Module not found` | Missing dependency | `npm install` |
| `Type error` | TypeScript issue | Check types, run `tsc --noEmit` |
| `Env var missing` | Missing env var | Add to `.env.local` and Vercel |
| `Build timeout` | Too large | Check bundle size, optimize |

---

## 5. Supabase Realtime Debugging

### Check Channel Subscriptions

```typescript
// In browser console (DevTools)
const supabase = window.__supabase; // if exposed
supabase.realtime.channels.forEach(ch => console.log(ch.topic));
```

### Test Realtime Events

```sql
-- In Supabase SQL Editor
INSERT INTO messages (booking_id, sender_id, content)
VALUES ('...', '...', 'Test message');
-- Check if client receives event
```

### Common Realtime Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| No events received | RLS blocks | Check SELECT policy |
| Duplicate events | Multiple subscriptions | Ensure cleanup in useEffect |
| Connection drops | Network | Reconnect logic in client |
| High latency | Region mismatch | Ensure Supabase region matches users |

---

## 6. Stripe Webhook Debugging

### Test Webhook Locally

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### Verify Webhook Signature

```typescript
// In webhook handler
const sig = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
console.log("Event verified:", event.type);
```

### Common Webhook Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Signature verification fails | Wrong secret | Check `STRIPE_WEBHOOK_SECRET` |
| Events not received | URL wrong | Check Stripe Dashboard webhook URL |
| Duplicate processing | No idempotency | Check `event.id` before processing |
| Timeout | Slow handler | Optimize or use background job |

---

## 7. Cron Job Debugging

### Test Cron Locally

```bash
# Simulate cron request
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/expire-rides

curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/ride-reminders
```

### Check Cron in Production

1. Vercel Dashboard → Cron Jobs
2. Check execution history
3. Check function logs for errors

### Hobby Tier Limitation

**Only 1 cron job per day is allowed on Hobby tier.**  
If both crons are configured, one may fail silently.

**Workaround:** Merge into single cron dispatcher:
```typescript
// /api/cron/dispatcher/route.ts
export async function GET(request: NextRequest) {
  // Auth check...
  await expireRides();
  await sendRideReminders();
  return NextResponse.json({ success: true });
}
```

---

## 8. Performance Debugging

### Lighthouse Audit

```bash
# Run locally
npx lighthouse http://localhost:3000/it --output=html --output-path=report.html

# Or use Chrome DevTools → Lighthouse
```

### Bundle Analysis

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Run build with analyze
ANALYZE=true npm run build
# Opens browser with bundle visualization
```

### Core Web Vitals Check

| Metric | Check | Target |
|--------|-------|--------|
| LCP | Largest image or text block | < 2.5s |
| FID | First input delay | < 100ms |
| CLS | Layout shift score | < 0.1 |
| TTFB | Time to first byte | < 200ms |

---

## 9. Emergency Contacts & Resources

| Resource | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| Stripe Dashboard | https://dashboard.stripe.com |
| Sentry Issues | https://sentry.io (check project) |
| Production URL | https://andamus.vercel.app |
| Repository | https://github.com/raunchy1/andamus |

---

## 10. Log Locations

| Log Type | Location |
|----------|----------|
| Vercel Function Logs | Vercel Dashboard → Logs |
| Supabase Postgres Logs | Supabase Dashboard → Logs → Postgres |
| Supabase Realtime Logs | Supabase Dashboard → Logs → Realtime |
| Stripe Webhook Logs | Stripe Dashboard → Developers → Webhooks |
| Sentry Error Tracking | Sentry Dashboard → Issues |
| Browser Console | DevTools → Console |
| Browser Network | DevTools → Network |

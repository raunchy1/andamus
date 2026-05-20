# Andamùs — Architecture & Routing Audit

> **Domain:** Build system, directory structure, middleware, API routes, data flow  
> **Status:** 🟡 Functional with structural risks  

---

## 1. Tech Stack Deep Dive

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.2.4 | Turbopack dev; App Router |
| Language | TypeScript | 5.x | Strict mode enabled |
| Styling | Tailwind CSS | 4.x | Custom theme extensions |
| Components | shadcn/ui | latest | Built on Radix UI primitives |
| Icons | Lucide React | latest | Consistent iconography |
| State | React useState/useEffect | — | No global state library (Zustand/Redux) |
| Forms | React state + validation | — | No Formik/React Hook Form |
| Maps | @react-google-maps/api | latest | Heavy dependency, no code-split |
| Charts | recharts | latest | Admin dashboard only, no code-split |
| PWA | Serwist | v9 | Service worker + workbox |
| i18n | next-intl | v3 | Prefix `always`, it/en/de |

---

## 2. Directory Structure Analysis

```
app/
├── [locale]/              # i18n-routed pages (it, en, de)
│   ├── auth/callback/     # OAuth callback handler
│   ├── admin/             # Admin dashboard (protected)
│   ├── cerca/             # Ride search
│   ├── come-funziona/     # How it works
│   ├── contattaci/        # Contact
│   ├── domande-frequenti/ # FAQ
│   ├── offri/             # Offer a ride
│   ├── profilo/           # User profile
│   ├── recensioni/        # Reviews
│   ├── termini/           # Terms
│   ├── tratta/            # Ride detail
│   └── viaggio/           # Booking flow
├── api/                   # API routes
│   ├── cron/              # Scheduled jobs
│   ├── stripe/            # Payment webhooks & checkout
│   ├── chat/              # Chat API
│   └── ...
├── coming-soon/           # Waitlist landing page
├── offline/               # PWA offline fallback
├── unsubscribe/           # Email unsubscribe
├── global-error.tsx       # Global error boundary
├── layout.tsx             # Root layout
└── globals.css            # Global styles

components/
├── ui/                    # shadcn/ui base components
├── cerca/                 # Search-specific components
├── offri/                 # Offer-ride components
├── chat/                  # Chat components
└── [30+ shared components]

lib/
├── supabase/              # Supabase clients (browser + server)
├── emails/                # Email templates
├── features.ts            # Feature flags
├── date-utils.ts          # Timezone helpers
├── rides-actions.ts       # Server actions
├── stripe.ts              # Stripe client config
└── [10+ utility modules]

messages/
├── it.json                # Italian (default)
├── en.json                # English
└── de.json                # German
```

### Observations

- **Clean separation** between `app/`, `components/`, and `lib/`.
- **No `src/` directory** — flat project root is fine for this scale.
- **Feature folders** (`cerca/`, `offri/`, `chat/`) inside `components/` aid discoverability.
- **Missing:** No `types/` or `interfaces/` directory — types are scattered.

---

## 3. Build & Deploy Configuration

### `next.config.mjs`

- **Turbopack** enabled for dev builds.
- **Static exports** partially used (PWA assets).
- **Image optimization** via `next/image` with remote patterns for Supabase storage.
- **Rewrites** present for API routes and locale handling.

### `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/ride-reminders", "schedule": "0 17 * * *" },
    { "path": "/api/cron/expire-rides", "schedule": "0 0 * * *" }
  ]
}
```

⚠️ **Hobby tier limitation:** Only **1 cron job per day** is allowed. Currently **2 are configured** — this may fail silently or Vercel may reject the second.

**Recommendation:** Merge both cron jobs into a single endpoint that dispatches to sub-tasks, or upgrade to Pro tier.

---

## 4. Middleware Analysis (`middleware.ts`)

### Responsibilities

1. **Locale routing** — Prefix `always` (e.g., `/it/cerca`, `/en/search`).
2. **Supabase session refresh** — Attaches refreshed auth cookies.
3. **Admin protection** — Redirects non-admin users from `/admin`.
4. **Waitlist gating** — Redirects anonymous users to `/coming-soon` when `WAITLIST_MODE=true`.

### Code Patterns

```typescript
import { FEATURES } from "@/lib/features";

if (!FEATURES.WAITLIST_MODE && pathname === "/coming-soon") {
  return NextResponse.redirect(new URL("/it", request.url));
}
```

### Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Cookie-based waitlist bypass | P2 | `hasSupabaseAuthCookie` checks for cookie *presence*, not validity. A fake cookie bypasses waitlist. |
| Hardcoded bypass list | P2 | `COMING_SOON_BYPASS` is a hardcoded array of internal paths. |
| Middleware bloat | P2 | 200+ lines; consider splitting into route-specific guards. |
| No rate limiting | P1 | `lib/rate-limit.ts` exists but middleware doesn't use it. |

---

## 5. Component Architecture

### Client vs. Server Split

| Page | Type | Lines | Issue |
|------|------|-------|-------|
| `cerca/page.tsx` | `use client` | ~1,192 | Monolithic; fetches in `useEffect` |
| `profilo/page.tsx` | `use client` | ~1,705 | Monolithic; multiple concerns |
| `tratta/[id]/page.tsx` | `use client` | ~600 | Fetches ride data client-side |
| `offri/page.tsx` | `use client` | ~800 | Form + map + validation |
| `ChatWindow.tsx` | `use client` | ~1,190 | Chat + realtime + UI |
| `admin/page.tsx` | `use client` | ~500 | Admin dashboard |

### Critical Observation

> **Almost all public pages are `"use client"` with browser-side Supabase fetching.**

This means:
- ❌ **No SSR for SEO** — Search engines see empty shells.
- ❌ **No initial data on page load** — Users see loading spinners.
- ❌ **Larger bundles** — All page logic ships to the browser.
- ❌ **Hydration risks** — Server/client mismatch potential.

**Root cause:** Heavy reliance on `useEffect` + `createClient()` (browser Supabase client) instead of server-side data fetching via `async` Server Components or Server Actions.

---

## 6. Data Flow Patterns

### Current Pattern (Anti-Pattern)

```tsx
// Client Component fetches its own data
"use client";
export default function Page() {
  const [rides, setRides] = useState([]);
  useEffect(() => {
    supabase.from("rides").select("*").then(({ data }) => setRides(data));
  }, []);
  return <RideList rides={rides} />;
}
```

### Recommended Pattern

```tsx
// Server Component fetches data
export default async function Page() {
  const rides = await searchRides(); // Server Action or direct query
  return <RideList rides={rides} />;
}
```

---

## 7. API Routes Audit

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/cron/ride-reminders` | GET | `CRON_SECRET` | Send ride reminder emails | 🟡 |
| `/api/cron/expire-rides` | GET | `CRON_SECRET` | Mark expired rides | 🟢 |
| `/api/stripe/checkout` | POST | Session | Create Stripe checkout | 🟡 |
| `/api/stripe/webhook` | POST | Stripe sig | Handle Stripe events | 🟢 |
| `/api/stripe/connect` | POST | Session | Create Connect account | 🟡 |
| `/api/chat/send` | POST | Session | Send chat message | 🟡 |
| `/api/chat/mark-read` | POST | Session | Mark messages read | 🟡 |

### Observations

- **Consistent Bearer auth pattern** for cron routes.
- **Stripe webhook** correctly verifies signatures.
- **No request body validation** on most API routes (Zod missing).
- **No rate limiting** on any API route.

---

## 8. Environment Variables

| Variable | Required | Used In | Issue |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_WAITLIST_MODE` | Yes | `lib/features.ts`, middleware | ✅ Correct |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Map components | ✅ Fixed (was `GOOGLE_MAPS_API_KEY`) |
| `STRIPE_SECRET_KEY` | Yes | `lib/stripe.ts`, API routes | ✅ Correct |
| `STRIPE_WEBHOOK_SECRET` | Yes | `/api/stripe/webhook` | ✅ Correct |
| `CRON_SECRET` | Yes | Cron routes | ✅ Correct |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin ops | ⚠️ Ensure NOT exposed client-side |
| `RESEND_API_KEY` | Yes | Email sending | ✅ Correct |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client | ✅ Correct |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client | ✅ Correct |
| `SENTRY_DSN` | Optional | Error reporting | ✅ Correct |

### Security Note

`SUPABASE_SERVICE_ROLE_KEY` must **never** be referenced in client components. Audit shows it is only used in server actions and API routes — ✅ safe.

---

## 9. Recommendations

| Priority | Recommendation | Effort |
|----------|---------------|--------|
| P1 | Refactor `cerca/page.tsx` and `profilo/page.tsx` into smaller sub-components | Medium |
| P1 | Move data fetching from `useEffect` to Server Components/Server Actions | High |
| P1 | Add Zod validation to all API route request bodies | Medium |
| P2 | Split middleware into smaller, focused guards | Low |
| P2 | Consider Zustand or React Query for client state management | Medium |
| P2 | Merge cron jobs or upgrade Vercel tier | Low |

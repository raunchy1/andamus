# Andamùs — Performance Audit

> **Domain:** Bundle size, code splitting, caching, data fetching, Core Web Vitals  
> **Status:** 🔴 Poor performance due to heavy client bundles and lack of SSR  

---

## 1. Bundle Size Analysis

### Client Bundle Concerns

| Dependency | Size (gzipped est.) | Used In | Code-Split? |
|-----------|---------------------|---------|-------------|
| `@react-google-maps/api` | ~35 KB | `offri/`, `tratta/` | ❌ No |
| `recharts` | ~45 KB | `admin/` | ❌ No |
| `lucide-react` | ~20 KB (tree-shaken) | All pages | ✅ Yes |
| `framer-motion` | ~25 KB | Various | ⚠️ Partial |
| Supabase client | ~30 KB | All pages | ❌ No |
| Stripe.js | ~50 KB | Checkout | ✅ Stripe loads async |

**Total estimated heavy deps:** ~120 KB of unnecessary synchronous JS on initial load.

### Page-Specific Bundle Impact

| Page | Client JS (est.) | Issue |
|------|-----------------|-------|
| `/cerca` | ~180 KB | Search + maps + filtering all client-side |
| `/profilo` | ~200 KB | Profile + bookings + reviews + settings |
| `/offri` | ~220 KB | Form + maps + route calculation |
| `/tratta/[id]` | ~150 KB | Ride detail + map + booking |
| `/admin` | ~250 KB | Charts + tables + admin tools |
| `/chat` | ~120 KB | Chat + realtime |

---

## 2. Code Splitting Opportunities

### Immediate Wins

#### 1. Google Maps (`@react-google-maps/api`)

**Current:** Imported synchronously in pages that need maps.

**Fix:** Dynamic import with loading skeleton:
```tsx
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

**Impact:** ~35 KB saved on non-map pages; faster initial paint on map pages.

#### 2. Recharts (Admin Dashboard)

**Current:** Imported in admin page.

**Fix:**
```tsx
const AnalyticsCharts = dynamic(() => import("@/components/admin/AnalyticsCharts"), {
  ssr: false,
});
```

**Impact:** ~45 KB saved for non-admin users (100% of regular users).

#### 3. Heavy Components

| Component | Dynamic Import? | Loading State |
|-----------|----------------|---------------|
| `ChatWindow` | Should be | Skeleton messages |
| `RatingModal` | Should be | Simple spinner |
| `AuthModal` | Should be | Simple spinner |
| `OnboardingModal` | Should be | Simple spinner |

---

## 3. Data Fetching Patterns

### Current Anti-Pattern

Almost all pages fetch data client-side:

```tsx
"use client";
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    supabase.from("rides").select("*").then(({ data }) => setData(data));
  }, []);
  if (!data) return <Spinner />;
  return <Content data={data} />;
}
```

### Problems

1. **No SSR** — Search engines see empty pages.
2. **No streaming** — Users wait for all data before seeing anything.
3. **Double data** — HTML ships empty, then JS fetches data.
4. **Hydration delay** — Page is interactive only after fetch completes.

### Recommended Pattern

```tsx
// Server Component
export default async function Page() {
  const rides = await searchRides(); // Server Action
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults rides={rides} />
    </Suspense>
  );
}
```

**Impact:**
- Faster First Contentful Paint (FCP)
- Better SEO
- Smaller client bundles
- Better caching (CDN can cache rendered HTML)

---

## 4. Image Optimization

### Current State

| Aspect | Status |
|--------|--------|
| `next/image` usage | ✅ Used |
| Remote patterns configured | ✅ Supabase Storage |
| AVIF format | ⚠️ Not configured |
| Priority LCP images | ⚠️ Not marked |
| Blur placeholders | ⚠️ Limited use |

### Recommendations

1. **Add AVIF support** in `next.config.mjs`:
   ```javascript
   images: { formats: ["image/avif", "image/webp"] }
   ```

2. **Mark hero/avatar images as `priority`** for faster LCP.

3. **Use blur placeholders** for all user-uploaded avatars.

---

## 5. Caching Strategy

### Browser Caching

| Asset Type | Cache Control | Status |
|-----------|--------------|--------|
| Static assets (JS, CSS) | 1 year (Vercel default) | ✅ |
| Images | 1 year (Vercel default) | ✅ |
| API responses | No cache | ⚠️ Could cache some |
| Supabase GETs | 24h (Serwist) | 🔴 Too long for ride data |

### Service Worker Caching (Serwist)

```javascript
// Current: 24-hour cache for Supabase GETs
workbox.routing.registerRoute(
  ({ url }) => url.hostname.includes("supabase.co"),
  new workbox.strategies.CacheFirst({
    cacheName: "supabase-cache",
    plugins: [new workbox.expiration.ExpirationPlugin({ maxAgeSeconds: 86400 })],
  })
);
```

**Problem:** Ride listings cached for 24 hours means users see stale search results.

**Fix:** Use `NetworkFirst` or `StaleWhileRevalidate` with short TTL (5 minutes max for ride data).

---

## 6. Core Web Vitals Estimates

| Metric | Current (Est.) | Target | Status |
|--------|---------------|--------|--------|
| LCP (Largest Contentful Paint) | ~3.5s | <2.5s | 🔴 Poor |
| FID (First Input Delay) | ~150ms | <100ms | 🟡 Needs Improvement |
| CLS (Cumulative Layout Shift) | ~0.15 | <0.1 | 🟡 Needs Improvement |
| TTFB (Time to First Byte) | ~200ms | <200ms | 🟢 Good |
| INP (Interaction to Next Paint) | ~300ms | <200ms | 🟡 Needs Improvement |

**Note:** These are estimates based on code analysis. Run Lighthouse/PageSpeed Insights for actual scores.

---

## 7. Build Performance

### Turbopack

- **Dev builds:** Fast with Turbopack
- **Prod builds:** Standard Next.js build
- **Build time:** ~2-3 minutes (estimate)

### Bundle Analyzer

**Recommendation:** Add `@next/bundle-analyzer`:
```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.mjs
import withBundleAnalyzer from "@next/bundle-analyzer";
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(config);
```

---

## 8. Database Query Performance

### N+1 Queries

Some pages may trigger N+1 queries:

```tsx
// Potential N+1: Fetch rides, then fetch driver profile for each
const { data: rides } = await supabase.from("rides").select("*");
for (const ride of rides) {
  const { data: driver } = await supabase.from("profiles").select("*").eq("id", ride.driver_id);
}
```

**Fix:** Use joined selects:
```tsx
const { data } = await supabase
  .from("rides")
  .select(`*, profiles!inner(name, avatar_url, rating)`);
```

### Missing Indexes Impact

See [DATABASE_AND_SUPABASE.md](./DATABASE_AND_SUPABASE.md#6-missing-indexes) for full list.

---

## 9. Recommendations

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P1 | Dynamic import `@react-google-maps/api` | Low | High |
| P1 | Dynamic import `recharts` | Low | High |
| P1 | Move data fetching to Server Components | High | Very High |
| P1 | Reduce Serwist Supabase cache to 5 min | Low | High |
| P2 | Add `next/image` AVIF support | Low | Medium |
| P2 | Mark LCP images as `priority` | Low | Medium |
| P2 | Add `@next/bundle-analyzer` | Low | Low |
| P2 | Split `profilo/page.tsx` into sub-components | Medium | Medium |
| P2 | Split `cerca/page.tsx` into sub-components | Medium | Medium |
| P2 | Split `ChatWindow.tsx` into sub-components | Medium | Medium |

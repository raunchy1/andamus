# Andamus Phase 2E — Admin Dashboard + Google Maps Dark Style Audit

**Date:** 2026-06-15  
**Scope:** Visual-only restyle (markup, classNames, CSS, map style config)  
**Constraint:** No changes to access control, data fetching, Supabase queries, cron, KYC logic, GA4 tracking, or map routing logic.

---

## Summary

Phase 2E completes the screen redesign with two deliverables:

1. **Admin dashboard** — metric cards, Recharts charts, data tables, feedback moderation UI, and diagnostics aligned to the monochrome + teal token system.
2. **Google Maps dark style** — shared `darkMapStyles` array applied to all interactive tile maps and static map fallbacks; route polyline and markers use `--accent` (`#4FB3C9`).

`next build` completes with **zero errors**.

---

## Part 1 — Admin Dashboard

### Metric cards
- `bg-surface`, `border-line`, mono numbers (`font-mono text-fg`), muted labels (`text-muted`), mono eyebrows (`text-dim uppercase tracking-widest`)
- Lucide icons at `strokeWidth={1.5}`, `text-muted` — no gradient or colored stat boxes

### Charts (Recharts / GA4)
- Grid: `--line` (`stroke-line`)
- Axes: `--dim`, mono tick labels
- Primary series: `--accent` (`#4FB3C9`)
- Multi-series palette: accent + muted + dim (no rainbow)
- Tooltip: `bg-elevated`, `border-line`, `text-fg`

### Data tables
- Hairline `divide-line` row separators
- Mono for numbers, dates, IDs
- No zebra-striping or heavy borders

### KYC moderation
- No KYC moderation UI component exists in the admin pages (API route `app/api/admin/kyc/route.ts` unchanged)
- When added: approve = teal `Button`, reject = `destructive` (`--bad`) — handlers untouched

### Feedback
- Status badges: small mono pills with desaturated dots (`--ok` / `--pending`)
- Resolve action: teal `Button` (accent variant)
- `resolveFeedback` handler and Supabase update logic unchanged

### Diagnostics
- Same token shell as main admin
- Booking/report/suspicious status uses ok/pending/bad mono dot badges
- All Supabase fetch queries and admin email check unchanged

---

## Part 2 — Google Maps Dark Style

### Shared style config (`lib/sardinia-cities.ts`)
- `darkMapStyles` — Google Maps JS `styles` option array (geometry `#0a0a0a`, labels `#8c8c87`, roads, POI/transit off, water `#050505`)
- `MAP_ACCENT` = `#4FB3C9`, `MAP_MUTED` = `#8C8C87`
- `staticMapDarkStyleQuery` — equivalent styling for Static Maps API URLs

### `RouteMap.tsx` (interactive + MiniMap)
- `mapOptions.styles: darkMapStyles` on every `GoogleMap` instance
- `DirectionsRenderer` `strokeColor: MAP_ACCENT` (was red)
- Origin marker: hollow muted SVG; destination: filled teal SVG
- Container: `rounded-[var(--radius)] border border-line`
- **Logic unchanged:** `calculateRoute`, `DirectionsService`, coords, loaders

### Static map fallbacks
- `MiniMap` static URL: dark style query + muted/teal markers
- `ChatWindow` location preview: dark style query + `color:0x4FB3C9` marker (was red)

### Publish form
- No interactive `GoogleMap` on `/offri` — uses `/api/maps/distance` only (out of scope)

---

## Files Changed (visual only)

| File | Changes |
|------|---------|
| `app/[locale]/admin/page.tsx` | Token shell, KPI cards, tabs (no emoji), loaders |
| `app/[locale]/admin/_components/OverviewCharts.tsx` | Teal/mono Recharts styling |
| `app/[locale]/admin/_components/AdminDataTabs.tsx` | Tables, realtime panel icons, token badges |
| `app/[locale]/admin/feedback/page.tsx` | Metric cards, mono type pills |
| `app/[locale]/admin/diagnostics/page.tsx` | Metric cards, status badges, tables |
| `components/admin/FeedbackList.tsx` | Token cards, ok/pending badges, accent resolve button |
| `components/RouteMap.tsx` | Dark map styles, teal route, custom markers, container |
| `components/chat/ChatWindow.tsx` | Static map URL styling only |
| `lib/sardinia-cities.ts` | `darkMapStyles`, `MAP_ACCENT`, `staticMapDarkStyleQuery` |

---

## Files NOT Modified (logic / API / access)

| Category | Paths |
|----------|-------|
| Admin API routes | `app/api/admin/**` (kyc, analytics, feedback, health, moderation, queue, refresh-rides, seed) |
| Admin access | `lib/admin.ts`, `lib/admin-config.ts`, `app/[locale]/admin/layout.tsx` |
| Data actions | `lib/admin-actions.ts` (`resolveFeedback`, `loadStats` callers) |
| Cron / GA4 | `app/api/cron/**`, GA4 tracking hooks |
| Map logic | `calculateRoute`, `DirectionsService`, marker positions, `DirectionsRenderer` routing |
| KYC logic | `app/api/admin/kyc/route.ts` POST body + `profiles.update` |

---

## Build Verification

```
npm run build
✓ Compiled successfully
✓ TypeScript — no errors
✓ 136 static pages generated
Exit code: 0
```

---

## Visual Checklist

| Area | Status |
|------|--------|
| Admin overview KPI cards | ✅ Token surfaces, mono numbers |
| Recharts line/bar/pie | ✅ Teal primary, mono axes |
| Users / rides / waiting / liquidity tables | ✅ Hairline dividers, mono IDs/dates |
| Feedback page + list | ✅ ok/pending dot badges, accent resolve |
| Diagnostics | ✅ Mono metrics, status badges |
| RouteMap interactive | ✅ Dark tiles, teal polyline |
| MiniMap static fallback | ✅ Dark + teal/muted markers |
| Chat location static map | ✅ Dark + teal marker |
| No emoji in admin tabs | ✅ |
| No `#e63946` in admin or RouteMap | ✅ |

---

## Screenshots

Captured at `docs/redesign/screenshots/phase-2e/` (headless Chrome, port 7001):

| File | URL | Note |
|------|-----|------|
| `admin-overview.png` | `/it/admin` | Redirects to public home (no admin session) — confirms access control intact |
| `feedback.png` | `/it/admin/feedback` | Same redirect (auth gate working) |
| `diagnostics.png` | `/it/admin/diagnostics` | Same redirect (auth gate working) |

Authenticated admin KPI/chart screenshots and live RouteMap tiles require an admin session + `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## Phase 2E Complete

This is the **final screen phase** of the visual redesign. All user-facing screens now use the token system; remaining legacy `#e63946` references are outside Phase 2E scope (legal pages, premium, gruppi, emails, etc.).
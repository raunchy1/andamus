# Andamus Pre-Deploy Visual Audit

**Date:** 2026-06-15  
**Base URL:** http://localhost:7002  
**Screenshots:** `docs/redesign/screenshots/predeploy-audit/`

## Summary

| Metric | Count |
|--------|-------|
| ✅ OK | 10 |
| 🚫 Blocked (auth) | 3 |
| ⏭️ Skipped | 1 |
| ❌ Failed | 1 |

## Screenshots

| Page | Status | File | Notes |
|------|--------|------|-------|
| home-desktop | ok | `home-desktop.png` | — |
| cerca-desktop | ok | `cerca-desktop.png` | — |
| not-found-desktop | ok | `not-found-desktop.png` | — |
| home-mobile | ok | `home-mobile.png` | — |
| offri-desktop | ok | `offri-desktop.png` | — |
| profilo-desktop | ok | `profilo-desktop.png` | — |
| chat-inbox-desktop | ok | `chat-inbox-desktop.png` | — |
| chat-window-desktop | ok | `chat-window-desktop.png` | — |
| ride-detail-desktop | skip | `ride-detail-desktop.png` | Seed ride IDs return 404 — no active rides in DB |
| onboarding-welcome-mobile | fail | `onboarding-welcome-mobile.png` | Seed user already completed onboarding |
| admin-overview | blocked | `admin-overview.png` | 404 — seed user not admin (expected) |
| admin-feedback | blocked | `admin-feedback.png` | 404 — seed user not admin (expected) |
| admin-diagnostics | blocked | `admin-diagnostics.png` | 404 — seed user not admin (expected) |

## Design checklist

| Area | Expected | Verify in screenshots |
|------|----------|----------------------|
| Dark theme | `bg-canvas`, dark cards | home, cerca, offri |
| Teal accent | `#4FB3C9` CTAs | buttons, links |
| Maps | Dark tiles + teal route | ride-detail-map (if ride available) |
| Admin | Mono KPI cards, teal charts | admin-* (requires Google admin) |
| Mobile | Bottom nav, responsive | home-mobile, onboarding |

## Verdict

| Area | Result |
|------|--------|
| Public pages (home, cerca, 404) | ✅ PASS — dark theme + teal accents consistent |
| Auth pages (offri, profilo, chat) | ✅ PASS — redesign applied, layout clean |
| Mobile home | ✅ PASS — bottom nav, responsive search |
| Admin dashboard | ⏳ MANUAL — requires Google admin login |
| Ride detail + dark map | ⏳ MANUAL — no active rides in staging DB |
| Onboarding flow | ⏳ MANUAL — seed account already onboarded |

**Overall:** Visual redesign is **ready to deploy** for public + authenticated user flows. Admin and map tiles need post-deploy verification with a real admin session and an active ride.

## Manual follow-up

- **Admin pages:** Capture with `cristianermurache@gmail.com` via Google OAuth (seed user no longer has admin).
- **Ride detail map:** Open any active `/it/corsa/[id]` in production after deploy.
- **Onboarding:** Use a fresh Google account or reset onboarding flag in Supabase.

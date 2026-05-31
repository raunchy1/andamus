# Master Feature Inventory

| Feature Name | Date Introduced | Commit Hash | Dependencies | Files/Core Modules |
|---|---|---|---|---|
| **Location System (Core & Combobox)** | Recent | `d7be724` | Supabase `locations` | `LocationCombobox.tsx`, `actions/locations.ts`, `cerca/page.tsx`, `offri/page.tsx` |
| **Extended Locations (Frazioni)** | Recent | `e11eb51` | Supabase RPC `search_locations` | `041_sardinia_location_system.sql`, `042_FIX_EXTENDED_LOCATIONS.sql` |
| **Vehicle Identity System** | Recent | `2aace6b` | Supabase `vehicles`, Storage | `VehicleWizard.tsx`, `MeetYourRide.tsx`, `VehicleEditPanel.tsx` |
| **Mobile-First Onboarding Flow** | Recent | `ac7d8da` | Supabase `profiles` | `app/[locale]/onboarding/*` |
| **Dynamic Marketplace Seeder** | Recent | `0528f46` | Supabase Cron/Functions | `api/admin/seed/route.ts`, `api/admin/refresh-rides/route.ts` |
| **Referral & Viral Sharing Engine** | Recent | `990f524`, `2438eae` | Supabase `waiting_list` | `ShareRide.tsx`, `PostActionModal.tsx`, `api/referrals/redeem` |
| **Public Profiles & Trust Platform** | Recent | `345ee5e` | Supabase `profiles`, `reviews` | `app/[locale]/u/[id]/page.tsx`, `TrustBadge.tsx` |
| **Admin & Moderation Tools** | Recent | `b7cf17f` | Supabase `roles` | `app/[locale]/admin/*`, `ReportUser.tsx` |
| **Chat & Ride Lifecycle** | Recent | `a1c31f7`, `176b737` | Supabase `messages`, Cron | `chat/[bookingId]/page.tsx`, `api/cron/expire-rides` |
| **Observability (Sentry & Logging)** | Recent | `3c987b6` | Sentry, Logtail | `lib/logger.ts`, `lib/server/observability/logging.ts` |
| **PWA Install Tracking** | Recent | `0528f46` | Next.js PWA | `PWAInstallPrompt.tsx` |
| **Waiting List / Coming Soon** | Recent | `56bdefe` | Supabase `waiting_list` | `coming-soon/page.tsx`, `api/waiting-list` |
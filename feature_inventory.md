# Feature Inventory

| Feature Name | Status | Dependencies | Risk | Files |
|---|---|---|---|---|
| **Sardinia Location System (Core)** | LIVE | Supabase `locations` table | Low | `LocationCombobox.tsx`, `actions/locations.ts` |
| **Extended Locations (Frazioni)** | LIVE | Supabase RPC `search_locations` | Low | Migration `042_FIX_EXTENDED_LOCATIONS.sql` |
| **Search Autocomplete & UI** | LIVE | `LocationCombobox` | Low | `cerca/page.tsx`, `HomePageClient.tsx` |
| **Ride Offering Routing** | LIVE | `LocationCombobox` | Low | `offri/page.tsx`, `StopsSection.tsx` |
| **Ride Requests Filtering** | LIVE | `LocationCombobox` | Low | `richieste/page.tsx`, `CreateRequestModal.tsx` |
| **Group Ride Routing** | LIVE | `LocationCombobox` | Low | `gruppi/page.tsx` |
| **Alerts Origin/Destination** | LIVE | `LocationCombobox` | Low | `AlertModal.tsx` |
| **Vehicle Identity System** | LIVE | Supabase `vehicles` | Low | `VehicleWizard.tsx`, `MeetYourRide.tsx` |
| **Coming Soon Landing Page** | LIVE | `LocationCombobox` | Low | `coming-soon/page.tsx` |
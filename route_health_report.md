# Route Health Report

| Route | HTTP Status | Verdict |
|---|---|---|
| `/it/` | 200 | ✅ LIVE |
| `/it/cerca` | 200 | ✅ LIVE |
| `/it/offri` | 200 | ✅ LIVE |
| `/it/richieste` | 200 | ✅ LIVE |
| `/it/profilo` | 200 | ✅ LIVE |
| `/it/gruppi` | 200 | ✅ LIVE |
| `/it/hubs` | 200 | ✅ LIVE |
| `/it/hubs/events` | 200 | ✅ LIVE |
| `/it/eventi` | 200 | ✅ LIVE |
| `/it/statistiche` | 200 | ✅ LIVE |
| `/coming-soon` | 307 | ✅ REDIRECT |

All primary Next.js routes and app router endpoints return 200 OK. The `/coming-soon` route redirects successfully based on the active middleware configuration (waitlist mode disabled).
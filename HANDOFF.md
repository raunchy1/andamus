# Andamus — Handoff complet pentru AI coding

> Data: 2 aprilie 2026 | Branch: `claude/app-status-review-3zdTf` | Repo: `raunchy1/andamus`

---

## CE ESTE

**Andamus** = platformă carpooling gratuită pentru Sardinia (Italia). Next.js 16 + Supabase + Stripe. Utilizatorii caută/oferă curse, rezervă locuri, chat real-time, gamification, subscripții premium.

**Dev server:** `npm run dev` → port **7001**
**URL prod:** https://andamus.it
**Admin:** cristianermurache@gmail.com

---

## TECH STACK

| | Versiune |
|--|--|
| Next.js | 16.2.1 (App Router) |
| React | 19.2.4 |
| TypeScript | ^5 |
| TailwindCSS | ^4 (PostCSS plugin) |
| Supabase JS | ^2.100.1 |
| Stripe | ^21.0.1 |
| next-intl | ^4.8.3 (IT/EN/DE) |
| Framer Motion | ^12.38.0 |
| Recharts | ^3.8.1 |
| web-push | ^3.6.7 |
| lucide-react | ^1.7.0 |

---

## ENVIRONMENT VARIABLES (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_DRIVER_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://andamus.it
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@andamus.it
CRON_SECRET=secret_random
```

Generează VAPID keys cu: `npm run vapid:generate`

---

## STRUCTURA PAGINI

```
app/[locale]/
├── page.tsx              # Home (1200+ linii, dual Mobile+Desktop)
├── cerca/page.tsx        # Căutare curse (1206 linii)
├── offri/page.tsx        # Publică cursă (1137 linii)
├── corsa/[id]/page.tsx   # Detaliu cursă + rezervare
├── chat/[bookingId]/     # Chat real-time (foto/voce/locație)
├── profilo/page.tsx      # Profil user (1388 linii)
├── verifica/page.tsx     # KYC - verificare identitate
├── statistiche/page.tsx  # Stats + CO2 + grafice Recharts
├── premium/page.tsx      # Planuri Stripe
├── invita/page.tsx       # Referral system
├── join/page.tsx         # Join via referral link
├── eventi/page.tsx       # Evenimente sardine
├── eventi/[slug]/        # Detaliu eveniment
├── gruppi/page.tsx       # Grupuri carpool
├── gruppo/[id]/          # Detaliu grup
├── richieste/page.tsx    # Cereri pasageri (reverse marketplace)
├── richiesta/[id]/       # Detaliu cerere
└── admin/page.tsx        # Admin panel (767 linii)
```

**Pattern arhitectură:** fiecare pagină mare = `<PageMobile>` + `<PageDesktop>` în același fișier. Logica e client-side cu Supabase JS SDK (nu server actions).

---

## API ROUTES

| Route | Metodă | Scop |
|-------|--------|------|
| `/api/stripe/checkout` | POST | Inițiază session checkout Stripe |
| `/api/stripe/webhook` | POST | Primește events Stripe (subscription updates) |
| `/api/stripe/portal` | POST | Stripe Billing Portal |
| `/api/push/subscribe` | POST | Înregistrare Web Push |
| `/api/push/unsubscribe` | POST | Dezabonare push |
| `/api/push/send` | POST | Trimite notificare push |
| `/api/alerts/check` | POST | Verifică ride_alerts la cursă nouă |
| `/api/rides/generate-recurring` | POST | Cron: generare curse din templates |

---

## COMPONENTE

| Component | Scop |
|-----------|------|
| `navbar.tsx` | Nav responsivă cu auth (453 linii) |
| `BottomNav.tsx` | Bottom nav mobile (4 items) |
| `RideListItem.tsx` | Card cursă Mobile+Desktop |
| `SafetyButton.tsx` | SOS flotant + modal urgență |
| `OnboardingModal.tsx` | Tutorial 5 slide-uri (Framer Motion) |
| `WeatherWidget.tsx` | Meteo Open-Meteo (gratis, fără cheie) |
| `SardiniaMap.tsx` | Hartă SVG interactivă Sardinia |
| `NotificationBell.tsx` | Dropdown notificări real-time (Supabase) |
| `PushNotificationToggle.tsx` | Web Push subscribe/unsubscribe |
| `ShareRide.tsx` | Share WhatsApp/Telegram/Facebook |
| `RatingModal.tsx` | Review 5 stele post-cursă |
| `ReportUser.tsx` | Raportare comportament |
| `BadgeDisplay.tsx` | Badge-uri + niveluri + progress |
| `EmptyState.tsx` | 5 variante empty states |

---

## BAZA DE DATE — 22 TABELE SUPABASE

### Tabele principale
```sql
profiles      -- User profiles, rating, puncte, stripe_customer_id
rides         -- Curse cu from_city, to_city, date, time, seats, price
bookings      -- Rezervări (pending/confirmed/rejected)
messages      -- Chat: type=text/image/location/audio
reviews       -- Rating 1-5 + comentariu
notifications -- Notificări in-app
verifications -- KYC: phone/email/id_document/driver_license
safety_reports-- Rapoarte comportament
```

### Tabele din migrații (001–013)
```sql
badges               -- Gamification badges
referrals            -- Sistem referral (25 puncte)
ride_alerts          -- Alerte pentru curse potrivite
push_subscriptions   -- WebPush endpoints
subscriptions        -- Stripe subscripții
ride_templates       -- Template-uri curse recurente
ride_instances       -- Instanțe generate din templates
ride_requests        -- Cereri pasageri (reverse marketplace)
ride_stops           -- Opriri intermediare
events               -- Evenimente sardine (5 pre-seeded)
carpool_groups       -- Grupuri (4 pre-seeded)
group_memberships    -- Membrii grupuri
booking_cancellations-- Istoricul anulărilor
user_actions         -- Audit log pentru rate limiting
```

### Funcții PostgreSQL (RPC)
- `handle_new_user()` — auto-creează profil la signup
- `add_user_points(uuid, points)` — puncte + nivel
- `check_and_award_badge(uuid, type)` — badge dacă nu există
- `apply_referral_bonus(new_user_id, code)` — bonus referral
- `generate_rides_from_templates(days)` — generare curse recurente
- `get_admin_stats()` — statistici admin
- `get_driver_stats(uuid)` — statistici șofer

---

## GAMIFICATION

### Puncte per acțiune
| Acțiune | Puncte |
|---------|--------|
| Prima cursă | +50 |
| Fiecare cursă | +10 |
| Rezervare confirmată | +15 |
| Recenzie 5 stele primită | +20 |
| Verificare identitate | +30 |

### Niveluri
| Nivel | Puncte | Emoji |
|-------|--------|-------|
| Viaggiatore | 0–99 | 🚗 |
| Esploratore | 100–299 | 🗺️ |
| Sardo DOC | 300–599 | 🦁 |
| Re della Strada | 600–999 | 👑 |
| Leggenda Sarda | 1000+ | ⭐ |

### Badge-uri
`first_ride` / `welcome` / `verified` / `five_stars` / `habitue` (10 corse) / `ambassador` (50 corse)

---

## STRIPE — PLANURI

| Plan | Preț | Env var |
|------|------|---------|
| Gratuito | €0 | — |
| Premium | €4.99/lună | `STRIPE_PREMIUM_PRICE_ID` |
| Driver Pro | €9.99/lună | `STRIPE_DRIVER_PRICE_ID` |

**Flow:** User → `/api/stripe/checkout` → Stripe → webhook → `profiles.subscription_plan`

---

## AUTENTIFICARE

- Google OAuth via Supabase Auth
- `lib/supabase/client.ts` → `createBrowserClient()`
- `lib/supabase/server.ts` → `createServerClient()` cu cookies SSR
- `lib/auth.ts` → `signInWithGoogle()`, `signOut()`, `getUser()`
- Configurare: Supabase Dashboard → Authentication → Providers → Google

---

## INTERNAȚIONALIZARE

- `next-intl` ^4.8.3
- Limbi: `it` (default), `en`, `de`
- Fișiere: `messages/it.json`, `en.json`, `de.json` (146 chei fiecare, sincronizate)
- URL: `/it/cerca`, `/en/cerca`, `/de/cerca`

---

## DESIGN SYSTEM

```
Brand roșu:   #e63946
Background:   bg-background (CSS var dark)
Cards:        bg-card
Muted:        bg-muted
Text:         text-foreground / text-muted-foreground
```

### Z-index
```
z-40:    BottomNav, header pagini
z-[45]:  Action buttons fixed (deasupra BottomNav)
z-50:    SafetyButton flotant
z-[60]:  Modals/overlays
z-[70]:  SOS confirm modal
```

---

## SECURITATE

- **Headers:** X-Frame-Options DENY, CSP complet, HSTS, nosniff
- **Rate limiting:** 10 ride/zi, 20 bookings/zi, 10 reviews/zi
- **XSS:** sanitizeInput() în `lib/security.ts`
- **SQL injection:** detectSQLInjection() în `lib/security.ts`
- **RLS:** activat pe toate tabelele Supabase

---

## LIBRĂRII EXTERNE

| Serviciu | Utilizare | API Key? |
|---------|-----------|---------|
| Supabase | DB + Auth + Storage + Realtime | ✅ DA |
| Stripe | Plăți subscripții | ✅ DA |
| Google Maps | Rute + navigație | ✅ DA |
| Open-Meteo | Meteo | ❌ Gratis |
| Web Push | Push notifications | ✅ VAPID keys |

---

## CE E IMPLEMENTAT ✅

- Căutare/ofertă curse cu filtre avansate
- Sistem de rezervări (pending → confirmed/rejected)
- Chat real-time cu text/foto/locație/voce
- Gamification complet (puncte, niveluri, 6 badge-uri)
- Stripe subscripții (Premium + Driver)
- KYC verification (telefon OTP, ID upload, permis)
- Push notifications (Web Push API)
- Notificări real-time (Supabase Realtime)
- Review/rating sistem
- Curse recurente (templates + auto-generare)
- Reverse marketplace (cereri pasageri)
- Evenimente + Grupuri carpool
- Sistem referral (25 puncte per referral)
- Alerte curse (notifică la apariție)
- Admin panel complet
- Dark mode + i18n 3 limbi
- PWA installabilă (manifest + service worker)
- Safety button SOS (cheamă 112, share locație)
- Statistici cu grafice (Recharts) + export CSV

---

## CE LIPSEȘTE PENTRU LANSARE

1. **`.env.local`** cu cheile reale (Supabase, Stripe live, VAPID)
2. **Migrații DB** rulate pe Supabase production (`npm run db:push`)
3. **Stripe** — produse + price IDs + webhook URL configurat
4. **Deploy Vercel** + env vars în dashboard
5. **Privacy Policy + Termeni & Condiții** (GDPR obligatoriu Italia)
6. **Twilio** în Supabase (pentru SMS OTP real la verificare telefon)

---

## COMENZI

```bash
npm install          # Instalare dependențe
npm run dev          # Dev server pe port 7001
npm run build        # Build producție
npm run vapid:generate  # Generează VAPID keys pentru push
npm run db:push      # Aplică migrații pe Supabase remote
npm run db:status    # Verifică starea migrațiilor
```

---

## GIT — ULTIMELE COMMITURI

```
3d56336  design: fix UI consistency, z-index, dark theme
1c63232  fix: OTP real, email auto-verify, export CSV, env.example
b55a06f  chore: remove temporary screenshots
c864695  fix: resolve hydration crash and loading hang
1acd61f  feat: premium interactive SardiniaMap
6388426  Implement dual Desktop + Mobile design system
7688aaa  Andamus v1.0 - Production ready
d6a9c2d  Production optimizations: SEO, performance, PWA, security
```

---

*Generat automat de Claude Code — 2 aprilie 2026*

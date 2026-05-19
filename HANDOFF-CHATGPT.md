# ANDAMUS — Document Complet de Handoff
> Carpooling app pentru Sardinia (Italia) — context complet pentru dezvoltare continuă

**URL producție:** https://andamus.vercel.app  
**Repository:** https://github.com/raunchy1/andamus  
**Branch activ:** `claude/app-status-review-3zdTf`  
**Data audit:** Mai 2026

---

## 1. OVERVIEW APLICAȚIE

**Ce face:** Platformă de carpooling gratuită pentru Sardinia. Utilizatorii pot oferi sau căuta locuri în mașină între orașele sarde. Modelul de business: freemium cu abonamente Stripe.

**Audiență țintă:** Rezidenți din Sardinia, turiști, studenți universitari.

**Limbi:** Italiană (default), Engleză, Germană.

**Status:** MVP funcțional complet, nelansat public. Toate feature-urile principale sunt implementate. Rămân câteva probleme de securitate de rezolvat înainte de lansare.

---

## 2. STACK TEHNIC (versiuni exacte)

| Tehnologie | Versiune | Rol |
|---|---|---|
| Next.js | 16.2.1 | Framework principal (App Router, Turbopack) |
| React | 19.2.4 | UI |
| TypeScript | ^5 | Type safety |
| Supabase JS SDK | ^2.100.1 | Backend-as-a-service (DB + Auth + Storage) |
| @supabase/ssr | ^0.9.0 | Server-side rendering cu cookies |
| next-intl | ^4.8.3 | Internaționalizare (i18n) |
| Stripe | ^21.0.1 | Plăți și abonamente |
| @stripe/stripe-js | ^9.0.1 | Client-side Stripe |
| TailwindCSS | ^4 | Styling (PostCSS plugin, fără tailwind.config.ts) |
| framer-motion | ^12.38.0 | Animații |
| lucide-react | ^1.7.0 | Icoane |
| react-hot-toast | ^2.6.0 | Notificări UI |
| recharts | ^3.8.1 | Grafice statistici |
| web-push | ^3.6.7 | Push notifications (VAPID) |
| shadcn | ^4.1.1 | Componente UI base |

**Port dev:** 7001 (`npm run dev`)  
**Build:** `npm run build`

---

## 3. STRUCTURA FOLDERE

```
andamus/
├── app/
│   ├── layout.tsx                    # Root layout: html dark class, SW registration
│   ├── globals.css                   # CSS variables, TailwindCSS v4
│   ├── [locale]/                     # Toate paginile (IT/EN/DE)
│   │   ├── layout.tsx                # Locale layout: Navbar, ThemeProvider, SafetyButton
│   │   ├── page.tsx                  # Home (mobile + desktop)
│   │   ├── cerca/page.tsx            # Căutare curse
│   │   ├── offri/page.tsx            # Oferă cursă
│   │   ├── profilo/page.tsx          # Profil utilizator
│   │   ├── corsa/[id]/page.tsx       # Detalii cursă
│   │   ├── chat/[bookingId]/page.tsx # Chat în timp real
│   │   ├── verifica/page.tsx         # Verificare identitate KYC
│   │   ├── premium/page.tsx          # Planuri premium
│   │   ├── premium/success/page.tsx  # Confirmare plată
│   │   ├── premium/cancel/page.tsx   # Anulare plată
│   │   ├── admin/page.tsx            # Dashboard admin
│   │   ├── statistiche/page.tsx      # Statistici utilizator
│   │   ├── invita/page.tsx           # Sistem referral
│   │   ├── join/page.tsx             # Landing referral
│   │   ├── eventi/page.tsx           # Lista evenimente
│   │   ├── eventi/[slug]/page.tsx    # Detaliu eveniment
│   │   ├── gruppi/page.tsx           # Lista grupuri carpooling
│   │   ├── gruppo/[id]/page.tsx      # Detaliu grup
│   │   ├── richieste/page.tsx        # Lista cereri pasageri
│   │   ├── richiesta/[id]/page.tsx   # Detaliu cerere
│   │   └── auth/
│   │       ├── callback/route.ts     # OAuth callback
│   │       └── auth-code-error/page.tsx
│   └── api/
│       ├── stripe/checkout/route.ts  # Creare sesiune Stripe
│       ├── stripe/portal/route.ts    # Portal gestiune abonament
│       ├── stripe/webhook/route.ts   # Webhook Stripe
│       ├── push/subscribe/route.ts   # Înregistrare push
│       ├── push/unsubscribe/route.ts # Dezabonare push
│       ├── push/send/route.ts        # Trimitere notificare push
│       └── rides/generate-recurring/ # Generare curse recurente (cron)
├── components/
│   ├── navbar.tsx                    # Header desktop + mobile menu
│   ├── BottomNav.tsx                 # Navigare bottom mobile (4 tab-uri)
│   ├── SardiniaMap.tsx               # Hartă SVG interactivă cu rute
│   ├── SafetyButton.tsx              # Buton urgență plutitor (z-50)
│   ├── ThemeProvider.tsx             # Dark/light theme context
│   ├── OnboardingModal.tsx           # Modal bun venit (prima vizită)
│   ├── NotificationBell.tsx          # Clopoțel notificări
│   ├── RatingModal.tsx               # Modal recenzie
│   ├── ReportUser.tsx                # Raportare utilizator
│   ├── WeatherWidget.tsx             # Widget meteo (Open-Meteo API)
│   ├── RideListItem.tsx              # Card cursă în lista rezultate
│   ├── BadgeDisplay.tsx              # Afișare badge-uri gamification
│   ├── PushNotificationToggle.tsx    # Toggle notificări push
│   ├── ShareRide.tsx                 # Share cursă
│   ├── RouteMap.tsx                  # Hartă rută Google Maps
│   ├── SardiniaMap.tsx               # Hartă SVG Sardinia
│   └── view-mode.tsx                 # Context mobile/desktop
├── lib/
│   ├── supabase/client.ts            # createBrowserClient
│   ├── supabase/server.ts            # createServerClient (SSR)
│   ├── supabase/middleware.ts        # Session refresh
│   ├── auth.ts                       # signInWithGoogle, signOut, getUser
│   ├── gamification.ts               # Puncte, nivele, badge-uri
│   ├── notifications.ts              # Creare notificări in-app
│   ├── sardinia-cities.ts            # 50+ orașe cu coordonate GPS
│   ├── security.ts                   # Rate limiting, sanitizare input
│   ├── web-push.ts                   # VAPID setup
│   └── weather.ts                    # Open-Meteo API
├── messages/
│   ├── it.json                       # 202 chei traduceri italiana
│   ├── en.json                       # 202 chei engleza
│   └── de.json                       # 202 chei germana
├── supabase/migrations/              # 13 migrații SQL
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   └── icon-{72..512}x*.png         # 8 mărimi icoane PWA
└── middleware.ts                     # next-intl locale routing
```

---

## 4. AUTH FLOW

**Provider:** Google OAuth via Supabase Auth (fără email/parolă, fără telefon în prod)

**Flow complet:**
1. User apasă "Accedi con Google" → `signInWithGoogle()` din `lib/auth.ts`
2. `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: origin + "/auth/callback" })`
3. Google redirect → `app/[locale]/auth/callback/route.ts`
4. `supabase.auth.exchangeCodeForSession(code)` → sesiune în cookie
5. Dacă există cookie `pending_referral_code` → aplică bonus referral via RPC
6. Redirect la `/profilo` (succes) sau `/auth/auth-code-error` (eșec)

**Protecție rute:** DOAR client-side! Fiecare pagină protejată face:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) { router.push("/"); return; }
```

**Rute protejate:** profilo, offri, premium, verifica, invita, chat/[bookingId], statistiche, admin  
**Rute publice:** home, cerca, corsa/[id], eventi, gruppi, richieste, join

**⚠️ PROBLEMĂ SECURITATE:** Nu există protecție server-side pentru `/admin`. Un utilizator poate accesa pagina ignorând redirect-ul client.

---

## 5. SUPABASE — SCHEMA COMPLETĂ (19 tabele)

### Tabele de bază (pre-existente, nu în migrații)
- **profiles** — utilizatori (extins prin migrații cu câmpuri noi)
- **rides** — curse oferite de șoferi
- **bookings** — rezervări pasageri la curse
- **messages** — mesaje chat

### Tabele create prin migrații

#### `reviews` (001)
```sql
id UUID PK | ride_id FK→rides | reviewer_id FK→profiles
reviewed_id FK→profiles | rating INTEGER(1-5) | comment TEXT
created_at | UNIQUE(ride_id, reviewer_id)
```
RLS: SELECT public | INSERT auth.uid()=reviewer_id  
Trigger: auto-update `profiles.rating` la insert/update recenzie

#### `notifications` (002)
```sql
id UUID PK | user_id FK→profiles | type TEXT | title TEXT | body TEXT
read BOOLEAN=false | ride_id FK | booking_id FK | created_at
```
Types: `booking_request|booking_accepted|booking_rejected|new_message|new_review|ride_alert`  
RLS: SELECT/UPDATE propriu | INSERT WITH CHECK(true) ← **PROBLEMĂ SECURITATE**  
Function: `get_unread_notifications_count(user_uuid)`

#### `verifications` (003)
```sql
id UUID PK | user_id FK→profiles | type TEXT | status TEXT='pending'
document_url TEXT | verified_at | rejected_reason | created_at
```
Types: `phone|email|id_document|driver_license`  
Status: `pending|approved|rejected`  
Profiles câmpuri adăugate: `phone_verified|email_verified|id_verified|driver_verified|phone_number`

#### `safety_reports` (003)
```sql
id UUID PK | reporter_id FK | reported_id FK | ride_id FK
type TEXT | description TEXT | status TEXT='pending' | created_at
```
Types: `inappropriate_behavior|no_show|fake_profile|other`

#### `badges` (005)
```sql
id UUID PK | user_id FK→profiles | type TEXT | earned_at
```
RLS: SELECT public | INSERT WITH CHECK(true) ← **PROBLEMĂ SECURITATE**  
Profiles câmpuri: `points INTEGER=0 | level TEXT='Viaggiatore'`

#### `referrals` (006)
```sql
id UUID PK | referrer_id FK | referred_id FK UNIQUE | points_awarded=25 | created_at
```
Profiles câmpuri: `referral_code TEXT UNIQUE | referred_by FK | referrals_count | referral_points_earned`  
Functions: `generate_referral_code()`, `apply_referral_bonus(new_user_id, referrer_code)`, `get_referral_leaderboard(limit_count=5)`

#### Messages câmpuri adăugate (007)
`type TEXT='text'|'image'|'location'|'audio' | media_url | location_lat | location_lng | duration INTEGER`

#### `user_actions` (008) — audit log
```sql
id UUID PK | user_id FK→auth.users | action TEXT | metadata JSONB | created_at
```
Function: `cleanup_old_user_actions()` (>30 zile)

#### `ride_alerts` (009)
```sql
id UUID PK | user_id FK | from_city | to_city | start_date | end_date | min_seats | max_price | created_at
```
Trigger: `trg_check_ride_alerts` — notifică utilizatorii la cursă nouă potrivită

#### `push_subscriptions` (009)
```sql
id UUID PK | user_id FK | endpoint TEXT UNIQUE | p256dh TEXT | auth TEXT | created_at
```

#### Rides câmpuri adăugate (009)
`smoking_allowed|pets_allowed|large_luggage BOOLEAN | music_preference TEXT | women_only|students_only BOOLEAN`

#### `subscriptions` (010)
```sql
id UUID PK | user_id FK | stripe_subscription_id TEXT UNIQUE | stripe_customer_id TEXT
plan_id TEXT | status TEXT | current_period_start/end | canceled_at
```
Profiles câmpuri: `stripe_customer_id | subscription_status='inactive' | subscription_period_end | subscription_plan`  
Status: `inactive|active|past_due|canceled`  
Plans: `free|premium|driver`

#### `ride_templates` (010) — curse recurente
```sql
id UUID PK | user_id FK | from_city | to_city | time | seats | price
meeting_point | notes | preferences JSONB | recurrence_days INTEGER[] | is_active=true | created_at
```
Function: `generate_rides_from_templates(p_days_ahead=30)` — generează curse pentru N zile

#### `ride_instances` (010)
```sql
id UUID PK | template_id FK | ride_id FK | scheduled_date DATE | UNIQUE(template_id, scheduled_date)
```

#### `ride_requests` (011) — pasageri caută curse
```sql
id UUID PK | user_id FK | from_city | to_city | date DATE | time | time_flexibility='exact'
seats_needed=1 | max_price | notes | status='active' | created_at
```
time_flexibility: `exact|1h|3h|any` | status: `active|fulfilled|canceled`  
Trigger: notifică utilizatori cu cereri potrivite la cursă nouă

#### `ride_stops` (011) — opriri intermediare
```sql
id UUID PK | ride_id FK | city TEXT | order_index INTEGER
```

#### `events` (012)
```sql
id UUID PK | slug TEXT UNIQUE | name | description | image_url | start_date | end_date | location | city | created_at
```

#### `carpool_groups` (012)
```sql
id UUID PK | name | description | type TEXT | city | created_by FK | created_at
```
Types: `university|airport|commute|event|other`

#### `group_memberships` (012)
```sql
id UUID PK | group_id FK | user_id FK | joined_at | UNIQUE(group_id, user_id)
```

#### `ride_price_logs` (012)
```sql
id UUID PK | from_city | to_city | suggested_price | distance_km | created_at
```

#### `booking_cancellations` (013)
```sql
id UUID PK | booking_id FK | canceled_by FK | reason TEXT | created_at
```
Profiles câmpuri: `cancellation_penalty_count INTEGER=0`  
Functions: `increment_cancellation_penalty(user_uuid)`, `get_driver_stats(driver_uuid)`

### Funcții RPC importante
| Funcție | Descriere |
|---|---|
| `add_user_points(user_uuid, points_to_add)` | Adaugă puncte, actualizează level |
| `check_and_award_badge(user_uuid, badge_type)` | Award badge dacă nu există deja |
| `get_admin_stats()` | Returnează total_users, total_rides, total_bookings, pending_reports |
| `apply_referral_bonus(new_user_id, referrer_code)` | Aplică bonus 25 puncte ambilor |
| `get_referral_leaderboard(limit_count)` | Top referreri luna curentă |
| `generate_rides_from_templates(p_days_ahead)` | Generare automată curse din template |
| `get_driver_stats(driver_uuid)` | Statistici complete șofer |

---

## 6. GAMIFICATION SYSTEM

### Puncte per acțiune
| Acțiune | Puncte |
|---|---|
| Prima cursă publicată | 50 |
| Fiecare cursă publicată | 10 |
| Rezervare confirmată | 15 |
| Recenzie 5 stele primită | 20 |
| Identitate verificată | 30 |

### Nivele
| Nivel | Minim | Maxim | Emoji |
|---|---|---|---|
| Viaggiatore | 0 | 99 | 🚗 |
| Esploratore | 100 | 299 | 🗺️ |
| Sardo DOC | 300 | 599 | 🦁 |
| Re della Strada | 600 | 999 | 👑 |
| Leggenda Sarda | 1000 | ∞ | ⭐ |

### Badge-uri
| Badge | Tip | Condiție |
|---|---|---|
| Prima Corsa | first_ride | Prima cursă publicată |
| Benvenuto | welcome | Profil completat |
| Verificato | verified | Identitate verificată |
| 5 Stelle | five_stars | Prima recenzie 5 stele |
| Habitué | habitue | 10 curse publicate |
| Ambasciatore | ambassador | 50 curse publicate |

---

## 7. STRIPE INTEGRATION

### Planuri
| Plan | Price ID env var | Preț | Funcționalități cheie |
|---|---|---|---|
| Gratuito | — | €0 | 3 curse/lună, chat de bază |
| Premium | STRIPE_PREMIUM_PRICE_ID | €4.99/lună | Curse nelimitate, badge, prioritate |
| Driver Pro | STRIPE_DRIVER_PRICE_ID | €9.99/lună | Tot Premium + tools șofer, API |

### API Routes Stripe
- `POST /api/stripe/checkout` — creează sesiune Stripe, creează/găsește customer, redirect success/cancel
- `POST /api/stripe/portal` — link portal gestiune abonament
- `POST /api/stripe/webhook` — procesează: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated/deleted`

### Webhook events gestionate
La `checkout.session.completed`: upsert în `subscriptions` + update `profiles.subscription_plan/status`  
La cancel/update: actualizează status în `subscriptions` + `profiles`

---

## 8. PUSH NOTIFICATIONS

**Librărie:** `web-push` cu VAPID keys  
**Setup:** `lib/web-push.ts` → `ensureVapidDetails()` setat din env vars  
**Subscribe:** `POST /api/push/subscribe` — salvează endpoint în `push_subscriptions`  
**Send:** `POST /api/push/send` — trimite la endpoint specific  
⚠️ **PROBLEMĂ:** `/api/push/send` nu verifică autentificarea — oricine poate trimite

### Service Worker (`public/sw.js`)
- Cache name: `andamus-v2`
- Network-first pentru HTML, cache-first pentru assets statice
- Push notification handling cu routing la click

---

## 9. VARIABILE DE MEDIU (toate)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_DRIVER_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://andamus.it

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@andamus.it

# Cron protection
CRON_SECRET=...  # ← NU e în .env.example, trebuie adăugat!
```

---

## 10. TOATE PAGINILE — STATUS

| Pagină | Rută | Status | Note |
|---|---|---|---|
| Home | `/[locale]` | ✅ Complet | Mobile (map+carousel) + Desktop (hero+grid) |
| Căutare | `/[locale]/cerca` | ✅ Complet | Filtre avansate, pull-to-refresh, ride alerts |
| Oferă cursă | `/[locale]/offri` | ✅ Complet | Form complet, recurente, opriri intermediare |
| Profil | `/[locale]/profilo` | ✅ Complet | 6 tab-uri, gamification, booking requests |
| Detaliu cursă | `/[locale]/corsa/[id]` | ✅ Complet | Booking, recenzii, curse similare |
| Chat | `/[locale]/chat/[bookingId]` | ✅ Complet | Text, poze, audio, locație, real-time |
| Verificare | `/[locale]/verifica` | ✅ Complet | Telefon OTP, email, ID, permis |
| Premium | `/[locale]/premium` | ✅ Complet | 3 planuri, Stripe checkout |
| Admin | `/[locale]/admin` | ✅ Complet | Users, rides, reports, verifications |
| Statistici | `/[locale]/statistiche` | ✅ Complet | Grafice, export CSV/TXT |
| Invită | `/[locale]/invita` | ✅ Complet | Cod referral, leaderboard, share social |
| Join | `/[locale]/join` | ✅ Complet | Landing page referral |
| Evenimente | `/[locale]/eventi` | ✅ Complet | Lista eventi Sardinia |
| Grupuri | `/[locale]/gruppi` | ✅ Complet | Lista grupuri carpooling |
| Grup detaliu | `/[locale]/gruppo/[id]` | ✅ Complet | Join/leave grup |
| Cereri | `/[locale]/richieste` | ✅ Complet | Lista cereri pasageri |
| Cerere detaliu | `/[locale]/richiesta/[id]` | ✅ Complet | Detaliu cerere |
| Auth callback | `/[locale]/auth/callback` | ✅ Complet | OAuth + referral bonus |
| Auth error | `/[locale]/auth/auth-code-error` | ✅ Complet | Pagina eroare OAuth |

---

## 11. COMPONENTE PRINCIPALE

### `components/navbar.tsx`
- Desktop: logo, linkuri nav (Home/Cerca/Richieste/Offri/Eventi/Gruppi), auth buttons, notification bell, language selector, theme toggle
- Mobile: hamburger menu cu toate linkurile
- Admin link vizibil doar pentru emailuri specifice
- Scroll detection → bg transparent→blur
- **PROBLEMĂ:** Admin emails hardcodate: `cristiermurache@gmail.com`, `cristianermurache@gmail.com`

### `components/BottomNav.tsx`
- Mobile only (ascuns la md+), z-40
- 4 tab-uri: Explore (home), Routes (cerca), Trips (offri), Profile (profilo)
- Material Symbols icons, active state cu FILL

### `components/SardiniaMap.tsx`
- SVG interactiv 500x600 viewBox
- 8 orașe: Cagliari, Sassari, Olbia, Nuoro, Oristano, Tortolì, Alghero, Carbonia
- 8 rute animate cu dasharray (animație draw-on)
- Hover tooltip cu distanță/durată
- Click pe oraș → highlight rute conectate
- Background: gradienți SVG landscape (sky/mountain/sea)

### `components/SafetyButton.tsx`
- Buton roșu plutitor (z-50) → modal urgență
- Apel 112, share locație GPS via clipboard
- SOS counter (5 click-uri) → alertă vizuală extremă (z-70)

### `components/ThemeProvider.tsx`
- Context dark/light theme, default dark
- `<html class="dark">` setat din root layout (server-side)
- localStorage persistence
- Mounted guard pentru hydration

---

## 12. DESIGN SYSTEM

### Culori principale
| Variabilă CSS | Valoare | Folosit pentru |
|---|---|---|
| `bg-background` | #131313 / CSS var | Fundal pagini |
| `#e63946` | — | Primary (roșu Andamus) |
| `#ffb3b1` | — | Primary light (rute hartă, active nav) |
| `#e5e2e1` | — | Text principal |
| `#1c1b1b` | — | Card background |
| `#2a2a2a` | — | Border |

### Z-Index hierarchy
```
z-40  → BottomNav, Navbar
z-45  → Action buttons (corsa page)
z-50  → SafetyButton flotant
z-60  → Modale
z-70  → SOS emergency
```

### Breakpoints
- Mobile: < 768px (md) → BottomNav, compact UI
- Desktop: ≥ 768px → Navbar desktop, layout extins

---

## 13. I18N — STRUCTURA CHEI (202 chei per limbă)

Fișiere: `messages/it.json`, `en.json`, `de.json` — identice ca structură.

```
metadata.{title, description}
nav.{home, search, offer, profile, admin, invite, login, logout, loginWithGoogle}
theme.{light, dark, toggle}
language.{it, en, de, select}
home.{hero.*, todayRides, noRidesToday, howItWorks.*, popularRoutes.*, events.*, stats.*, footer.*}
search.{title, from, to, date, filters, maxPrice, minSeats, verifiedOnly, ...}
offer.{title, loginRequired, form.*, success.*, errors.*}
ride.{details, route, date, time, seats, price, free, driver, meetingPoint, notes, ...}
profile.{title, rides, bookings, reviews, stats.*, verification.*, gamification.*, actions.*, ...}
chat.{title, placeholder, send, bookingConfirmed, bookingPending}
common.{cancel, save, delete, edit, close, back, continue, loading, error, success, warning, info}
```

**Lipsesc:** chei pentru Premium plans (hardcodate în componentă)

---

## 14. PWA CONFIG

**manifest.json:**
- Name: Andamus | Short name: Andamus
- Display: standalone | Lang: it | Start URL: /it
- Theme: #e63946 | Background: #1a1a2e
- 8 icoane (72px→512px), toate maskable
- 3 shortcuts: Cerca, Offri, Profilo
- 2 screenshots (wide + narrow)

**sw.js (cache: andamus-v2):**
- Install: pre-cache assets statice
- Network-first pentru HTML, cache-first pentru assets
- Push notifications cu icon/badge
- Click notification → deschide URL specific

---

## 15. BUGURI CUNOSCUTE ȘI PROBLEME

### 🔴 CRITICE — Blochează lansarea

**B1: Token Supabase hardcodat în `package.json`**
```json
"db:push": "SUPABASE_ACCESS_TOKEN=sbp_af281b463a2737aa4653ca95d2f94ec61bfa2478 ..."
```
→ **ACȚIUNE IMEDIATĂ:** Revocă tokenul din Supabase Dashboard → Settings → Access Tokens  
→ **FIX:** Înlocuiește cu `$SUPABASE_ACCESS_TOKEN` și setează în `.env.local`

**B2: `/api/push/send` fără autentificare**
- Fișier: `app/api/push/send/route.ts`
- Oricine poate trimite notificări push la orice endpoint
- **FIX:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**B3: Stripe webhook secret opțional**
- Fișier: `app/api/stripe/webhook/route.ts` linia 11
- `const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";`
- Dacă lipsește env var, orice request trece
- **FIX:** `if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET required")`

### 🟠 ÎNALTĂ PRIORITATE

**B4: RLS permisiv pe `notifications` și `badges`**
- `WITH CHECK (true)` permite orice utilizator să insereze notificări/badge-uri pentru oricine
- **FIX:** `WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role')`

**B5: CRON_SECRET opțional**
- `app/api/rides/generate-recurring/route.ts`
- Dacă `CRON_SECRET` lipsește din env, endpoint-ul e public
- **FIX:** Verifică existența secretului la start, returnează 500 dacă lipsește

**B6: Admin guard doar client-side**
- `/admin` verifică emailul doar în browser, nu server
- Vulnerabil la manipulare prin DevTools
- **FIX:** Adaugă server component check sau middleware

**B7: Admin emails hardcodate**
- `admin/page.tsx` și `navbar.tsx`: `['cristiermurache@gmail.com', 'cristianermurache@gmail.com']`
- **FIX:** Mută în env var `ADMIN_EMAILS` sau tabel Supabase `admin_roles`

### 🟡 MEDIE PRIORITATE

**B8: 20 rute fără `loading.tsx`**
- Lipsesc: admin, chat, corsa, eventi, gruppi, offri, premium, verifica, invita, join, richieste, richiesta/[id], gruppo/[id], eventi/[slug]
- Pe conexiuni lente → ecran gol
- **FIX:** Template simplu cu Loader2 spinner

**B9: `unsafe-eval` în CSP** (`next.config.ts`)
- Slăbește protecția XSS
- **FIX:** Elimină dacă nicio dependință nu o necesită

**B10: Rate limiting în memorie** (`lib/security.ts`)
- `const rateLimitStore: Record<string, RateLimitEntry> = {}`
- Se resetează la fiecare redeploy pe Vercel
- **FIX:** Mută în Supabase sau Upstash Redis

**B11: Comentariu în română în `sw.js`**
- `"Nu cache-ui paginile HTML"` — ar trebui în engleză/italiană

### 🟢 MINOR

**B12: Lista orașelor duplicată**
- `sardinianCities` array definit în 4-5 fișiere
- Ar trebui importată din `lib/sardinia-cities.ts`

**B13: `@ts-expect-error` în Stripe webhook**
- 5 linii cu `// @ts-expect-error stripe SDK types mismatch`
- Nu cauzează erori runtime dar ascunde potențiale probleme

---

## 16. FIX-URI IMPLEMENTATE (în această sesiune de dev)

| Fix | Fișiere modificate |
|---|---|
| `createClient()` wrapat în `useMemo` | 22 fișiere React |
| `new Date()` din JSX → `useState` + `useEffect` | `app/[locale]/page.tsx` |
| `Promise.all` destructuring sigur | `gruppo/[id]/page.tsx`, `richiesta/[id]/page.tsx` |
| `export const dynamic = 'force-dynamic'` | 5 rute dinamice |
| ThemeProvider FOUC fix | `components/ThemeProvider.tsx` |
| Error boundaries create | 18 fișiere `error.tsx` |
| Pagina `/auth/auth-code-error` creată | nouă pagină |
| Fix TypeScript build: `todayDate` prop | `app/[locale]/page.tsx` |
| Z-index hierarchy fixat | BottomNav, Navbar, SafetyButton |
| Dark theme unificat | `bg-background` CSS var în 6 pagini |
| Hartă Sardinia: gradient SVG landscape | `components/SardiniaMap.tsx` |
| Text Romanian→Italian în hartă | `components/SardiniaMap.tsx` |
| Skip button OnboardingModal în modal | `components/OnboardingModal.tsx` |
| WeatherWidget icon culoare | `components/WeatherWidget.tsx` |

---

## 17. CHECKLIST LANSARE

### Săptămâna aceasta (BLOCKER)
- [ ] **Revocă tokenul Supabase** din Dashboard → Settings → Access Tokens
- [ ] **Fix auth pe `/api/push/send`** (adaugă `getUser()` check)
- [ ] **Fix Stripe webhook secret** (obligatoriu, nu opțional)
- [ ] **Fix CRON_SECRET** (obligatoriu)
- [ ] **Setează toate env vars** pe Vercel: STRIPE_*, VAPID_*, CRON_SECRET, NEXT_PUBLIC_APP_URL

### Înainte de lansare (HIGH)
- [ ] **Fix RLS notifications + badges** (migrație Supabase)
- [ ] **Testează flow complet:** înregistrare → cursă → rezervare → chat → plată
- [ ] **Testează pe mobil real** (Android + iOS)
- [ ] **Testează Stripe** cu card test `4242 4242 4242 4242`
- [ ] **Verifică Google OAuth** cu URL producție setat în Google Console

### Înainte de lansare (MEDIUM)
- [ ] **Adaugă loading.tsx** la rutele principale (admin, offri, cerca, profilo)
- [ ] **Adaugă CRON_SECRET** în `.env.example`
- [ ] Mută admin emails în env var

### Post-lansare
- [ ] Rate limiting persistent (Upstash Redis)
- [ ] Admin guard server-side
- [ ] Analytics (Vercel Analytics sau Plausible)
- [ ] Monitoring erori (Sentry)
- [ ] Populează DB cu evenimente reale din Sardinia

---

## 18. COMENZI UTILE

```bash
# Development
npm run dev                          # Start pe port 7001

# Build
npm run build                        # Build producție

# DB
npx supabase migration list          # Lista migrații
npx supabase db push                 # Aplică migrații

# VAPID keys generate
node scripts/generate-vapid-keys.js

# Git branch activ
git checkout claude/app-status-review-3zdTf
```

---

## 19. ARHITECTURA DECIZII IMPORTANTE

1. **Nu există Server Actions** — totul e client-side cu `createBrowserClient`
2. **Middleware DOAR pentru i18n** — fără auth în middleware (risc securitate)
3. **TailwindCSS v4** — fără `tailwind.config.ts`, configurare prin CSS variables
4. **React 19 + Next.js 16** — versiuni bleeding edge, breaking changes față de documentație standard
5. **Phone OTP via Supabase** — necesită Twilio configurat în Supabase Dashboard
6. **Google OAuth** — configurat în Supabase Dashboard → Auth → Providers → Google
7. **Storage buckets** — `chat-images` și `chat-audio` (create prin migrație 007)
8. **Deployed pe Vercel** — `andamus.vercel.app`

---

*Document generat automat — Mai 2026*

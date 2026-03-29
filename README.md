# Andamus 🚗

> **Carpooling gratuito per la Sardegna**

Una piattaforma moderna e intuitiva per trovare e offrire passaggi in tutta la Sardegna. Risparmia sui costi del carburante, riduci le emissioni di CO₂ e viaggia in compagnia!

![Andamus](https://andamus.it/og-image.png)

## ✨ Features

### Core Features
- 🔍 **Cerca passaggi** - Trova corse disponibili per data, origine e destinazione
- 🚗 **Offri passaggi** - Pubblica la tua corsa e trova passeggeri
- 💬 **Chat in tempo reale** - Comunica direttamente con conducenti/passeggeri
- 🗺️ **Mappe interattive** - Visualizza il percorso con Google Maps
- 🌤️ **Meteo integrato** - Controlla le condizioni meteo per il viaggio
- 🔔 **Notifiche** - Ricevi aggiornamenti in tempo reale

### Gamification
- 🏅 **Badge System** - Sblocca badge per le tue attività
- 📊 **Livelli** - Sali di livello da "Viaggiatore" a "Leggenda Sarda"
- 🌱 **Impatto ambientale** - Traccia km percorsi e CO₂ risparmiata
- ⭐ **Recensioni** - Valuta e ricevi valutazioni dagli altri utenti

### Sicurezza
- ✅ **Verifica identità** - Verifica telefono e documento
- 🛡️ **Sistema di report** - Segnala comportamenti sospetti
- 🔒 **Auth con Google** - Accesso sicuro e veloce
- 📱 **Pulsante sicurezza** - Pulsante di emergenza sempre accessibile

### Tech Features
- 🌍 **Multilingua** - Italiano, English, Deutsch
- 📱 **PWA** - Installabile come app su mobile
- 🌙 **Dark Mode** - Interfaccia ottimizzata per la visione notturna
- ⚡ **Real-time** - Aggiornamenti istantanei con Supabase Realtime

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + CSS Animations
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth (OAuth Google)
- **Realtime**: Supabase Realtime (WebSocket)
- **Storage**: Supabase Storage
- **Maps**: Google Maps API
- **Icons**: Lucide React
- **Animations**: Framer Motion + CSS Keyframes
- **Deployment**: Vercel (consigliato)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm o pnpm
- Account Supabase
- API Key Google Maps

### Installation

1. **Clone il repository**
```bash
git clone https://github.com/raunchy1/andamus.git
cd andamus
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura le variabili d'ambiente**
```bash
cp .env.example .env.local
# Edita .env.local con le tue chiavi
```

4. **Setup Database**
```bash
# Crea un progetto su Supabase
# Esegui le migrations
SUPABASE_ACCESS_TOKEN=your-token npx supabase db push --include-all
```

5. **Avvia in development**
```bash
npm run dev
# Apri http://localhost:7001
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anonima Supabase | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API Key Google Maps | ✅ |
| `SUPABASE_ACCESS_TOKEN` | Token CLI Supabase | Per deploy |

## 📊 Database Schema

### Tables principali

**profiles**
- `id` (uuid, PK) - Riferimento auth.users
- `name` (text)
- `avatar_url` (text)
- `points` (int) - Punti gamification
- `level` (text) - Livello utente
- `rating` (float) - Valutazione media
- `phone_verified` (bool)
- `id_verified` (bool)

**rides**
- `id` (uuid, PK)
- `driver_id` (uuid, FK)
- `from_city` (text)
- `to_city` (text)
- `date` (date)
- `time` (time)
- `seats` (int)
- `price` (int)
- `status` (enum: active, completed, cancelled)
- `meeting_point` (text)
- `notes` (text)

**bookings**
- `id` (uuid, PK)
- `ride_id` (uuid, FK)
- `passenger_id` (uuid, FK)
- `status` (enum: pending, confirmed, rejected, cancelled)

**messages**
- `id` (uuid, PK)
- `booking_id` (uuid, FK)
- `sender_id` (uuid, FK)
- `content` (text)
- `type` (enum: text, image, location, audio)
- `media_url` (text)
- `read` (bool)

**badges**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `type` (text)
- `earned_at` (timestamp)

### RLS Policies
Tutte le tabelle hanno Row Level Security abilitato con policies appropriate:
- Users possono leggere solo i propri dati
- Drivers possono vedere i bookings dei propri rides
- Messaggi accessibili solo ai partecipanti della chat

## 🗂️ Project Structure

```
andamus/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Routes localizzate (it, en, de)
│   │   ├── cerca/         # Pagina ricerca
│   │   ├── offri/         # Pagina offerta corsa
│   │   ├── profilo/       # Dashboard utente
│   │   ├── corsa/[id]/    # Dettaglio corsa
│   │   ├── chat/[id]/     # Chat
│   │   ├── verifica/      # Verifica identità
│   │   ├── statistiche/   # Statistiche utente
│   │   └── ...
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Stili globali
├── components/            # React components
│   ├── ui/               # Componenti UI (shadcn)
│   ├── BottomNav.tsx     # Navigazione mobile
│   ├── EmptyState.tsx    # Stati vuoti
│   └── ...
├── lib/                   # Utilities
│   ├── supabase/         # Client Supabase
│   ├── auth.ts           # Auth helpers
│   ├── gamification.ts   # Logica gamification
│   └── ...
├── messages/             # Traduzioni i18n
│   ├── it.json
│   ├── en.json
│   └── de.json
├── supabase/
│   └── migrations/       # Database migrations
└── public/               # Assets statici
```

## 🚀 Deployment

### Vercel (Consigliato)

1. **Connetti il repository**
```bash
npm i -g vercel
vercel
```

2. **Configura le variabili d'ambiente** nel dashboard Vercel

3. **Deploy**
```bash
vercel --prod
```

### Build locale
```bash
npm run build
# Output in .next/
```

## 📝 Scripts disponibili

```bash
npm run dev          # Development server (port 7001)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check

# Supabase
npm run db:push      # Push migrations
npm run db:push:all  # Push all migrations
npm run db:status    # Check migration status
```

## 🤝 Contributing

1. Fork il repository
2. Crea un branch (`git checkout -b feature/xyz`)
3. Committa le modifiche (`git commit -m 'Add xyz'`)
4. Push al branch (`git push origin feature/xyz`)
5. Apri una Pull Request

## 📜 License

MIT License - vedi [LICENSE](LICENSE)

## 🙏 Credits

Fatto con ❤️ in Sardegna

---

**🌐 Live Demo**: [https://andamus.it](https://andamus.it)

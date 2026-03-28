# Andamus

Il carpooling sardo per viaggiare insieme. Trova e offri passaggi in tutta la Sardegna.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Auth & Database**: Supabase (Google OAuth)
- **Font**: Inter

## Design System

- **Primary Color**: #1a1a2e (dark navy)
- **Accent Color**: #e63946 (sardinian red)
- **Font**: Inter
- **Design**: Mobile-first

## Project Structure

```
andamus/
├── app/
│   ├── auth/callback/     # OAuth callback handler
│   ├── cerca/             # Search rides page
│   ├── offri/             # Post a ride page
│   ├── profilo/           # Profile page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── navbar.tsx         # Navigation bar
│   ├── footer.tsx         # Footer
│   └── ui/                # UI components
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Session middleware
│   └── utils.ts           # Utility functions
├── middleware.ts          # Next.js middleware
└── .env.local.example     # Environment variables template
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth provider in Authentication > Providers
3. Set up your Google OAuth credentials in the Google Cloud Console
4. Add the redirect URL: `http://localhost:3000/auth/callback`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Pages

- `/` - Homepage
- `/cerca` - Search for rides
- `/offri` - Post a ride offer
- `/profilo` - User profile

## License

MIT

import Link from "next/link";
import { Car, Search, UserPlus, MessageCircle, MapPin, ArrowRight } from "lucide-react";

const popularRoutes = [
  { from: "Ogliastra", to: "Cagliari" },
  { from: "Nuoro", to: "Cagliari" },
  { from: "Sassari", to: "Cagliari" },
  { from: "Olbia", to: "Sassari" },
  { from: "Oristano", to: "Cagliari" },
  { from: "Ogliastra", to: "Olbia" },
];

const steps = [
  {
    icon: UserPlus,
    title: "Registrati",
    description: "Crea un account gratis con Google in pochi secondi.",
  },
  {
    icon: Search,
    title: "Cerca o pubblica",
    description: "Trova una corsa che fa per te o offri il tuo posto libero.",
  },
  {
    icon: MessageCircle,
    title: "Viaggia insieme",
    description: "Contatta l'autista o il passeggero e parti insieme.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
        {/* Sardinia Map Background */}
        <div className="absolute inset-0 opacity-10">
          <svg
            viewBox="0 0 400 500"
            className="absolute right-0 top-1/2 h-[600px] w-auto -translate-y-1/2 translate-x-1/4 text-[#e63946]"
            fill="currentColor"
          >
            {/* Simplified Sardinia outline */}
            <path d="M200 20C150 30 100 60 80 100C60 140 50 180 60 220C70 260 90 300 120 340C140 370 150 400 145 430C140 460 160 480 200 485C240 480 260 460 255 430C250 400 260 370 280 340C310 300 330 260 340 220C350 180 340 140 320 100C300 60 250 30 200 20ZM200 450C180 445 170 435 175 420C180 405 200 395 225 420C230 435 220 445 200 450Z" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
            <Car className="h-4 w-4 text-[#e63946]" />
            <span className="text-sm text-white/80">Carpooling sardo</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Viaggia insieme
            <br />
            <span className="text-[#e63946]">in Sardegna</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Trova o offri un passaggio in tutta la Sardegna. Gratis.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/cerca"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#c92a37] hover:shadow-lg hover:shadow-[#e63946]/25"
            >
              <Search className="h-5 w-5" />
              Cerca un passaggio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/offri"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
            >
              <Car className="h-5 w-5" />
              Offri un passaggio
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Come funziona
            </h2>
            <p className="mt-4 text-white/60">
              In tre semplici passaggi
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-all hover:border-[#e63946]/30 hover:bg-white/[0.07]"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#e63946]/10 text-[#e63946]">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="absolute right-6 top-6 text-5xl font-bold text-white/5">
                  {index + 1}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Rotte popolari
            </h2>
            <p className="mt-4 text-white/60">
              I passaggi più cercati in Sardegna
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map((route) => (
              <Link
                key={`${route.from}-${route.to}`}
                href="/cerca"
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all hover:border-[#e63946]/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]/10 text-[#e63946]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {route.from} → {route.to}
                    </p>
                    <p className="text-sm text-white/50">Cerca passaggi</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/30 transition-all group-hover:text-[#e63946] group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-white/10 bg-[#12121e]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-[#e63946]">Gratuito</p>
              <p className="mt-1 text-white/60">per sempre</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#e63946]">Tutta</p>
              <p className="mt-1 text-white/60">la Sardegna</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#e63946]">Comunità</p>
              <p className="mt-1 text-white/60">sarda</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a12] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-[#e63946]" />
              <span className="text-xl font-bold text-white">Andamus</span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="/cerca" className="text-sm text-white/60 transition-colors hover:text-white">
                Cerca
              </Link>
              <Link href="/offri" className="text-sm text-white/60 transition-colors hover:text-white">
                Offri
              </Link>
              <Link href="/profilo" className="text-sm text-white/60 transition-colors hover:text-white">
                Profilo
              </Link>
            </nav>

            {/* Made with love */}
            <p className="text-sm text-white/40">
              Fatto con <span className="text-[#e63946]">♥</span> in Sardegna
            </p>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Andamus. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

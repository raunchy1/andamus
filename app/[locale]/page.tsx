"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Car, Search, UserPlus, MessageCircle, MapPin, ArrowRight, Calendar, Users, Route, Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OnboardingModal } from "@/components/OnboardingModal";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer", "Bosa", "Castelsardo"
];

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
interface TodayRide {
  id: string;
  from_city: string;
  to_city: string;
  time: string;
  price: number;
  seats: number;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
  };
}

  const [todayRides, setTodayRides] = useState<TodayRide[]>([]);
  const [stats, setStats] = useState({ users: 0, rides: 0, cities: 20 });
  const [loadingRides, setLoadingRides] = useState(true);
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const steps = [
    { icon: UserPlus, title: t('home.howItWorks.step1.title'), description: t('home.howItWorks.step1.description') },
    { icon: Search, title: t('home.howItWorks.step2.title'), description: t('home.howItWorks.step2.description') },
    { icon: MessageCircle, title: t('home.howItWorks.step3.title'), description: t('home.howItWorks.step3.description') },
  ];

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}



  // Fetch today's rides
  useEffect(() => {
    const fetchTodayRides = async () => {
      const { data } = await supabase
        .from("rides")
        .select(`
          *,
          profiles(name, avatar_url, rating)
        `)
        .eq("date", today)
        .eq("status", "active")
        .order("time", { ascending: true })
        .limit(6);
      
      setTodayRides(data || []);
      setLoadingRides(false);
    };

    // Fetch stats
    const fetchStats = async () => {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: ridesCount } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true });
      
      setStats({
        users: usersCount || 0,
        rides: ridesCount || 0,
        cities: 20
      });
    };

    fetchTodayRides();
    fetchStats();
  }, [supabase, today]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (date) params.set("date", date);
    router.push(`/cerca?${params.toString()}`);
  };



  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Onboarding Modal */}
      <OnboardingModal />
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px"
          }} />
        </div>
        
        {/* Sardinia Map Background */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-10">
          <svg viewBox="0 0 400 500" className="h-[700px] w-auto text-[#e63946]" fill="currentColor">
            <path d="M200 20C150 30 100 60 80 100C60 140 50 180 60 220C70 260 90 300 120 340C140 370 150 400 145 430C140 460 160 480 200 485C240 480 260 460 255 430C250 400 260 370 280 340C310 300 330 260 340 220C350 180 340 140 320 100C300 60 250 30 200 20Z" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <Car className="h-4 w-4 text-[#e63946]" />
              <span className="text-sm text-white/80">Carpooling sardo</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Viaggia insieme
            <br />
            <span className="text-[#e63946]">in Sardegna</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/60">
            Trova o offri un passaggio in tutta la Sardegna. 
            <span className="text-white font-medium"> Gratis.</span>
          </p>

          {/* LIVE SEARCH BAR */}
          <form onSubmit={handleSearch} className="mt-10 mx-auto max-w-4xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
              <div className="grid gap-3 md:grid-cols-4">
                {/* Origin */}
                <div className="relative">
                  <label className="mb-1 block text-xs font-medium text-white/50">Da</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0f1729] pl-10 pr-8 text-sm text-white outline-none focus:border-[#e63946] [&>option]:bg-[#1a1a2e]"
                    >
                      <option value="">Da dove parti?</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 rotate-90 md:rotate-0" />
                  </div>
                </div>

                {/* Destination */}
                <div className="relative">
                  <label className="mb-1 block text-xs font-medium text-white/50">A</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0f1729] pl-10 pr-8 text-sm text-white outline-none focus:border-[#e63946] [&>option]:bg-[#1a1a2e]"
                    >
                      <option value="">Dove vai?</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="relative">
                  <label className="mb-1 block text-xs font-medium text-white/50">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none focus:border-[#e63946] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e63946] text-sm font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] hover:shadow-xl active:scale-95 touch-manipulation min-h-[48px]"
                  >
                    <Search className="h-4 w-4" />
                    Cerca
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Popular Routes - Horizontal Scroll on Mobile */}
          <div className="mt-6">
            <p className="text-center text-sm text-white/40 mb-3 hidden sm:block">Percorsi popolari:</p>
            <div className="flex overflow-x-auto gap-2 pb-2 px-4 sm:px-0 sm:flex-wrap sm:justify-center sm:gap-3 no-scrollbar">
              {[
                { from: "Tortolì", to: "Cagliari" },
                { from: "Olbia", to: "Sassari" },
                { from: "Nuoro", to: "Cagliari" },
                { from: "Oristano", to: "Cagliari" },
                { from: "Sassari", to: "Cagliari" },
              ].map((route) => (
                <Link
                  key={`${route.from}-${route.to}`}
                  href={`/cerca?from=${route.from}&to=${route.to}`}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:border-[#e63946]/30 transition-all whitespace-nowrap active:scale-95"
                >
                  <span className="text-[#e63946]">{route.from}</span>
                  <span className="text-white/30">→</span>
                  <span>{route.to}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S RIDES SECTION */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#12121e] pb-24 md:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Corse disponibili oggi</h2>
              <p className="mt-1 text-white/50">Passaggi programmati per oggi in tutta la Sardegna</p>
            </div>
            <Link href="/cerca" className="hidden sm:flex items-center gap-1 text-sm text-[#e63946] hover:text-white transition-colors">
              Vedi tutte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingRides ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#e63946]" />
            </div>
          ) : todayRides.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/50">Nessuna corsa disponibile oggi.</p>
              <Link href="/offri" className="mt-4 inline-block text-[#e63946] hover:text-white">
                Offri tu il primo passaggio →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {todayRides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/corsa/${ride.id}`}
                  className="group rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/50 hover:shadow-lg hover:shadow-[#e63946]/10 active:scale-[0.98] touch-manipulation"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[#e63946] bg-[#e63946]/10 px-2 py-1 rounded-full">
                      Oggi alle {ride.time.slice(0, 5)}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {ride.price === 0 ? (
                        <span className="text-green-400 text-sm">Gratis</span>
                      ) : (
                        `${ride.price}€`
                      )}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-white text-lg">
                    {ride.from_city} → {ride.to_city}
                  </h3>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                      {ride.profiles.avatar_url ? (
                        <Image src={ride.profiles.avatar_url} alt="" width={32} height={32} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{ride.profiles.name}</p>
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{ride.profiles.rating || 5.0}</span>
                      </div>
                    </div>
                    <span className="text-xs text-white/50">{ride.seats} posti</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/cerca" className="inline-flex items-center gap-1 text-sm text-[#e63946]">
              Vedi tutte le corse <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('home.howItWorks.title')}</h2>
            <p className="mt-4 text-white/60">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-all hover:border-[#e63946]/30 hover:bg-white/[0.07]"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#e63946]/10 text-[#e63946]">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="absolute right-6 top-6 text-6xl font-bold text-white/5">{index + 1}</div>
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="text-white/60 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#12121e]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('home.popularRoutes.title')}</h2>
            <p className="mt-4 text-white/60">{t('home.popularRoutes.subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { from: "Ogliastra", to: "Cagliari" },
              { from: "Nuoro", to: "Cagliari" },
              { from: "Sassari", to: "Cagliari" },
              { from: "Olbia", to: "Sassari" },
              { from: "Oristano", to: "Cagliari" },
              { from: "Ogliastra", to: "Olbia" },
            ].map((route) => (
              <Link
                key={`${route.from}-${route.to}`}
                href={`/cerca?from=${route.from}&to=${route.to}`}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]/10 text-[#e63946]">
                    <Route className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{route.from} → {route.to}</p>
                    <p className="text-sm text-white/50">{t('home.popularRoutes.search')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/30 transition-all group-hover:text-[#e63946] group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTI SPECIALI */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#0d0d16]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Eventi Speciali</h2>
            <p className="mt-4 text-white/60">Le tradizioni sarde più importanti - trova un passaggio!</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                name: "Sartiglia di Oristano", 
                date: "02-25",
                month: 2,
                day: 25,
                description: "La giostra equestre più famosa della Sardegna",
                icon: "🏇",
                city: "Oristano"
              },
              { 
                name: "Cavalcata Sarda", 
                date: "05-18",
                month: 5,
                day: 18,
                description: "Grande sfilata a cavallo per le vie di Sassari",
                icon: "🐴",
                city: "Sassari"
              },
              { 
                name: "Fiera di Cagliari", 
                date: "05-01",
                month: 5,
                day: 1,
                description: "Tradizionale fiera di Sant'Efisio",
                icon: "🎪",
                city: "Cagliari"
              },
              { 
                name: "Ferragosto", 
                date: "08-15",
                month: 8,
                day: 15,
                description: "Il grande esodo estivo - prenota il tuo passaggio",
                icon: "🏖️",
                city: ""
              },
              { 
                name: "Pasqua", 
                date: "04-20",
                month: 4,
                day: 20,
                description: "Torna a casa per le festività pasquali",
                icon: "🐣",
                city: ""
              },
              { 
                name: "Natale", 
                date: "12-25",
                month: 12,
                day: 25,
                description: "Riunisciti con la famiglia per le feste",
                icon: "🎄",
                city: ""
              },
            ].map((event) => {
              // Calculate the next occurrence of this event
              const currentYear = new Date().getFullYear();
              const eventDate = new Date(currentYear, event.month - 1, event.day);
              if (eventDate < new Date()) {
                eventDate.setFullYear(currentYear + 1);
              }
              const dateStr = eventDate.toISOString().split('T')[0];
              
              return (
                <Link
                  key={event.name}
                  href={`/cerca?date=${dateStr}${event.city ? `&to=${event.city}` : ''}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a4a] p-6 transition-all hover:border-[#e63946]/30 hover:bg-[#1e2a4a]/80"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#e63946]/10 to-transparent rounded-bl-full" />
                  
                  <div className="relative">
                    <div className="text-4xl mb-3">{event.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-1">{event.name}</h3>
                    <p className="text-sm text-white/60 mb-3">{event.description}</p>
                    
                    <div className="flex items-center gap-2 text-[#e63946]">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {eventDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-1 text-sm text-white/40 group-hover:text-[#e63946] transition-colors">
                      <span>Cerca passaggi</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS BAR with Animated Counters */}
      <section className="border-y border-white/10 bg-[#0a0a12] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div className="relative">
              <p className="text-5xl font-bold text-[#e63946]">
                <AnimatedCounter end={stats.users} suffix="+" />
              </p>
              <p className="mt-2 text-white/60">{t('home.stats.users')}</p>
            </div>
            <div className="relative sm:border-x sm:border-white/10">
              <p className="text-5xl font-bold text-[#e63946]">
                <AnimatedCounter end={stats.rides} suffix="+" />
              </p>
              <p className="mt-2 text-white/60">{t('home.stats.rides')}</p>
            </div>
            <div className="relative">
              <p className="text-5xl font-bold text-[#e63946]">
                <AnimatedCounter end={stats.cities} />
              </p>
              <p className="mt-2 text-white/60">{t('home.stats.cities')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a12] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Andamus</span>
            </Link>

            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="/cerca" className="text-sm text-white/60 transition-colors hover:text-white">Cerca</Link>
              <Link href="/offri" className="text-sm text-white/60 transition-colors hover:text-white">Offri</Link>
              <Link href="/profilo" className="text-sm text-white/60 transition-colors hover:text-white">Profilo</Link>
            </nav>

            <p className="text-sm text-white/40">
              {t('home.footer.madeWith')} <span className="text-[#e63946]">♥</span> {t('home.footer.inSardinia')}
            </p>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/40">© {new Date().getFullYear()} Andamus. {t('home.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

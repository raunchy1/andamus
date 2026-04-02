"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { SardiniaMap } from "@/components/SardiniaMap";
import { LaunchBanner } from "@/components/LaunchBanner";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì",
  "Lanusei", "Iglesias", "Carbonia", "Alghero", "Tempio Pausania",
  "La Maddalena", "Siniscola", "Dorgali", "Muravera"
];

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
  };
}

function normalizeProfile(profiles: unknown): { name: string; avatar_url: string | null; rating: number } {
  if (Array.isArray(profiles)) {
    return profiles[0] || { name: "", avatar_url: null, rating: 5 };
  }
  return (profiles as { name: string; avatar_url: string | null; rating: number }) || { name: "", avatar_url: null, rating: 5 };
}

interface HomeUIProps {
  origin: string;
  setOrigin: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  todayRides: Ride[];
  loading: boolean;
  userName: string;
  userAvatar: string | null;
  handleSearch: (e: React.FormEvent) => void;
  router: ReturnType<typeof useRouter>;
}

function HomeMobile({
  origin,
  setOrigin,
  destination,
  setDestination,
  todayRides,
  loading,
  userName,
  userAvatar,
  handleSearch,
}: HomeUIProps) {
  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] pb-32">
      {/* TopAppBar */}
      <header className="bg-[#0e0e0e] flex justify-between items-end w-full px-6 pt-12 pb-4 z-50">
        <div className="flex flex-col">
          <span className="font-semibold uppercase tracking-widest text-[11px] text-[#ffb3b1]">
            {userName ? `Bentornato, ${userName.split(" ")[0]}` : "Bentornato"}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tighter text-[#e5e2e1] uppercase">Andamus</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cerca"
            className="material-symbols-outlined text-[#e5e2e1] hover:opacity-80 transition-opacity active:scale-95 duration-200 ease-out"
          >
            tune
          </Link>
          <Link href="/profilo" className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Hero & Map Section */}
        <section className="relative px-6 pt-6">
          <h2 className="font-headline font-extrabold tracking-tighter text-[2.75rem] leading-[0.95] mb-8 max-w-[280px]">
            Il modo più semplice di spostarsi in Sardegna
          </h2>

          {/* Interactive Sardinia Map Area */}
          <div className="relative w-full aspect-[4/5] bg-surface-container-low rounded-xl overflow-hidden sardinia-map-container mb-8">
            <div className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity grayscale" />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <SardiniaMap
                mode="mobile"
                className="w-full h-full"
                onRouteClick={(_, from, to) => {
                  setOrigin(from);
                  setDestination(to);
                }}
              />
            </div>

            {/* Smart Search Bar */}
            <form
              onSubmit={handleSearch}
              className="absolute bottom-6 left-4 right-4 bg-surface-container-high/90 backdrop-blur-md p-1 rounded-lg flex items-center shadow-xl border border-white/5"
            >
              <div className="flex-1 flex items-center px-3 gap-2">
                <span className="material-symbols-outlined text-primary text-sm">search</span>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm text-on-surface w-full appearance-none cursor-pointer"
                >
                  <option value="" className="bg-surface-container-high text-on-surface/50">Dove vuoi andare?</option>
                  {sardinianCities.map((city) => (
                    <option key={city} value={city} className="bg-surface-container-high">{city}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-primary text-on-primary px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Cerca
              </button>
            </form>
          </div>
        </section>

        {/* Horizontal Carousel Section */}
        <section className="mb-12">
          <div className="px-6 flex justify-between items-end mb-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-on-surface">Corse disponibili oggi</h3>
            <Link href="/cerca" className="text-[11px] font-bold text-primary border-b border-primary/30 pb-0.5 hover:text-primary/80 transition-colors">
              Vedi tutte
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x no-scrollbar">
              {[1, 2].map((i) => (
                <div key={i} className="snap-start flex-shrink-0 w-[280px] bg-surface-container-high p-5 rounded-xl h-[180px] animate-pulse" />
              ))}
            </div>
          ) : todayRides.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x no-scrollbar">
              {todayRides.map((ride, idx) => (
                <Link
                  key={ride.id}
                  href={`/corsa/${ride.id}`}
                  className={`snap-start flex-shrink-0 w-[280px] bg-surface-container-high p-5 rounded-xl flex flex-col justify-between h-[180px] transition-transform active:scale-95 ${
                    idx === 0 ? "border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold ${idx === 0 ? "text-primary" : "text-on-surface/40"} uppercase tracking-widest`}>
                        Oggi · {ride.time.slice(0, 5)}
                      </span>
                      <h4 className="text-lg font-bold mt-1 text-on-surface">{ride.from_city} → {ride.to_city}</h4>
                    </div>
                    <div className="text-xl font-extrabold tracking-tight text-on-surface">
                      {ride.price === 0 ? "Gratis" : `€${ride.price}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden">
                      {ride.profiles.avatar_url ? (
                        <img src={ride.profiles.avatar_url} alt={ride.profiles.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">{ride.profiles.name}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[10px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                        >
                          star
                        </span>
                        <span className="text-[10px] text-on-surface/60">{ride.profiles.rating} · Auto</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6">
              <div className="bg-surface-container-high p-5 rounded-xl">
                <p className="text-sm text-on-surface/60">Nessuna corsa disponibile oggi.</p>
                <Link href="/cerca" className="text-primary text-sm font-bold mt-2 inline-block">Cerca altre date →</Link>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section className="px-6 grid grid-cols-2 gap-4">
          <Link
            href="/offri"
            className="aspect-square bg-primary-container/20 rounded-xl p-6 flex flex-col justify-between hover:bg-primary-container/30 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface">Offri un passaggio</span>
          </Link>
          <Link
            href="/profilo"
            className="aspect-square bg-surface-container-highest rounded-xl p-6 flex flex-col justify-between hover:bg-surface-container-high transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-on-surface/60 text-3xl">history</span>
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface">I tuoi viaggi</span>
          </Link>
        </section>
      </main>
    </div>
  );
}

function HomeDesktop({
  origin,
  setOrigin,
  destination,
  setDestination,
  todayRides,
  loading,
  userName,
  userAvatar,
  router,
}: HomeUIProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (date && date !== today) params.set("date", date);
    router.push(`/cerca?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1]">
      {/* Navbar */}
      <nav className="w-full border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tighter uppercase text-[#e5e2e1]">Andamus</span>
            <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-[#ffb3b1]" />
          </div>
          <div className="flex items-center gap-8">
            <Link href="/cerca" className="text-sm font-medium text-[#e5e2e1]/70 hover:text-[#e5e2e1] transition-colors">Esplora</Link>
            <Link href="/offri" className="text-sm font-medium text-[#e5e2e1]/70 hover:text-[#e5e2e1] transition-colors">Offri</Link>
            <Link href="/profilo" className="flex items-center gap-3 pl-6 border-l border-white/10">
              <span className="text-sm font-medium">{userName ? userName.split(" ")[0] : "Profilo"}</span>
              <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden border border-white/10">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#e5e2e1]/60">person</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#ffb3b110_0%,_transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-8 pt-20 pb-16 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-3xl">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffb3b1] mb-6">
                {userName ? `Bentornato, ${userName.split(" ")[0]}` : "Il carpooling in Sardegna"}
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] mb-8">
                Il modo più semplice di <span className="text-[#ffb3b1]">spostarsi</span> in Sardegna
              </h1>
              <p className="text-lg md:text-xl text-[#e5e2e1]/60 max-w-xl leading-relaxed">
                Connetti con chi viaggia nella tua stessa direzione. Risparmia, riduci le emissioni e scopri nuove storie.
              </p>
            </div>
            <div className="w-full lg:w-[420px] xl:w-[480px]">
              <div className="relative aspect-[4/5] bg-[#181818]/50 rounded-2xl border border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-15 mix-blend-luminosity grayscale" />
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <SardiniaMap
                    mode="desktop"
                    className="w-full h-full"
                    onRouteClick={(_, from, to) => {
                      setOrigin(from);
                      setDestination(to);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="relative -mt-4 z-10">
        <div className="max-w-5xl mx-auto px-8">
          <form
            onSubmit={onSubmit}
            className="bg-[#131313] border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/40"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5">
                <span className="material-symbols-outlined text-[#ffb3b1]">trip_origin</span>
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40">Partenza</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[#e5e2e1] w-full appearance-none cursor-pointer p-0"
                  >
                    <option value="" className="bg-[#131313]">Seleziona città</option>
                    {sardinianCities.map((city) => (
                      <option key={city} value={city} className="bg-[#131313]">{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5">
                <span className="material-symbols-outlined text-[#ffb3b1]">location_on</span>
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40">Destinazione</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[#e5e2e1] w-full appearance-none cursor-pointer p-0"
                  >
                    <option value="" className="bg-[#131313]">Seleziona città</option>
                    {sardinianCities.map((city) => (
                      <option key={city} value={city} className="bg-[#131313]">{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 md:max-w-[200px]">
                <span className="material-symbols-outlined text-[#ffb3b1]">calendar_today</span>
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40">Data</label>
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[#e5e2e1] w-full p-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#e63946] hover:bg-[#d32f3c] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">search</span>
                Cerca
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Rides */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight">Corse disponibili oggi</h3>
            <p className="text-[#e5e2e1]/50 mt-2">Partenze confermate per il {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" })}</p>
          </div>
          <Link href="/cerca" className="text-sm font-bold text-[#ffb3b1] hover:text-[#ffb3b1]/80 transition-colors">
            Vedi tutte →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : todayRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayRides.map((ride, idx) => (
              <Link
                key={ride.id}
                href={`/corsa/${ride.id}`}
                className={`group relative p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
                  idx === 0
                    ? "bg-[#ffb3b1]/5 border-[#ffb3b1]/20"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? "text-[#ffb3b1]" : "text-[#e5e2e1]/40"}`}>
                      Oggi · {ride.time.slice(0, 5)}
                    </span>
                    <h4 className="text-xl font-bold mt-2">{ride.from_city} → {ride.to_city}</h4>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {ride.price === 0 ? "Gratis" : `€${ride.price}`}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden border border-white/10">
                    {ride.profiles.avatar_url ? (
                      <img src={ride.profiles.avatar_url} alt={ride.profiles.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#e5e2e1]/60">person</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{ride.profiles.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="material-symbols-outlined text-[12px] text-[#ffb3b1]"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                      >
                        star
                      </span>
                      <span className="text-xs text-[#e5e2e1]/60">{ride.profiles.rating} · Auto</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-10 text-center">
            <p className="text-[#e5e2e1]/60">Nessuna corsa disponibile oggi.</p>
            <Link href="/cerca" className="inline-block mt-4 text-[#ffb3b1] font-bold hover:underline">Cerca altre date</Link>
          </div>
        )}
      </section>

      {/* Quick Stats / Info */}
      <section className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ffb3b1]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb3b1] text-2xl">savings</span>
              </div>
              <h4 className="text-lg font-bold">Risparmia sui viaggi</h4>
              <p className="text-[#e5e2e1]/50 leading-relaxed">Condividi le spese con altri passeggeri e riduci i costi del tuo spostamento fino al 70%.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ffb3b1]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb3b1] text-2xl">eco</span>
              </div>
              <h4 className="text-lg font-bold">Viaggia sostenibile</h4>
              <p className="text-[#e5e2e1]/50 leading-relaxed">Ogni passaggio condiviso riduce le emissioni di CO₂ e il traffico sulle strade sarde.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ffb3b1]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb3b1] text-2xl">verified_user</span>
              </div>
              <h4 className="text-lg font-bold">Community affidabile</h4>
              <p className="text-[#e5e2e1]/50 leading-relaxed">Profili verificati e recensioni reali per viaggiare sempre con tranquillità.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2">Hai un posto libero in macchina?</h3>
            <p className="text-[#e5e2e1]/50">Offri un passaggio e aiuta qualcuno a raggiungere la sua destinazione.</p>
          </div>
          <Link
            href="/offri"
            className="bg-[#e63946] hover:bg-[#d32f3c] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors"
          >
            Offri un passaggio
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const deviceType = useDeviceType();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [todayRides, setTodayRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data: ridesData } = await supabase
        .from("rides")
        .select("id, from_city, to_city, date, time, price, profiles!inner(name, avatar_url, rating)")
        .eq("date", today)
        .eq("status", "active")
        .order("time", { ascending: true })
        .limit(5);

      setTodayRides(((ridesData as unknown as any[]) || []).map(r => ({ ...r, profiles: normalizeProfile(r.profiles) })) as Ride[]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        setUserName(name);
        setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    router.push(`/cerca?${params.toString()}`);
  };

  const props = {
    origin,
    setOrigin,
    destination,
    setDestination,
    todayRides,
    loading,
    userName,
    userAvatar,
    handleSearch,
    router,
  };

  return (
    <>
      <LaunchBanner />
      {deviceType === "mobile" ? <HomeMobile {...props} /> : <HomeDesktop {...props} />}
    </>
  );
}

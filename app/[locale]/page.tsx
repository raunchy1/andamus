"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export default function HomePage() {
  const router = useRouter();
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
            
            {/* Abstract Map UI */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-full h-full border border-primary/10 rounded-full flex items-center justify-center">
                <div className="w-48 h-64 bg-surface-container-highest/30 rounded-full blur-3xl absolute" />
                
                {/* City Nodes */}
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_12px_#ffb3b1]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-on-surface">Olbia</span>
                </div>
                <div className="absolute top-[40%] left-[20%] flex flex-col items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_12px_#ffb3b1]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-on-surface">Sassari</span>
                </div>
                <div className="absolute bottom-[20%] left-[55%] -translate-x-1/2 flex flex-col items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_12px_#ffb3b1]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-on-surface">Cagliari</span>
                </div>
                
                {/* Animated Route Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <path d="M196,80 Q150,150 78,160" fill="none" stroke="#ffb3b1" strokeDasharray="4 4" strokeWidth="1.5" />
                  <path d="M196,80 Q220,250 216,340" fill="none" stroke="#ffb3b1" strokeDasharray="4 4" strokeWidth="1.5" />
                </svg>
              </div>
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

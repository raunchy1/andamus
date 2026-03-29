"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Car, Search, UserPlus, MessageCircle, MapPin, ArrowRight, Calendar, Users, Route, Star, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OnboardingModal } from "@/components/OnboardingModal";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer", "Bosa", "Castelsardo"
];

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number;
          let animationFrame: number;
          
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));
            
            if (progress < 1) {
              animationFrame = requestAnimationFrame(animate);
            }
          };
          
          animationFrame = requestAnimationFrame(animate);
          return () => cancelAnimationFrame(animationFrame);
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);
  
  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

// Scroll reveal hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);
}

// Floating car icon component
function FloatingCar({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute pointer-events-none opacity-10 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Car className="w-full h-full text-white animate-float" strokeWidth={1} />
    </div>
  );
}

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
  const [totalRidesToday, setTotalRidesToday] = useState(0);
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const steps = [
    { icon: UserPlus, title: t('home.howItWorks.step1.title'), description: t('home.howItWorks.step1.description') },
    { icon: Search, title: t('home.howItWorks.step2.title'), description: t('home.howItWorks.step2.description') },
    { icon: MessageCircle, title: t('home.howItWorks.step3.title'), description: t('home.howItWorks.step3.description') },
  ];

  useScrollReveal();

  // Fetch today's rides
  useEffect(() => {
    const fetchTodayRides = async () => {
      const { data, count } = await supabase
        .from("rides")
        .select(`
          *,
          profiles(name, avatar_url, rating)
        `, { count: 'exact' })
        .eq("date", today)
        .eq("status", "active")
        .order("time", { ascending: true })
        .limit(6);
      
      setTodayRides(data || []);
      setTotalRidesToday(count || 0);
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
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#1e1a3e] to-[#2a1a3e] animate-gradient" />
        
        {/* Floating Car Icons */}
        <FloatingCar className="top-20 left-[10%] w-24 h-24" delay={0} />
        <FloatingCar className="top-40 right-[15%] w-16 h-16" delay={2} />
        <FloatingCar className="bottom-40 left-[20%] w-20 h-20" delay={4} />
        <FloatingCar className="top-1/3 right-[8%] w-12 h-12" delay={1} />
        <FloatingCar className="bottom-1/4 right-[25%] w-14 h-14" delay={3} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }} />
        </div>
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e63946]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-6 flex justify-center reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-2">
              <Sparkles className="h-4 w-4 text-[#e63946]" />
              <span className="text-sm text-white/80">Carpooling sardo</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="heading-premium text-balance text-center text-3xl text-white sm:text-5xl md:text-6xl lg:text-7xl reveal reveal-delay-1">
            Viaggia insieme
            <br />
            <span className="gradient-text">in Sardegna</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/60 reveal reveal-delay-2">
            Trova o offri un passaggio in tutta la Sardegna. 
            <span className="text-white font-medium"> Gratis.</span>
          </p>

          {/* LIVE SEARCH BAR - Glass Morphism */}
          <form onSubmit={handleSearch} className="mt-10 mx-auto max-w-4xl reveal reveal-delay-3">
            <div className="glass rounded-3xl p-2 shadow-2xl shadow-black/50">
              <div className="grid gap-2 md:grid-cols-4">
                {/* Origin */}
                <div className="relative group">
                  <label className="mb-1.5 ml-3 block text-xs font-medium text-white/40 group-focus-within:text-[#e63946] transition-colors">Da</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border-0 bg-white/5 pl-10 pr-8 text-sm text-white outline-none transition-all focus:bg-white/10 focus:ring-2 focus:ring-[#e63946]/50 [&>option]:bg-[#1a1a2e]"
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
                <div className="relative group">
                  <label className="mb-1.5 ml-3 block text-xs font-medium text-white/40 group-focus-within:text-[#e63946] transition-colors">A</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border-0 bg-white/5 pl-10 pr-8 text-sm text-white outline-none transition-all focus:bg-white/10 focus:ring-2 focus:ring-[#e63946]/50 [&>option]:bg-[#1a1a2e]"
                    >
                      <option value="">Dove vai?</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="relative group">
                  <label className="mb-1.5 ml-3 block text-xs font-medium text-white/40 group-focus-within:text-[#e63946] transition-colors">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e63946]" />
                    <input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12 w-full rounded-xl border-0 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition-all focus:bg-white/10 focus:ring-2 focus:ring-[#e63946]/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e63946] to-[#ff5a66] text-sm font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:shadow-xl hover:shadow-[#e63946]/40 active:scale-[0.98] touch-manipulation min-h-[48px] btn-press"
                  >
                    <Search className="h-4 w-4" />
                    Cerca
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Real-time Counter Badge */}
          <div className="mt-6 flex justify-center reveal reveal-delay-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 animate-pulse-glow">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/70">
                <span className="font-semibold text-white tabular-nums">{totalRidesToday}</span> corse disponibili oggi
              </span>
            </div>
          </div>

          {/* Popular Routes - Horizontal Scroll on Mobile */}
          <div className="mt-8 reveal reveal-delay-4">
            <p className="text-center text-sm text-white/40 mb-3 hidden sm:block">Percorsi popolari:</p>
            <div className="flex overflow-x-auto gap-2 pb-2 px-4 sm:px-0 sm:flex-wrap sm:justify-center sm:gap-3 no-scrollbar">
              {[
                { from: "Tortolì", to: "Cagliari" },
                { from: "Olbia", to: "Sassari" },
                { from: "Nuoro", to: "Cagliari" },
                { from: "Oristano", to: "Cagliari" },
                { from: "Sassari", to: "Cagliari" },
              ].map((route, i) => (
                <Link
                  key={`${route.from}-${route.to}`}
                  href={`/cerca?from=${route.from}&to=${route.to}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:border-[#e63946]/30 transition-all whitespace-nowrap active:scale-95 touch-manipulation"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="text-[#e63946] font-medium">{route.from}</span>
                  <ArrowRight className="w-3 h-3 text-white/30" />
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
          <div className="mb-8 flex items-center justify-between reveal">
            <div>
              <h2 className="heading-premium text-2xl text-white sm:text-3xl">Corse disponibili oggi</h2>
              <p className="mt-1 text-white/50">Passaggi programmati per oggi in tutta la Sardegna</p>
            </div>
            <Link href="/cerca" className="hidden sm:flex items-center gap-1 text-sm text-[#e63946] hover:text-white transition-colors group">
              Vedi tutte <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingRides ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#e63946]" />
            </div>
          ) : todayRides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center reveal">
              <div className="empty-illustration">
                <Car className="mx-auto h-16 w-16 text-white/20" />
              </div>
              <p className="mt-4 text-lg text-white/60">Nessuna corsa disponibile oggi</p>
              <p className="mt-2 text-sm text-white/40">Sii il primo a offrire un passaggio!</p>
              <Link href="/offri" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37] btn-press">
                <Car className="h-4 w-4" />
                Offri un passaggio
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {todayRides.map((ride, i) => (
                <Link
                  key={ride.id}
                  href={`/corsa/${ride.id}`}
                  className="group card-lift relative rounded-2xl border-l-4 border-l-[#e63946] border-y border-r border-white/10 bg-gradient-to-br from-[#1e2a4a] to-[#1a2339] p-5 active:scale-[0.98] touch-manipulation reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e63946]/10 px-3 py-1 text-xs font-medium text-[#e63946]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e63946] animate-pulse" />
                      Oggi alle {ride.time.slice(0, 5)}
                    </span>
                    <span className="text-lg font-bold">
                      {ride.price === 0 ? (
                        <span className="text-green-400 text-sm">Gratis</span>
                      ) : (
                        <span className="gradient-text-gold">{ride.price}€</span>
                      )}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-white text-lg mb-1">
                    {ride.from_city} <span className="text-white/30">→</span> {ride.to_city}
                  </h3>
                  
                  {/* Seat indicators */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: ride.seats }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-green-400" />
                    ))}
                    <span className="ml-2 text-xs text-white/50">{ride.seats} posti liberi</span>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946] ring-2 ring-white/5">
                        {ride.profiles.avatar_url ? (
                          <Image src={ride.profiles.avatar_url} alt="" width={40} height={40} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#1e2a4a] online-indicator" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{ride.profiles.name}</p>
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="tabular-nums">{ride.profiles.rating || 5.0}</span>
                      </div>
                    </div>
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
      <section className="px-4 py-20 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center reveal">
            <h2 className="heading-premium text-3xl text-white sm:text-4xl">Come funziona</h2>
            <p className="mt-4 text-white/60">In tre semplici passaggi</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-all hover:border-[#e63946]/30 hover:bg-white/[0.07] card-lift reveal"
                style={{ transitionDelay: `${index * 0.15}s` }}
              >
                {/* Step number with animation */}
                <div className="absolute -top-4 -left-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e63946] to-[#c92a37] text-white font-bold text-lg shadow-lg shadow-[#e63946]/30">
                  {index + 1}
                </div>
                
                <div className="mb-6 mt-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e63946]/20 to-[#e63946]/5 text-[#e63946] ring-1 ring-[#e63946]/20 group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8" />
                </div>
                
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
          <div className="mb-8 text-center reveal">
            <h2 className="heading-premium text-3xl text-white sm:text-4xl">{t('home.popularRoutes.title')}</h2>
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
            ].map((route, i) => (
              <Link
                key={`${route.from}-${route.to}`}
                href={`/cerca?from=${route.from}&to=${route.to}`}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-[#1e2a4a] to-[#1a2339] p-5 transition-all hover:border-[#e63946]/30 card-lift reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#e63946]/20 to-[#e63946]/5 text-[#e63946] group-hover:scale-110 transition-transform">
                    <Route className="h-6 w-6" />
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

      {/* SOCIAL PROOF BAR */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-r from-[#e63946]/10 via-[#e63946]/5 to-[#e63946]/10 border-y border-[#e63946]/10">
        <div className="mx-auto max-w-4xl text-center reveal">
          <p className="text-lg text-white/80">
            Unisciti a <span className="font-bold text-white tabular-nums"><AnimatedCounter end={stats.users} /></span> sardi che viaggiano insieme
          </p>
        </div>
      </section>

      {/* EVENTI SPECIALI */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-[#0d0d16]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center reveal">
            <h2 className="heading-premium text-3xl text-white sm:text-4xl">Eventi Speciali</h2>
            <p className="mt-4 text-white/60">Le tradizioni sarde più importanti - trova un passaggio!</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Sartiglia di Oristano", date: "02-25", month: 2, day: 25, description: "La giostra equestre più famosa della Sardegna", icon: "🏇", city: "Oristano" },
              { name: "Cavalcata Sarda", date: "05-18", month: 5, day: 18, description: "Grande sfilata a cavallo per le vie di Sassari", icon: "🐴", city: "Sassari" },
              { name: "Fiera di Cagliari", date: "05-01", month: 5, day: 1, description: "Tradizionale fiera di Sant'Efisio", icon: "🎪", city: "Cagliari" },
              { name: "Ferragosto", date: "08-15", month: 8, day: 15, description: "Il grande esodo estivo - prenota il tuo passaggio", icon: "🏖️", city: "" },
              { name: "Pasqua", date: "04-20", month: 4, day: 20, description: "Torna a casa per le festività pasquali", icon: "🐣", city: "" },
              { name: "Natale", date: "12-25", month: 12, day: 25, description: "Riunisciti con la famiglia per le feste", icon: "🎄", city: "" },
            ].map((event, i) => {
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
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e2a4a] to-[#1a2339] p-6 transition-all hover:border-[#e63946]/30 card-lift reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e63946]/10 to-transparent rounded-bl-full" />
                  
                  <div className="relative">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{event.icon}</div>
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
          <div className="grid gap-8 text-center sm:grid-cols-3 reveal">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#e63946]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <p className="heading-premium text-5xl text-[#e63946]">
                  <AnimatedCounter end={stats.users} suffix="+" />
                </p>
                <p className="mt-2 text-white/60">{t('home.stats.users')}</p>
              </div>
            </div>
            <div className="relative group sm:border-x sm:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-b from-[#e63946]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <p className="heading-premium text-5xl text-[#e63946]">
                  <AnimatedCounter end={stats.rides} suffix="+" />
                </p>
                <p className="mt-2 text-white/60">{t('home.stats.rides')}</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#e63946]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <p className="heading-premium text-5xl text-[#e63946]">
                  <AnimatedCounter end={stats.cities} />
                </p>
                <p className="mt-2 text-white/60">{t('home.stats.cities')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a12] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e63946] to-[#c92a37]">
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

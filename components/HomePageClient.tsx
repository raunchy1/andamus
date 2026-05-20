'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { getAppNow } from "@/lib/date-utils";
import { SardiniaMap } from "@/components/SardiniaMap";
import { LaunchBanner } from "@/components/LaunchBanner";
import { Search, CircleDot, MapPin, PiggyBank, Leaf, ShieldCheck, SlidersHorizontal, User, PlusCircle, History, Star, Sparkles, ArrowRight, Zap, Heart } from "lucide-react";
import Image from "next/image";
import { DatePicker } from "@/components/ui/date-picker";
import { CityCombobox } from "@/components/CityCombobox";
import municipalities from "@/scripts/sardinia-municipalities.json";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { Spotlight } from "@/components/ui/premium/spotlight";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { AnimatedCounter } from "@/components/ui/premium/animated-counter";
import { Marquee } from "@/components/ui/premium/marquee";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";
import { OrbGlow } from "@/components/ui/premium/orb-glow";

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

interface HomeTranslations {
  badge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroDescription: string;
  heroFree: string;
  heroFrom: string;
  heroTo: string;
  heroDate: string;
  heroSearchButton: string;
  heroCityPlaceholder: string;
  heroFromPlaceholder: string;
  todayRides: string;
  seeAll: string;
  today: string;
  free: string;
  car: string;
  noRidesToday: string;
  searchOtherDates: string;
  offerRide: string;
  yourTrips: string;
  departuresConfirmed: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  ctaTitle: string;
  ctaDescription: string;
  welcomeBack: string;
}

interface HomeViewProps extends HomeUIProps {
  locale: string;
  translations: HomeTranslations;
}

function HomeMobile({
  origin,
  setOrigin,
  setDestination,
  todayRides,
  loading,
  userName,
  userAvatar,
  handleSearch,
  locale,
  translations,
}: HomeViewProps) {
	const t = translations;
  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] overflow-x-hidden">
      {/* TopAppBar - NO pt-12, Layout shell handles navbar spacing */}
      <header className="bg-[#0e0e0e] flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4 z-sticky">
        <div className="flex flex-col">
          <span className="font-semibold uppercase tracking-widest text-[11px] text-[#ffb3b1]">
            {userName ? `${t.welcomeBack}, ${userName.split(" ")[0]}` : t.welcomeBack}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tighter text-[#e5e2e1] uppercase">Andamus</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/cerca`}
            className="text-[#e5e2e1] hover:opacity-80 transition-opacity active:scale-95 duration-200 ease-out"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </Link>
          <Link href={`/${locale}/profilo`} className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
            {userAvatar ? (
              <Image src={userAvatar} alt="Profile" width={40} height={40} sizes="40px" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-on-surface-variant" />
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* ─── Hero & Map (premium) ─── */}
        <AuroraBackground className="px-4 sm:px-6 pt-6 pb-10">
          <OrbGlow className="-top-20 -right-20" color="#e63946" size={320} opacity={0.35} />
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffb3b1]/30 bg-[#ffb3b1]/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1] backdrop-blur-md">
              <Sparkles className="h-2.5 w-2.5" />
              Sardegna
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 font-headline font-extrabold tracking-tighter text-[2.5rem] sm:text-[3rem] leading-[0.92] word-break">
              {t.heroTitle}{" "}
              <GradientText>{t.heroTitleHighlight}</GradientText>{" "}
              {t.heroSubtitle}
            </h2>
          </Reveal>

          {/* Interactive Sardinia Map Area */}
          <Reveal delay={0.2}>
            <div className="relative w-full aspect-[4/5] bg-surface-container-low rounded-2xl overflow-hidden sardinia-map-container mt-6 mb-6 sm:mb-8 border border-white/8">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0d0d0d] opacity-80" />

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
                className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#0a0a0a]/85 backdrop-blur-xl p-1.5 rounded-2xl flex items-center shadow-2xl border border-white/10"
              >
                <div className="flex-1 flex items-center px-3 gap-2 min-w-0">
                  <Search className="w-4 h-4 text-[#ffb3b1] flex-shrink-0" />
                  <CityCombobox
                    cities={municipalities}
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t.heroFromPlaceholder}
                    label="partenza"
                    buttonClassName="bg-transparent border-none shadow-none text-sm text-[#e5e2e1] hover:bg-transparent hover:text-[#e5e2e1] px-0 h-auto min-h-0"
                  />
                </div>
                <MagneticButton type="submit" strength={10} className="px-4 py-2 text-xs">
                  {t.heroSearchButton}
                </MagneticButton>
              </form>
            </div>
          </Reveal>
        </AuroraBackground>

        {/* ─── Horizontal Carousel (premium) ─── */}
        <section className="mb-8 sm:mb-12">
          <div className="px-4 sm:px-6 flex justify-between items-end mb-4 sm:mb-6">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#ffb3b1]/70">Live</span>
              <h3 className="text-base font-extrabold tracking-tight text-on-surface mt-1">
                {t.todayRides}
              </h3>
            </div>
            <Link href={`/${locale}/cerca`} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ffb3b1] hover:text-white transition-colors">
              {t.seeAll}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-4 snap-x no-scrollbar">
              {[1, 2].map((i) => (
                <div key={i} className="snap-start flex-shrink-0 w-[260px] sm:w-[280px] bg-white/[0.03] border border-white/5 p-4 sm:p-5 rounded-2xl h-[170px] sm:h-[180px] animate-pulse" />
              ))}
            </div>
          ) : todayRides.length > 0 ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-4 snap-x no-scrollbar">
              {todayRides.map((ride, idx) => (
                <Link
                  key={ride.id}
                  href={`/${locale}/corsa/${ride.id}`}
                  className={`snap-start flex-shrink-0 w-[260px] sm:w-[280px] p-4 sm:p-5 rounded-2xl border flex flex-col justify-between h-[170px] sm:h-[180px] transition-all active:scale-95 ${
                    idx === 0
                      ? "border-[#ffb3b1]/25 bg-gradient-to-br from-[#ffb3b1]/[0.07] via-[#e63946]/[0.04] to-transparent"
                      : "border-white/8 bg-white/[0.025]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${idx === 0 ? "text-[#ffb3b1]" : "text-on-surface/40"} uppercase tracking-widest`}>
                        {idx === 0 && <Sparkles className="h-2.5 w-2.5" />}
                        {t.today} · {ride.time.slice(0, 5)}
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold tracking-tight mt-1 text-on-surface truncate">{ride.from_city} → {ride.to_city}</h4>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold tracking-tighter text-on-surface flex-shrink-0">
                      {ride.price === 0 ? <GradientText>{t.free}</GradientText> : `€${ride.price}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="relative w-8 h-8 rounded-full bg-white/5 overflow-hidden border border-white/10 flex-shrink-0">
                      {ride.profiles.avatar_url ? (
                        <Image src={ride.profiles.avatar_url} alt={ride.profiles.name} width={32} height={32} sizes="32px" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-on-surface-variant" />
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#0a0a0a]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">{ride.profiles.name}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-[#ffb3b1] fill-[#ffb3b1]" />
                        <span className="text-[10px] text-on-surface/60">{ride.profiles.rating}</span>
                      </div>
                    </div>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-on-surface/30" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-6">
              <div className="bg-white/[0.025] border border-white/8 p-5 rounded-2xl">
                <p className="text-sm text-on-surface/60">{t.noRidesToday}</p>
                <Link href={`/${locale}/cerca`} className="text-[#ffb3b1] text-sm font-bold mt-2 inline-flex items-center gap-1">
                  {t.searchOtherDates} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ─── Marquee (mobile) ─── */}
        <section className="py-6 border-y border-white/5">
          <Marquee speed={32}>
            {["Cagliari → Olbia", "Sassari → Alghero", "Nuoro → Cagliari", "Olbia → Palau", "Alghero → Bosa", "Cagliari → Iglesias"].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 text-xs font-medium text-[#e5e2e1]/70 whitespace-nowrap"
              >
                <Zap className="h-3 w-3 text-[#ffb3b1]" />
                {r}
              </div>
            ))}
          </Marquee>
        </section>

        {/* Quick Actions Grid - Fixed Layout */}
        <section className="px-4 sm:px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
            <Link
              href={`/${locale}/offri`}
              className="bg-primary-container/20 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:bg-primary-container/30 transition-colors active:scale-95 min-h-[120px]"
            >
              <PlusCircle className="w-7 h-7 flex-shrink-0 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface leading-tight mt-2">{t.offerRide}</span>
            </Link>
            <Link
              href={`/${locale}/profilo`}
              className="bg-surface-container-highest rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:bg-surface-container-high transition-colors active:scale-95 min-h-[120px]"
            >
              <History className="w-7 h-7 flex-shrink-0 text-on-surface/60" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface leading-tight mt-2">{t.yourTrips}</span>
            </Link>
          </div>
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
  router,
  locale,
  translations,
}: HomeViewProps) {
  const t = translations;
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (date && date !== today) params.set("date", date);
    router.push(`/${locale}/cerca?${params.toString()}`);
  };

  // Top 12 most popular Sardinian routes — used for the marquee
  const popularRoutes = [
    "Cagliari → Olbia",
    "Sassari → Alghero",
    "Nuoro → Oristano",
    "Olbia → Cagliari",
    "Cagliari → Iglesias",
    "Sassari → Cagliari",
    "Alghero → Bosa",
    "Oristano → Cagliari",
    "Cagliari → Villasimius",
    "Sassari → Castelsardo",
    "Nuoro → Dorgali",
    "Olbia → Palau",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] overflow-x-hidden">
      {/* ─── HERO ─── */}
      <AuroraBackground className="relative pt-20 pb-24 lg:pt-28 lg:pb-32">
        <OrbGlow className="-top-32 -left-32" color="#e63946" size={400} opacity={0.30} />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: copy + CTAs */}
            <div className="flex-1 max-w-3xl">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb3b1]/30 bg-[#ffb3b1]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1] backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  {userName ? `${t.welcomeBack}, ${userName.split(" ")[0]}` : t.badge}
                </span>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="mt-7 text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-tighter leading-[0.92]">
                  {t.heroTitle}{" "}
                  <GradientText className="font-extrabold">{t.heroTitleHighlight}</GradientText>{" "}
                  {t.heroSubtitle}
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="mt-8 text-lg md:text-xl text-[#e5e2e1]/65 max-w-xl leading-relaxed">
                  {t.heroDescription}
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <MagneticButton onClick={() => router.push(`/${locale}/cerca`)}>
                    <Search className="h-4 w-4" />
                    {t.heroSearchButton}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </MagneticButton>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/offri`)}
                    className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-white/25"
                  >
                    <PlusCircle className="h-4 w-4 text-[#ffb3b1]" />
                    {t.offerRide}
                  </button>
                </div>
              </Reveal>

              {/* Stats strip */}
              <Reveal delay={0.45}>
                <div className="mt-14 grid grid-cols-3 gap-4 max-w-xl">
                  {[
                    { value: 2400, suffix: "+", label: "Viaggi" },
                    { value: 1850, suffix: "", label: "Membri" },
                    { value: 92, suffix: "%", label: "Soddisfatti" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4 backdrop-blur-sm"
                    >
                      <div className="text-3xl font-extrabold tracking-tight">
                        <GradientText>
                          <AnimatedCounter value={s.value} suffix={s.suffix} />
                        </GradientText>
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/45">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: Sardinia map artwork on a glassy card */}
            <Reveal delay={0.3} className="w-full lg:w-[460px] xl:w-[520px]">
              <div className="relative aspect-[4/5] rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-2 backdrop-blur-xl shadow-[0_50px_120px_-30px_rgba(230,57,70,0.45)]">
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,179,177,0.15),transparent_55%)]" />
                <div className="relative w-full h-full overflow-hidden rounded-[1.4rem] bg-[#0d0d0d]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0d0d0d] opacity-80" />
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
                  {/* Pulse rings */}
                  <span className="pointer-events-none absolute right-8 top-8 inline-flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-70" style={{ animation: "pulseRing 1.6s infinite" }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e63946]" />
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </AuroraBackground>

      {/* ─── PREMIUM SEARCH BAR ─── */}
      <section className="relative -mt-12 z-20 px-6 lg:px-10">
        <Reveal>
          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0d0d0d]/95 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] transition-all border border-transparent hover:border-[#ffb3b1]/20 min-w-0 group">
                <CircleDot className="w-5 h-5 text-[#ffb3b1] flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex flex-col w-full min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40 mb-1">{t.heroFrom}</label>
                  <CityCombobox
                    cities={municipalities}
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t.heroCityPlaceholder}
                    label="partenza"
                    buttonClassName="bg-transparent border-none shadow-none text-[#e5e2e1] hover:bg-transparent hover:text-[#e5e2e1] px-0 h-auto min-h-0 text-base"
                  />
                </div>
              </div>

              <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] transition-all border border-transparent hover:border-[#ffb3b1]/20 min-w-0 group">
                <MapPin className="w-5 h-5 text-[#ffb3b1] flex-shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex flex-col w-full min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40 mb-1">{t.heroTo}</label>
                  <CityCombobox
                    cities={municipalities}
                    value={destination}
                    onChange={setDestination}
                    placeholder={t.heroCityPlaceholder}
                    label="destinazione"
                    buttonClassName="bg-transparent border-none shadow-none text-[#e5e2e1] hover:bg-transparent hover:text-[#e5e2e1] px-0 h-auto min-h-0 text-base"
                  />
                </div>
              </div>

              <DatePicker
                date={date}
                onSelect={(newDate) => setDate(newDate || today)}
                onClear={() => setDate(today)}
                min={today}
                label={t.heroDate}
                className="md:max-w-[200px]"
              />

              <MagneticButton type="submit" className="md:rounded-2xl md:px-8">
                <Search className="w-4 h-4" />
                {t.heroSearchButton}
              </MagneticButton>
            </div>
          </form>
        </Reveal>
      </section>

      {/* ─── MARQUEE: Popular routes ─── */}
      <section className="relative py-12 lg:py-16 mt-4 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
        <div className="mb-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e5e2e1]/40">
            Tratte popolari in Sardegna
          </span>
        </div>
        <Marquee speed={42}>
          {popularRoutes.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-[#e5e2e1]/70 transition-colors hover:border-[#ffb3b1]/30 hover:text-white whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 text-[#ffb3b1]" />
              {r}
            </div>
          ))}
        </Marquee>
      </section>

      {/* ─── FEATURED RIDES: 3D-tilt cards ─── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffb3b1]/70">
                Live · {new Date().toLocaleDateString(locale, { day: "numeric", month: "long" })}
              </span>
              <h3 className="mt-3 text-4xl lg:text-5xl font-extrabold tracking-tighter">
                {t.todayRides}
              </h3>
              <p className="mt-3 text-[#e5e2e1]/55 text-lg">
                {t.departuresConfirmed}
              </p>
            </div>
            <Link
              href={`/${locale}/cerca`}
              className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#ffb3b1] hover:text-white transition-colors"
            >
              {t.seeAll}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : todayRides.length > 0 ? (
          <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayRides.map((ride, idx) => (
              <RevealItem key={ride.id}>
                <TiltCard
                  className={`relative h-full rounded-3xl border ${
                    idx === 0
                      ? "border-[#ffb3b1]/30 bg-gradient-to-br from-[#ffb3b1]/[0.07] via-[#e63946]/[0.05] to-transparent"
                      : "border-white/8 bg-white/[0.025] hover:border-white/15"
                  } backdrop-blur-sm`}
                >
                  <Link href={`/${locale}/corsa/${ride.id}`} className="block p-6 lg:p-7">
                    {/* Top: featured badge + price */}
                    <div className="flex items-start justify-between gap-3 mb-7">
                      <div className="flex flex-col gap-2 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                            idx === 0
                              ? "bg-[#ffb3b1]/15 text-[#ffb3b1]"
                              : "bg-white/5 text-[#e5e2e1]/55"
                          }`}
                        >
                          {idx === 0 && <Sparkles className="h-2.5 w-2.5" />}
                          {t.today} · {ride.time.slice(0, 5)}
                        </span>
                        <h4 className="text-xl lg:text-2xl font-extrabold tracking-tight leading-tight truncate">
                          {ride.from_city} → {ride.to_city}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="text-3xl font-extrabold tracking-tighter">
                          {ride.price === 0 ? (
                            <GradientText>{t.free}</GradientText>
                          ) : (
                            <>€{ride.price}</>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/35">
                          a persona
                        </span>
                      </div>
                    </div>

                    {/* Bottom: driver */}
                    <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                      <div className="relative w-12 h-12 rounded-full bg-white/5 overflow-hidden border border-white/10 flex-shrink-0">
                        {ride.profiles.avatar_url ? (
                          <Image
                            src={ride.profiles.avatar_url}
                            alt={ride.profiles.name}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-[#e5e2e1]/60" />
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a0a0a]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{ride.profiles.name}</span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-[#ffb3b1] fill-[#ffb3b1]" />
                          <span className="text-xs text-[#e5e2e1]/55 font-medium">
                            {ride.profiles.rating} · driver verificato
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-[#e5e2e1]/30 group-hover:text-[#ffb3b1] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealStagger>
        ) : (
          <Reveal>
            <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-12 text-center">
              <p className="text-[#e5e2e1]/55 text-lg">{t.noRidesToday}</p>
              <Link
                href={`/${locale}/cerca`}
                className="mt-5 inline-flex items-center gap-2 text-[#ffb3b1] font-bold hover:text-white transition-colors"
              >
                {t.searchOtherDates}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        )}
      </section>

      {/* ─── BENTO GRID: Why Andamus ─── */}
      <section className="relative border-t border-white/5 overflow-hidden">
        <OrbGlow className="-bottom-40 left-1/3" color="#e63946" size={420} opacity={0.18} />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffb3b1]/70">
                Perché Andamus
              </span>
              <h3 className="mt-4 text-4xl lg:text-5xl font-extrabold tracking-tighter">
                Viaggia <GradientText>insieme</GradientText>, non più da solo.
              </h3>
            </div>
          </Reveal>

          <RevealStagger className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-[200px]">
            {/* Big card */}
            <RevealItem className="md:col-span-3 md:row-span-2">
              <TiltCard
                tiltStrength={6}
                className="relative h-full rounded-3xl border border-[#ffb3b1]/15 bg-gradient-to-br from-[#ffb3b1]/[0.08] via-[#e63946]/[0.04] to-transparent p-8 lg:p-10"
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                    <PiggyBank className="h-7 w-7 text-[#ffb3b1]" />
                  </div>
                  <div>
                    <h4 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
                      {t.feature1Title}
                    </h4>
                    <p className="mt-4 text-[#e5e2e1]/60 leading-relaxed text-base lg:text-lg">
                      {t.feature1Description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <div className="text-5xl font-extrabold tracking-tighter">
                        <GradientText>
                          <AnimatedCounter value={68} suffix="%" />
                        </GradientText>
                      </div>
                      <span className="text-sm text-[#e5e2e1]/50 font-medium">
                        risparmio medio sul carburante
                      </span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </RevealItem>

            {/* Eco */}
            <RevealItem className="md:col-span-3 md:row-span-1">
              <TiltCard
                tiltStrength={6}
                className="relative h-full rounded-3xl border border-white/8 bg-white/[0.025] p-7"
              >
                <div className="flex items-start gap-5 h-full">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/20 flex-shrink-0">
                    <Leaf className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold tracking-tight">
                      {t.feature2Title}
                    </h4>
                    <p className="mt-2 text-[#e5e2e1]/55 leading-relaxed text-sm">
                      {t.feature2Description}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </RevealItem>

            {/* Security */}
            <RevealItem className="md:col-span-2 md:row-span-1">
              <TiltCard
                tiltStrength={6}
                className="relative h-full rounded-3xl border border-white/8 bg-white/[0.025] p-7"
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 ring-1 ring-blue-400/20">
                    <ShieldCheck className="h-6 w-6 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-extrabold tracking-tight leading-tight">
                    {t.feature3Title}
                  </h4>
                </div>
              </TiltCard>
            </RevealItem>

            {/* Heart / community */}
            <RevealItem className="md:col-span-1 md:row-span-1">
              <TiltCard
                tiltStrength={6}
                className="relative h-full rounded-3xl border border-white/8 bg-gradient-to-br from-[#e63946]/[0.07] to-transparent p-6"
              >
                <div className="flex flex-col h-full justify-between items-start">
                  <Heart className="h-6 w-6 text-[#ffb3b1]" />
                  <div className="text-3xl font-extrabold tracking-tighter">
                    <GradientText>
                      <AnimatedCounter value={4.8} decimals={1} />
                    </GradientText>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/45">
                    Stelle
                  </span>
                </div>
              </TiltCard>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative border-t border-white/5 overflow-hidden">
        <AuroraBackground className="py-20 lg:py-28" showRadialMask={false}>
          <div className="max-w-5xl mx-auto px-6 lg:px-10 relative text-center">
            <Reveal>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.05]">
                {t.ctaTitle.split(" ").map((word, i, arr) =>
                  i === Math.floor(arr.length / 2) ? (
                    <GradientText key={i}>{word} </GradientText>
                  ) : (
                    <span key={i}>{word} </span>
                  )
                )}
              </h3>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg lg:text-xl text-[#e5e2e1]/60 max-w-2xl mx-auto leading-relaxed">
                {t.ctaDescription}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <MagneticButton onClick={() => router.push(`/${locale}/offri`)}>
                  <PlusCircle className="h-4 w-4" />
                  {t.offerRide}
                  <ArrowRight className="h-4 w-4" />
                </MagneticButton>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/cerca`)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-white/25"
                >
                  <Search className="h-4 w-4 text-[#ffb3b1]" />
                  {t.heroSearchButton}
                </button>
              </div>
            </Reveal>
          </div>
        </AuroraBackground>
      </section>
    </div>
  );
}

export default function HomePageClient({
  locale,
  translations,
}: {
  locale: string;
  translations: HomeTranslations;
}) {
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
      try {
        const { date: today, time: nowTime } = getAppNow();

        const { data: ridesData } = await supabase
          .from("rides")
          .select("id, from_city, to_city, date, time, price, profiles!inner(name, avatar_url, rating)")
          .eq("date", today)
          .eq("status", "active")
          .gte("time", nowTime)
          .order("time", { ascending: true })
          .limit(5);

        setTodayRides(((ridesData as unknown as Record<string, unknown>[]) || []).map(r => ({ ...r, profiles: normalizeProfile(r.profiles) })) as Ride[]);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
          setUserName(name);
          setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
        }
      } catch {
        // Error fetching data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    router.push(`/${locale}/cerca?${params.toString()}`);
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
    locale,
    translations,
  };

  return (
    <>
      <LaunchBanner />
      {deviceType === "mobile" ? <HomeMobile {...props} /> : <HomeDesktop {...props} />}
    </>
  );
}

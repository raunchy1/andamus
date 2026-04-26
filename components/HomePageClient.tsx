'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { SardiniaMap } from "@/components/SardiniaMap";
import { CityCombobox } from "@/components/CityCombobox";
import {
  Search, Star, User, PlusCircle, History,
  ArrowRight, ArrowUpDown, Calendar, ChevronRight
} from "lucide-react";
import Image from "next/image";
import municipalities from "@/scripts/sardinia-municipalities.json";

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
  destination,
  setDestination,
  todayRides,
  loading,
  userName,
  translations,
  handleSearch,
}: HomeViewProps) {
  const t = translations;
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const formattedDate = new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden pb-20">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full h-[55vh] overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/sardinia-hero.jpg)" }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/85" />

        {/* Sardinia Map — right side */}
        <div className="absolute right-0 top-0 w-[50%] h-full opacity-55 z-[2]">
          <SardiniaMap mode="mobile" />
        </div>

        {/* Hero content — left side */}
        <div className="absolute bottom-8 left-5 z-[3] max-w-[55%]">
          {userName && (
            <p className="text-[#e63946] text-xs font-inter font-bold tracking-[0.2em] uppercase mb-1">
              {t.welcomeBack}, {userName.split(" ")[0]}
            </p>
          )}
          <p className="text-[#e63946] text-xs font-inter font-bold tracking-[0.2em] uppercase mb-2">
            {t.badge}
          </p>
          <h1 className="font-bebas text-7xl text-white leading-none tracking-wide mb-1">
            ANDAMUS
          </h1>
          <p className="font-playfair text-xl italic text-white/90 mb-4">
            L&apos;isola ti <span className="text-[#e63946]">aspetta.</span>
          </p>
          <div className="space-y-1 border-l-2 border-[#e63946] pl-3">
            <p className="text-sm text-white/80 font-inter">
              Da Cagliari a Olbia. <span className="text-[#e63946] font-semibold">Insieme.</span>
            </p>
            <p className="text-sm text-white/70 font-inter">
              Non guidare da solo. Muoviti <span className="text-[#e63946] font-semibold">sardo.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== SEARCH CARD ===== */}
      <section className="relative bg-[#0d0d0d] rounded-t-3xl -mt-6 z-[4] px-5 pt-6 pb-4">
        {/* Red top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e63946]/60 to-transparent" />

        <p className="text-[#e63946] text-xs font-inter font-bold tracking-[0.15em] uppercase mb-4">
          {t.heroFrom}
        </p>

        {/* Route input card */}
        <div className="bg-[#111111] rounded-2xl p-4 mb-3 relative">
          {/* Vertical red line */}
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-[#e63946]" />

          {/* FROM */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#e63946] mt-1 flex-shrink-0 shadow-red-glow-sm" />
            <div className="flex-1">
              <p className="text-[#9ca3af] text-xs font-inter uppercase tracking-widest mb-0.5">DA</p>
              <CityCombobox
                cities={municipalities}
                value={origin}
                onChange={setOrigin}
                placeholder={t.heroFromPlaceholder}
                label="partenza"
                buttonClassName="bg-transparent border-none shadow-none text-sm text-white hover:bg-transparent hover:text-white px-0 h-auto min-h-0"
              />
            </div>
          </div>

          {/* TO */}
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full border-2 border-[#e63946] mt-1 flex-shrink-0 bg-transparent" />
            <div className="flex-1">
              <p className="text-[#9ca3af] text-xs font-inter uppercase tracking-widest mb-0.5">A</p>
              <CityCombobox
                cities={municipalities}
                value={destination}
                onChange={setDestination}
                placeholder={t.heroCityPlaceholder}
                label="destinazione"
                buttonClassName="bg-transparent border-none shadow-none text-sm text-white hover:bg-transparent hover:text-white px-0 h-auto min-h-0"
              />
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwapCities}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/20 bg-[#111111] flex items-center justify-center hover:border-[#e63946] transition-colors"
          >
            <ArrowUpDown size={16} className="text-[#9ca3af]" />
          </button>
        </div>

        {/* Date selector */}
        <button className="w-full flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-3.5 mb-4 hover:border-[#e63946]/50 transition-colors">
          <Calendar size={18} className="text-[#e63946]" />
          <span className="flex-1 text-left text-white font-inter">{formattedDate}</span>
          <ChevronRight size={16} className="text-[#9ca3af] rotate-90" />
        </button>

        {/* CTA Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-[#e63946] text-white rounded-2xl py-4 font-inter font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-red-glow"
        >
          {t.heroSearchButton}
          <ArrowRight size={18} />
        </button>

        {/* Gamification strip */}
        <div className="mt-3 flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#e63946]/20 border border-[#e63946] flex items-center justify-center flex-shrink-0">
            <Star size={14} className="text-[#e63946]" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-inter font-medium">Guadagna punti ad ogni viaggio!</p>
          </div>
          <span className="text-[#e63946] font-inter font-bold text-sm">+50 pt</span>
          <ChevronRight size={16} className="text-[#9ca3af]" />
        </div>

        {/* Decorative dot grid */}
        <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#e63946]" />
          ))}
        </div>
      </section>

      {/* ===== TODAY'S RIDES ===== */}
      <section className="px-5 pt-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white font-inter truncate pr-2">
            {t.todayRides}
          </h3>
          <Link href="/cerca" className="text-[11px] font-bold text-[#e63946] border-b border-[#e63946]/30 pb-0.5 hover:text-[#e63946]/80 transition-colors flex-shrink-0 font-inter">
            {t.seeAll}
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar">
            {[1, 2].map((i) => (
              <div key={i} className="snap-start flex-shrink-0 w-[260px] bg-[#111111] p-4 rounded-xl h-[160px] animate-pulse" />
            ))}
          </div>
        ) : todayRides.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar">
            {todayRides.map((ride, idx) => (
              <Link
                key={ride.id}
                href={`/corsa/${ride.id}`}
                className={`snap-start flex-shrink-0 w-[260px] bg-[#111111] p-4 rounded-xl flex flex-col justify-between h-[160px] transition-transform active:scale-95 ${
                  idx === 0 ? "border-l-4 border-[#e63946]" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-bold ${idx === 0 ? "text-[#e63946]" : "text-white/40"} uppercase tracking-widest`}>
                      {t.today} · {ride.time.slice(0, 5)}
                    </span>
                    <h4 className="text-base font-bold mt-1 text-white truncate">{ride.from_city} → {ride.to_city}</h4>
                  </div>
                  <div className="text-lg font-extrabold tracking-tight text-white flex-shrink-0">
                    {ride.price === 0 ? t.free : `€${ride.price}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                    {ride.profiles.avatar_url ? (
                      <Image src={ride.profiles.avatar_url} alt={ride.profiles.name} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-[#9ca3af]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{ride.profiles.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-[#e63946] fill-[#e63946]" />
                      <span className="text-[10px] text-white/60">{ride.profiles.rating}{t.car}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#111111] p-4 rounded-xl">
            <p className="text-sm text-white/60">{t.noRidesToday}</p>
            <Link href="/cerca" className="text-[#e63946] text-sm font-bold mt-2 inline-block">{t.searchOtherDates} →</Link>
          </div>
        )}
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="px-5 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-3 w-full">
          <Link
            href="/offri"
            className="bg-[#e63946]/10 rounded-xl p-4 flex flex-col justify-between hover:bg-[#e63946]/20 transition-colors active:scale-95 min-h-[120px] border border-[#e63946]/20"
          >
            <PlusCircle className="w-7 h-7 flex-shrink-0 text-[#e63946]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white leading-tight mt-2 font-inter">{t.offerRide}</span>
          </Link>
          <Link
            href="/profilo"
            className="bg-[#111111] rounded-xl p-4 flex flex-col justify-between hover:bg-[#1a1a1a] transition-colors active:scale-95 min-h-[120px] border border-white/5"
          >
            <History className="w-7 h-7 flex-shrink-0 text-[#9ca3af]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white leading-tight mt-2 font-inter">{t.yourTrips}</span>
          </Link>
        </div>
      </section>
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
  translations,
  handleSearch,
  router,
  locale,
}: HomeViewProps) {
  const t = translations;
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (date && date !== today) params.set("date", date);
    router.push(`/cerca?${params.toString()}`);
  };

  const formattedDate = new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative w-full h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/sardinia-hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/85" />

        {/* Map overlay */}
        <div className="absolute right-0 top-0 w-[45%] h-full opacity-50 z-[2]">
          <SardiniaMap mode="desktop" />
        </div>

        {/* Hero content */}
        <div className="absolute bottom-12 left-10 z-[3] max-w-[50%]">
          {userName && (
            <p className="text-[#e63946] text-sm font-inter font-bold tracking-[0.2em] uppercase mb-2">
              {t.welcomeBack}, {userName.split(" ")[0]}
            </p>
          )}
          <p className="text-[#e63946] text-sm font-inter font-bold tracking-[0.2em] uppercase mb-3">
            {t.badge}
          </p>
          <h1 className="font-bebas text-9xl text-white leading-none tracking-wide mb-2">
            ANDAMUS
          </h1>
          <p className="font-playfair text-3xl italic text-white/90 mb-6">
            L&apos;isola ti <span className="text-[#e63946]">aspetta.</span>
          </p>
          <div className="space-y-2 border-l-2 border-[#e63946] pl-4">
            <p className="text-base text-white/80 font-inter">
              Da Cagliari a Olbia. <span className="text-[#e63946] font-semibold">Insieme.</span>
            </p>
            <p className="text-base text-white/70 font-inter">
              Non guidare da solo. Muoviti <span className="text-[#e63946] font-semibold">sardo.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <form
            onSubmit={onSubmit}
            className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 lg:p-5 shadow-2xl shadow-black/40"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {/* Partenza */}
              <div className="flex-1 flex items-center gap-4 px-5 py-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 min-w-0">
                <div className="w-3 h-3 rounded-full bg-[#e63946] flex-shrink-0 shadow-red-glow-sm" />
                <div className="flex flex-col w-full min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1 font-inter">{t.heroFrom}</label>
                  <CityCombobox
                    cities={municipalities}
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t.heroCityPlaceholder}
                    label="partenza"
                    buttonClassName="bg-transparent border-none shadow-none text-white hover:bg-transparent hover:text-white px-0 h-auto min-h-0 text-base"
                  />
                </div>
              </div>

              {/* Swap */}
              <button
                type="button"
                onClick={handleSwapCities}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-[#111111] hover:border-[#e63946] transition-colors self-center"
              >
                <ArrowUpDown size={16} className="text-[#9ca3af]" />
              </button>

              {/* Destinazione */}
              <div className="flex-1 flex items-center gap-4 px-5 py-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 min-w-0">
                <div className="w-3 h-3 rounded-full border-2 border-[#e63946] flex-shrink-0 bg-transparent" />
                <div className="flex flex-col w-full min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1 font-inter">{t.heroTo}</label>
                  <CityCombobox
                    cities={municipalities}
                    value={destination}
                    onChange={setDestination}
                    placeholder={t.heroCityPlaceholder}
                    label="destinazione"
                    buttonClassName="bg-transparent border-none shadow-none text-white hover:bg-transparent hover:text-white px-0 h-auto min-h-0 text-base"
                  />
                </div>
              </div>

              {/* Data */}
              <div className="md:max-w-[200px] flex items-center gap-4 px-5 py-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 min-w-0">
                <Calendar size={18} className="text-[#e63946] flex-shrink-0" />
                <div className="flex flex-col w-full min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1 font-inter">{t.heroDate}</label>
                  <span className="text-white text-base font-inter">{formattedDate}</span>
                </div>
              </div>

              {/* Cerca Button */}
              <button
                type="submit"
                className="bg-[#e63946] hover:opacity-90 text-white px-8 lg:px-10 py-5 rounded-xl font-inter font-bold text-base uppercase tracking-wider transition-opacity flex items-center justify-center gap-2 flex-shrink-0 min-w-[140px] shadow-red-glow"
              >
                <Search className="w-5 h-5" />
                {t.heroSearchButton}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Rides */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight font-bebas">{t.todayRides}</h3>
            <p className="text-white/50 mt-2 font-inter">{t.departuresConfirmed} {new Date().toLocaleDateString(locale, { day: "numeric", month: "long" })}</p>
          </div>
          <Link href="/cerca" className="text-sm font-bold text-[#e63946] hover:text-[#e63946]/80 transition-colors font-inter">
            {t.seeAll} →
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
                    ? "bg-[#e63946]/5 border-[#e63946]/20"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? "text-[#e63946]" : "text-white/40"}`}>
                      {t.today} · {ride.time.slice(0, 5)}
                    </span>
                    <h4 className="text-xl font-bold mt-2">{ride.from_city} → {ride.to_city}</h4>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {ride.price === 0 ? t.free : `€${ride.price}`}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden border border-white/10">
                    {ride.profiles.avatar_url ? (
                      <Image src={ride.profiles.avatar_url} alt={ride.profiles.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{ride.profiles.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-[#e63946] fill-[#e63946]" />
                      <span className="text-xs text-white/60">{ride.profiles.rating}{t.car}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-10 text-center">
            <p className="text-white/60">{t.noRidesToday}</p>
            <Link href="/cerca" className="inline-block mt-4 text-[#e63946] font-bold hover:underline">{t.searchOtherDates}</Link>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/offri"
            className="bg-[#e63946]/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-[#e63946]/20 transition-colors active:scale-95 border border-[#e63946]/20"
          >
            <PlusCircle className="w-8 h-8 text-[#e63946]" />
            <div>
              <span className="text-lg font-bold text-white font-inter">{t.offerRide}</span>
              <p className="text-sm text-white/50 font-inter">Offri un passaggio e guadagna punti</p>
            </div>
          </Link>
          <Link
            href="/profilo"
            className="bg-[#111111] rounded-2xl p-6 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors active:scale-95 border border-white/5"
          >
            <History className="w-8 h-8 text-[#9ca3af]" />
            <div>
              <span className="text-lg font-bold text-white font-inter">{t.yourTrips}</span>
              <p className="text-sm text-white/50 font-inter">Vedi i tuoi viaggi passati</p>
            </div>
          </Link>
        </div>
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
        const today = new Date().toISOString().split("T")[0];

        const { data: ridesData, error: ridesError } = await supabase
          .from("rides")
          .select("id, from_city, to_city, date, time, price, profiles!inner(name, avatar_url, rating)")
          .eq("date", today)
          .eq("status", "active")
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
    locale,
    translations,
  };

  return (
    <>
      {deviceType === "mobile" ? <HomeMobile {...props} /> : <HomeDesktop {...props} />}
    </>
  );
}

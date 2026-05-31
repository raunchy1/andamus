"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, RefreshCw, Bell, SlidersHorizontal, X, User, Search, Car, Star, ChevronRight, BadgeCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { getFriendlyErrorMessage } from "@/lib/client/error-handler";
import { searchRides } from "@/lib/rides-actions";
import { Slider } from "@/components/ui/slider";
import { LocationCombobox } from "@/components/LocationCombobox";
import { EmptyStateSearch } from "@/components/EmptyState";
import { TrustBadge } from "@/components/TrustBadge";
import { Analytics } from "@/lib/analytics";
import { trackSearchInHistory } from "@/lib/commute-suggestions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RideCardSkeleton } from "@/components/cerca/RideCardSkeleton";
import { PremiumRideCard } from "@/components/cerca/PremiumRideCard";
import { AlertModal } from "@/components/cerca/AlertModal";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { CreateRequestModal } from "@/components/CreateRequestModal";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";

function getFilterOptions(t: (key: string) => string) {
  return [
    { id: "all", label: t('filterAll') },
    { id: "free", label: t('filterFree') },
    { id: "verified", label: t('filterVerified') },
    { id: "today", label: t('filterToday') },
  ];
}

interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  created_at?: string;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    review_count?: number | null;
    rides_count?: number | null;
    completed_rides_count?: number | null;
  };
}

interface SearchViewProps {
  activeFilter: string;
  setActiveFilter: (v: string) => void;
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  timeWindow: string;
  setTimeWindow: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  minSeats: number | null;
  setMinSeats: (v: number | null) => void;
  onlyVerified: boolean;
  setOnlyVerified: (v: boolean) => void;
  prefSmoking: boolean;
  setPrefSmoking: (v: boolean) => void;
  prefPets: boolean;
  setPrefPets: (v: boolean) => void;
  prefLuggage: boolean;
  setPrefLuggage: (v: boolean) => void;
  prefWomen: boolean;
  setPrefWomen: (v: boolean) => void;
  prefStudents: boolean;
  setPrefStudents: (v: boolean) => void;
  prefMusic: string;
  setPrefMusic: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  isRefreshing: boolean;
  setIsRefreshing: (v: boolean) => void;
  showAlertModal: boolean;
  setShowAlertModal: (v: boolean) => void;
  alertSaving: boolean;
  setAlertSaving: (v: boolean) => void;
  pullStartY: number;
  setPullStartY: (v: number) => void;
  pullDistance: number;
  setPullDistance: (v: number) => void;
  rides: Ride[];
  loading: boolean;
  hasError: boolean;
  today: string;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  fetchRides: () => Promise<void>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => Promise<void>;
  handleTouchCancel: () => void;
  handleRefresh: () => Promise<void>;
  handleSearch: (e: React.FormEvent) => void;
  clearFilters: () => void;
  formatDate: (dateStr: string) => string;
  activeFiltersCount: number;
  supabase: ReturnType<typeof createClient>;
  showCreateModal?: boolean;
  setShowCreateModal?: (v: boolean) => void;
}


function SearchMobile(props: SearchViewProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const {
    activeFilter, setActiveFilter,
    origin, setOrigin,
    destination, setDestination,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    timeWindow, setTimeWindow,
    maxPrice, setMaxPrice,
    minSeats, setMinSeats,
    onlyVerified, setOnlyVerified,
    prefSmoking, setPrefSmoking,
    prefPets, setPrefPets,
    prefLuggage, setPrefLuggage,
    prefWomen, setPrefWomen,
    prefStudents: _prefStudents,
    prefMusic: _prefMusic,
    showFilters, setShowFilters,
    isRefreshing,
    showAlertModal, setShowAlertModal,
    alertSaving, setAlertSaving,
    pullDistance,
    rides, loading, hasError,
    today,
    resultsRef,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel,
    handleRefresh,
    handleSearch: _handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    setShowCreateModal,
  } = props;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] overflow-x-hidden">
      {/* TopAppBar with aurora glow */}
      <AuroraBackground className="border-b border-white/5">
        <OrbGlow className="-top-10 -right-10" color="#e63946" size={220} opacity={0.28} />
        <header className="relative flex justify-between items-end px-4 sm:px-6 pt-4 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/${locale}/profilo`} className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 backdrop-blur-md">
              <User className="w-5 h-5 text-[#e5e2e1]" />
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#ffb3b1]/70">{t('resultsCount', { count: rides.length })}</span>
              <h1 className="font-extrabold tracking-tighter text-2xl sm:text-3xl text-[#e5e2e1] uppercase truncate">
                <GradientText>Cerca</GradientText>
              </h1>
            </div>
          </div>
          <button type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md text-[#ffb3b1] hover:bg-white/[0.06] hover:border-[#ffb3b1]/30 transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#e63946] text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0e0e0e]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </header>
      </AuroraBackground>

      <main className="px-4 sm:px-6 max-w-2xl mx-auto overflow-x-hidden" ref={resultsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Pull to refresh indicator */}
        <div
          className="flex justify-center items-center h-0 overflow-visible transition-all duration-200 -mt-2 mb-2"
          style={{ height: pullDistance > 0 ? pullDistance : 0 }}
        >
          <div className={`flex items-center gap-2 text-on-surface/60 transition-opacity ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            <span className="text-sm">{pullDistance > 60 ? t('releaseToRefresh') : t('pullToRefresh')}</span>
          </div>
        </div>

        {/* Sticky Minimal Search Bar - Full Width Responsive */}
        <div className="z-40 mb-6 sm:sticky sm:top-24 sm:mb-8">
          <div className="bg-surface-container-high rounded-xl p-2.5 sm:p-4 shadow-2xl w-full max-w-full">
            {/* Mobile: Stacked layout, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/* Search Icon - hidden on mobile, shown on sm+ */}
              <Search className="hidden sm:block w-5 h-5 text-primary flex-shrink-0" />

              {/* From/To Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Partenza */}
                <div className="flex flex-col min-w-0 bg-surface-container-highest/50 rounded-lg px-3 py-2 sm:bg-transparent sm:p-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">{t('fromLabel')}</span>
                  <div className="w-full">
                    <LocationCombobox
                      value={origin}
                      onChange={setOrigin}
                      placeholder={t('departureLabel')}
                      label={t('fromLabel')}
                    />
                  </div>
                </div>

                {/* Destinazione */}
                <div className="flex flex-col min-w-0 bg-surface-container-highest/50 rounded-lg px-3 py-2 sm:bg-transparent sm:p-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">{t('toLabel')}</span>
                  <div className="w-full">
                    <LocationCombobox
                      value={destination}
                      onChange={setDestination}
                      placeholder={t('destinationLabel')}
                      label={t('toLabel')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Shortcuts Panel (Zero Friction Search) */}
        {!origin && !destination && (
          <section className="mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#ffb3b1] uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3 text-[#ffb3b1]" />
              Scorciatoie consigliate per la Sardegna
            </span>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar snap-x">
              {[
                { from: "Cagliari", to: "Sassari", label: "Dorsale Sarda", badge: "Popolare" },
                { from: "Sinnai", to: "Cagliari", label: "UniCa Monserrato", badge: "Studenti" },
                { from: "Sassari", to: "Alghero", label: "Fertilia Airport", badge: "Aeroporto" },
                { from: "Olbia", to: "Cagliari", label: "Costa Smeralda Hub", badge: "Aeroporto" }
              ].map((shortcut, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setOrigin(shortcut.from);
                    setDestination(shortcut.to);
                    Analytics.track("popular_route_clicked", { from: shortcut.from, to: shortcut.to, type: "cerca_preset" });
                  }}
                  className="snap-start flex-shrink-0 bg-white/5 border border-white/8 p-3 rounded-xl text-left w-[160px] active:scale-95 transition-all hover:border-[#ffb3b1]/30 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl bg-white/5 text-white/50 text-[7px] font-extrabold uppercase">
                    {shortcut.badge}
                  </div>
                  <div className="text-[11px] font-extrabold text-white group-hover:text-[#ffb3b1] transition-colors truncate">{shortcut.from} ➔ {shortcut.to}</div>
                  <div className="text-[9px] text-[#a0a0a0] mt-1.5 font-semibold truncate">{shortcut.label}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Elegant Filter Pills */}
        <div className="flex gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto no-scrollbar pb-2">
          {getFilterOptions(t).map((option) => (
            <button type="button"
              key={option.id}
              onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
              className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 flex-shrink-0 ${
                activeFilter === option.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface border border-outline-variant border-opacity-20 hover:bg-surface-container-highest"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button type="button"
            onClick={() => setShowAlertModal(true)}
            className="whitespace-nowrap px-4 sm:px-6 py-2 bg-surface-container-high text-primary rounded-full font-bold text-[11px] uppercase tracking-widest border border-outline-variant border-opacity-20 hover:bg-surface-container-highest transition-all active:scale-95 flex items-center gap-2 flex-shrink-0"
          >
            <Bell className="w-3 h-3" />
            {t('alertButton')}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-6 sm:mb-8 bg-surface-container-low rounded-xl p-3 sm:p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">{t('advancedFilters')}</h3>
              <button type="button" onClick={() => setShowFilters(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">{t('dateRange')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <PremiumDatePicker
                    date={dateFrom}
                    onSelect={setDateFrom}
                    min={today}
                    placeholder="Da"
                    label=""
                    className="w-full"
                  />
                  <PremiumDatePicker
                    date={dateTo}
                    onSelect={setDateTo}
                    min={dateFrom || today}
                    placeholder="A"
                    label=""
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">{t('timeWindowLabel')}</label>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="">{t('any')}</option>
                  <option value="morning">{t('timeMorning')}</option>
                  <option value="afternoon">{t('timeAfternoon')}</option>
                  <option value="evening">{t('timeEvening')}</option>
                  <option value="night">{t('timeNight')}</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('maxPriceLabel')}</label>
                  <span className="text-xs font-bold text-on-surface">{maxPrice === 50 ? t('priceAny') : `€${maxPrice}`}</span>
                </div>
                <Slider
                  value={[maxPrice]}
                  onValueChange={(v) => setMaxPrice(Array.isArray(v) ? v[0] : v)}
                  max={50}
                  step={1}
                  className="py-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">{t('minSeatsLabel')}</label>
                <select
                  value={minSeats || ""}
                  onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="">{t('any')}</option>
                  <option value="1">{t('seats', {count: 1})}</option>
                  <option value="2">{t('seats', {count: 2})}</option>
                  <option value="3">{t('seats', {count: 3})}</option>
                  <option value="4">{t('seats', {count: 4})}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${onlyVerified ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('verifiedFilter')}</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefSmoking ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefSmoking} onChange={(e) => setPrefSmoking(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('smokingFilter')}</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefPets ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefPets} onChange={(e) => setPrefPets(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('petsFilter')}</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefLuggage ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefLuggage} onChange={(e) => setPrefLuggage(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('luggageFilter')}</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefWomen ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefWomen} onChange={(e) => setPrefWomen(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('womenFilter')}</span>
              </label>
            </div>

            {activeFiltersCount > 0 && (
              <button type="button"
                onClick={clearFilters}
                className="w-full py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {loading ? t('loading') : t('resultsCount', { count: rides.length })}
          </p>
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label={t('ariaRefresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Innovative Ride List (Premium Editorial Style) */}
        <RevealStagger className="space-y-4 sm:space-y-6">
          {loading && (
            <>
              <RideCardSkeleton />
              <RideCardSkeleton />
              <RideCardSkeleton />
            </>
          )}

          {!loading && hasError && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <p className="text-[#e5e2e1]/60 text-sm">{t('searchError')}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#e63946] text-white rounded-xl text-sm font-semibold hover:bg-[#c92a37] transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          )}

          {!loading && !hasError && rides.length === 0 && (
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
              onCreateRequest={() => setShowCreateModal?.(true)}
              onCreateAlert={() => setShowAlertModal(true)}
              fromCity={origin}
              toCity={destination}
              searchDate={dateFrom}
              onSelectSuggestion={(sFrom, sTo, sDate) => {
                if (sFrom !== undefined) setOrigin(sFrom);
                if (sTo !== undefined) setDestination(sTo);
                if (sDate !== undefined) setDateFrom(sDate || "");
              }}
            />
          )}

          {!loading && !hasError && rides.map((ride, idx) => (
            <RevealItem key={ride.id}>
              <PremiumRideCard
                ride={ride}
                index={idx}
                today={today}
                formatDate={formatDate}
                variant="list"
                t={t}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </main>

      <AlertModal
        showAlertModal={showAlertModal}
        setShowAlertModal={setShowAlertModal}
        alertSaving={alertSaving}
        setAlertSaving={setAlertSaving}
        origin={origin}
        destination={destination}
        date={dateFrom}
        minSeats={minSeats}
        maxPrice={maxPrice === 50 ? null : maxPrice}
        supabase={supabase}
      />
    </div>
  );
}

function SearchDesktop(props: SearchViewProps) {
  const t = useTranslations('search');
  const locale = useLocale();
  const {
    activeFilter, setActiveFilter,
    origin, setOrigin,
    destination, setDestination,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    timeWindow, setTimeWindow,
    maxPrice, setMaxPrice,
    minSeats, setMinSeats,
    onlyVerified, setOnlyVerified,
    prefSmoking, setPrefSmoking,
    prefPets, setPrefPets,
    prefLuggage, setPrefLuggage,
    prefWomen, setPrefWomen,
    prefStudents, setPrefStudents,
    prefMusic, setPrefMusic,
    showFilters, setShowFilters,
    isRefreshing,
    showAlertModal, setShowAlertModal,
    alertSaving, setAlertSaving,
    rides, loading, hasError,
    today,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    setShowCreateModal,
  } = props;

  return (
    <div className="text-[#e5e2e1] max-w-7xl mx-auto w-full relative">
      <AuroraBackground className="absolute inset-x-0 -top-10 h-[400px] -z-10" showRadialMask={false}>
        <OrbGlow className="-top-20 -left-20" color="#e63946" size={320} opacity={0.30} />
      </AuroraBackground>

      {/* Section title */}
      <Reveal>
        <div className="mb-8 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffb3b1]/70">Sardegna · Live</span>
          <h2 className="mt-2 text-4xl lg:text-5xl font-extrabold tracking-tighter">
            Trova il tuo <GradientText>passaggio</GradientText>
          </h2>
        </div>
      </Reveal>

      {/* Search & Filters Section */}
      <div className="mb-10 space-y-6">
        {/* Horizontal Search Bar */}
        <Reveal delay={0.1}>
        <form onSubmit={handleSearch} className="bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-end shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('departureLabel')}</label>
            <LocationCombobox
              value={origin}
              onChange={setOrigin}
              placeholder={t('departureLabel')}
              label={t('departureLabel')}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('destinationLabel')}</label>
            <LocationCombobox
              value={destination}
              onChange={setDestination}
              placeholder={t('destinationLabel')}
              label={t('destinationLabel')}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('dateLabel')}</label>
            <div className="flex gap-2">
              <PremiumDatePicker
                date={dateFrom}
                onSelect={setDateFrom}
                min={today}
                placeholder="Da"
                label=""
                className="flex-1"
              />
              <PremiumDatePicker
                date={dateTo}
                onSelect={setDateTo}
                min={dateFrom || today}
                placeholder="A"
                label=""
                className="flex-1"
              />
            </div>
          </div>
          <MagneticButton type="submit" className="lg:rounded-2xl">
            <Search className="w-4 h-4" />
            {t('searchButton')}
          </MagneticButton>
        </form>
        </Reveal>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {getFilterOptions(t).map((option) => (
            <motion.button type="button"
              key={option.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
              className={`px-5 py-2.5 rounded-full font-semibold text-[11px] uppercase tracking-widest transition-all ${
                activeFilter === option.id
                  ? "text-white"
                  : "bg-[#1a1a1a] text-[#a0a0a0] border border-white/[0.06] hover:border-white/[0.1] hover:text-[#e5e2e1]"
              }`}
              style={activeFilter === option.id ? {
                background: "linear-gradient(135deg, #e63946 0%, #f4a261 100%)",
                boxShadow: "0 4px 12px rgba(230, 57, 70, 0.25)",
              } : undefined}
            >
              {option.label}
            </motion.button>
          ))}
          <motion.button type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAlertModal(true)}
            className="px-5 py-2.5 bg-[#1a1a1a] text-[#e63946] rounded-full font-semibold text-[11px] uppercase tracking-widest border border-white/[0.06] hover:border-[#e63946]/20 transition-all flex items-center gap-2"
          >
            <Bell className="w-3 h-3" />
            {t('alertButton')}
          </motion.button>
          <motion.button type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 rounded-full font-semibold text-[11px] uppercase tracking-widest border transition-all flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? "text-white border-transparent"
                : "bg-[#1a1a1a] text-[#a0a0a0] border-white/[0.06] hover:border-white/[0.1] hover:text-[#e5e2e1]"
            }`}
            style={showFilters || activeFiltersCount > 0 ? {
              background: "linear-gradient(135deg, #e63946 0%, #f4a261 100%)",
              boxShadow: "0 4px 12px rgba(230, 57, 70, 0.25)",
            } : undefined}
          >
            <SlidersHorizontal className="w-3 h-3" />
            {t('advancedFilters')}
            {activeFiltersCount > 0 && !showFilters && (
              <span className="ml-1 w-4 h-4 bg-white/20 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
          {activeFiltersCount > 0 && (
            <motion.button type="button"
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-full font-semibold text-[11px] uppercase tracking-widest text-[#6b6b6b] hover:text-[#e63946] transition-colors"
            >
              {t('clearFilters')}
            </motion.button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-6 space-y-6"
            style={{
              background: "linear-gradient(180deg, #111111 0%, #0d0d0d 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('fromDateShort')}</label>
                <PremiumDatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  min={today}
                  placeholder="Da"
                  label=""
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('toDateShort')}</label>
                <PremiumDatePicker
                  date={dateTo}
                  onSelect={setDateTo}
                  min={dateFrom || today}
                  placeholder="A"
                  label=""
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('timeWindowLabel')}</label>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">{t('any')}</option>
                  <option value="morning">{t('timeMorning')}</option>
                  <option value="afternoon">{t('timeAfternoon')}</option>
                  <option value="evening">{t('timeEvening')}</option>
                  <option value="night">{t('timeNight')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('minSeatsLabel')}</label>
                <select
                  value={minSeats || ""}
                  onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">{t('any')}</option>
                  <option value="1">{t('seats', {count: 1})}</option>
                  <option value="2">{t('seats', {count: 2})}</option>
                  <option value="3">{t('seats', {count: 3})}</option>
                  <option value="4">{t('seats', {count: 4})}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1]">{t('maxPriceLabel')}</label>
                  <span className="text-xs font-bold text-[#e5e2e1]">{maxPrice === 50 ? t('priceAny') : `€${maxPrice}`}</span>
                </div>
                <Slider
                  value={[maxPrice]}
                  onValueChange={(v) => setMaxPrice(Array.isArray(v) ? v[0] : v)}
                  max={50}
                  step={1}
                  className="py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">{t('musicLabel')}</label>
                <select
                  value={prefMusic}
                  onChange={(e) => setPrefMusic(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">{t('any')}</option>
                  <option value="quiet">{t('musicQuiet')}</option>
                  <option value="music">{t('musicMusic')}</option>
                  <option value="talk">{t('musicTalk')}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: "verified", label: t('verifiedFilter'), state: onlyVerified, setState: setOnlyVerified },
                { id: "smoking", label: t('smokingFilter'), state: prefSmoking, setState: setPrefSmoking },
                { id: "pets", label: t('petsFilter'), state: prefPets, setState: setPrefPets },
                { id: "luggage", label: t('luggageFilter'), state: prefLuggage, setState: setPrefLuggage },
                { id: "women", label: t('womenFilter'), state: prefWomen, setState: setPrefWomen },
                { id: "students", label: t('studentsFilter'), state: prefStudents, setState: setPrefStudents },
              ].map((item) => (
                <motion.label
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-all border ${
                    item.state
                      ? "text-white border-transparent"
                      : "bg-[#1a1a1a] text-[#a0a0a0] border-white/[0.06] hover:border-white/[0.1] hover:text-[#e5e2e1]"
                  }`}
                  style={item.state ? {
                    background: "linear-gradient(135deg, #e63946 0%, #f4a261 100%)",
                    boxShadow: "0 4px 12px rgba(230, 57, 70, 0.2)",
                  } : undefined}
                >
                  <input type="checkbox" checked={item.state} onChange={(e) => item.setState(e.target.checked)} className="hidden" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                </motion.label>
              ))}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#e5e2e1]/60">
          {loading ? t('loading') : t('resultsCount', { count: rides.length })}
        </p>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-[#1a1a1a] text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#222] transition-colors"
            aria-label={t('ariaRefresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <RevealStagger className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && (
          <>
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        )}

        {!loading && hasError && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center gap-4">
            <p className="text-[#e5e2e1]/60">{t('searchError')}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 bg-[#e63946] text-white rounded-xl text-sm font-semibold hover:bg-[#c92a37] transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {!loading && !hasError && rides.length === 0 && (
          <div className="col-span-full">
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
              onCreateAlert={() => setShowAlertModal(true)}
              onCreateRequest={() => setShowCreateModal?.(true)}
              fromCity={origin}
              toCity={destination}
              searchDate={dateFrom}
              onSelectSuggestion={(sFrom, sTo, sDate) => {
                if (sFrom !== undefined) setOrigin(sFrom);
                if (sTo !== undefined) setDestination(sTo);
                if (sDate !== undefined) setDateFrom(sDate || "");
              }}
            />
          </div>
        )}

        {!loading && !hasError && rides.map((ride, idx) => (
          <RevealItem key={ride.id}>
            <PremiumRideCard
              ride={ride}
              index={idx}
              today={today}
              formatDate={formatDate}
              variant="grid"
              t={t}
            />
          </RevealItem>
        ))}
      </RevealStagger>

      <AlertModal
        showAlertModal={showAlertModal}
        setShowAlertModal={setShowAlertModal}
        alertSaving={alertSaving}
        setAlertSaving={setAlertSaving}
        origin={origin}
        destination={destination}
        date={dateFrom}
        minSeats={minSeats}
        maxPrice={maxPrice === 50 ? null : maxPrice}
        supabase={supabase}
      />
    </div>
  );
}

function SearchContent() {
  const t = useTranslations('search');
  const searchErrorText = t('searchError');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceType = useDeviceType();

  const [activeFilter, setActiveFilter] = useState("all");
  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date") || "");
  const [dateTo, setDateTo] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [minSeats, setMinSeats] = useState<number | null>(null);
  const [onlyVerified, setOnlyVerified] = useState(searchParams.get("verified") === "true");
  const [prefSmoking, setPrefSmoking] = useState(false);
  const [prefPets, setPrefPets] = useState(false);
  const [prefLuggage, setPrefLuggage] = useState(false);
  const [prefWomen, setPrefWomen] = useState(searchParams.get("women") === "true");
  const [prefStudents, setPrefStudents] = useState(searchParams.get("students") === "true");
  const [prefMusic, setPrefMusic] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  // Fix #4: track error state so the error UI is shown instead of empty state
  const [hasError, setHasError] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Fix #1: sync filter state back into the URL so browser Back restores them.
  // We use replace (not push) to avoid polluting the history stack on every
  // keystroke — only the current entry is updated.
  const syncUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (dateFrom) params.set("date", dateFrom);
    if (activeFilter !== "all") params.set("filter", activeFilter);
    const qs = params.toString();
    router.replace(`/${locale}/cerca${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [origin, destination, dateFrom, activeFilter, locale, router]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const results = await searchRides({
        origin: origin || undefined,
        destination: destination || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        timeWindow: (timeWindow as "morning" | "afternoon" | "evening" | "night" | "") || undefined,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        minSeats: minSeats ?? undefined,
        smoking: prefSmoking || undefined,
        pets: prefPets || undefined,
        luggage: prefLuggage || undefined,
        womenOnly: prefWomen || undefined,
        studentsOnly: prefStudents || undefined,
        musicPreference: prefMusic || undefined,
        verifiedOnly: (activeFilter === "verified" || onlyVerified) || undefined,
        freeOnly: activeFilter === "free" || undefined,
        todayOnly: activeFilter === "today" || undefined,
      });
      if (!isMountedRef.current) return;
      setRides(results as Ride[]);

      // Phase 5 Search Conversion Telemetry & PWA Signal
      if (results && results.length > 0) {
        Analytics.trackEvent("first_search_success", {
          origin: origin || undefined,
          destination: destination || undefined,
          results_count: results.length,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("successful_search"));
        }
      } else {
        Analytics.trackEvent("empty_searches", {
          origin: origin || undefined,
          destination: destination || undefined,
        });
      }

      if (origin || destination) {
        Analytics.searchPerformed(origin, destination);

        // Log search telemetry asynchronously
        fetch("/api/cerca/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_city: origin || "Tutte",
            to_city: destination || "Tutte",
            date: dateFrom || null,
            results_count: results ? results.length : 0,
            device_type: typeof window !== "undefined" ? (window.innerWidth < 768 ? "mobile" : "desktop") : "unknown",
          }),
        }).catch(() => {});

        if (origin && destination) {
          trackSearchInHistory(origin, destination);
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setHasError(true);
      toast.error(err instanceof Error ? err.message : searchErrorText);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [activeFilter, dateFrom, dateTo, timeWindow, destination, maxPrice, minSeats, onlyVerified, origin, prefLuggage, prefMusic, prefPets, prefSmoking, prefStudents, prefWomen, searchErrorText]);

  // Fix #2: single debounced effect — removed the redundant immediate useEffect
  // that was causing a double fetch on every mount. fetchRides fires once after
  // 400 ms on the initial render, and again whenever its deps change.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRides();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRides]);

  // Fix #1: keep the URL in sync whenever key filter state changes.
  useEffect(() => {
    syncUrlParams();
  }, [syncUrlParams]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (resultsRef.current && resultsRef.current.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && resultsRef.current && resultsRef.current.scrollTop === 0) {
      const diff = e.touches[0].clientY - pullStartY;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 80));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchRides();
      if (isMountedRef.current) setIsRefreshing(false);
    }
    if (isMountedRef.current) {
      setPullStartY(0);
      setPullDistance(0);
    }
  };

  const handleTouchCancel = () => {
    if (isMountedRef.current) {
      setPullStartY(0);
      setPullDistance(0);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRides();
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  const clearFilters = () => {
    setOrigin("");
    setDestination("");
    setDateFrom("");
    setDateTo("");
    setTimeWindow("");
    setMaxPrice(50);
    setMinSeats(null);
    setOnlyVerified(false);
    setPrefSmoking(false);
    setPrefPets(false);
    setPrefLuggage(false);
    setPrefWomen(false);
    setPrefStudents(false);
    setPrefMusic("");
    setActiveFilter("all");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const isToday = dateStr === today;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const isTomorrow = dateStr === tomorrow;

    if (isToday) return t('today');
    if (isTomorrow) return t('tomorrow');

    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };

  const activeFiltersCount =
    (origin ? 1 : 0) +
    (destination ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (timeWindow ? 1 : 0) +
    (maxPrice > 0 && maxPrice < 50 ? 1 : 0) +
    (minSeats !== null ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (prefSmoking ? 1 : 0) +
    (prefPets ? 1 : 0) +
    (prefLuggage ? 1 : 0) +
    (prefWomen ? 1 : 0) +
    (prefStudents ? 1 : 0) +
    (prefMusic ? 1 : 0);

  const sharedProps: SearchViewProps = {
    activeFilter, setActiveFilter,
    origin, setOrigin,
    destination, setDestination,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    timeWindow, setTimeWindow,
    maxPrice, setMaxPrice,
    minSeats, setMinSeats,
    onlyVerified, setOnlyVerified,
    prefSmoking, setPrefSmoking,
    prefPets, setPrefPets,
    prefLuggage, setPrefLuggage,
    prefWomen, setPrefWomen,
    prefStudents, setPrefStudents,
    prefMusic, setPrefMusic,
    showFilters, setShowFilters,
    isRefreshing, setIsRefreshing,
    showAlertModal, setShowAlertModal,
    alertSaving, setAlertSaving,
    pullStartY, setPullStartY,
    pullDistance, setPullDistance,
    rides, loading, hasError,
    today,
    resultsRef,
    fetchRides,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    showCreateModal,
    setShowCreateModal,
  };

  if (deviceType === "mobile") {
    return (
      <>
        <SearchMobile {...sharedProps} />
        <CreateRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialFrom={origin}
          initialTo={destination}
          initialDate={dateFrom}
        />
      </>
    );
  }
  return (
    <>
      <SearchDesktop {...sharedProps} />
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialFrom={origin}
        initialTo={destination}
        initialDate={dateFrom}
      />
    </>
  );
}

// Fix #9: SearchContent uses useSearchParams and useRouter which require a
// Suspense boundary in Next.js 16. SearchPage provides that boundary.
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-[#0e0e0e] pt-16 pb-24">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
              <div className="mb-8">
                <div className="h-5 w-32 mb-2 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-9 w-24 bg-white/[0.08] rounded-lg animate-pulse" />
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 w-full bg-white/[0.05] rounded-lg animate-pulse" />
                  <div className="h-10 w-full bg-white/[0.05] rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 mb-8 overflow-hidden">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-8 rounded-full flex-shrink-0 bg-white/[0.05] animate-pulse w-20" />
                ))}
              </div>
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 sm:p-6 animate-pulse h-48" />
                ))}
              </div>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, Bell, SlidersHorizontal, X, User, Search, Car, Star, ChevronRight, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { searchRides } from "@/lib/rides-actions";
import { Slider } from "@/components/ui/slider";
import { CityCombobox } from "@/components/CityCombobox";
import municipalities from "@/scripts/sardinia-municipalities.json";
import { EmptyStateSearch } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer", "Bosa", "Castelsardo"
];

const filterOptions = [
  { id: "all", label: "Tutti" },
  { id: "free", label: "Gratis" },
  { id: "verified", label: "Verificati" },
  { id: "today", label: "Oggi" },
];

interface Ride {
  id: string;
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
    phone_verified?: boolean;
    id_verified?: boolean;
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
  today: string;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  fetchRides: () => Promise<void>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleSearch: (e: React.FormEvent) => void;
  clearFilters: () => void;
  formatDate: (dateStr: string) => string;
  activeFiltersCount: number;
  supabase: ReturnType<typeof createClient>;
}

// Premium Skeleton for loading state - matches exact ride card layout
function RideCardSkeleton() {
  return (
    <div className="bg-surface p-4 sm:p-6 rounded-xl animate-pulse">
      {/* Top Row: Date/Time + Price */}
      <div className="flex justify-between items-start mb-4 sm:mb-6 gap-4">
        <div className="space-y-1 min-w-0">
          <Skeleton className="h-3 w-20 sm:w-24 rounded" />
          <Skeleton className="h-8 sm:h-10 w-16 sm:w-20 rounded" />
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded ml-auto" />
          <Skeleton className="h-2.5 w-12 sm:w-16 rounded ml-auto" />
        </div>
      </div>

      {/* Path Indicator */}
      <div className="relative py-6 sm:py-8 flex items-center justify-between">
        <Skeleton className="absolute left-0 right-0 h-[2px] rounded" />
        <div className="relative z-10 flex flex-col items-start bg-surface pr-2 sm:pr-4 max-w-[40%]">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded mb-1" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col items-center bg-surface px-2 sm:px-4 flex-shrink-0">
          <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded" />
        </div>
        <div className="relative z-10 flex flex-col items-end bg-surface pl-2 sm:pl-4 max-w-[40%]">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded mb-1" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center justify-between mt-4 sm:mt-6">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-24 sm:w-32 rounded" />
            <Skeleton className="h-3 w-12 sm:w-16 rounded" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

// Backward compatibility alias
const SkeletonRow = RideCardSkeleton;

function AlertModal({
  showAlertModal,
  setShowAlertModal,
  alertSaving,
  setAlertSaving,
  origin,
  destination,
  date,
  minSeats,
  maxPrice,
  supabase,
}: {
  showAlertModal: boolean;
  setShowAlertModal: (v: boolean) => void;
  alertSaving: boolean;
  setAlertSaving: (v: boolean) => void;
  origin: string;
  destination: string;
  date: string;
  minSeats: number | null;
  maxPrice: number | null;
  supabase: ReturnType<typeof createClient>;
}) {
  const t = useTranslations('search');
  if (!showAlertModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6">
        <h3 className="mb-1 text-xl font-extrabold tracking-tight text-on-surface">{t('saveAlert')}</h3>
        <p className="mb-4 text-sm text-on-surface-variant">{t('alertDescription')}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAlertSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error(t('loginToSaveAlert'));
              setAlertSaving(false);
              return;
            }
            const form = e.target as HTMLFormElement;
            const fd = new FormData(form);
            const { error } = await supabase.from("ride_alerts").insert({
              user_id: user.id,
              from_city: fd.get("alertFrom") as string,
              to_city: fd.get("alertTo") as string,
              start_date: (fd.get("alertStartDate") as string) || null,
              end_date: (fd.get("alertEndDate") as string) || null,
              min_seats: fd.get("alertMinSeats") ? parseInt(fd.get("alertMinSeats") as string) : null,
              max_price: fd.get("alertMaxPrice") ? parseInt(fd.get("alertMaxPrice") as string) : null,
            });
            setAlertSaving(false);
            if (error) {
              toast.error("Errore nel salvare l'alerta");
            } else {
              toast.success(t('alertSaved'));
              setShowAlertModal(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">Da</label>
              <select name="alertFrom" defaultValue={origin} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary [&>option]:bg-surface-container-high appearance-none">
                <option value="">Qualsiasi</option>
                {sardinianCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">A</label>
              <select name="alertTo" defaultValue={destination} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary [&>option]:bg-surface-container-high appearance-none">
                <option value="">Qualsiasi</option>
                {sardinianCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">Dal</label>
              <input type="date" name="alertStartDate" defaultValue={date} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">Al</label>
              <input type="date" name="alertEndDate" className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">Posti minimi</label>
              <input type="number" name="alertMinSeats" min="1" placeholder="Qualsiasi" defaultValue={minSeats ?? ""} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">Prezzo max</label>
              <input type="number" name="alertMaxPrice" min="0" placeholder="Qualsiasi" defaultValue={maxPrice ?? ""} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAlertModal(false)}
              className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={alertSaving}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {alertSaving ? t('saving') : t('saveAlert')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SearchMobile(props: SearchViewProps) {
  const t = useTranslations('search');
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
    rides, loading,
    today,
    resultsRef,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    handleRefresh,
    handleSearch: _handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
  } = props;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-[#0e0e0e] flex justify-between items-end px-4 sm:px-6 pt-4 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/profilo" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
            <User className="w-5 h-5 text-on-surface" />
          </Link>
          <h1 className="font-extrabold tracking-tighter text-2xl sm:text-3xl text-[#e5e2e1] uppercase truncate">Andamus</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-[#ffb3b1] hover:opacity-80 transition-opacity active:scale-95 duration-200 ease-out relative"
        >
          <SlidersHorizontal className="w-8 h-8" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary rounded-full text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </header>

      <main className="px-4 sm:px-6 max-w-2xl mx-auto overflow-x-hidden" ref={resultsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        <div
          className="flex justify-center items-center h-0 overflow-visible transition-all duration-200 -mt-2 mb-2"
          style={{ height: pullDistance > 0 ? pullDistance : 0 }}
        >
          <div className={`flex items-center gap-2 text-on-surface/60 transition-opacity ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            <span className="text-sm">{pullDistance > 60 ? 'Rilascia per aggiornare' : 'Tira per aggiornare'}</span>
          </div>
        </div>

        {/* Sticky Minimal Search Bar - Full Width Responsive */}
        <div className="sticky top-24 z-40 mb-6 sm:mb-8">
          <div className="bg-surface-container-high rounded-xl p-2.5 sm:p-4 shadow-2xl w-full max-w-full">
            {/* Mobile: Stacked layout, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/* Search Icon - hidden on mobile, shown on sm+ */}
              <Search className="hidden sm:block w-5 h-5 text-primary flex-shrink-0" />
              
              {/* From/To Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Partenza */}
                <div className="flex flex-col min-w-0 bg-surface-container-highest/50 rounded-lg px-3 py-2 sm:bg-transparent sm:p-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Da</span>
                  <div className="w-full">
                    <CityCombobox
                      cities={municipalities}
                      value={origin}
                      onChange={setOrigin}
                      placeholder="Partenza"
                      label="partenza"
                    />
                  </div>
                </div>
                
                {/* Destinazione */}
                <div className="flex flex-col min-w-0 bg-surface-container-highest/50 rounded-lg px-3 py-2 sm:bg-transparent sm:p-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">A</span>
                  <div className="w-full">
                    <CityCombobox
                      cities={municipalities}
                      value={destination}
                      onChange={setDestination}
                      placeholder="Destinazione"
                      label="destinazione"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Filter Pills */}
        <div className="flex gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto no-scrollbar pb-2">
          {filterOptions.map((option) => (
            <button
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
          <button
            onClick={() => setShowAlertModal(true)}
            className="whitespace-nowrap px-4 sm:px-6 py-2 bg-surface-container-high text-primary rounded-full font-bold text-[11px] uppercase tracking-widest border border-outline-variant border-opacity-20 hover:bg-surface-container-highest transition-all active:scale-95 flex items-center gap-2 flex-shrink-0"
          >
            <Bell className="w-3 h-3" />
            Alerta
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-6 sm:mb-8 bg-surface-container-low rounded-xl p-3 sm:p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">{t('advancedFilters')}</h3>
              <button onClick={() => setShowFilters(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Intervallo date</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    min={today}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
                    placeholder="Da"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || today}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
                    placeholder="A"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Fascia oraria</label>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="">Qualsiasi</option>
                  <option value="morning">Mattina (05-12)</option>
                  <option value="afternoon">Pomeriggio (12-17)</option>
                  <option value="evening">Sera (17-22)</option>
                  <option value="night">Notte (22-05)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Prezzo max</label>
                  <span className="text-xs font-bold text-on-surface">{maxPrice === 50 ? "Qualsiasi" : `€${maxPrice}`}</span>
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">Posti minimi</label>
                <select
                  value={minSeats || ""}
                  onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="">Qualsiasi</option>
                  <option value="1">1 posto</option>
                  <option value="2">2+ posti</option>
                  <option value="3">3+ posti</option>
                  <option value="4">4+ posti</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${onlyVerified ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Verificati</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefSmoking ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefSmoking} onChange={(e) => setPrefSmoking(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Fumatori</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefPets ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefPets} onChange={(e) => setPrefPets(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Animali</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefLuggage ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefLuggage} onChange={(e) => setPrefLuggage(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Bagaglio</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${prefWomen ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                <input type="checkbox" checked={prefWomen} onChange={(e) => setPrefWomen(e.target.checked)} className="hidden" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Solo donne</span>
              </label>
            </div>

            {activeFiltersCount > 0 && (
              <button
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
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label="Aggiorna"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Innovative Ride List (Asymmetric Editorial Style) */}
        <div className="space-y-4 sm:space-y-6">
          {loading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!loading && rides.length === 0 && (
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
            />
          )}

          {!loading && rides.map((ride) => (
            <Link
              key={ride.id}
              href={`/corsa/${ride.id}`}
              className="group relative bg-surface p-4 sm:p-6 rounded-xl transition-all duration-300 hover:bg-surface-container-low cursor-pointer block overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4 sm:mb-6 gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                    {ride.date === today ? "Disponibile" : formatDate(ride.date)}
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-on-surface">{ride.time.slice(0, 5)}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-on-surface">
                    {ride.price === 0 ? "Gratis" : `€${ride.price}`}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-50">Posto singolo</div>
                </div>
              </div>

              {/* Path Indicator */}
              <div className="relative py-6 sm:py-8 flex items-center justify-between">
                <div className="absolute left-0 right-0 h-[2px] bg-surface-container-highest" />
                <div className="absolute left-0 right-0 h-[2px] bg-primary scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />
                <div className="relative z-10 flex flex-col items-start bg-surface pr-2 sm:pr-4 group-hover:bg-surface-container-low transition-colors max-w-[40%]">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase text-primary mb-1 truncate max-w-full">{ride.from_city}</span>
                  <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                </div>
                <div className="relative z-10 flex flex-col items-center bg-surface px-2 sm:px-4 group-hover:bg-surface-container-low transition-colors flex-shrink-0">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="relative z-10 flex flex-col items-end bg-surface pl-2 sm:pl-4 group-hover:bg-surface-container-low transition-colors max-w-[40%]">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase text-on-surface mb-1 opacity-50 truncate max-w-full">{ride.to_city}</span>
                  <div className="w-3 h-3 rounded-full bg-surface-container-highest ring-4 ring-background" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 sm:mt-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary overflow-hidden grayscale group-hover:grayscale-0 transition-all flex-shrink-0">
                    {ride.profiles.avatar_url ? (
                      <Image
                        src={ride.profiles.avatar_url}
                        alt={ride.profiles.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <User className="w-5 h-5 text-on-surface-variant" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{ride.profiles.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-current" />
                      <span className="text-[11px] font-bold text-on-surface-variant">
                        {ride.profiles.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-2 transition-transform flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
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
    rides, loading,
    today,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
  } = props;

  return (
    <div className="text-[#e5e2e1] max-w-7xl mx-auto w-full">
      {/* Search & Filters Section */}
      <div className="mb-10 space-y-6">
        {/* Horizontal Search Bar */}
        <form onSubmit={handleSearch} className="bg-[#141414] border border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Partenza</label>
            <CityCombobox
              cities={municipalities}
              value={origin}
              onChange={setOrigin}
              placeholder="Da dove parti?"
              label="partenza"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Destinazione</label>
            <CityCombobox
              cities={municipalities}
              value={destination}
              onChange={setDestination}
              placeholder="Dove vai?"
              label="destinazione"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Data</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                min={today}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50"
              />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || today}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#ffb3b1] text-[#0f0f0f] px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#ff9e9c] transition-colors"
          >
            Cerca
          </button>
        </form>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
              className={`px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${
                activeFilter === option.id
                  ? "bg-[#ffb3b1] text-[#0f0f0f]"
                  : "bg-[#1a1a1a] text-[#e5e2e1] border border-white/10 hover:border-white/20"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-5 py-2 bg-[#1a1a1a] text-[#ffb3b1] rounded-full font-bold text-[11px] uppercase tracking-widest border border-white/10 hover:border-[#ffb3b1]/30 transition-all flex items-center gap-2"
          >
            <Bell className="w-3 h-3" />
            Alerta
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest border transition-all flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? "bg-[#ffb3b1] text-[#0f0f0f] border-[#ffb3b1]"
                : "bg-[#1a1a1a] text-[#e5e2e1] border-white/10 hover:border-white/20"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            {t('advancedFilters')}
            {activeFiltersCount > 0 && !showFilters && (
              <span className="ml-1 w-4 h-4 bg-[#0f0f0f] text-[#ffb3b1] rounded-full text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest text-[#e5e2e1] hover:text-[#ffb3b1] transition-colors"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Data da</label>
                <input
                  type="date"
                  value={dateFrom}
                  min={today}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Data a</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || today}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Fascia oraria</label>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">Qualsiasi</option>
                  <option value="morning">Mattina (05-12)</option>
                  <option value="afternoon">Pomeriggio (12-17)</option>
                  <option value="evening">Sera (17-22)</option>
                  <option value="night">Notte (22-05)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Posti minimi</label>
                <select
                  value={minSeats || ""}
                  onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">Qualsiasi</option>
                  <option value="1">1 posto</option>
                  <option value="2">2+ posti</option>
                  <option value="3">3+ posti</option>
                  <option value="4">4+ posti</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1]">Prezzo max</label>
                  <span className="text-xs font-bold text-[#e5e2e1]">{maxPrice === 50 ? "Qualsiasi" : `€${maxPrice}`}</span>
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
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#ffb3b1] mb-2">Musica</label>
                <select
                  value={prefMusic}
                  onChange={(e) => setPrefMusic(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/50 appearance-none cursor-pointer"
                >
                  <option value="">Qualsiasi</option>
                  <option value="quiet">Silenzio</option>
                  <option value="music">Musica</option>
                  <option value="talk">Chiacchiere</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: "verified", label: "Verificati", state: onlyVerified, setState: setOnlyVerified },
                { id: "smoking", label: "Fumatori", state: prefSmoking, setState: setPrefSmoking },
                { id: "pets", label: "Animali", state: prefPets, setState: setPrefPets },
                { id: "luggage", label: "Bagaglio", state: prefLuggage, setState: setPrefLuggage },
                { id: "women", label: "Solo donne", state: prefWomen, setState: setPrefWomen },
                { id: "students", label: "Solo studenti", state: prefStudents, setState: setPrefStudents },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors border ${
                    item.state ? 'bg-[#ffb3b1] text-[#0f0f0f] border-[#ffb3b1]' : 'bg-[#1a1a1a] text-[#e5e2e1] border-white/10 hover:border-white/20'
                  }`}
                >
                  <input type="checkbox" checked={item.state} onChange={(e) => item.setState(e.target.checked)} className="hidden" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#e5e2e1]/60">
          {loading ? t('loading') : t('resultsCount', { count: rides.length })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-[#1a1a1a] text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#222] transition-colors"
            aria-label="Aggiorna"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && rides.length === 0 && (
          <div className="col-span-full">
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
            />
          </div>
        )}

        {!loading && rides.map((ride) => (
          <Link
            key={ride.id}
            href={`/corsa/${ride.id}`}
            className="group bg-[#141414] border border-white/5 rounded-2xl p-6 transition-all duration-200 hover:border-[#ffb3b1]/30 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer block touch-manipulation"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1]">
                  {ride.date === today ? "Oggi" : formatDate(ride.date)}
                </span>
                <h3 className="text-3xl font-extrabold tracking-tighter text-[#e5e2e1]">{ride.time.slice(0, 5)}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold tracking-tighter text-[#e5e2e1]">
                  {ride.price === 0 ? "Gratis" : `€${ride.price}`}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/50">Posto singolo</div>
              </div>
            </div>

            {/* Route */}
            <div className="relative py-6 flex items-center justify-between mb-4">
              <div className="absolute left-0 right-0 h-[2px] bg-white/10" />
              <div className="absolute left-0 right-0 h-[2px] bg-[#ffb3b1] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />
              <div className="relative z-10 flex flex-col items-start bg-[#141414] pr-4 group-hover:bg-[#181818] transition-colors">
                <span className="text-[11px] font-bold uppercase text-[#ffb3b1] mb-1">{ride.from_city}</span>
                <div className="w-3 h-3 rounded-full bg-[#ffb3b1] ring-4 ring-[#141414] group-hover:ring-[#181818] transition-all" />
              </div>
              <div className="relative z-10 flex flex-col items-center bg-[#141414] px-4 group-hover:bg-[#181818] transition-colors">
                <Car className="w-5 h-5 text-[#ffb3b1]" />
              </div>
              <div className="relative z-10 flex flex-col items-end bg-[#141414] pl-4 group-hover:bg-[#181818] transition-colors">
                <span className="text-[11px] font-bold uppercase text-[#e5e2e1] mb-1 opacity-50">{ride.to_city}</span>
                <div className="w-3 h-3 rounded-full bg-white/20 ring-4 ring-[#141414] group-hover:ring-[#181818] transition-all" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full border-2 border-[#ffb3b1] overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                  {ride.profiles.avatar_url ? (
                    <Image
                      src={ride.profiles.avatar_url}
                      alt={ride.profiles.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#e5e2e1]/60" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#e5e2e1]">{ride.profiles.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#ffb3b1] fill-current" />
                    <span className="text-[11px] font-bold text-[#e5e2e1]/60">
                      {ride.profiles.rating}
                    </span>
                  </div>
                </div>
              </div>
              {(ride.profiles.phone_verified || ride.profiles.id_verified) && (
                <BadgeCheck className="w-5 h-5 text-[#ffb3b1]" />
              )}
            </div>
          </Link>
        ))}
      </div>

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
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [prefSmoking, setPrefSmoking] = useState(false);
  const [prefPets, setPrefPets] = useState(false);
  const [prefLuggage, setPrefLuggage] = useState(false);
  const [prefWomen, setPrefWomen] = useState(false);
  const [prefStudents, setPrefStudents] = useState(false);
  const [prefMusic, setPrefMusic] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchRides({
        origin: origin || undefined,
        destination: destination || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        timeWindow: (timeWindow as any) || undefined,
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
      setRides(results as Ride[]);
    } catch (err: any) {
      toast.error(err?.message || t('searchError'));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, dateFrom, dateTo, timeWindow, destination, maxPrice, minSeats, onlyVerified, origin, prefLuggage, prefMusic, prefPets, prefSmoking, prefStudents, prefWomen]);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRides();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRides]);

  // Initial load
  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setIsRefreshing(false);
    }
    setPullStartY(0);
    setPullDistance(0);
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

    if (isToday) return "Oggi";
    if (isTomorrow) return "Domani";

    return date.toLocaleDateString("it-IT", {
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
    rides, loading,
    today,
    resultsRef,
    fetchRides,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
  };

  if (deviceType === "mobile") {
    return <SearchMobile {...sharedProps} />;
  }
  return <SearchDesktop {...sharedProps} />;
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }>
          <SearchContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

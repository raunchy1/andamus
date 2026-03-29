"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Armchair, 
  ArrowRight,
  Loader2,
  Star,
  Clock,
  Route,
  X,
  Euro,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { MiniMap } from "@/components/RouteMap";
import { WeatherWidget } from "@/components/WeatherWidget";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer", "Bosa", "Castelsardo"
];

const filterOptions = [
  { id: "all", label: "Tutti" },
  { id: "free", label: "Solo gratuiti" },
  { id: "verified", label: "Solo verificati" },
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
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    phone_verified?: boolean;
    id_verified?: boolean;
  };
}

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-24 bg-white/10 rounded" />
        <div className="h-6 w-16 bg-white/10 rounded" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-3 bg-white/10 rounded-full" />
          <div className="h-8 w-0.5 bg-white/10" />
          <div className="h-3 w-3 bg-white/10 rounded-full" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-white/10 rounded" />
          <div className="h-5 w-32 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 rounded-full" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  
  // Filters state
  const [activeFilter, setActiveFilter] = useState("all");
  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minSeats, setMinSeats] = useState<number | null>(null);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  
  const supabase = createClient();

  const fetchRides = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("rides")
        .select(`
          *,
          profiles!inner(name, avatar_url, rating, phone_verified, id_verified)
        `)
        .eq("status", "active")
        .gte("date", today);

      if (origin) query = query.eq("from_city", origin);
      if (destination) query = query.eq("to_city", destination);
      if (date) query = query.eq("date", date);
      if (maxPrice !== null) query = query.lte("price", maxPrice);
      if (minSeats !== null) query = query.gte("seats", minSeats);

      // Apply quick filters
      if (activeFilter === "free") query = query.eq("price", 0);
      if (activeFilter === "today") query = query.eq("date", today);

      const { data, error: supabaseError } = await query
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (supabaseError) {
        return;
      }

      // Client-side filtering for verified users
      let filtered = data || [];
      if (activeFilter === "verified" || onlyVerified) {
        filtered = filtered.filter(
          (ride: Ride) => ride.profiles.phone_verified || ride.profiles.id_verified
        );
      }

      setRides(filtered);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeFilter, date, destination, maxPrice, minSeats, onlyVerified, origin, supabase, today, setRides]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Pull to refresh handlers
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
    setDate("");
    setMaxPrice(null);
    setMinSeats(null);
    setOnlyVerified(false);
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
    (date ? 1 : 0) + 
    (maxPrice !== null ? 1 : 0) + 
    (minSeats !== null ? 1 : 0) + 
    (onlyVerified ? 1 : 0);

  return (
    <>
      {/* SEARCH BAR SECTION - Collapsible on Mobile */}
      <section className="sticky top-16 z-30 border-b border-white/10 bg-[#12121e]/95 backdrop-blur">
        {/* Mobile Search Toggle */}
        <div className="md:hidden px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Search className="w-4 h-4 text-[#e63946]" />
            <span className="text-sm">
              {origin || destination || date 
                ? `${origin || "Da"} → ${destination || "A"}${date ? ` • ${formatDate(date)}` : ""}`
                : "Cerca un passaggio"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="p-2 rounded-lg bg-white/5 text-white/70 active:scale-95 transition-all"
          >
            {showSearchBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        <div className={`${showSearchBar ? 'block' : 'hidden md:block'} px-4 py-4 sm:px-6 lg:px-8`}>
        <div className="mx-auto max-w-6xl">
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
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
            </div>

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

            <button 
              type="submit"
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 text-sm font-semibold text-white transition-all hover:bg-[#c92a37] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cerca
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e63946] text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </form>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0f1729] p-4">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {/* Max Price */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    Prezzo massimo
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Qualsiasi"
                      value={maxPrice || ""}
                      onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : null)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-[#1a1a2e] pl-10 pr-4 text-sm text-white outline-none focus:border-[#e63946]"
                    />
                  </div>
                </div>

                {/* Min Seats */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    Posti minimi
                  </label>
                  <select
                    value={minSeats || ""}
                    onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#1a1a2e] px-4 text-sm text-white outline-none focus:border-[#e63946] [&>option]:bg-[#1a1a2e]"
                  >
                    <option value="">Qualsiasi</option>
                    <option value="1">1 posto</option>
                    <option value="2">2+ posti</option>
                    <option value="3">3+ posti</option>
                    <option value="4">4+ posti</option>
                  </select>
                </div>

                {/* Verified Only */}
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#1a1a2e] p-3 transition-colors hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                      className="h-4 w-4 accent-[#e63946]"
                    />
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white">Solo verificati</span>
                    </div>
                  </label>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/70 transition-colors hover:bg-white/5"
                    >
                      <X className="h-4 w-4" />
                      Cancella filtri
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </section>

      {/* QUICK FILTERS */}
      <section className="border-b border-white/10 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e63946] text-xs text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
                className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeFilter === option.id
                    ? "bg-[#e63946] text-white"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS LIST */}
      <section 
        ref={resultsRef}
        className="px-4 py-6 sm:px-6 lg:px-8 overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto max-w-6xl">
          {/* Pull to refresh indicator */}
          <div 
            className="flex justify-center items-center h-0 overflow-visible transition-all duration-200"
            style={{ height: pullDistance > 0 ? pullDistance : 0 }}
          >
            <div className={`flex items-center gap-2 text-white/60 transition-opacity ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
              <span className="text-sm">{pullDistance > 60 ? 'Rilascia per aggiornare' : 'Tira per aggiornare'}</span>
            </div>
          </div>
          
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-white/50">
              {loading ? "Caricamento..." : `${rides.length} corse trovate`}
            </p>
            <div className="flex items-center gap-2">
              {/* Refresh button for mobile */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="md:hidden p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Aggiorna"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#e63946] hover:text-white"
                >
                  Cancella tutti i filtri
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && rides.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <Route className="mx-auto h-16 w-16 text-white/20" />
              <p className="mt-4 text-lg text-white/60">Nessun passaggio trovato.</p>
              <p className="mt-1 text-sm text-white/40">
                Prova a modificare i filtri o cerca un&apos;altra data.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
                >
                  Cancella filtri
                </button>
              )}
            </div>
          )}

          {/* Results Grid */}
          {!loading && rides.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {rides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/corsa/${ride.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a4a] transition-all hover:border-[#e63946]/30 hover:shadow-lg hover:shadow-[#e63946]/5 active:scale-[0.98] touch-manipulation"
                >
                  {/* Mini Map */}
                  <div className="mb-4">
                    <MiniMap fromCity={ride.from_city} toCity={ride.to_city} />
                  </div>

                  {/* Content */}
                  <div className="px-5 pb-5">
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e63946]/10 px-3 py-1 text-xs font-medium text-[#e63946]">
                      <Clock className="h-3 w-3" />
                      {formatDate(ride.date)} • {ride.time.slice(0, 5)}
                    </span>
                    <div className="flex items-center gap-2">
                      <WeatherWidget 
                        city={ride.from_city} 
                        date={ride.date}
                        variant="compact"
                      />
                      <span className="text-lg font-bold">
                        {ride.price === 0 ? (
                          <span className="text-green-400">Gratis</span>
                        ) : (
                          <span className="text-white">{ride.price}€</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-[#e63946] ring-4 ring-[#e63946]/20" />
                      <div className="my-1 h-10 w-0.5 bg-gradient-to-b from-[#e63946] to-white/30" />
                      <div className="h-3 w-3 rounded-full bg-white/50" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-white/40">Partenza</p>
                        <p className="font-semibold text-white">{ride.from_city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Destinazione</p>
                        <p className="font-semibold text-white">{ride.to_city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                          {ride.profiles.avatar_url ? (
                            <Image 
                              src={ride.profiles.avatar_url} 
                              alt={ride.profiles.name}
                              width={40}
                              height={40}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        {(ride.profiles.phone_verified || ride.profiles.id_verified) && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-400">
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{ride.profiles.name}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < Math.floor(ride.profiles.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} 
                            />
                          ))}
                          <span className="ml-1 text-xs text-white/50">{ride.profiles.rating || 5.0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Armchair className="h-4 w-4 text-[#e63946]" />
                      <span>{ride.seats} posti</span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight className="h-6 w-6 text-[#e63946]" />
                  </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] pt-20">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#e63946]" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}

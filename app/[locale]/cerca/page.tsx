"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
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
  RefreshCw,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    phone_verified?: boolean;
    id_verified?: boolean;
  };
}

// Skeleton for loading state
function SkeletonRow() {
  return (
    <div className="py-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-8 w-8 bg-muted rounded-full" />
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
  const searchBarRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  
  const supabase = createClient();

  // Sticky search bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        if (rect.top <= 64) {
          searchBarRef.current.classList.add("shadow-sm");
        } else {
          searchBarRef.current.classList.remove("shadow-sm");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  }, [activeFilter, date, destination, maxPrice, minSeats, onlyVerified, origin, supabase, today]);

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
    <div className="min-h-screen bg-background">
      {/* Sticky Search Bar */}
      <div 
        ref={searchBarRef}
        className="sticky top-16 z-30 border-b border-border bg-background transition-shadow"
      >
        {/* Mobile Search Toggle */}
        <div className="md:hidden px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Search className="w-4 h-4 text-accent" />
            <span className="text-sm">
              {origin || destination || date 
                ? `${origin || "Da"} → ${destination || "A"}${date ? ` • ${formatDate(date)}` : ""}`
                : "Cerca un passaggio"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {showSearchBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        <div className={`${showSearchBar ? 'block' : 'hidden md:block'} px-4 py-4 sm:px-6 lg:px-8`}>
          <div className="mx-auto max-w-6xl">
            <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-12 w-full appearance-none rounded-full border border-border bg-muted pl-10 pr-8 text-sm text-foreground outline-none focus:border-accent [&>option]:bg-card"
                >
                  <option value="">Da dove parti?</option>
                  {sardinianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 w-full appearance-none rounded-full border border-border bg-muted pl-10 pr-8 text-sm text-foreground outline-none focus:border-accent [&>option]:bg-card"
                >
                  <option value="">Dove vai?</option>
                  {sardinianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-full border border-border bg-muted pl-10 pr-4 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Cerca
              </button>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtri
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </form>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Prezzo max
                    </label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="number"
                        min="0"
                        placeholder="Qualsiasi"
                        value={maxPrice || ""}
                        onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : null)}
                        className="h-10 w-full rounded-full border border-border bg-muted pl-10 pr-4 text-sm text-foreground outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Posti minimi
                    </label>
                    <select
                      value={minSeats || ""}
                      onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
                      className="h-10 w-full rounded-full border border-border bg-muted px-4 text-sm text-foreground outline-none focus:border-accent [&>option]:bg-card"
                    >
                      <option value="">Qualsiasi</option>
                      <option value="1">1 posto</option>
                      <option value="2">2+ posti</option>
                      <option value="3">3+ posti</option>
                      <option value="4">4+ posti</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex cursor-pointer items-center gap-3 rounded-full border border-border bg-muted p-3 transition-colors hover:bg-muted/80">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => setOnlyVerified(e.target.checked)}
                        className="h-4 w-4 accent-accent"
                      />
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-foreground">Solo verificati</span>
                      </div>
                    </label>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted"
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
      </div>

      {/* Quick Filters - Pill Style */}
      <div className="border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeFilter === option.id
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results List - Clean List Style */}
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
            <div className={`flex items-center gap-2 text-muted-foreground transition-opacity ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
              <span className="text-sm">{pullDistance > 60 ? 'Rilascia per aggiornare' : 'Tira per aggiornare'}</span>
            </div>
          </div>
          
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Caricamento..." : `${rides.length} corse trovate`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="md:hidden p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                aria-label="Aggiorna"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent hover:text-accent/80"
                >
                  Cancella tutti
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && rides.length === 0 && (
            <div className="py-20 text-center">
              <Route className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">Nessun passaggio trovato</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prova a modificare i filtri o cerca un&apos;altra data
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  Cancella filtri
                </button>
              )}
            </div>
          )}

          {/* Results List - Clean Row Style */}
          {!loading && rides.length > 0 && (
            <div className="divide-y divide-border">
              {rides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/corsa/${ride.id}`}
                  className="group flex items-center gap-4 py-5 transition-colors hover:bg-muted/30"
                >
                  {/* Route Info - Left */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {ride.from_city} <span className="text-muted-foreground mx-1">→</span> {ride.to_city}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(ride.date)}</span>
                      <span>•</span>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{ride.time.slice(0, 5)}</span>
                      <span>•</span>
                      <span>{ride.seats} posti</span>
                    </div>
                  </div>

                  {/* Driver Info - Center */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
                      {ride.profiles.avatar_url ? (
                        <Image 
                          src={ride.profiles.avatar_url} 
                          alt={ride.profiles.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{ride.profiles.name}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < Math.floor(ride.profiles.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action - Right */}
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${ride.price === 0 ? "text-green-500" : "text-foreground"}`}>
                      {ride.price === 0 ? "Gratis" : `${ride.price}€`}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
                      Vedi
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}

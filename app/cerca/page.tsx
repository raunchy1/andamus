"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Armchair, 
  ArrowRight,
  Filter,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const sardinianCities = [
  "Cagliari",
  "Sassari", 
  "Olbia",
  "Nuoro",
  "Oristano",
  "Tortolì",
  "Lanusei",
  "Iglesias",
  "Carbonia",
  "Alghero",
  "Tempio Pausania",
  "La Maddalena",
  "Siniscola",
  "Dorgali",
  "Muravera",
  "Villacidro",
  "Sanluri",
  "Macomer",
  "Bosa",
  "Castelsardo"
];

const filterOptions = [
  { id: "all", label: "Tutti" },
  { id: "free", label: "Solo gratuiti" },
  { id: "available", label: "Con posti disponibili" }
];

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point: string | null;
  notes: string | null;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export default function SearchPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();

  // Fetch rides from Supabase
  const fetchRides = async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase
        .from("rides")
        .select(`
          *,
          profiles!inner(name, avatar_url)
        `)
        .eq("status", "active")
        .gte("date", today);

      // Apply search filters
      if (origin) {
        query = query.eq("from_city", origin);
      }
      if (destination) {
        query = query.eq("to_city", destination);
      }
      if (date) {
        query = query.eq("date", date);
      }

      const { data, error: supabaseError } = await query.order("date", { ascending: true }).order("time", { ascending: true });

      if (supabaseError) {
        console.error("Error fetching rides:", supabaseError);
        setError("Errore durante il caricamento. Riprova.");
        return;
      }

      setRides(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Errore imprevisto. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRides();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return date.toLocaleDateString('it-IT', options);
  };

  // Client-side filters
  const filteredRides = rides.filter(ride => {
    if (activeFilter === "free") return ride.price === 0;
    if (activeFilter === "available") return ride.seats > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* SEARCH BAR SECTION */}
      <section className="border-b border-white/10 bg-[#12121e] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
            Cerca un passaggio
          </h1>
          
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            {/* Da (Origin) */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Da
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white outline-none transition-colors focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] [&>option]:bg-[#1a1a2e] [&>option]:text-white"
                >
                  <option value="">Tutte le città</option>
                  {sardinianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* A (Destination) */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-white/70">
                A
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white outline-none transition-colors focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] [&>option]:bg-[#1a1a2e] [&>option]:text-white"
                >
                  <option value="">Tutte le città</option>
                  {sardinianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Data (Date) */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            {/* Cerca Button */}
            <div className="relative flex items-end">
              <button 
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 text-sm font-semibold text-white transition-all hover:bg-[#c92a37] hover:shadow-lg hover:shadow-[#e63946]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Cerca
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/50" />
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeFilter === option.id
                      ? "bg-[#e63946] text-white"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS LIST */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results count */}
          <p className="mb-6 text-sm text-white/50">
            {loading ? "Caricamento..." : `${filteredRides.length} corse trovate`}
          </p>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#e63946]" />
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredRides.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-white/30" />
              <p className="mt-4 text-white/60">
                Nessun passaggio trovato.
              </p>
              <p className="mt-1 text-sm text-white/40">
                Prova a cambiare data o percorso, oppure offri tu un passaggio!
              </p>
              <Link
                href="/offri"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
              >
                Offri un passaggio
              </Link>
            </div>
          )}

          {/* Results grid */}
          {!loading && filteredRides.length > 0 && (
            <div className="grid gap-4">
              {filteredRides.map((ride) => (
                <div
                  key={ride.id}
                  className="group relative rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30 hover:bg-[#1e2a4a]/80"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Route & Date */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {ride.from_city} <span className="text-[#e63946]">→</span> {ride.to_city}
                      </h3>
                      <p className="mt-1 text-white/60">
                        {formatDate(ride.date)} • {ride.time.slice(0, 5)}
                      </p>
                      
                      {/* Driver info */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                          {ride.profiles.avatar_url ? (
                            <img 
                              src={ride.profiles.avatar_url} 
                              alt={ride.profiles.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <span className="text-sm text-white/80">
                          {ride.profiles.name || "Utente"}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Seats & Price */}
                    <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Armchair className="h-4 w-4 text-[#e63946]" />
                        <span>{ride.seats} posti disponibili</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {ride.price === 0 ? (
                          <span className="text-green-400">Gratuito</span>
                        ) : (
                          <span>{ride.price}€ contributo</span>
                        )}
                      </div>
                    </div>

                    {/* Right: CTA Button */}
                    <div className="sm:ml-4">
                      <Link
                        href={`/corsa/${ride.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#e63946] group-hover:bg-[#e63946]"
                      >
                        Vedi dettagli
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a12] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-white/40">
            Fatto con <span className="text-[#e63946]">♥</span> in Sardegna
          </p>
        </div>
      </footer>
    </div>
  );
}

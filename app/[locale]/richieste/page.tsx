"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  User,
  Loader2,
  PlusCircle,
  ArrowLeft,
  Clock,
  Users,
  Euro,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Alghero",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer",
  "Bosa", "Castelsardo"
];

interface RideRequest {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string | null;
  time_flexibility: string;
  seats_needed: number;
  max_price: number | null;
  notes: string | null;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export default function RequestsPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const t = useTranslations("requests");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const today = new Date().toISOString().split("T")[0];

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("ride_requests")
      .select(`*, profiles(name, avatar_url)`)
      .eq("status", "active")
      .gte("date", today)
      .order("date", { ascending: true });

    if (origin) query = query.eq("from_city", origin);
    if (destination) query = query.eq("to_city", destination);
    if (date) query = query.eq("date", date);

    const { data, error } = await query;
    if (!error) setRequests(data || []);
    setLoading(false);
  }, [supabase, origin, destination, date, today]);

  useEffect(() => {
    Promise.resolve().then(() => fetchRequests());
  }, [fetchRequests]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  };

  const flexibilityLabel = (val: string) => {
    switch (val) {
      case "1h": return "±1h";
      case "3h": return "±3h";
      case "any": return t("flexibleTime");
      default: return t("exactTime");
    }
  };

  const seatLabel = (count: number) => {
    return count === 1 ? t("oneSeat") : t("manySeats", { count });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-outline bg-surface-container px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-2">
            <Link href="/cerca" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t("backToSearch")}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
          <p className="mt-1 text-on-surface-variant">{t("subtitle")}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-outline bg-surface-container px-4 py-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t("from")}</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-12 w-full rounded-xl border border-outline bg-surface px-3 text-on-surface outline-none focus:border-accent"
              >
                <option value="">{t("any")}</option>
                {sardinianCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t("to")}</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 w-full rounded-xl border border-outline bg-surface px-3 text-on-surface outline-none focus:border-accent"
              >
                <option value="">{t("any")}</option>
                {sardinianCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t("date")}</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-outline bg-surface px-3 text-on-surface outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 rounded-xl border border-outline px-4 text-on-surface-variant hover:bg-surface-variant"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <Link
              href="/profilo"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
            >
              <PlusCircle className="h-4 w-4" />
              {t("findRide")}
            </Link>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center">
              <User className="mx-auto h-12 w-12 text-on-surface-variant/50" />
              <p className="mt-4 text-lg font-medium text-on-surface">{t("noRequests")}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t("tryDifferentFilters")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-outline bg-surface-container">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/richiesta/${req.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-surface-variant/30"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(req.date)}</span>
                      {req.time && (
                        <>
                          <span>•</span>
                          <Clock className="h-4 w-4" />
                          <span>{req.time.slice(0, 5)}</span>
                          <span className="text-xs">({flexibilityLabel(req.time_flexibility)})</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 font-semibold text-on-surface">
                      {req.from_city} → {req.to_city}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
                      <Users className="h-4 w-4" />
                      <span>{seatLabel(req.seats_needed)}</span>
                      {req.max_price !== null && (
                        <>
                          <span>•</span>
                          <Euro className="h-4 w-4" />
                          <span>{t("maxPrice", { price: req.max_price })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-on-surface">{req.profiles.name}</p>
                    <ChevronRight className="ml-auto h-5 w-5 text-on-surface-variant" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

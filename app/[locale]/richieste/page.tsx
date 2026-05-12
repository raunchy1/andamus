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
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      {/* Header — Premium Aurora */}
      <AuroraBackground className="border-b border-white/5 px-4 py-8 lg:py-12 relative" showRadialMask={false}>
        <OrbGlow className="-top-20 -right-32" color="#e63946" size={400} opacity={0.30} />
        <OrbGlow className="-bottom-20 -left-20" color="#ffb3b1" size={340} opacity={0.25} blur={140} />
        <div className="mx-auto max-w-5xl relative">
          <Reveal>
          <div className="mb-4 flex items-center gap-2">
            <Link href="/cerca" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#ffb3b1] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t("backToSearch")}
            </Link>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb3b1]/30 bg-[#ffb3b1]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1] backdrop-blur-md mb-4">
            <Sparkles className="h-3 w-3" />
            {t("subtitle")}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-[#e5e2e1]">
            <GradientText>{t("title")}</GradientText>
          </h1>
          </Reveal>
        </div>
      </AuroraBackground>

      {/* Search bar */}
      <div className="border-b border-white/5 bg-[#0d0d0d]/95 backdrop-blur-xl px-4 py-5 sticky top-0 z-30">
        <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#ffb3b1]">{t("from")}</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/40 transition-colors"
              >
                <option value="" className="bg-[#0d0d0d]">{t("any")}</option>
                {sardinianCities.map((c) => (
                  <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#ffb3b1]">{t("to")}</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/40 transition-colors"
              >
                <option value="" className="bg-[#0d0d0d]">{t("any")}</option>
                {sardinianCities.map((c) => (
                  <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#ffb3b1]">{t("date")}</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[#e5e2e1] outline-none focus:border-[#ffb3b1]/40 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[#ffb3b1] hover:bg-white/[0.06] hover:border-[#ffb3b1]/30 transition-all"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <MagneticButton onClick={() => window.location.assign(`/${locale}/profilo`)} strength={12} className="h-12 px-4 py-0 text-xs">
              <PlusCircle className="h-4 w-4" />
              {t("findRide")}
            </MagneticButton>
          </div>
        </div>
        </Reveal>
      </div>

      {/* Results */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#ffb3b1]" />
            </div>
          ) : requests.length === 0 ? (
            <Reveal>
            <div className="py-20 text-center rounded-3xl border border-white/8 bg-white/[0.02]">
              <User className="mx-auto h-14 w-14 text-[#e5e2e1]/30" />
              <p className="mt-4 text-lg font-bold text-[#e5e2e1]">{t("noRequests")}</p>
              <p className="mt-1 text-sm text-[#e5e2e1]/55">{t("tryDifferentFilters")}</p>
            </div>
            </Reveal>
          ) : (
            <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {requests.map((req, idx) => (
                <RevealItem key={req.id}>
                <TiltCard
                  tiltStrength={5}
                  className={`relative h-full rounded-3xl border ${
                    idx === 0
                      ? "border-[#ffb3b1]/25 bg-gradient-to-br from-[#ffb3b1]/[0.07] via-[#e63946]/[0.04] to-transparent"
                      : "border-white/8 bg-white/[0.025]"
                  } backdrop-blur-sm`}
                >
                <Link
                  href={`/${locale}/richiesta/${req.id}`}
                  className="group block p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(req.date)}</span>
                      {req.time && (
                        <>
                          <span className="text-[#e5e2e1]/30">•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{req.time.slice(0, 5)}</span>
                          <span className="text-[#e5e2e1]/40 normal-case font-medium">({flexibilityLabel(req.time_flexibility)})</span>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-[#e5e2e1] mb-3">
                    {req.from_city} <GradientText>→</GradientText> {req.to_city}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#e5e2e1]/60 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/8 px-2.5 py-1">
                      <Users className="h-3.5 w-3.5 text-[#ffb3b1]" />
                      {seatLabel(req.seats_needed)}
                    </span>
                    {req.max_price !== null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/8 px-2.5 py-1">
                        <Euro className="h-3.5 w-3.5 text-[#ffb3b1]" />
                        {t("maxPrice", { price: req.max_price })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-[#e5e2e1]/60" />
                      </div>
                      <p className="text-sm font-bold text-[#e5e2e1]">{req.profiles.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#e5e2e1]/40 group-hover:translate-x-1 group-hover:text-[#ffb3b1] transition-all" />
                  </div>
                </Link>
                </TiltCard>
                </RevealItem>
              ))}
            </RevealStagger>
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

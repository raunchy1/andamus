"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { CreateRequestModal } from "@/components/CreateRequestModal";
import { LocationCombobox } from "@/components/LocationCombobox";

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

function RequestsContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const t = useTranslations("requests");
  const locale = useLocale();

  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    <div className="min-h-screen bg-bg text-fg">
      {/* Header — Premium Aurora */}
      <AuroraBackground className="border-b border-line px-4 py-8 lg:py-12 relative" showRadialMask={false}>
        <OrbGlow className="-top-20 -right-32" color="#2D6A4F" size={300} opacity={0.30} />
        <div className="mx-auto max-w-5xl relative">
          <Reveal>
          <div className="mb-4 flex items-center gap-2">
            <Link href={`/${locale}/cerca`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t("backToSearch")}
            </Link>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md mb-4">
            <Sparkles className="h-3 w-3" />
            {t("subtitle")}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-fg">
            <GradientText>{t("title")}</GradientText>
          </h1>
          </Reveal>
        </div>
      </AuroraBackground>

      {/* Search bar */}
      <div className="border-b border-line bg-surface/95 backdrop-blur-xl px-4 py-5 sticky top-0 z-30">
        <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("from")}</label>
              <LocationCombobox
                value={origin}
                onChange={setOrigin}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("to")}</label>
              <LocationCombobox
                value={destination}
                onChange={setDestination}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("date")}</label>
              <PremiumDatePicker
                date={date}
                onSelect={setDate}
                min={today}
                label=""
                placeholder={t("date")}
                className="w-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 rounded-xl border border-line bg-surface px-4 text-primary hover:bg-sand-deep hover:border-primary/30 transition-all"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <MagneticButton onClick={() => setShowCreateModal(true)} strength={12} className="h-12 px-4 py-0 text-xs">
              <PlusCircle className="h-4 w-4" />
              Crea Richiesta
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
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <Reveal>
            <div className="py-20 text-center rounded-3xl border border-line bg-surface">
              <User className="mx-auto h-14 w-14 text-faint" />
              <p className="mt-4 text-lg font-bold text-fg">{t("noRequests")}</p>
              <p className="mt-1 text-sm text-fg/55">{t("tryDifferentFilters")}</p>
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
                      ? "border-primary/25 bg-gradient-to-br from-primary/[0.07] via-[#2D6A4F]/[0.04] to-transparent"
                      : "border-line bg-surface"
                  } backdrop-blur-sm`}
                >
                <Link
                  href={`/${locale}/richiesta/${req.id}`}
                  className="group block p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(req.date)}</span>
                      {req.time && (
                        <>
                          <span className="text-faint">•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{req.time.slice(0, 5)}</span>
                          <span className="text-faint normal-case font-medium">({flexibilityLabel(req.time_flexibility)})</span>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-fg mb-3">
                    {req.from_city} <GradientText>→</GradientText> {req.to_city}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-2.5 py-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {seatLabel(req.seats_needed)}
                    </span>
                    {req.max_price !== null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-2.5 py-1">
                        <Euro className="h-3.5 w-3.5 text-primary" />
                        {t("maxPrice", { price: req.max_price })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-muted" />
                      </div>
                      <p className="text-sm font-bold text-fg">{req.profiles.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-faint group-hover:translate-x-1 group-hover:text-primary transition-all" />
                  </div>
                </Link>
                </TiltCard>
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </div>
      </div>

      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialFrom={origin}
        initialTo={destination}
        initialDate={date}
        onSuccess={fetchRequests}
      />
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <RequestsContent />
    </Suspense>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

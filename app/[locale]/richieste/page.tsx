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
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader
        back={{ href: `/${locale}/cerca`, label: t("backToSearch") }}
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            <PlusCircle className="size-[15px]" strokeWidth={1.8} aria-hidden />
            <span className="whitespace-nowrap">{t("createRequest")}</span>
          </button>
        }
      />

      {/* Search bar */}
      <div className="border-b border-line bg-surface/95 backdrop-blur-xl px-4 py-5 sticky top-0 z-30">
        <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 items-end gap-3 lg:flex lg:flex-wrap">
            <div className="lg:flex-1 lg:min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-muted">{t("from")}</label>
              <LocationCombobox
                value={origin}
                onChange={setOrigin}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>
            <div className="lg:flex-1 lg:min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-muted">{t("to")}</label>
              <LocationCombobox
                value={destination}
                onChange={setDestination}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>
            <div className="lg:min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-muted">{t("date")}</label>
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-ink lg:w-auto"
            >
              <SlidersHorizontal className="size-[18px]" strokeWidth={1.6} />
              <span className="lg:hidden">{t("filters")}</span>
            </button>
          </div>
        </div>
        </Reveal>
      </div>

      {/* Results */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted" strokeWidth={1.5} aria-hidden />
            </div>
          ) : requests.length === 0 ? (
            <Reveal>
            <div className="flex min-h-[46vh] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-surface-2">
                <User className="size-6 text-muted" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="flex max-w-sm flex-col gap-1.5">
                <p className="text-lg font-semibold tracking-[-0.01em] text-ink">{t("noRequests")}</p>
                <p className="text-sm leading-relaxed text-muted">{t("tryDifferentFilters")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex h-[46px] items-center rounded-xl border border-line bg-surface px-5 text-[15px] font-semibold text-ink transition-colors hover:border-line-strong"
              >
                {t("createRequest")}
              </button>
            </div>
            </Reveal>
          ) : (
            <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {requests.map((req, idx) => (
                <RevealItem key={req.id}>
                <div className="relative h-full rounded-2xl border border-line bg-surface">
                <Link
                  href={`/${locale}/richiesta/${req.id}`}
                  className="group block p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
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
                  <h3 className="mb-3 font-heading text-lg text-ink">
                    {req.from_city} — {req.to_city}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-2.5 py-1">
                      <Users className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} aria-hidden />
                      {seatLabel(req.seats_needed)}
                    </span>
                    {req.max_price !== null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-2.5 py-1">
                        <Euro className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} aria-hidden />
                        {t("maxPrice", { price: req.max_price })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-muted" />
                      </div>
                      <p className="text-sm font-medium text-ink">{req.profiles.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-faint group-hover:translate-x-1 group-hover:text-primary transition-all" />
                  </div>
                </Link>
                </div>
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

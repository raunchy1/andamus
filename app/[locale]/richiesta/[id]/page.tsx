"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  User,
  Euro,
  Users,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Reveal } from "@/components/ui/premium/reveal";

interface RideRequest {
  id: string;
  user_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string | null;
  time_flexibility: string;
  seats_needed: number;
  max_price: number | null;
  notes: string | null;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export default function RequestDetailPage() {
  const t = useTranslations("requests");
  const locale = useLocale();
  const params = useParams();
  const requestId = params.id as string;
  const supabase = createClient();

  const [request, setRequest] = useState<RideRequest | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) return;
      setLoading(true);
      setError(false);

      try {
        const [{ data: { user: currentUser } }, { data: reqData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("ride_requests")
            .select(`*, profiles(name, avatar_url)`)
            .eq("id", requestId)
            .single(),
        ]);

        setUser(currentUser);
        setRequest(reqData);
      } catch (err) {
        console.error('[richiesta] fetchData error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId, supabase]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  };

  const flexibilityLabel = (val: string) => {
    switch (val) {
      case "1h": return t("flexibility.1h");
      case "3h": return t("flexibility.3h");
      case "any": return t("flexibility.any");
      default: return t("flexibility.exact");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-xl font-bold text-fg">{t("loadError")}</h1>
        <Link href={`/${locale}/richieste`} className="mt-6 flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("backToRequests")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold text-fg">{t("notFound")}</h1>
        <Link href={`/${locale}/richieste`} className="mt-6 flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("backToRequests")}
        </Link>
      </div>
    );
  }

  const isMyRequest = user?.id === request.user_id;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line px-4 py-8 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Link
              href={`/${locale}/richieste`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {t("backToRequests")}
            </Link>
            <h1 className="mt-2 font-heading text-[26px] leading-tight text-ink sm:text-3xl">
              {request.from_city} — {request.to_city}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("lookingForRide")}</p>
          </Reveal>
        </div>
      </header>

      {/* Detail Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Reveal>
          <div className="space-y-6">
            {/* Meta Info */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-line overflow-hidden">
                    {request.profiles?.avatar_url ? (
                      <img src={request.profiles.avatar_url} alt={request.profiles.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-medium text-green">
                        {request.profiles?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-heading text-lg text-ink">{request.profiles.name}</p>
                    <p className="text-xs text-muted">{t("lookingForRide")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-fg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted" strokeWidth={1.5} aria-hidden />
                    <span className="capitalize">{formatDate(request.date)}</span>
                  </div>
                  {request.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted" strokeWidth={1.5} aria-hidden />
                      <span>{request.time.slice(0, 5)}</span>
                      <span className="text-xs text-faint">({flexibilityLabel(request.time_flexibility)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Users className="h-4 w-4 text-muted" strokeWidth={1.5} aria-hidden />
                  <p className="text-xs text-muted">{t("seatsNeeded")}</p>
                </div>
                <p className="font-heading text-2xl text-ink">{request.seats_needed}</p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Euro className="h-4 w-4 text-muted" strokeWidth={1.5} aria-hidden />
                  <p className="text-xs text-muted">{t("maxBudget")}</p>
                </div>
                <p className="font-heading text-2xl text-ink">
                  {request.max_price !== null ? `${request.max_price} €` : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Clock className="h-4 w-4 text-muted" strokeWidth={1.5} aria-hidden />
                  <p className="text-xs text-muted">{t("flexibilityLabel") || t("flexibility")}</p>
                </div>
                <p className="truncate font-heading text-lg text-ink">{flexibilityLabel(request.time_flexibility)}</p>
              </div>
            </div>

            {/* Notes Section */}
            {request.notes && (
              <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                <div>
                  <p className="font-bold text-fg mb-1">{t("notes")}</p>
                  <p className="text-fg leading-relaxed text-sm">{request.notes}</p>
                </div>
              </div>
            )}

            {/* Actions for Drivers */}
            {!isMyRequest && user && (
              <div className="rounded-2xl border border-line bg-green-tint p-8 text-center">
                <MapPin className="mx-auto mb-3 h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden />
                <p className="mb-2 font-heading text-lg text-ink">{t("haveRidePrompt")}</p>
                <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted">
                  {t("haveRideBody")}
                </p>
                <div className="inline-flex justify-center">
                  <button
                    type="button"
                    onClick={() => window.location.assign(`/${locale}/offri?from=${request.from_city}&to=${request.to_city}&date=${request.date}`)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    {t("publishRide")}
                  </button>
                </div>
              </div>
            )}

            {/* Information for Request Owner */}
            {isMyRequest && (
              <div className="rounded-2xl border border-line bg-surface p-5 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />
                <p className="text-sm font-medium text-ink">{t("yourRequest")}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">{t("notificationInfo")}</p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

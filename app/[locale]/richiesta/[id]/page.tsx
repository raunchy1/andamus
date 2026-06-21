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
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-[#4FB3C9] mb-4" />
        <h1 className="text-xl font-bold text-[#e5e2e1]">{t("loadError")}</h1>
        <Link href={`/${locale}/richieste`} className="mt-6 flex items-center gap-2 text-[#4FB3C9] hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("backToRequests")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#4FB3C9]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-[#4FB3C9] mb-4" />
        <h1 className="text-2xl font-bold text-[#e5e2e1]">{t("notFound")}</h1>
        <Link href={`/${locale}/richieste`} className="mt-6 flex items-center gap-2 text-[#4FB3C9] hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("backToRequests")}
        </Link>
      </div>
    );
  }

  const isMyRequest = user?.id === request.user_id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      {/* Header — Premium Aurora */}
      <AuroraBackground className="border-b border-white/5 px-4 py-8 lg:py-12 relative" showRadialMask={false}>
        <OrbGlow className="-top-20 -right-32" color="#4FB3C9" size={300} opacity={0.30} />
        <div className="mx-auto max-w-3xl relative">
          <Reveal>
            <div className="mb-4 flex items-center gap-2">
              <Link href={`/${locale}/richieste`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#4FB3C9] transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {t("backToRequests")}
              </Link>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#4FB3C9]/30 bg-[#4FB3C9]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4FB3C9] backdrop-blur-md mb-4">
              <Sparkles className="h-3 w-3" />
              {t("lookingForRide")}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#e5e2e1]">
              {request.from_city} <GradientText>→</GradientText> {request.to_city}
            </h1>
          </Reveal>
        </div>
      </AuroraBackground>

      {/* Detail Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Reveal>
          <div className="space-y-6">
            {/* Meta Info */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 overflow-hidden">
                    {request.profiles?.avatar_url ? (
                      <img src={request.profiles.avatar_url} alt={request.profiles.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-[#4FB3C9]">
                        {request.profiles?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#e5e2e1]">{request.profiles.name}</p>
                    <p className="text-xs text-[#e5e2e1]/60">{t("lookingForRide")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-[#e5e2e1]/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#4FB3C9]" />
                    <span className="capitalize">{formatDate(request.date)}</span>
                  </div>
                  {request.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#4FB3C9]" />
                      <span>{request.time.slice(0, 5)}</span>
                      <span className="text-xs text-[#e5e2e1]/40">({flexibilityLabel(request.time_flexibility)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <TiltCard tiltStrength={4} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Users className="h-4 w-4 text-[#4FB3C9]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#e5e2e1]/60">{t("seatsNeeded")}</p>
                </div>
                <p className="text-2xl font-black text-[#e5e2e1]">{request.seats_needed}</p>
              </TiltCard>

              <TiltCard tiltStrength={4} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Euro className="h-4 w-4 text-[#4FB3C9]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#e5e2e1]/60">{t("maxBudget")}</p>
                </div>
                <p className="text-2xl font-black text-[#e5e2e1]">
                  {request.max_price !== null ? `${request.max_price}€` : "-"}
                </p>
              </TiltCard>

              <TiltCard tiltStrength={4} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Clock className="h-4 w-4 text-[#4FB3C9]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#e5e2e1]/60">{t("flexibilityLabel") || t("flexibility")}</p>
                </div>
                <p className="text-lg font-bold text-[#e5e2e1] truncate">{flexibilityLabel(request.time_flexibility)}</p>
              </TiltCard>
            </div>

            {/* Notes Section */}
            {request.notes && (
              <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 backdrop-blur-sm flex gap-4">
                <FileText className="h-6 w-6 text-[#4FB3C9] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#e5e2e1] mb-1">{t("notes")}</p>
                  <p className="text-[#e5e2e1]/80 leading-relaxed text-sm">{request.notes}</p>
                </div>
              </div>
            )}

            {/* Actions for Drivers */}
            {!isMyRequest && user && (
              <div className="rounded-3xl border border-[#4FB3C9]/20 bg-gradient-to-br from-[#4FB3C9]/[0.05] via-[#4FB3C9]/[0.02] to-transparent p-8 text-center backdrop-blur-sm">
                <MapPin className="h-10 w-10 text-[#4FB3C9] mx-auto mb-3" />
                <p className="text-lg font-bold text-[#e5e2e1] mb-2">{t("haveRidePrompt")}</p>
                <p className="text-sm text-[#e5e2e1]/60 mb-6 max-w-md mx-auto">
                  Pubblica una corsa che corrisponde alle esigenze di questo passeggero. Verrà notificato istantaneamente!
                </p>
                <div className="inline-flex justify-center">
                  <MagneticButton
                    onClick={() => window.location.assign(`/${locale}/offri?from=${request.from_city}&to=${request.to_city}&date=${request.date}`)}
                    strength={12}
                    className="h-12 px-6 text-sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t("publishRide")}
                  </MagneticButton>
                </div>
              </div>
            )}

            {/* Information for Request Owner */}
            {isMyRequest && (
              <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 text-center backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-[#4FB3C9] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#e5e2e1]">{t("yourRequest")}</p>
                <p className="text-xs text-[#e5e2e1]/50 mt-1 max-w-sm mx-auto">{t("notificationInfo")}</p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

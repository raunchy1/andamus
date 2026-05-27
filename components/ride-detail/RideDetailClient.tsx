"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Sun, User, BadgeCheck, Star, MessageCircle, DoorOpen, Car, Cigarette, Dog, Briefcase, UserCircle, GraduationCap, Music, ShieldCheck, Lock, Clock, Zap } from "lucide-react";
import { CarInfoCard } from "@/components/CarInfoCard";
import { ShareRide } from "@/components/ShareRide";
import { CelebrationModal } from "@/components/FirstRideCelebration";
import dynamic from "next/dynamic";

const PostActionModal = dynamic(() => import("@/components/PostActionModal").then(m => m.PostActionModal), { ssr: false });
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { getDeterministicDriverMetrics, getDeterministicActivity } from "@/lib/reputation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { notifyBookingRequest } from "@/lib/notification-actions";
import { useDeviceType } from "@/components/view-mode";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { computeRideStatus, isRideBookable, getRideStatusLabel, getRideStatusColor } from "@/lib/ride-status";
import { Analytics } from "@/lib/analytics";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { ReportUser } from "@/components/ReportUser";

import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
    avatar_url: string | null;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
}

interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  // Car info
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    rides_count: number;
    review_count?: number | null;
  };
}

interface RideDetailViewProps {
  ride: Ride;
  user: SupabaseUser | null;
  reviews: Review[];
  similarRides: Ride[];
  stops: { city: string; order_index: number }[];
  existingBooking: Booking | null;
  requesting: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  handleShare: () => void;
  handleRequestRide: () => void;
  formatDate: (dateStr: string) => string;
  formatReviewDate: (dateStr: string) => string;
  rideStatus: import("@/lib/ride-status").ComputedRideStatus;
  canBook: boolean;
}

function RideDetailMobile({
  ride,
  user,
  reviews,
  similarRides,
  stops,
  existingBooking,
  requesting,
  showLoginModal,
  setShowLoginModal,
  handleShare: _handleShare,
  handleRequestRide,
  formatDate,
  formatReviewDate,
  rideStatus,
  canBook,
}: RideDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ride");
  const tc = useTranslations("common");
  const isMyRide = user?.id === ride.driver_id;

  return (
    <div className="min-h-screen bg-surface pb-44">
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 pt-12">
        <button onClick={() => router.back()} className="bg-surface-container-highest/90 backdrop-blur-xl p-3.5 rounded-2xl text-on-surface hover:bg-surface-container-highest transition-all active:scale-95 shadow-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <ShareRide ride={{ id: ride.id, from_city: ride.from_city, to_city: ride.to_city, date: ride.date, time: ride.time, price: ride.price, driverName: ride.profiles.name }} variant="icon" className="bg-surface-container-highest/90 backdrop-blur-xl p-3.5 rounded-2xl shadow-lg" />
      </header>

      <main className="overflow-y-auto overflow-x-hidden hide-scrollbar">
        {/* Full Bleed Map Header — Premium Aurora */}
        <AuroraBackground className="relative h-[400px] w-full" showRadialMask={false}>
          <OrbGlow className="-top-10 -right-20" color="#e63946" size={280} opacity={0.35} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/70 via-[#0e0e0e]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
          {/* Weather Widget */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/[0.06] backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg border border-white/10">
            <Sun className="w-7 h-7 text-[#ffb3b1]" />
            <div className="flex flex-col">
              <span className="font-label font-bold text-[10px] uppercase tracking-wider text-[#e5e2e1]/60">{ride.from_city}</span>
              <span className="font-headline font-bold text-lg text-[#e5e2e1]">24°C</span>
            </div>
          </div>
          {/* Pulse indicator */}
          <span className="pointer-events-none absolute right-8 top-20 inline-flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-70" style={{ animation: "pulseRing 1.6s infinite" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e63946]" />
          </span>
        </AuroraBackground>

        {/* Route Details */}
        <div className="px-5 pt-4">
          {/* Main Title Section */}
          <Reveal>
          <div className="mb-10">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div className="flex-1">
                <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface leading-[1.1]">
                  {ride.from_city} <GradientText>→</GradientText> {ride.to_city}
                </h1>
              </div>
              <div className="text-right shrink-0 pt-1">
                <span className="font-headline font-extrabold text-4xl tracking-tight">
                  {ride.price === 0 ? <GradientText>{t('free')}</GradientText> : <span className="text-on-surface">{`€${ride.price}`}</span>}
                </span>
                <p className="font-label font-semibold text-[10px] uppercase tracking-wider text-on-surface/40 mt-1">{t('perPerson')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#e63946] animate-pulse" />
              <p className="font-label font-semibold text-sm uppercase tracking-wide text-[#ffb3b1]">
                {t('departure')} • {formatDate(ride.date)} · {ride.time.slice(0,5)}
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRideStatusColor(rideStatus)}`}>
                {getRideStatusLabel(rideStatus)}
              </span>
            </div>
          </div>
          </Reveal>

          {/* Driver Profile Card — TiltCard */}
          <Reveal delay={0.1}>
          <TiltCard tiltStrength={4} className="bg-gradient-to-br from-[#ffb3b1]/[0.07] via-[#e63946]/[0.04] to-transparent border border-[#ffb3b1]/20 rounded-3xl p-7 mb-10 relative overflow-hidden">
            {/* Deterministic active activity / scarcity alert indicator inside the detail page */}
            {(() => {
              const activity = getDeterministicActivity(ride.id);
              const metrics = getDeterministicDriverMetrics(ride.driver_id, ride.profiles.rating);
              return (
                <>
                  {activity.seatsScarcityText && (
                    <div className="absolute top-0 right-0 left-0 bg-[#e63946]/10 border-b border-[#e63946]/15 py-1.5 px-4 text-center">
                      <span className="text-[10px] font-extrabold tracking-widest text-[#e63946] uppercase animate-pulse flex items-center justify-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-[#e63946]" />
                        {activity.seatsScarcityText}
                      </span>
                    </div>
                  )}

                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${activity.seatsScarcityText ? "mt-7" : ""} mb-6 pb-5 border-b border-white/[0.06] gap-3`}>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface/50 font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#ffb3b1]" />
                      <span>{activity.publishedText}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4CAF50] bg-[#4CAF50]/10 border border-[#4CAF50]/20 px-2 py-0.5 rounded-full">
                      <span className={`w-1.5 h-1.5 rounded-full bg-[#4CAF50] ${metrics.isOnlineNow ? "animate-pulse" : ""}`} />
                      <span>{activity.lastActiveText}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <Link
                        href={`/${locale}/u/${ride.driver_id}`}
                        onClick={() => Analytics.shareEvent?.("profile_click", { source: "ride_detail", driver_id: ride.driver_id })}
                        className="relative shrink-0"
                      >
                        {ride.profiles.avatar_url ? (
                          <Image src={ride.profiles.avatar_url} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 border-surface-container-high shadow-sm hover:ring-2 hover:ring-[#e63946]/50 transition-all" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-surface shadow-sm hover:ring-2 hover:ring-[#e63946]/50 transition-all">
                            <User className="w-9 h-9 text-on-surface-variant" />
                          </div>
                        )}
                        {/* Live presence indicator */}
                        {metrics.isOnlineNow && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#131313] animate-pulse" />
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/${locale}/u/${ride.driver_id}`}
                          onClick={() => Analytics.shareEvent?.("profile_click", { source: "ride_detail", driver_id: ride.driver_id })}
                          className="flex items-center gap-1.5"
                        >
                          <h3 className="font-headline font-bold text-xl text-on-surface hover:text-[#e63946] transition-colors">{ride.profiles.name}</h3>
                          {metrics.isOnlineNow && <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online adesso" />}
                        </Link>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-primary fill-current" />
                          <span className="text-base font-semibold text-on-surface">{ride.profiles.rating}</span>
                          <span className="text-on-surface/40 text-sm">• {ride.profiles.rides_count || 0} {t('trips')} · {ride.profiles.review_count || 0} {t('reviews')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-on-surface/50 font-medium">Membro dal 2025</span>
                          {((ride.profiles.rating || 0) >= 4.5 || (ride.profiles.review_count || 0) > 5) && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] bg-[#2dd4bf]/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              Verificato
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#f4a261] bg-[#f4a261]/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-[#f4a261]" />
                            Pendolare Verificato
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {existingBooking && !isMyRide && (
                        <Link href={`/${locale}/chat/${existingBooking.id}`} className="bg-white/[0.06] text-on-surface p-4 rounded-2xl hover:bg-[#e63946] hover:text-white transition-all active:scale-95 border border-white/10">
                          <MessageCircle className="w-6 h-6" />
                        </Link>
                      )}
                      {!isMyRide && (
                        <div className="bg-white/[0.06] text-on-surface p-4 rounded-2xl hover:bg-[#e63946] hover:text-white transition-all active:scale-95 border border-white/10 flex items-center justify-center">
                          <ReportUser reportedId={ride.driver_id} rideId={ride.id} reportedName={ride.profiles.name} iconOnly={true} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profilo Affidabilità Sub-Card */}
                  <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1">Affidabilità</span>
                      <span className="text-sm font-extrabold text-[#2dd4bf] flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        {metrics.completionRate}% completate
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1">Reattività</span>
                      <span className="text-sm font-extrabold text-[#f4a261] flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {metrics.responseTimeText}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1">Lingue Parlate</span>
                      <div className="flex gap-1.5 flex-wrap mt-0.5">
                        {metrics.languages.map((lang, lIdx) => (
                          <span key={lIdx} className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/70">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1">Livello Esperienza</span>
                      <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-[#ffb3b1]/10 text-[#ffb3b1] text-[10px] font-extrabold">Liv. {Math.round(metrics.profileCompletion / 10)}</span>
                      </span>
                    </div>
                    {/* Preferred corridors */}
                    <div className="col-span-2 sm:col-span-4 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1.5 block">Tratte Frequenti</span>
                      <div className="flex gap-2 flex-wrap">
                        {metrics.preferredRoutes.map((route, rIdx) => (
                          <span key={rIdx} className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#ffb3b1]/5 border border-[#ffb3b1]/15 text-[#ffb3b1]">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </TiltCard>
          </Reveal>


          {/* Journey Info Cards */}
          <RevealStagger className="grid grid-cols-2 gap-4 mb-10">
            <RevealItem>
            <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 rounded-3xl p-6 flex flex-col justify-between h-[200px]">
              <div className="bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20 w-16 h-16 rounded-2xl flex items-center justify-center">
                <DoorOpen className="w-8 h-8 text-[#ffb3b1]" />
              </div>
              <div>
                <p className="font-label font-bold text-[10px] uppercase tracking-[0.15em] text-on-surface/40 mb-2">{t('pickupPoint')}</p>
                <p className="font-semibold text-on-surface text-base leading-snug">{ride.meeting_point || t('defaultMeetingPoint', { city: ride.from_city })}</p>
              </div>
            </TiltCard>
            </RevealItem>

            {/* Car Info Card - Full width if has details */}
            {ride.car_model ? (
              <RevealItem className="col-span-2">
                <CarInfoCard
                  model={ride.car_model}
                  color={ride.car_color}
                  plate={ride.car_plate}
                  year={ride.car_year}
                />
              </RevealItem>
            ) : (
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 rounded-3xl p-6 flex flex-col justify-between h-[200px]">
                <div className="bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20 w-16 h-16 rounded-2xl flex items-center justify-center">
                  <Car className="w-8 h-8 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="font-label font-bold text-[10px] uppercase tracking-[0.15em] text-on-surface/40 mb-2">{t('vehicle')}</p>
                  <p className="font-semibold text-on-surface text-base leading-snug">{t('driverCar')}</p>
                </div>
              </TiltCard>
              </RevealItem>
            )}
          </RevealStagger>

          {/* The Path Indicator */}
          {stops.length > 0 && (
            <div className="mb-10 px-2">
              <h4 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-on-surface/50 mb-6 ml-1">{t('waypoints')}</h4>
              <div className="space-y-6 relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-surface-container-highest" />
                <div className="flex items-center gap-5 relative">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="font-semibold text-lg text-on-surface">{ride.from_city}</span>
                </div>
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-5 relative">
                    <div className="w-6 h-6 rounded-full bg-surface-container-lowest border-2 border-surface-container-highest z-10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
                    </div>
                    <span className="font-semibold text-base text-on-surface/70">{stop.city}</span>
                  </div>
                ))}
                <div className="flex items-center gap-5 relative">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary z-10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="font-semibold text-lg text-on-surface">{ride.to_city}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rules/Amenities - Elegant pill-style badges */}
          <div className="flex flex-wrap gap-2.5 mb-10">
            {!ride.smoking_allowed && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <Cigarette className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">{t('noSmoking')}</span>
              </div>
            )}
            {ride.pets_allowed && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <Dog className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">{t('petsOk')}</span>
              </div>
            )}
            {ride.large_luggage && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <Briefcase className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">{t('largeLuggage')}</span>
              </div>
            )}
            {ride.women_only && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <UserCircle className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">{t('womenOnly')}</span>
              </div>
            )}
            {ride.students_only && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <GraduationCap className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">{t('studentsOnly')}</span>
              </div>
            )}
            {ride.music_preference && (
              <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-4 py-2.5 rounded-full border border-surface-container-high">
                <Music className="w-4 h-4 text-on-surface/60" />
                <span className="font-medium text-sm text-on-surface/80">
                  {ride.music_preference === "quiet" ? t('quiet') : ride.music_preference === "music" ? t('music') : t('chat')}
                </span>
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mb-12">
              <h4 className="font-label font-bold text-[10px] uppercase tracking-[0.2em] text-on-surface/40 mb-5">{t('reviews')}</h4>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-surface-container-low p-6 rounded-3xl shadow-sm">
                    <div className="flex items-start gap-4">
                      {review.reviewer.avatar_url ? (
                        <Image src={review.reviewer.avatar_url} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center">
                          <User className="w-5 h-5 text-on-surface-variant" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-base text-on-surface truncate">{review.reviewer.name}</p>
                          <span className="text-xs text-on-surface/40 shrink-0 ml-2">{formatReviewDate(review.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? "text-primary fill-current" : "text-surface-container-highest"}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-on-surface/60 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Rides */}
          {similarRides.length > 0 && (
            <div className="mb-12">
              <h4 className="font-label font-bold text-[10px] uppercase tracking-[0.2em] text-on-surface/40 mb-5">{t('similarRides')}</h4>
              <div className="space-y-3">
                {similarRides.map((similar) => (
                  <Link
                    key={similar.id}
                    href={`/${locale}/corsa/${similar.id}`}
                    className="flex items-center justify-between bg-surface-container-low p-5 rounded-2xl transition-all hover:bg-surface-container-high active:scale-[0.98] shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base text-on-surface mb-0.5 truncate">{similar.from_city} <span className="text-primary">→</span> {similar.to_city}</p>
                      <p className="text-sm text-on-surface/50">{similar.time.slice(0,5)} · {similar.profiles.name}</p>
                    </div>
                    <span className="font-bold text-lg text-on-surface shrink-0 ml-3">
                      {similar.price === 0 ? t('free') : `€${similar.price}`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
      </main>

      {/* Fixed Action Button — Magnetic CTA */}
      <div className="fixed bottom-24 left-0 w-full px-5 z-40">
        <div className="max-w-md mx-auto">
          {isMyRide ? (
            <MagneticButton
              onClick={() => router.push(`/${locale}/profilo`)}
              strength={16}
              className="w-full py-5 text-base bg-white/[0.08] border border-white/15 backdrop-blur-xl"
            >
              <span>{t('manageFromProfile')}</span>
              <ChevronRight className="w-5 h-5" />
            </MagneticButton>
          ) : existingBooking ? (
            <MagneticButton
              onClick={() => router.push(`/${locale}/chat/${existingBooking.id}`)}
              strength={16}
              className="w-full py-5 text-base"
            >
              <span>{t('openChat')}</span>
              <ChevronRight className="w-5 h-5" />
            </MagneticButton>
          ) : !canBook ? (
            <MagneticButton
              disabled
              strength={16}
              className="w-full py-5 text-base disabled:opacity-50"
            >
              <span>{rideStatus === 'completed' ? t('rideCompleted') : t('rideUnavailable')}</span>
            </MagneticButton>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <MagneticButton
                onClick={handleRequestRide}
                disabled={requesting}
                strength={16}
                className="w-full py-5 text-base disabled:opacity-70"
              >
                <span>{requesting ? t('booking') : t('requestRide')}</span>
                <ChevronRight className="w-5 h-5" />
              </MagneticButton>
              {ride.seats <= 2 && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#f4a261]">
                  Solo {ride.seats} posti rimasti
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface-container-low p-8 shadow-2xl">
            <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-on-surface">{t('loginToBook')}</h3>
            <p className="mb-8 text-on-surface/70 text-base">{t('authRequiredToBook')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-2xl bg-surface-container-high py-4 text-base font-semibold text-on-surface hover:bg-surface-container-highest transition-all active:scale-95"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => signInWithGoogle()}
                className="flex-1 rounded-2xl bg-primary py-4 text-base font-semibold text-on-primary hover:opacity-90 transition-all active:scale-95"
              >
                {tc('login')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RideDetailDesktop({
  ride,
  user,
  reviews,
  similarRides,
  stops,
  existingBooking,
  requesting,
  showLoginModal,
  setShowLoginModal,
  handleShare: _handleShare,
  handleRequestRide,
  formatDate,
  formatReviewDate,
  rideStatus,
  canBook,
}: RideDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ride");
  const tc = useTranslations("common");
  const isMyRide = user?.id === ride.driver_id;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl text-on-surface hover:bg-white/5 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="font-semibold text-on-surface">{t('details')}</span>
          </div>
          <div className="flex items-center gap-3">
            <ShareRide ride={{ id: ride.id, from_city: ride.from_city, to_city: ride.to_city, date: ride.date, time: ride.time, price: ride.price, driverName: ride.profiles.name }} variant="icon" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column — Hero / Map / Route / Info */}
          <div className="lg:col-span-2 space-y-10">
            {/* Hero Map — Premium Aurora */}
            <Reveal>
            <AuroraBackground className="relative h-[420px] w-full rounded-3xl overflow-hidden border border-white/10" showRadialMask={false}>
              <OrbGlow className="-top-20 -right-20" color="#e63946" size={320} opacity={0.32} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/70 via-[#0e0e0e]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center space-x-3 bg-white/[0.06] border border-white/10 backdrop-blur-xl px-4 py-2 rounded-xl">
                <Sun className="w-5 h-5 text-[#ffb3b1]" />
                <div className="flex flex-col">
                  <span className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface/60">{ride.from_city}</span>
                  <span className="font-headline font-bold text-lg text-on-surface leading-none">24°C</span>
                </div>
              </div>
              <span className="pointer-events-none absolute right-8 top-8 inline-flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-70" style={{ animation: "pulseRing 1.6s infinite" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e63946]" />
              </span>
            </AuroraBackground>
            </Reveal>

            {/* Route Title */}
            <Reveal delay={0.1}>
            <div>
              <h1 className="font-headline font-extrabold text-6xl tracking-tighter text-on-surface mb-3">
                {ride.from_city} <GradientText className="tracking-normal">→</GradientText> {ride.to_city}
              </h1>
              <div className="flex items-center gap-3">
                <p className="font-label font-semibold text-sm uppercase tracking-[0.15em] text-[#ffb3b1]">{t('departure')} • {formatDate(ride.date)} · {ride.time.slice(0,5)}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRideStatusColor(rideStatus)}`}>
                  {getRideStatusLabel(rideStatus)}
                </span>
              </div>
            </div>
            </Reveal>

            {/* Bento Info — TiltCards */}
            <RevealStagger className="grid grid-cols-2 gap-5">
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-6 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <DoorOpen className="w-6 h-6 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface/40 mb-1">{t('pickup')}</p>
                  <p className="font-body font-semibold text-on-surface">{ride.meeting_point || t('defaultMeetingPoint', { city: ride.from_city })}</p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-6 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <Car className="w-6 h-6 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface/40 mb-1">{t('car')}</p>
                  <p className="font-body font-semibold text-on-surface">{t('driverCar')}</p>
                </div>
              </TiltCard>
              </RevealItem>
            </RevealStagger>

            {/* Path Indicator */}
            {stops.length > 0 && (
              <div className="px-2">
                <h4 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-on-surface/40 mb-6">{t('waypoints')}</h4>
                <div className="space-y-8 relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-surface-container-highest" />
                  <div className="flex items-center space-x-6 relative">
                    <div className="w-5 h-5 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-headline font-semibold text-xl text-on-surface">{ride.from_city}</span>
                  </div>
                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center space-x-6 relative">
                      <div className="w-5 h-5 rounded-full bg-surface-container-lowest border-2 border-surface-container-highest z-10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
                      </div>
                      <span className="font-headline font-semibold text-lg text-on-surface/60">{stop.city}</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-6 relative">
                    <div className="w-5 h-5 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-headline font-semibold text-xl text-on-surface">{ride.to_city}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            <div className="flex flex-wrap gap-3">
              {!ride.smoking_allowed && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <Cigarette className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">{t('noSmoking')}</span>
                </div>
              )}
              {ride.pets_allowed && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <Dog className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">{t('petsOk')}</span>
                </div>
              )}
              {ride.large_luggage && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">{t('largeLuggage')}</span>
                </div>
              )}
              {ride.women_only && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <UserCircle className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">{t('womenOnly')}</span>
                </div>
              )}
              {ride.students_only && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">{t('studentsOnly')}</span>
                </div>
              )}
              {ride.music_preference && (
                <div className="flex items-center space-x-2 bg-surface-container-high px-4 py-2.5 rounded-xl">
                  <Music className="w-5 h-5" />
                  <span className="font-label font-bold text-[11px] uppercase">
                    {ride.music_preference === "quiet" ? t('quiet') : ride.music_preference === "music" ? t('music') : t('chat')}
                  </span>
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h4 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-on-surface/40 mb-5">{t('reviews')}</h4>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-surface-container-low p-5 rounded-2xl">
                      <div className="flex items-start gap-4">
                        {review.reviewer.avatar_url ? (
                          <Image src={review.reviewer.avatar_url} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                            <User className="w-5 h-5 text-on-surface-variant" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-on-surface">{review.reviewer.name}</p>
                            <span className="text-sm text-on-surface-variant">{formatReviewDate(review.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < Math.round(review.rating) ? 'text-primary fill-primary' : 'text-outline'}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="mt-3 text-sm text-on-surface-variant">&ldquo;{review.comment}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Rides */}
            {similarRides.length > 0 && (
              <div>
                <h4 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-on-surface/40 mb-5">{t('similarRides')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarRides.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/${locale}/corsa/${similar.id}`}
                      className="flex items-center justify-between bg-surface-container-low p-5 rounded-2xl transition-colors hover:bg-surface-container-high"
                    >
                      <div>
                        <p className="font-bold text-on-surface">{similar.from_city} → {similar.to_city}</p>
                        <p className="text-sm text-on-surface-variant">{similar.time.slice(0,5)} · {similar.profiles.name}</p>
                      </div>
                      <span className="font-extrabold text-on-surface">
                        {similar.price === 0 ? t('free') : `€${similar.price}`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Sticky Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card — Premium TiltCard */}
              <Reveal delay={0.15}>
              <TiltCard tiltStrength={4} className="bg-gradient-to-br from-[#ffb3b1]/[0.08] via-[#e63946]/[0.04] to-transparent border border-[#ffb3b1]/20 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-[0_30px_80px_-25px_rgba(230,57,70,0.4)]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-on-surface/40 text-sm font-semibold uppercase tracking-widest mb-1">{t('pricePerSeat')}</p>
                    <span className="font-headline font-extrabold text-5xl tracking-tighter">
                      {ride.price === 0 ? <GradientText>{t('free')}</GradientText> : <span className="text-on-surface">{`€${ride.price}`}</span>}
                    </span>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-4">
                    <Link
                      href={`/${locale}/u/${ride.driver_id}`}
                      onClick={() => Analytics.shareEvent?.("profile_click", { source: "ride_detail_desktop", driver_id: ride.driver_id })}
                      className="relative shrink-0"
                    >
                      {ride.profiles.avatar_url ? (
                        <Image src={ride.profiles.avatar_url} alt="" width={64} height={64} className="w-16 h-16 rounded-full object-cover hover:ring-2 hover:ring-[#e63946]/50 transition-all" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:ring-2 hover:ring-[#e63946]/50 transition-all">
                          <User className="w-7 h-7 text-on-surface-variant" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-[#e63946] text-white rounded-full p-1 border-4 border-[#0a0a0a]">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                    <div>
                      <Link
                        href={`/${locale}/u/${ride.driver_id}`}
                        onClick={() => Analytics.shareEvent?.("profile_click", { source: "ride_detail_desktop", driver_id: ride.driver_id })}
                      >
                        <h3 className="font-headline font-bold text-xl text-on-surface leading-tight hover:text-[#e63946] transition-colors">{ride.profiles.name}</h3>
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="w-4 h-4 text-[#ffb3b1] fill-[#ffb3b1]" />
                        <span className="text-base font-semibold text-on-surface">{ride.profiles.rating}</span>
                        <span className="text-on-surface/40 text-sm">• {ride.profiles.rides_count || 0} {t('trips')} · {ride.profiles.review_count || 0} {t('reviews')}</span>
                      </div>
                    </div>
                  </div>
                  {existingBooking && !isMyRide && (
                    <Link href={`/${locale}/chat/${existingBooking.id}`} className="bg-white/[0.06] border border-white/10 text-on-surface p-3 rounded-xl hover:bg-[#e63946] hover:border-[#e63946] hover:text-white transition-all">
                      <MessageCircle className="w-5 h-5" />
                    </Link>
                  )}
                </div>

                {/* Action — Magnetic CTA */}
                <div className="pt-2">
                  {isMyRide ? (
                    <MagneticButton
                      onClick={() => router.push(`/${locale}/profilo`)}
                      strength={16}
                      className="w-full py-5 text-base bg-white/[0.08] border border-white/15 backdrop-blur-md"
                    >
                      <span>{t('manageFromProfile')}</span>
                      <ChevronRight className="w-5 h-5" />
                    </MagneticButton>
                  ) : existingBooking ? (
                    <MagneticButton
                      onClick={() => router.push(`/${locale}/chat/${existingBooking.id}`)}
                      strength={16}
                      className="w-full py-5 text-base"
                    >
                      <span>{t('openChat')}</span>
                      <ChevronRight className="w-5 h-5" />
                    </MagneticButton>
                  ) : !canBook ? (
                    <MagneticButton
                      disabled
                      strength={16}
                      className="w-full py-5 text-base disabled:opacity-50"
                    >
                      <span>{rideStatus === 'completed' ? t('rideCompleted') : t('rideUnavailable')}</span>
                    </MagneticButton>
                  ) : (
                    <MagneticButton
                      onClick={handleRequestRide}
                      disabled={requesting}
                      strength={16}
                      className="w-full py-5 text-base disabled:opacity-70"
                    >
                      <span>{requesting ? t('booking') : t('requestRide')}</span>
                      <ChevronRight className="w-5 h-5" />
                    </MagneticButton>
                  )}
                </div>
              </TiltCard>
              </Reveal>

              {/* Trust badges mini */}
              <RevealStagger className="grid grid-cols-2 gap-4">
                <RevealItem>
                <TiltCard tiltStrength={4} className="bg-white/[0.025] border border-white/8 rounded-2xl p-5 text-center">
                  <ShieldCheck className="w-8 h-8 text-[#ffb3b1] mb-2 mx-auto" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/70">{t('verifiedDriver')}</p>
                </TiltCard>
                </RevealItem>
                <RevealItem>
                <TiltCard tiltStrength={4} className="bg-white/[0.025] border border-white/8 rounded-2xl p-5 text-center">
                  <Lock className="w-8 h-8 text-[#ffb3b1] mb-2 mx-auto" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface/70">{t('securePayment')}</p>
                </TiltCard>
                </RevealItem>
              </RevealStagger>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6">
            <h3 className="mb-2 text-xl font-extrabold tracking-tight text-on-surface">{t('loginToBook')}</h3>
            <p className="mb-6 text-on-surface-variant">{t('authRequiredToBook')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={() => signInWithGoogle()}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary hover:opacity-90"
              >
                {tc('login')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface RideDetailClientProps {
  ride: Ride;
  user: SupabaseUser | null;
  reviews: Review[];
  similarRides: Ride[];
  stops: { city: string; order_index: number }[];
  existingBooking: Booking | null;
  rideId: string;
  locale: string;
}

export function RideDetailClient({
  ride,
  user,
  reviews,
  similarRides,
  stops,
  existingBooking: initialBooking,
  rideId,
  locale,
}: RideDetailClientProps) {
  const router = useRouter();
  const deviceType = useDeviceType();
  const t = useTranslations("ride");

  const [requesting, setRequesting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPostAction, setShowPostAction] = useState(false);
  const [postActionBookingId, setPostActionBookingId] = useState<string | null>(null);
  const [existingBooking] = useState<Booking | null>(initialBooking);

  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  const rideStatus = computeRideStatus(ride.status, ride.date, ride.time);
  const canBook = isRideBookable(ride.status, ride.date, ride.time);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    
    let prefix = "";
    if (dateStr === today) prefix = `${t('today')}, `;
    else if (dateStr === tomorrow) prefix = `${t('tomorrow')}, `;
    
    return prefix + date.toLocaleDateString(locale, { 
      weekday: "long", 
      day: "numeric", 
      month: "long",
    });
  }, [locale, t]);

  const formatReviewDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      month: "short",
      year: "numeric"
    });
  }, [locale]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  const handleRequestRide = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!ride) return;
    if (user.id === ride.driver_id) {
      toast.error(t('cannotBookOwnRide'));
      return;
    }
    if (existingBooking) {
      router.push(`/${locale}/chat/${existingBooking.id}`);
      return;
    }
    if (!canBook) {
      toast.error(t('rideUnavailable'));
      return;
    }

    setRequesting(true);
    Analytics.trackEvent("booking_started", { ride_id: ride.id, price: ride.price });
    Analytics.trackEvent("first_booking_started", { ride_id: ride.id, price: ride.price });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("booking_intent"));
    }

    try {
      // Paid ride → redirect to Stripe Connect checkout
      if (ride.price > 0) {
        const res = await fetch("/api/stripe/connect/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId, locale }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.error === "Driver has not set up payments") {
            toast.error(t('driverPaymentsNotSetup') || "Il guidatore non ha ancora configurato i pagamenti.");
          } else {
            throw new Error(data.error || "Checkout failed");
          }
          setRequesting(false);
          return;
        }

        window.location.href = data.url;
        return;
      }

      // Free ride — ensure profile exists before booking
      await supabase.from("profiles").upsert({
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente",
        email: user.email || "",
        rating: 5.0,
        rides_count: 0,
        points: 0,
        level: "Viaggiatore",
      }, { onConflict: "id", ignoreDuplicates: true });

      // Free ride — existing flow
      const { count: confirmedCount, error: countError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("ride_id", rideId)
        .eq("status", "confirmed");

      if (countError) {
        throw new Error(`Seat count failed: ${countError.message}`);
      }

      const availableSeats = ride.seats - (confirmedCount || 0);
      if (availableSeats <= 0) {
        toast.error(t('noSeatsAvailable'));
        setRequesting(false);
        return;
      }

      // Check if this is the first booking for celebration
      const { count: priorBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("passenger_id", user.id);
      const isFirstBooking = (priorBookings || 0) === 0;

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error(t('alreadyBooked') || 'Hai già una prenotazione per questo viaggio');
          setRequesting(false);
          return;
        }
        throw new Error(`Booking insert failed: ${error.message}`);
      }
      if (!booking?.id) throw new Error('Booking insert returned no data');

      await supabase.from("messages").insert({
        booking_id: booking.id,
        sender_id: user.id,
        content: t('initialMessage', { from: ride.from_city, to: ride.to_city }),
        read: false,
      });

      try {
        await notifyBookingRequest(
          ride.driver_id,
          user.user_metadata?.name || user.email?.split("@")[0] || t('passenger'),
          rideId,
          booking.id
        );
      } catch (notifyErr) {
        console.error('[booking] notification error (non-fatal):', notifyErr);
      }

      Analytics.trackEvent("booking_completed", { ride_id: ride.id, booking_id: booking.id, price: ride.price });
      toast.success(t('bookingSuccess'));
      
      // Trigger PWA Prompt
      localStorage.setItem("pwa_has_booked", "true");
      window.dispatchEvent(new Event("trigger_pwa_prompt"));
      
      if (isFirstBooking) {
        setShowCelebration(true);
        // Delay redirect to let celebration show
        setTimeout(() => {
          router.push(`/${locale}/chat/${booking.id}`);
        }, 2500);
      } else {
        // Show post-action share modal for non-first bookings
        setPostActionBookingId(booking.id);
        setShowPostAction(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[booking] error:', err);
      toast.error(`${t('bookingError')}: ${message}`);
      setRequesting(false);
    }
  };

  const commonProps: RideDetailViewProps = {
    ride,
    user,
    reviews,
    similarRides,
    stops,
    existingBooking,
    requesting,
    showLoginModal,
    setShowLoginModal,
    handleShare,
    handleRequestRide,
    formatDate,
    formatReviewDate,
    rideStatus,
    canBook,
  };

  return (
    <ErrorBoundary>
      {deviceType === "desktop" ? <RideDetailDesktop {...commonProps} /> : <RideDetailMobile {...commonProps} />}
      {showCelebration && (
        <CelebrationModal
          type="first_booking"
          onClose={() => {
            setShowCelebration(false);
            router.push(`/${locale}/chat/${existingBooking?.id || ""}`);
          }}
        />
      )}
      {showPostAction && ride && (
        <PostActionModal
          type="booking_confirmed"
          open={showPostAction}
          onClose={() => {
            setShowPostAction(false);
            if (postActionBookingId) {
              router.push(`/${locale}/chat/${postActionBookingId}`);
            }
          }}
          onPrimaryAction={() => {
            if (postActionBookingId) {
              router.push(`/${locale}/chat/${postActionBookingId}`);
            }
          }}
          context={{
            rideId: ride.id,
            fromCity: ride.from_city,
            toCity: ride.to_city,
            date: ride.date,
            time: ride.time,
            price: ride.price,
            driverName: ride.profiles?.name,
          }}
        />
      )}
    </ErrorBoundary>
  );
}

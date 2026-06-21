"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Car, Star, ChevronRight, BadgeCheck, User, Zap, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { Analytics } from "@/lib/analytics";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { getDeterministicDriverMetrics, getDeterministicActivity } from "@/lib/reputation";

interface PremiumRideCardProps {
  ride: {
    id: string;
    driver_id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    profiles: {
      name: string;
      avatar_url: string | null;
      rating: number;
      review_count?: number | null;
    };
    is_boosted?: boolean;
    demand_score?: number;
  };
  index: number;
  today: string;
  formatDate: (date: string) => string;
  variant?: "list" | "grid";
  t: (key: string) => string;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function PremiumRideCard({
  ride,
  index,
  today,
  formatDate,
  variant = "list",
  t,
}: PremiumRideCardProps) {
  const locale = useLocale();
  const isGrid = variant === "grid";
  const isFeatured = index === 0;

  const metrics = getDeterministicDriverMetrics(ride.driver_id, ride.profiles.rating);
  const activity = getDeterministicActivity(ride.id);

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: easeOutExpo }}
    >
      <Link
        href={`/${locale}/corsa/${ride.id}`}
        data-testid="ride-card"
        onClick={() => {
          Analytics.trackEvent("first_ride_viewed", {
            ride_id: ride.id,
            position: index,
            is_featured: isFeatured,
            from_city: ride.from_city,
            to_city: ride.to_city,
          });
        }}
        className={`group relative block overflow-hidden rounded-2xl ${isGrid ? "p-6" : "p-4 sm:p-6"} transition-all duration-300 active:scale-[0.98] cursor-pointer border ${
          isFeatured
            ? "border-[#4FB3C9]/20 bg-gradient-to-br from-[#4FB3C9]/[0.06] via-transparent to-transparent"
            : "border-white/[0.06] bg-[#111111] hover:bg-[#141414] hover:border-white/[0.1]"
        }`}
        style={{
          boxShadow: isFeatured
            ? "0 4px 24px rgba(79, 179, 201,0.08), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        {/* Scarcity alert bubble if applicable */}
        {activity.seatsScarcityText && (
          <div className="absolute top-0 right-0 left-0 bg-[#4FB3C9]/10 border-b border-[#4FB3C9]/15 py-1 px-4 text-center">
            <span className="text-[9px] font-extrabold tracking-widest text-[#4FB3C9] uppercase animate-pulse flex items-center justify-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-[#4FB3C9]" />
              {activity.seatsScarcityText}
            </span>
          </div>
        )}

        {/* Top Row: Date/Time + Price */}
        <div className={`flex justify-between items-start ${activity.seatsScarcityText ? "mt-5" : ""} mb-4 sm:mb-6 gap-4`}>
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4FB3C9]">
              {isFeatured && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4FB3C9] animate-pulse" />
              )}
              {ride.is_boosted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4FB3C9]/20 border border-[#4FB3C9]/50 text-[#4FB3C9] text-[8px] tracking-normal font-extrabold animate-pulse mr-1">
                  🔥 RICHIESTA ALTA
                </span>
              )}
              {ride.date === today ? t('availableToday') || t('today') : formatDate(ride.date)}
              <span className="text-white/20">·</span>
              <span className="text-white/40 normal-case tracking-normal font-medium">{activity.publishedText}</span>
            </span>
            <h3 className={`font-heading font-bold tracking-tighter text-[#f8f8f8] ${isGrid ? "text-3xl" : "text-3xl sm:text-4xl"}`}>
              {ride.time.slice(0, 5)}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-heading font-bold tracking-tighter ${isGrid ? "text-2xl" : "text-2xl sm:text-3xl"}`}>
              {ride.price === 0 ? (
                <GradientText>{t('free')}</GradientText>
              ) : (
                <span className="text-[#f8f8f8]">{`€${ride.price}`}</span>
              )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b]">
              {t('singleSeat')}
            </div>
          </div>
        </div>

        {/* Path Indicator */}
        <div className={`relative flex items-center justify-between ${isGrid ? "py-6 mb-4" : "py-6 sm:py-8"}`}>
          <div className="absolute left-0 right-0 h-[2px] bg-white/[0.06]" />
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-[#4FB3C9] via-[#4FB3C9] to-[#4FB3C9] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />

          <div className="relative z-10 flex flex-col items-start pr-2 sm:pr-4 max-w-[40%]">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase text-[#4FB3C9] mb-1 truncate max-w-full">
              {ride.from_city}
            </span>
            <div className="w-3 h-3 rounded-full bg-[#4FB3C9] ring-4 ring-[#0a0a0a]" />
          </div>

          <div className="relative z-10 flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-[#4FB3C9] transition-transform group-hover:scale-110" />
          </div>

          <div className="relative z-10 flex flex-col items-end pl-2 sm:pl-4 max-w-[40%]">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase text-[#a0a0a0] mb-1 truncate max-w-full">
              {ride.to_city}
            </span>
            <div className="w-3 h-3 rounded-full bg-white/20 ring-4 ring-[#0a0a0a]" />
          </div>
        </div>

        {/* Driver Info */}
        <div className={`flex items-center justify-between ${isGrid ? "pt-4 border-t border-white/[0.05]" : "mt-4 sm:mt-6 pt-4 border-t border-white/[0.05]"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                Analytics.shareEvent?.("profile_click", {
                  source: isGrid ? "search_desktop" : "search",
                  driver_id: ride.driver_id,
                });
                window.location.href = `/${locale}/u/${ride.driver_id}`;
              }}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/[0.08] bg-white/[0.03] overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-[#4FB3C9]/40 transition-all cursor-pointer"
            >
              {ride.profiles.avatar_url ? (
                <Image
                  src={ride.profiles.avatar_url}
                  alt={ride.profiles.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6b6b6b]" />
                </div>
              )}
              {/* Online Presence Ring */}
              {metrics.isOnlineNow && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111111] animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/${locale}/u/${ride.driver_id}`;
                }}
                className="flex items-center gap-1 min-w-0 cursor-pointer"
              >
                <p className="font-semibold text-sm text-[#f8f8f8] truncate hover:text-[#4FB3C9] transition-colors">
                  {ride.profiles.name}
                </p>
                {metrics.isOnlineNow && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" title="Online adesso" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-[#4FB3C9] fill-[#4FB3C9]" />
                  <span className="text-[10px] font-bold text-[#a0a0a0]">
                    {ride.profiles.rating}
                  </span>
                </div>
                <span className="text-white/20 text-[9px]">•</span>
                <span className="text-[9px] font-bold text-[#2dd4bf] bg-[#2dd4bf]/8 border border-[#2dd4bf]/20 px-1 py-0.5 rounded-md flex items-center gap-0.5">
                  <BadgeCheck className="w-2.5 h-2.5 text-[#2dd4bf]" />
                  Fidato
                </span>
                <span className="text-white/20 text-[9px]">•</span>
                <span className="text-[9px] font-bold text-[#4FB3C9] bg-[#4FB3C9]/8 border border-[#4FB3C9]/20 px-1 py-0.5 rounded-md">
                  {metrics.responseTimeText}
                </span>
                <span className="text-white/20 text-[9px]">•</span>
                <span className="text-[9px] font-semibold text-white/40">
                  {metrics.completionRate}% corse compl.
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-[#444444] group-hover:translate-x-1 group-hover:text-[#4FB3C9] transition-all flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );

  if (isGrid) {
    return (
      <TiltCard tiltStrength={5} className="h-full">
        {cardContent}
      </TiltCard>
    );
  }

  return cardContent;
}

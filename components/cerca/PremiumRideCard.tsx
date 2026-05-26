"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Car, Star, ChevronRight, BadgeCheck, User } from "lucide-react";
import { useLocale } from "next-intl";
import { Analytics } from "@/lib/analytics";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { GradientText } from "@/components/ui/premium/gradient-text";

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

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: easeOutExpo }}
    >
      <Link
        href={`/${locale}/corsa/${ride.id}`}
        className={`group relative block overflow-hidden rounded-2xl ${isGrid ? "p-6" : "p-4 sm:p-6"} transition-all duration-300 active:scale-[0.98] cursor-pointer border ${
          isFeatured
            ? "border-[#e63946]/20 bg-gradient-to-br from-[#e63946]/[0.06] via-transparent to-transparent"
            : "border-white/[0.06] bg-[#111111] hover:bg-[#141414] hover:border-white/[0.1]"
        }`}
        style={{
          boxShadow: isFeatured
            ? "0 4px 24px rgba(230,57,70,0.08), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        {/* Top Row: Date/Time + Price */}
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-4">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e63946]">
              {isFeatured && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e63946] animate-pulse" />
              )}
              {ride.date === today ? t('availableToday') || t('today') : formatDate(ride.date)}
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
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-[#e63946] via-[#f4a261] to-[#e63946] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />

          <div className="relative z-10 flex flex-col items-start pr-2 sm:pr-4 max-w-[40%]">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase text-[#e63946] mb-1 truncate max-w-full">
              {ride.from_city}
            </span>
            <div className="w-3 h-3 rounded-full bg-[#e63946] ring-4 ring-[#0a0a0a]" />
          </div>

          <div className="relative z-10 flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-[#e63946] transition-transform group-hover:scale-110" />
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
            <Link
              href={`/${locale}/u/${ride.driver_id}`}
              onClick={(e) => {
                e.stopPropagation();
                Analytics.shareEvent?.("profile_click", {
                  source: isGrid ? "search_desktop" : "search",
                  driver_id: ride.driver_id,
                });
              }}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/[0.08] bg-white/[0.03] overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-[#e63946]/40 transition-all"
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
              {/* Verified indicator */}
              {((ride.profiles.rating || 0) >= 4.5 || (ride.profiles.review_count || 0) > 5) && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2dd4bf] border-2 border-[#0a0a0a] flex items-center justify-center">
                  <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </Link>

            <div className="min-w-0">
              <Link
                href={`/${locale}/u/${ride.driver_id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-semibold text-sm text-[#f8f8f8] truncate hover:text-[#e63946] transition-colors">
                  {ride.profiles.name}
                </p>
              </Link>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#f4a261] fill-[#f4a261]" />
                <span className="text-[11px] font-semibold text-[#a0a0a0]">
                  {ride.profiles.rating}
                </span>
                <span className="text-[10px] text-[#444444]">
                  ({ride.profiles.review_count || 0})
                </span>
                {((ride.profiles.rating || 0) >= 4.5 || (ride.profiles.review_count || 0) > 5) && (
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-[#2dd4bf] bg-[#2dd4bf]/10 px-1.5 py-0.5 rounded-full">
                    Verif.
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-[#444444] group-hover:translate-x-1 group-hover:text-[#e63946] transition-all flex-shrink-0" />
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

"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Share2, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { ReportUser } from "@/components/ReportUser";
import { Analytics } from "@/lib/analytics";
import { Haptic } from "@/lib/haptic";
import { getDeterministicDriverMetrics } from "@/lib/reputation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RideCard } from "@/components/ui/ride-card";

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

interface PublicProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  review_count: number;
  rides_count: number;
  completed_rides_count: number;
  created_at: string;
  accountAge: string;
  phone_verified: boolean;
  email_verified: boolean;
  id_verified: boolean;
  driver_verified: boolean;
  car_model: string | null;
  car_color: string | null;
  car_year: number | null;
  level: string;
  points: number;
  trustScore: number;
  trustLevel: { label: string; color: string; emoji: string };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { name: string; avatar_url: string | null } | null;
  ride: { from_city: string; to_city: string; date: string } | null;
}

interface ActiveRide {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  status: string;
}

interface PublicProfileViewProps {
  locale: string;
  profile: PublicProfile;
  reviews: Review[];
  activeRides: ActiveRide[];
}

export function PublicProfileView({
  locale,
  profile,
  reviews,
  activeRides,
}: PublicProfileViewProps) {
  const t = useTranslations("publicProfile");
  const [copied, setCopied] = useState(false);
  const metrics = getDeterministicDriverMetrics(profile.id, profile.rating);
  const speaksSardo = metrics.languages.some((l) => l.toLowerCase().includes("sardo"));
  const verified =
    profile.driver_verified ||
    profile.rating >= 4.5 ||
    profile.review_count > 5;
  const memberYear = new Date(profile.created_at).getFullYear();

  useEffect(() => {
    Analytics.publicProfileView?.(profile.id);
  }, [profile.id]);

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : "https://andamus.it"}/${locale}/u/${profile.id}`;

  const handleShare = useCallback(async () => {
    Haptic.light();
    Analytics.shareEvent?.("profile_share", { user_id: profile.id });

    if (navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle", { name: profile.name }),
          text: t("shareText", {
            name: profile.name,
            rating: profile.rating.toFixed(1),
            rides: profile.completed_rides_count,
          }),
          url: profileUrl,
        });
        return;
      } catch {
        // cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }, [profileUrl, profile, t]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={`/${locale}/cerca`}
            className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
            <span className="hidden text-sm font-medium sm:inline">{t("backToSearch")}</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Share2 className="size-4" strokeWidth={1.5} />
              {copied ? t("copied") : t("share")}
            </button>
            <ReportUser reportedId={profile.id} reportedName={profile.name} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <motion.section {...fadeUp} className="mb-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Avatar
              src={profile.avatar_url}
              name={profile.name}
              size="lg"
              className="size-20 text-xl sm:size-24"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-fg sm:text-3xl">
                  {profile.name}
                </h1>
                {verified && <Badge verified>verificato</Badge>}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-sm sm:justify-start">
                <span className="tabular-nums text-fg">{profile.rating.toFixed(1)}</span>
                <span className="text-muted">
                  · {profile.review_count} {t("reviews")}
                </span>
              </div>

              {speaksSardo && (
                <span className="mt-3 inline-flex rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">
                  parla sardo
                </span>
              )}

              <div className="mt-4 space-y-1 font-mono text-xs text-dim">
                <p>
                  {profile.rides_count} {t("activeRides").toLowerCase()}
                </p>
                <p>
                  {t("memberSince", { age: profile.accountAge })} · membro dal {memberYear}
                </p>
                <p>{metrics.responseTimeText}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {profile.car_model && (
          <motion.section
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="mb-8"
          >
            <p className="text-eyebrow mb-3">{t("vehicle")}</p>
            <p className="text-sm text-fg">
              {[profile.car_model, profile.car_color, profile.car_year]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Separator className="mt-6" />
          </motion.section>
        )}

        <motion.section
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-eyebrow mb-4">{t("activeRides")}</p>

          {activeRides.length === 0 ? (
            <p className="font-mono text-sm text-muted">{t("noPublicActivity")}</p>
          ) : (
            <div className="space-y-3">
              {activeRides.map((ride, index) => (
                <RideCard
                  key={ride.id}
                  href={`/${locale}/corsa/${ride.id}`}
                  index={index}
                  departureTime={ride.time.slice(0, 5)}
                  arrivalTime=""
                  price={ride.price === 0 ? t("free") : `€${ride.price}`}
                  origin={{ name: ride.from_city, time: ride.time.slice(0, 5) }}
                  destination={{ name: ride.to_city }}
                  driverName={profile.name}
                  driverAvatar={profile.avatar_url}
                  verified={verified}
                  rating={profile.rating.toFixed(1)}
                  seatsLabel={`${ride.seats} posti`}
                />
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="mb-8"
        >
          <p className="text-eyebrow mb-4">{t("reviews")}</p>

          {reviews.length === 0 ? (
            <p className="font-mono text-sm text-muted">{t("noPublicActivity")}</p>
          ) : (
            <div className="divide-y divide-line">
              {reviews.map((review) => (
                <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <Avatar
                    src={review.reviewer?.avatar_url}
                    name={review.reviewer?.name || "?"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium text-fg">
                        {review.reviewer?.name || "—"}
                      </p>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-fg">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    {review.ride && (
                      <p className="mt-0.5 font-mono text-[11px] text-dim">
                        {review.ride.from_city} → {review.ride.to_city}
                      </p>
                    )}
                    {review.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 font-mono text-[11px] text-dim">
                      {new Date(review.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Shield,
  ShieldCheck,
  Phone,
  Mail,
  Car,
  Calendar,
  MapPin,
  Clock,
  Share2,
  ChevronRight,
  Award,
  Zap,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Analytics } from "@/lib/analytics";
import { Haptic } from "@/lib/haptic";

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

export function PublicProfileView({ locale, profile, reviews, activeRides }: PublicProfileViewProps) {
  const t = useTranslations("publicProfile");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
          text: t("shareText", { name: profile.name, rating: profile.rating.toFixed(1), rides: profile.completed_rides_count }),
          url: profileUrl,
        });
        return;
      } catch {
        // User cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback handled silently
    }
  }, [profileUrl, profile, t]);

  const verificationBadges = [
    { key: "email", label: t("verifiedEmail"), icon: Mail, active: profile.email_verified },
    { key: "phone", label: t("verifiedPhone"), icon: Phone, active: profile.phone_verified },
    { key: "id", label: t("verifiedId"), icon: ShieldCheck, active: profile.id_verified },
    { key: "driver", label: t("verifiedDriver"), icon: Car, active: profile.driver_verified },
  ];

  const activeCount = verificationBadges.filter((b) => b.active).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/${locale}/cerca`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{t("backToSearch")}</span>
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/70"
          >
            <Share2 className="w-4 h-4" />
            {copied ? t("copied") : t("share")}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Profile Card */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-2 ring-white/10 bg-surface-container-high">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#e63946]/10">
                    <span className="text-4xl font-bold text-[#e63946]">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Trust badge overlay */}
              <div
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 border-[#0a0a0a]"
                style={{ background: "rgba(10,10,10,0.9)" }}
                title={profile.trustLevel.label}
              >
                {profile.trustLevel.emoji}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {profile.name}
              </h1>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">{profile.rating.toFixed(1)}</span>
                </div>
                <span className="text-white/30">·</span>
                <span className="text-white/50 text-sm">
                  {profile.review_count} {t("reviews")}
                </span>
                <span className="text-white/30">·</span>
                <span className="text-white/50 text-sm">
                  {profile.completed_rides_count} {t("ridesCompleted")}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${profile.trustLevel.color.replace("text-", "border-").split(" ")[1]} ${profile.trustLevel.color}`}
                  style={{ background: `${profile.trustLevel.color.includes("emerald") ? "rgba(16,185,129,0.1)" : profile.trustLevel.color.includes("blue") ? "rgba(59,130,246,0.1)" : profile.trustLevel.color.includes("yellow") ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.05)"}` }}
                >
                  <Shield className="w-3 h-3" />
                  {profile.trustLevel.label}
                </span>
                <span className="text-white/40 text-xs">{profile.trustScore}/100</span>
              </div>

              <p className="text-white/40 text-sm mt-2">
                {t("memberSince", { age: profile.accountAge })}
              </p>
            </div>
          </div>
        </section>

        {/* Verification Badges */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">
              {t("verification")}
            </h2>
            <span className="text-xs text-white/30">
              {activeCount}/4 {t("verified")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {verificationBadges.map((badge) => (
              <div
                key={badge.key}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                  badge.active
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-white/[0.02] border-white/5 opacity-40"
                }`}
              >
                <badge.icon
                  className={`w-4 h-4 ${badge.active ? "text-emerald-400" : "text-white/30"}`}
                />
                <span className={`text-xs font-medium ${badge.active ? "text-emerald-300" : "text-white/30"}`}>
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Award className="w-5 h-5 text-[#e63946]" />}
              value={profile.level}
              label={t("level")}
            />
            <StatCard
              icon={<Star className="w-5 h-5 text-yellow-400" />}
              value={profile.rating.toFixed(1)}
              label={t("rating")}
            />
            <StatCard
              icon={<Car className="w-5 h-5 text-blue-400" />}
              value={String(profile.completed_rides_count)}
              label={t("ridesCompleted")}
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-orange-400" />}
              value={String(profile.points)}
              label={t("points")}
            />
          </div>
        </section>

        {/* Car Info */}
        {profile.car_model && (
          <section className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">
              {t("vehicle")}
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <Car className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <p className="text-white font-semibold">{profile.car_model}</p>
                <p className="text-white/40 text-sm">
                  {profile.car_color} {profile.car_year ? `· ${profile.car_year}` : ""}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Active Rides */}
        {activeRides.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">
              {t("activeRides")}
            </h2>
            <div className="flex flex-col gap-2">
              {activeRides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/${locale}/corsa/${ride.id}`}
                  onClick={() => Analytics.shareEvent?.("ride_card_click", { ride_id: ride.id, source: "profile" })}
                >
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e63946]/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#e63946]" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {ride.from_city} → {ride.to_city}
                        </p>
                        <p className="text-white/40 text-xs">
                          {ride.date} · {ride.time.slice(0, 5)} · {ride.price === 0 ? t("free") : `€${ride.price}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">
                {t("reviews")}
              </h2>
              <span className="text-xs text-white/30">
                {reviews.length} {t("total")}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  expanded={expandedReview === review.id}
                  onToggle={() => {
                    Haptic.light();
                    if (expandedReview !== review.id) {
                      Analytics.shareEvent?.("review_expand", { review_id: review.id });
                    }
                    setExpandedReview(expandedReview === review.id ? null : review.id);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty states */}
        {reviews.length === 0 && activeRides.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40">{t("noPublicActivity")}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-lg font-extrabold text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

function ReviewCard({
  review,
  expanded,
  onToggle,
}: {
  review: Review;
  expanded: boolean;
  onToggle: () => void;
}) {
  const comment = review.comment || "";
  const hasLongComment = comment.length > 120;
  const displayComment = expanded || !hasLongComment ? comment : comment.slice(0, 120) + "…";

  const sentiment = review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative";
  const sentimentBorder = {
    positive: "border-emerald-500/10",
    neutral: "border-yellow-500/10",
    negative: "border-red-500/10",
  }[sentiment];

  return (
    <motion.div
      layout
      className={`p-4 rounded-2xl bg-white/[0.03] border ${sentimentBorder} hover:bg-white/[0.04] transition-colors`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
            {review.reviewer?.avatar_url ? (
              <Image
                src={review.reviewer.avatar_url}
                alt={review.reviewer.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white/40">
                {review.reviewer?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{review.reviewer?.name || "Anonymous"}</p>
            {review.ride && (
              <p className="text-[10px] text-white/30">
                {review.ride.from_city} → {review.ride.to_city}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"}`}
            />
          ))}
        </div>
      </div>

      {displayComment && (
        <p className="text-sm text-white/70 leading-relaxed mt-2">{displayComment}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
          <span className="text-[10px] text-white/30">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {hasLongComment && (
          <button
            onClick={onToggle}
            className="text-[10px] font-semibold text-[#e63946] hover:text-[#ffb3b1] transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

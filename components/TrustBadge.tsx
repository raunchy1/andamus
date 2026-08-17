"use client";

import { Shield, BadgeCheck, Star, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { computeTrustScore, getTrustLevel } from "@/lib/reputation";
import type { ReputationProfile } from "@/lib/reputation";

interface TrustBadgeProps {
  profile: ReputationProfile;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showLabel?: boolean;
}

const SIZE_MAP = {
  sm: { container: "h-5 px-1.5 gap-0.5 text-[10px]", icon: "w-3 h-3" },
  md: { container: "h-6 px-2 gap-1 text-[11px]", icon: "w-3.5 h-3.5" },
  lg: { container: "h-7 px-2.5 gap-1 text-xs", icon: "w-4 h-4" },
};

export function TrustBadge({ profile, size = "md", showScore = false, showLabel = true }: TrustBadgeProps) {
  const t = useTranslations("reputation");
  const score = computeTrustScore(profile);
  const level = getTrustLevel(score);
  const levelText = t(`trust.${level.label}`);
  const s = SIZE_MAP[size];

  let Icon = Shield;
  let colorClass = "bg-surface text-faint border-line";

  if (score >= 80) {
    Icon = Award;
    colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  } else if (score >= 60) {
    Icon = BadgeCheck;
    colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
  } else if (score >= 40) {
    Icon = Star;
    colorClass = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border ${colorClass} ${s.container} font-medium`}
      title={`${t("trustScoreLabel")}: ${score}/100 — ${levelText}`}
    >
      <Icon className={s.icon} />
      {showLabel && <span>{levelText}</span>}
      {showScore && <span className="opacity-70">{score}</span>}
    </div>
  );
}

interface DriverMetaProps {
  profile: ReputationProfile;
  ridesDriven?: number;
  className?: string;
}

export function DriverMeta({ profile, ridesDriven, className = "" }: DriverMetaProps) {
  const t = useTranslations("reputation");
  const score = computeTrustScore(profile);
  const level = getTrustLevel(score);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <TrustBadge profile={profile} size="sm" />
      {profile.review_count ? (
        <span className="text-[10px] text-faint">
          {t("reviewCount", { count: profile.review_count })}
        </span>
      ) : null}
      {ridesDriven ? (
        <span className="text-[10px] text-faint">
          {t("rideCount", { count: ridesDriven })}
        </span>
      ) : null}
      {level.emoji ? (
        <span className="text-[10px]" title={t(`trust.${level.label}`)}>
          {level.emoji}
        </span>
      ) : null}
    </div>
  );
}

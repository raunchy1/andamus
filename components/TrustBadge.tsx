"use client";

import { Shield, BadgeCheck, Star, Award } from "lucide-react";
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
  const score = computeTrustScore(profile);
  const level = getTrustLevel(score);
  const s = SIZE_MAP[size];

  let Icon = Shield;
  let colorClass = "bg-white/5 text-white/40 border-white/10";

  if (score >= 80) {
    Icon = Award;
    colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (score >= 60) {
    Icon = BadgeCheck;
    colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  } else if (score >= 40) {
    Icon = Star;
    colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border ${colorClass} ${s.container} font-medium`}
      title={`Affidabilità: ${score}/100 — ${level.label}`}
    >
      <Icon className={s.icon} />
      {showLabel && <span>{level.label}</span>}
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
  const score = computeTrustScore(profile);
  const level = getTrustLevel(score);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <TrustBadge profile={profile} size="sm" />
      {profile.review_count ? (
        <span className="text-[10px] text-white/40">
          {profile.review_count} recension{profile.review_count === 1 ? "e" : "i"}
        </span>
      ) : null}
      {ridesDriven ? (
        <span className="text-[10px] text-white/40">
          {ridesDriven} cors{ridesDriven === 1 ? "a" : "e"}
        </span>
      ) : null}
      {level.emoji ? (
        <span className="text-[10px]" title={level.label}>
          {level.emoji}
        </span>
      ) : null}
    </div>
  );
}

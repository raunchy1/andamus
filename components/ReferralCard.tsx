"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Share2, Copy, Check, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Analytics } from "@/lib/analytics";

interface ReferralCardProps {
  locale: string;
  profile: {
    referral_code?: string | null;
    referrals_count?: number | null;
    referral_points_earned?: number | null;
  } | null;
}

export function ReferralCard({ locale, profile }: ReferralCardProps) {
  const t = useTranslations("referrals");
  const [copied, setCopied] = useState(false);

  const referralLink = profile?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : "https://andamus.it"}/join?ref=${profile.referral_code}`
    : "";

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      Analytics.inviteSent?.("copy");
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyError"));
    }
  }, [referralLink, t]);

  const count = profile?.referrals_count || 0;
  const points = profile?.referral_points_earned || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#e63946]/10 via-[#e63946]/5 to-transparent border border-[#e63946]/20 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e63946]/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#e63946]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t("title")}</h3>
            <p className="text-xs text-white/50">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5">
          <Users className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs font-bold text-white/60">{count}</span>
        </div>
      </div>

      {referralLink ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-xs break-all">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e63946] hover:bg-[#c92a37] text-white transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-white/50">
                {points} {t("pointsEarned")}
              </span>
            </div>
            <Link
              href={`/${locale}/invita`}
              onClick={() => Analytics.referralClicked?.("profile_card")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e63946] hover:text-[#ffb3b1] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t("share")}
            </Link>
          </div>
        </>
      ) : (
        <Link
          href={`/${locale}/invita`}
          onClick={() => Analytics.referralClicked?.("profile_card")}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#e63946]/10 text-[#e63946] font-semibold text-sm hover:bg-[#e63946]/20 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {t("inviteFriends")}
        </Link>
      )}
    </motion.div>
  );
}

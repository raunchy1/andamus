"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Copy, Check, ChevronRight } from "lucide-react";
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

/**
 * The one green-tinted block in the settings rail. It earns the emphasis
 * because it is the only card asking the user to do something optional.
 */
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
    <section className="rounded-2xl border border-line bg-green-tint p-5">
      <h2 className="font-heading text-base text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{t("subtitle")}</p>

      {referralLink ? (
        <>
          <div className="mt-4 flex items-stretch gap-2">
            <p className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface px-3 py-3 font-mono text-xs text-ink">
              {referralLink}
            </p>
            <button
              onClick={handleCopy}
              aria-label={t("copyLink")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:bg-sand"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green" strokeWidth={1.5} aria-hidden />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-3">
            <p className="text-xs text-muted tabular-nums">
              {t("summary", { count, points })}
            </p>
            <Link
              href={`/${locale}/invita`}
              onClick={() => Analytics.referralClicked?.("profile_card")}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-green hover:underline"
            >
              {t("share")}
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </>
      ) : (
        <Link
          href={`/${locale}/invita`}
          onClick={() => Analytics.referralClicked?.("profile_card")}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("inviteFriends")}
        </Link>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PremiumCancelPage() {
  const t = useTranslations("premium");

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-surface flex items-center justify-center">
          <X className="h-10 w-10 text-fg" />
        </div>
        <h1 className="text-3xl font-bold text-ink mb-4">{t("cancelledTitle")}</h1>
        <p className="text-muted mb-8">
          {t("cancelledDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/premium"
            className="inline-flex items-center justify-center rounded-xl bg-[#2D6A4F] px-6 py-3 text-white font-medium hover:bg-[#1E4A36] transition-colors"
          >
            {t("backToPlans")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-line px-6 py-3 text-ink font-medium hover:bg-sand-deep transition-colors"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

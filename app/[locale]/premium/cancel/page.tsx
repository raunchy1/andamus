"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PremiumCancelPage() {
  const t = useTranslations("premium");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
          <X className="h-10 w-10 text-white/70" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t("cancelledTitle")}</h1>
        <p className="text-white/60 mb-8">
          {t("cancelledDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/premium"
            className="inline-flex items-center justify-center rounded-xl bg-[#e63946] px-6 py-3 text-white font-medium hover:bg-[#c92a37] transition-colors"
          >
            {t("backToPlans")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-white font-medium hover:bg-white/5 transition-colors"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

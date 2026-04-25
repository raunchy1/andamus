"use client";

import { useEffect } from "react";
import { BarChart3, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function StatisticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("error");

  useEffect(() => {
    console.error("Statistics page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-[#e63946]/10 flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-[#e63946]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          {t("statsLoadError")}
        </h1>
        
        <p className="text-white/60 mb-8">
          {t("statsLoadFailed")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            {t("retry")}
          </button>
          
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <Home className="h-5 w-5" />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

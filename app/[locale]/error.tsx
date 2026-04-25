"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("error");

  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          {t("somethingWentWrong")}
        </h1>
        
        <p className="text-white/60 mb-2">
          {t("errorOccurred")}
        </p>
        
        {error.digest && (
          <p className="text-white/40 text-sm mb-8 font-mono">
            Codice errore: {error.digest}
          </p>
        )}

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
    </div>
  );
}

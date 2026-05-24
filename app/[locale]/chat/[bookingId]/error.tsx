"use client";

import { useEffect } from "react";
import { MessageCircleX, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("error");

  useEffect(() => {
    console.error("Chat page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <MessageCircleX className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          {t("somethingWentWrong")}
        </h1>

        <p className="text-muted-foreground mb-2">{t("errorOccurred")}</p>

        {error.digest && (
          <p className="text-muted-foreground/60 text-sm mb-8 font-mono">
            Codice errore: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            {t("retry")}
          </button>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            <Home className="h-5 w-5" />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

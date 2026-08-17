import Link from "next/link";
import { cookies } from "next/headers";
import { WifiOff, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RetryButton } from "@/components/RetryButton";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

export const metadata = {
  title: "Offline | Andamus",
};

export default async function OfflinePage() {
  const raw = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;
  const t = await getTranslations({ locale, namespace: "offline" });

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-surface border border-line flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-muted" aria-hidden />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-fg mb-3">{t("youAreOffline")}</h1>

        <p className="text-muted mb-8 leading-relaxed">{t("checkConnection")}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <RetryButton label={t("retry")} />

          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 bg-surface text-fg rounded-xl font-medium hover:bg-sand-deep transition-colors border border-line"
          >
            <Home className="h-5 w-5" aria-hidden />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

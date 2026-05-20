import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("authErrorTitle"),
  };
}

export default async function AuthCodeErrorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          {t("authErrorTitle")}
        </h1>

        <p className="text-white/60">
          {t("authErrorDescription")}
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
          >
            {t("backToHome")}
          </Link>

          <Link
            href={`/${locale}/profilo`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}

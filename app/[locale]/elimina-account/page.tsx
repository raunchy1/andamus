import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Trash2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "deleteAccount" });
  return {
    title: t("title"),
    description: t("intro"),
  };
}

/**
 * Publicly reachable account-deletion page.
 * Google Play requires a deletion path that works without installing the app,
 * so this route is intentionally accessible without authentication.
 */
export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "deleteAccount" });

  const deletedItems = [t("what1"), t("what2"), t("what3"), t("what4")];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backHome")}
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg">{t("title")}</h1>
      <p className="mt-3 leading-relaxed text-muted">{t("intro")}</p>

      <section className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <Trash2 className="h-5 w-5 text-destructive" />
          {t("whatTitle")}
        </h2>
        <ul className="mt-4 space-y-2">
          {deletedItems.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-muted">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface-2 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <ShieldCheck className="h-5 w-5 text-accent" />
          {t("retentionTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("retention")}</p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold text-fg">{t("inAppTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("inAppDesc")}</p>
          <Link
            href={`/${locale}/profilo`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            {t("inAppCta")}
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold text-fg">{t("emailTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("emailDesc")}</p>
          <a
            href="mailto:privacy@andamus.it?subject=Account%20deletion%20request"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            <Mail className="h-4 w-4" />
            {t("emailCta")}
          </a>
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Car, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

const footerLinks = [
  { href: "/cerca", labelKey: "searchRides" },
  { href: "/offri", labelKey: "offerRide" },
  { href: "/profilo", labelKey: "yourProfile" },
];

const legalLinks = [
  { href: "/termini-e-condizioni", labelKey: "termsAndConditions" },
  { href: "/privacy-policy", labelKey: "privacyPolicy" },
  { href: "/elimina-account", labelKey: "deleteAccount" },
];

const APP_VERSION = "v1.0";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const handleShare = async () => {
    const shareText = t("shareText");

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("shareTitle"),
          text: shareText,
          url: process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it",
        });
        toast.success(t("shareSuccess"));
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast.success(t("copySuccess"));
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <footer className="border-t border-line bg-bg text-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              <Car className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-lg font-bold">Andamus</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              {t("tagline")}
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              {t("shareAndamus")}
            </button>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg">
              {t("navigation")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="text-sm text-muted transition-colors hover:text-ink hover:translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="text-sm text-muted transition-colors hover:text-ink hover:translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg">
              {t("info")}
            </h3>
            <p className="text-sm text-muted">
              {t("madeWithLove")}
            </p>
            <p className="mt-2 text-xs text-faint">
              {t("version")} {APP_VERSION}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-line pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © {currentYear} Andamus. {t("allRightsReserved")}.
          </p>
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/termini-e-condizioni`} className="text-xs text-faint hover:text-fg transition-colors">
              {t("terms")}
            </Link>
            <Link href={`/${locale}/privacy-policy`} className="text-xs text-faint hover:text-fg transition-colors">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { Car, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const footerLinks = [
  { href: "/cerca", labelKey: "searchRides" },
  { href: "/offri", labelKey: "offerRide" },
  { href: "/profilo", labelKey: "yourProfile" },
];

const legalLinks = [
  { href: "/termini-e-condizioni", labelKey: "termsAndConditions" },
  { href: "/privacy-policy", labelKey: "privacyPolicy" },
];

const APP_VERSION = "v1.0";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const handleShare = async () => {
    const shareText = t("shareText");

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("shareTitle"),
          text: shareText,
          url: "https://andamus.it",
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
    <footer className="border-t border-white/5 bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <Car className="h-6 w-6 text-[#e63946] transition-transform group-hover:scale-110" />
              <span className="text-lg font-bold">Andamus</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("tagline")}
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e63946]/10 text-[#e63946] text-sm font-medium hover:bg-[#e63946]/20 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              {t("shareAndamus")}
            </button>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("navigation")}
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white hover:translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white hover:translate-x-1 inline-block"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("info")}
            </h3>
            <p className="text-sm text-gray-400">
              {t("madeWithLove")}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t("version")} {APP_VERSION}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Andamus. {t("allRightsReserved")}.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/termini-e-condizioni" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t("terms")}
            </Link>
            <Link href="/privacy-policy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

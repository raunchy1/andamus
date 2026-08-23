"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageSelectorProps {
  isHome?: boolean;
}

const LANGUAGE_CODES = ["it", "en", "de"] as const;
type LanguageCode = (typeof LANGUAGE_CODES)[number];

function isLanguageCode(value: string): value is LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function LanguageSelector({ isHome: _isHome = false }: LanguageSelectorProps) {
  const locale = useLocale();
  const t = useTranslations("language");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleLanguageChange = (newLocale: string) => {
    localStorage.setItem("preferred-language", newLocale);
    setIsOpen(false);
  };

  const pathnameWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const queryString = searchParams.toString();
  const getHref = (newLocale: string) => {
    const base = `/${newLocale}${pathnameWithoutLocale}`;
    return queryString ? `${base}?${queryString}` : base;
  };

  const currentCode: LanguageCode = isLanguageCode(locale) ? locale : "it";
  const currentLabel = t(currentCode);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm text-fg"
        aria-label={t("select")}
      >
        {/* useLocale() resolves on the server too, so render the *current*
            language here. Hardcoding "it" made the English and German pages
            ship markup labelling the switcher "Italiano" until hydration. */}
        <span>{currentLabel}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm text-fg transition-colors hover:bg-sand-deep hover:text-ink"
        aria-label={t("select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{currentLabel}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-line bg-elevated shadow-lg"
              role="listbox"
              aria-label={t("select")}
            >
              <div className="py-2">
                {LANGUAGE_CODES.map((code) => (
                  <Link
                    key={code}
                    href={getHref(code)}
                    onClick={() => handleLanguageChange(code)}
                    className="flex min-h-11 w-full items-center justify-between px-4 py-2.5 text-sm text-fg transition-colors hover:bg-sand-deep"
                    role="option"
                    aria-selected={locale === code}
                  >
                    <span>{t(code)}</span>
                    {locale === code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

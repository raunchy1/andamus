"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageSelectorProps {
  isHome?: boolean;
}

const languages = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

export function LanguageSelector({ isHome = false }: LanguageSelectorProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleLanguageChange = (newLocale: string) => {
    // Store preference in localStorage
    localStorage.setItem("preferred-language", newLocale);
    setIsOpen(false);
  };

  // Get the path without locale prefix
  const pathnameWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Preserve query parameters when switching language
  const queryString = searchParams.toString();
  const getHref = (newLocale: string) => {
    const base = `/${newLocale}${pathnameWithoutLocale}`;
    return queryString ? `${base}?${queryString}` : base;
  };

  const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

  if (!mounted) {
    return (
      <button
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isHome
            ? "text-white/70"
            : "text-gray-500"
        }`}
      >
        <span className="text-lg">🇮🇹</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isHome
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
        title="Cambia lingua / Change language / Sprache ändern"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
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
              className={`absolute right-0 z-50 mt-2 w-48 rounded-xl border shadow-lg ${
                isHome
                  ? "border-white/10 bg-[#111111]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="py-2">
                {languages.map((language) => (
                  <Link
                    key={language.code}
                    href={getHref(language.code)}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isHome
                        ? "text-white hover:bg-white/10"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                    </div>
                    {locale === language.code && (
                      <Check className="h-4 w-4 text-[#e63946]" />
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

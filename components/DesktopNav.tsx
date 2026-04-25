"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Car } from "lucide-react";

const navItems = [
  { href: "/", labelKey: "home" },
  { href: "/cerca", labelKey: "search" },
  { href: "/offri", labelKey: "offer" },
  { href: "/profilo", labelKey: "profile" },
];

export function DesktopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-nav bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Car className="w-8 h-8 text-[#ffb3b1]" />
          <span className="text-2xl font-extrabold tracking-tighter text-white uppercase">Andamus</span>
        </Link>

        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive = item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={fullHref}
                className={`text-sm font-semibold uppercase tracking-widest transition-colors ${
                  isActive ? "text-[#ffb3b1]" : "text-white/50 hover:text-white"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

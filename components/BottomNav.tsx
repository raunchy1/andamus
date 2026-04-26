"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Compass, Route, Car, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Compass, labelKey: "explore" },
  { href: "/cerca", icon: Route, labelKey: "routes" },
  { href: "/offri", icon: Car, labelKey: "trips" },
  { href: "/profilo", icon: User, labelKey: "profile" },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();

  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-nav bg-[#0a0a0a] border-t border-white/5 h-[70px] flex items-center justify-around px-4 md:hidden safe-area-bottom">
      {navItems.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link key={item.href} href={fullHref}>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive
                  ? "bg-[#e63946] text-white"
                  : "text-[#9ca3af]"
              }`}
            >
              <Icon size={20} />
              {isActive && (
                <span className="text-sm font-inter font-semibold">
                  {t(item.labelKey)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

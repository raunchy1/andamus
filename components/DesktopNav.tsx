"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/cerca", label: "Cerca" },
  { href: "/offri", label: "Offri" },
  { href: "/profilo", label: "Profilo" },
];

export function DesktopNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ffb3b1] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            directions_car
          </span>
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
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const navItems = [
  { href: "/", icon: "explore", label: "Explore" },
  { href: "/cerca", icon: "route", label: "Routes" },
  { href: "/offri", icon: "directions_car", label: "Trips" },
  { href: "/profilo", icon: "person", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-8 pt-4 bg-[#131313] md:hidden safe-area-pb">
      {navItems.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={`flex flex-col items-center justify-center group ${
              isActive
                ? "text-[#ffb3b1] font-bold"
                : "text-[#353534] hover:text-[#e5e2e1]"
            } transition-colors active:scale-90 duration-300`}
          >
            <span
              className="material-symbols-outlined text-2xl group-active:scale-90 transition-all duration-300"
              style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-bold uppercase tracking-[0.05em] text-[10px] mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

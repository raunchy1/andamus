"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Compass, Route, Car, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Compass, label: "Explore" },
  { href: "/cerca", icon: Route, label: "Routes" },
  { href: "/offri", icon: Car, label: "Trips" },
  { href: "/profilo", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-4 bg-[#0f0f0f] border-t border-[#2a2a2a] md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.href);
        const Icon = item.icon;

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
            <Icon
              className={`w-6 h-6 group-active:scale-90 transition-all duration-300 ${
                isActive ? "fill-current" : ""
              }`}
            />
            <span className="font-bold uppercase tracking-[0.05em] text-[10px] mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

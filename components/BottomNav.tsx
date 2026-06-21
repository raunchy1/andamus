"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Compass, Route, Car, User } from "lucide-react";

import { cn } from "@/lib/utils";

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

  const activeIndex = navItems.findIndex((item) =>
    item.href === "/"
      ? currentPath === "/"
      : currentPath.startsWith(item.href)
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-nav md:hidden border-t border-line bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item, index) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={fullHref}
              className="relative flex h-full w-[25%] flex-col items-center justify-center select-none"
            >
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent" : "text-dim"
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[10px] leading-none transition-colors",
                    isActive ? "text-fg" : "text-dim"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
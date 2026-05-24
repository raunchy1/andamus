"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Compass, Route, Car, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Compass, labelKey: "explore" },
  { href: "/cerca", icon: Route, labelKey: "routes" },
  { href: "/offri", icon: Car, labelKey: "trips" },
  { href: "/profilo", icon: User, labelKey: "profile" },
];

const easeSpring = { type: "spring" as const, stiffness: 400, damping: 30 };

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
      className="fixed bottom-4 left-4 right-4 z-nav md:hidden h-[68px] rounded-[28px]"
      style={{
        background: "rgba(17, 17, 17, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item, index) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={fullHref}
              className="relative flex flex-col items-center justify-center w-[25%] h-full select-none"
            >
              {/* Animated pill background */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-1 inset-y-1.5 rounded-[20px]"
                  style={{ backgroundColor: "rgba(230, 57, 70, 0.12)" }}
                  transition={easeSpring}
                />
              )}

              <motion.div
                className="relative flex flex-col items-center justify-center gap-0.5"
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.1 }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{
                    color: isActive ? "#e63946" : "#6b6b6b",
                    opacity: isActive ? 1 : 0.7,
                  }}
                />
                <span
                  className="font-caption leading-none"
                  style={{
                    color: isActive ? "#e63946" : "#6b6b6b",
                    opacity: isActive ? 1 : 0.7,
                    marginTop: "2px",
                  }}
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

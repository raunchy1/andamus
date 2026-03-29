"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/cerca", icon: Search, label: "Cerca" },
  { href: "/offri", icon: PlusCircle, label: "Offri", isAction: true },
  { href: "/profilo", icon: User, label: "Profilo" },
];

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  // Get current path without locale prefix
  const currentPath = pathname.replace(`/${locale}`, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121e]/95 backdrop-blur-lg border-t border-white/10 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = 
            item.href === "/" 
              ? currentPath === "/" 
              : currentPath.startsWith(item.href);

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={fullHref}
                className="relative -top-4"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-[#e63946] shadow-lg shadow-[#e63946]/30"
                >
                  <item.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={fullHref}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? "text-[#e63946]" : "text-white/50"
                }`}
              >
                <item.icon 
                  className="w-5 h-5" 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#e63946]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

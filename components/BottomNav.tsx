"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";


const navItems = [
  { href: "/",       icon: Home,          labelKey: "home"   },
  { href: "/cerca",  icon: Search,        labelKey: "search" },
  { href: "/offri",  icon: Plus,          labelKey: "offer",  isPill: true },
  { href: "/chat",   icon: MessageCircle, labelKey: "chat"   },
  { href: "/profilo",icon: User,          labelKey: "profile"},
];

/** Rute pe care tab bar-ul nu apare */
const HIDE_ON = [
  "/onboarding",
  "/offri",
  "/corsa/",
  "/prenotazione",
  "/conferma",
  "/notifiche",
];

/** Whether the tab bar shows for a path — the layout needs it to reserve room. */
export function isBottomNavVisible(pathname: string | null, locale: string) {
  if (!pathname) return false;
  const localePath = pathname.replace(`/${locale}`, "") || "/";
  const hidden =
    HIDE_ON.some((p) => localePath.startsWith(p)) ||
    /* thread chat: /chat/[bookingId] — nu lista /chat */
    (localePath.startsWith("/chat/") && localePath.length > "/chat/".length);
  return !hidden;
}

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();

  const localePath = pathname.replace(`/${locale}`, "") || "/";

  if (!isBottomNavVisible(pathname, locale)) return null;

  const activeIndex = navItems.findIndex((item) =>
    item.href === "/"
      ? localePath === "/"
      : localePath.startsWith(item.href)
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-nav md:hidden"
      style={{
        height: "84px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(244, 241, 234, 0.94)",
        borderTop: "1px solid var(--line)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div
        className="flex items-start justify-around"
        style={{ paddingTop: "10px", paddingLeft: "8px", paddingRight: "8px" }}
      >
        {navItems.map((item, index) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={fullHref}
              className="flex flex-col items-center justify-start gap-[5px] flex-1 select-none"
            >
              <motion.div
                className="flex flex-col items-center gap-[5px]"
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.1 }}
              >
                {item.isPill ? (
                  /* Tab Offri — pill 44×32 */
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 44,
                      height: 32,
                      borderRadius: 999,
                      background: isActive ? "var(--green)" : "var(--sand-deep)",
                      transition: "background 0.2s",
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2.1}
                      color={isActive ? "#FFFFFF" : "var(--muted)"}
                    />
                  </div>
                ) : (
                  <Icon
                    size={22}
                    strokeWidth={1.7}
                    style={{
                      color: isActive ? "var(--ink)" : "var(--faint)",
                      transition: "color 0.2s",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: isActive ? "var(--ink)" : "var(--faint)",
                    transition: "color 0.2s",
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

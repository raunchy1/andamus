"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center py-20 px-4 text-center ${className}`}
    >
      {/* Icon Container */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 blur-3xl rounded-full"
          style={{ background: "rgba(230, 57, 70, 0.15)" }}
        />
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-[28px]"
          style={{
            background: "linear-gradient(180deg, #1a1a1a 0%, #111111 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {icon || (
            <svg
              className="w-12 h-12 text-[#e63946]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Text Content */}
      <h3 className="font-h4 text-[#f8f8f8] mb-3">{title}</h3>
      <p className="text-[#6b6b6b] max-w-sm mb-8 leading-relaxed font-body-sm">{description}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Link href={action.href}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={action.variant || "default"}
                className={
                  action.variant === "outline"
                    ? "border-white/[0.08] text-white hover:bg-white/[0.05] rounded-xl h-12 px-6"
                    : "rounded-xl h-12 px-6 text-white font-semibold"
                }
                style={
                  action.variant !== "outline"
                    ? {
                        background: "linear-gradient(135deg, #e63946 0%, #f4a261 100%)",
                        boxShadow: "0 4px 16px rgba(230, 57, 70, 0.25)",
                      }
                    : undefined
                }
              >
                {action.label}
              </Button>
            </motion.div>
          </Link>
        )}
        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            className="text-[#6b6b6b] hover:text-[#a0a0a0] hover:bg-white/[0.03] rounded-xl h-12 px-6"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Fix #3: EmptyStateSearch "offer ride" action href was hardcoded to "/offri",
// which 404s because all routes are under /[locale]/. Now builds the href with
// the current locale prefix.
export function EmptyStateSearch({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const t = useTranslations("emptyState");
  const locale = useLocale();
  return (
    <EmptyState
      title={t("noRidesFound")}
      description={
        hasFilters
          ? t("noRidesFiltered")
          : t("noRidesDescription")
      }
      icon={
        <svg className="w-12 h-12 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v11.264c0 .415.255.788.647.927L15 16.5z" />
        </svg>
      }
      action={{
        label: t("offerRide"),
        href: `/${locale}/offri`,
        variant: "default",
      }}
      secondaryAction={
        hasFilters
          ? {
              label: t("clearFiltersLabel"),
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  );
}

export function EmptyStateProfile({ type }: { type: "rides" | "bookings" | "requests" }) {
  const t = useTranslations("emptyState");
  const locale = useLocale();
  const configs = {
    rides: {
      title: t("noRidesPublished"),
      description: t("startSharing"),
      action: { label: t("publishRide"), href: `/${locale}/offri`, variant: "default" as const },
    },
    bookings: {
      title: t("noBookings"),
      description: t("findRide"),
      action: { label: t("searchRides"), href: `/${locale}/cerca`, variant: "default" as const },
    },
    requests: {
      title: t("noRequests"),
      description: t("requestsAppearHere"),
      action: { label: t("viewRides"), href: `/${locale}/cerca`, variant: "outline" as const },
    },
  };

  const config = configs[type];

  return (
    <EmptyState
      title={config.title}
      description={config.description}
      icon={
        <svg className="w-12 h-12 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      action={config.action}
    />
  );
}

export function EmptyStateChat() {
  const t = useTranslations("emptyState");
  const locale = useLocale();
  return (
    <EmptyState
      title={t("noMessages")}
      description={t("chatAvailable")}
      icon={
        <svg className="w-12 h-12 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      action={{
        label: t("searchRidesBtn"),
        href: `/${locale}/cerca`,
        variant: "default",
      }}
    />
  );
}

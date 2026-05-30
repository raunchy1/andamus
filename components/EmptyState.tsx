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
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  tertiaryAction?: {
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
  tertiaryAction,
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
      <p className="text-[#a0a0a0] max-w-sm mb-8 leading-relaxed font-body-sm">{description}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {action && (
          action.href ? (
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
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={action.variant || "default"}
                onClick={action.onClick}
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
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="border-white/[0.08] text-white hover:bg-white/[0.05] rounded-xl h-12 px-6"
                >
                  {secondaryAction.label}
                </Button>
              </motion.div>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="border-white/[0.08] text-white hover:bg-white/[0.05] rounded-xl h-12 px-6"
            >
              {secondaryAction.label}
            </Button>
          )
        )}
        
        {tertiaryAction && (
          <Button
            variant="ghost"
            onClick={tertiaryAction.onClick}
            className="text-[#6b6b6b] hover:text-[#a0a0a0] hover:bg-white/[0.03] rounded-xl h-12 px-6"
          >
            {tertiaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Fix #3: EmptyStateSearch "offer ride" action href was hardcoded to "/offri",
// which 404s because all routes are under /[locale]/. Now builds the href with
// the current locale prefix.
import { useState, useEffect } from "react";

export function EmptyStateSearch({
  hasFilters,
  onClearFilters,
  onCreateAlert,
  onCreateRequest,
  fromCity = "",
  toCity = "",
  searchDate = null,
  onSelectSuggestion,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateAlert?: () => void;
  onCreateRequest?: () => void;
  fromCity?: string;
  toCity?: string;
  searchDate?: string | null;
  onSelectSuggestion?: (from?: string, to?: string, date?: string | null) => void;
}) {
  const t = useTranslations("emptyState");
  const locale = useLocale();
  const [recovery, setRecovery] = useState<{
    nearbySuggestions: any[];
    flexibleDates: any[];
    matchingRequests: any[];
    otherSearchersCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fromCity && !toCity) return;
    
    setLoading(true);
    const params = new URLSearchParams();
    if (fromCity) params.set("from", fromCity);
    if (toCity) params.set("to", toCity);
    if (searchDate) params.set("date", searchDate);

    fetch(`/api/cerca/alternatives?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          setRecovery(res.data);
        }
      })
      .catch((err) => console.error("Error fetching alternatives:", err))
      .finally(() => setLoading(false));
  }, [fromCity, toCity, searchDate]);

  return (
    <div className="w-full space-y-8">
      <EmptyState
        title={hasFilters ? t("noRidesFound") : "Nessun passaggio oggi"}
        description={
          hasFilters
            ? t("noRidesFiltered")
            : "Non ci sono ancora passaggi per questa rotta oggi, ma la community cresce in fretta! Salva la ricerca per ricevere una notifica appena qualcuno pubblica un passaggio."
        }
        icon={
          <svg className="w-12 h-12 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v11.264c0 .415.255.788.647.927L15 16.5z" />
          </svg>
        }
        action={{
          label: "Crea Alert",
          onClick: onCreateAlert,
          variant: "default",
        }}
        secondaryAction={{
          label: t("offerRide"),
          href: `/${locale}/offri`,
        }}
        tertiaryAction={
          hasFilters
            ? {
                label: t("clearFiltersLabel"),
                onClick: onClearFilters,
              }
            : onCreateRequest
            ? {
                label: "Chiedi un passaggio alla community",
                onClick: onCreateRequest,
              }
            : undefined
        }
      />

      {/* Social Proof Telemetry Bubble */}
      {recovery && recovery.otherSearchersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-semibold backdrop-blur-md shadow-lg"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          🔥 C&apos;è richiesta! Altri {recovery.otherSearchersCount} pendolari hanno cercato questa tratta oggi.
        </motion.div>
      )}

      {/* Alternatives & Fallbacks Grid */}
      {recovery && (recovery.flexibleDates.length > 0 || recovery.nearbySuggestions.length > 0 || recovery.matchingRequests.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto text-left"
        >
          {/* Flexible Dates suggestions */}
          {recovery.flexibleDates.length > 0 && (
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-2xl">
              <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date flessibili disponibili
              </h4>
              <p className="text-xs text-white/50 mb-4">Abbiamo trovato passaggi attivi su questa rotta in date vicine:</p>
              <div className="flex flex-col gap-2">
                {recovery.flexibleDates.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion?.(undefined, undefined, item.date)}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.03] hover:bg-white/[0.08] hover:border-emerald-500/30 transition duration-200 text-xs text-white"
                  >
                    <span className="font-semibold">
                      {new Date(item.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      {item.ride_count} {item.ride_count === 1 ? "passaggio" : "passaggi"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Hubs suggestions */}
          {recovery.nearbySuggestions.length > 0 && (
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-2xl">
              <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Rotte vicine consigliate
              </h4>
              <p className="text-xs text-white/50 mb-4">Controlla i passaggi attivi nei nodi di trasporto principali limitrofi:</p>
              <div className="flex flex-col gap-2">
                {recovery.nearbySuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion?.(item.from_city, item.to_city, undefined)}
                    className="flex flex-col text-left p-3 rounded-xl border border-white/[0.04] bg-white/[0.03] hover:bg-white/[0.08] hover:border-sky-500/30 transition duration-200 text-xs text-white"
                  >
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="font-bold text-sky-300">
                        {item.from_city} ➔ {item.to_city}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">+{item.distance_diff}km</span>
                    </div>
                    <span className="text-[10px] text-white/60">{item.reason}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passenger requests */}
          {recovery.matchingRequests.length > 0 && (
            <div className="col-span-full p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-2xl">
              <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Passeggeri in cerca di passaggio su questa tratta
              </h4>
              <p className="text-xs text-white/50 mb-4">Offri un passaggio a questi pendolari per avviare il viaggio insieme:</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {recovery.matchingRequests.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.03] text-xs text-white"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      {req.user?.avatar_url ? (
                        <img src={req.user.avatar_url} alt="" className="w-8 h-8 rounded-full border border-purple-500/30 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold font-mono">
                          {req.user?.full_name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white/90 truncate max-w-[120px]">{req.user?.full_name || "Pendolare"}</div>
                        <div className="text-[10px] text-white/40">
                          {new Date(req.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-purple-300">
                      <span>Posti: {req.seats_needed}</span>
                      <Link href={`/${locale}/offri?from=${req.from_city}&to=${req.to_city}&date=${req.date}`}>
                        <span className="px-2 py-1 rounded bg-purple-500/15 border border-purple-500/25 hover:bg-purple-500/30 transition font-semibold text-purple-200">
                          Offri passaggio
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
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

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, MapPin, Shield, MessageCircle, Trophy, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { FEATURES } from "@/lib/features";
import { SARDINIA_CITIES } from "@/lib/sardinia-cities";

// Derived from the actual city table rather than the previous "50+" claim,
// which overstated a list holding exactly 50 entries.
const CITY_COUNT = Object.keys(SARDINIA_CITIES).length;

const NEW_FEATURE_ICONS = [MapPin, Shield, MessageCircle, Trophy, Zap];

export function LaunchBanner() {
  const t = useTranslations("launchBanner");
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("launch_banner_dismissed_v1");
    if (!dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("launch_banner_dismissed_v1", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (FEATURES.WAITLIST_MODE) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-16 z-[90] md:top-20"
        >
          <div className="border-b border-line bg-surface/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <p className="text-sm text-muted truncate">
                    <span className="font-medium text-fg">{t("live")}</span>
                    <span className="hidden sm:inline"> {t("tagline")}</span>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="hidden md:inline-flex items-center gap-1 ml-2 text-xs text-accent border border-line rounded-full px-2 py-0.5 hover:border-line-strong hover:bg-surface-2 transition-colors"
                    >
                      {t("whatsNew")}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`} strokeWidth={1.5} />
                    </button>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden sm:inline text-[10px] font-mono text-accent border border-line rounded-full px-2 py-0.5">
                    v1.0
                  </span>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                    aria-label={t("dismiss")}
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-1 border-t border-line mt-2.5">
                      <p className="text-eyebrow mb-2">{t("whatsNew")}</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {NEW_FEATURE_ICONS.map((FeatureIcon, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 bg-surface-2 border border-line rounded-[var(--radius-sm)] px-2.5 py-2"
                          >
                            <FeatureIcon className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                            <span className="text-xs text-muted">
                              {index === 0
                                ? t("feature0", { count: CITY_COUNT })
                                : t(`feature${index}`)}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
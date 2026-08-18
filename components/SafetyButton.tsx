"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Phone, MapPin, X, LifeBuoy, Flag, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

/**
 * Safety sheet.
 *
 * Colour discipline: everything here is ink on white except the call-112
 * action, which is solid terracotta. Emergency is the one thing on this
 * screen that must be found without reading, so it is the one thing that
 * gets colour. Pastel circles behind every icon made all four options look
 * equally urgent, which is the same as none of them looking urgent.
 */
export function SafetyButton() {
  const t = useTranslations("safety");
  const pathname = usePathname();
  const isChatThread = /\/chat\/[^/]+/.test(pathname ?? "");
  const reduce = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Open via custom event (e.g. from other components)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-sos-modal", handleOpen);
    return () => window.removeEventListener("open-sos-modal", handleOpen);
  }, []);

  // Browser back button closes the panel
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ sosOpen: true }, "");
    const handlePopState = () => setIsOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  // Escape closes the panel
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("geolocationNotSupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const shareText = t("shareLocationText", { url: mapsUrl });
        try {
          if (navigator.share) {
            await navigator.share({
              title: t("shareLocationTitle"),
              text: shareText,
            });
            toast.success(t("locationShared"));
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            toast.success(t("locationCopied"));
          }
        } catch {
          await navigator.clipboard.writeText(shareText);
          toast.success(t("locationCopied"));
        }
      },
      () => {
        toast.error(t("locationError"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      {/* Launcher — above the bottom nav, lower inside a full-screen chat thread */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-transform active:scale-95 md:bottom-8 md:right-8",
          isChatThread ? "bottom-4" : "bottom-24"
        )}
        aria-label={t("openSafety")}
        aria-expanded={isOpen}
      >
        <LifeBuoy className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150] bg-[var(--bg-overlay)]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="safety-title"
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[151] max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] md:inset-x-auto md:right-8 md:bottom-8 md:w-[400px] md:rounded-3xl md:border"
            >
              <div className="flex justify-center pb-1 pt-3 md:hidden">
                <div className="h-1 w-10 rounded-full bg-track" />
              </div>

              <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-3">
                <div>
                  <h2 id="safety-title" className="font-heading text-xl text-ink">
                    {t("safety")}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t("sheetIntro")}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                  aria-label={t("close")}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </button>
              </div>

              <div className="space-y-3 px-5 pb-6">
                {/* The one coloured affordance on the screen. */}
                <a
                  href="tel:112"
                  className="flex min-h-[64px] w-full items-center gap-4 rounded-2xl bg-terracotta px-5 py-4 text-left transition-opacity hover:opacity-95 active:scale-[0.99]"
                >
                  <Phone className="h-6 w-6 shrink-0 text-white" strokeWidth={1.5} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-white">{t("call112")}</span>
                    <span className="mt-0.5 block text-sm text-white/85">{t("call112Detail")}</span>
                  </span>
                </a>

                <button
                  onClick={handleShareLocation}
                  className="flex min-h-[64px] w-full items-center gap-4 rounded-2xl border border-line px-5 py-4 text-left transition-colors hover:bg-sand active:scale-[0.99]"
                >
                  <MapPin className="h-6 w-6 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">{t("shareLocation")}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t("shareLocationDetail")}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden />
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowReport(true);
                  }}
                  className="flex min-h-[64px] w-full items-center gap-4 rounded-2xl border border-line px-5 py-4 text-left transition-colors hover:bg-sand active:scale-[0.99]"
                >
                  <Flag className="h-6 w-6 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">{t("reportProblem")}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t("reportDescription")}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden />
                </button>

                <div className="rounded-2xl bg-sand px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {t("safetyTips")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
                    <li>{t("tip1")}</li>
                    <li>{t("tip2")}</li>
                    <li>{t("tip3")}</li>
                    <li>{t("tip4")}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReportModal open={showReport} onClose={() => setShowReport(false)} />
    </>
  );
}

export function openSOSModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-sos-modal"));
  }
}

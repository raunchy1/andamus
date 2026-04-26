"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, MapPin, X, Shield, Siren } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function SafetyButton() {
  const t = useTranslations("safety");
  const [isOpen, setIsOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-sos-modal", handleOpen);
    return () => window.removeEventListener("open-sos-modal", handleOpen);
  }, []);

  const handleEmergencyCall = () => {
    window.location.href = "tel:112";
    toast.success(t("emergencyCall"));
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("geolocationNotSupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const shareText = `La mia posizione attuale: ${mapsUrl}`;
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
      {/* Floating Safety Button - positioned above BottomNav (64px + safe area) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[96px] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-110 hover:bg-red-600"
        aria-label={t("sosSafety")}
      >
        <Shield className="h-6 w-6" />
      </button>

      {/* Safety Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#131313] p-6"
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{t("safety")}</h3>
                    <p className="text-sm text-white/50">{t("emergencyTools")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                  aria-label={t("cancel")} // a11y: icon-only button
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Emergency Actions */}
              <div className="space-y-3">
                {/* SOS Button */}
                <button
                  onClick={() => setShowSOS(true)}
                  className="w-full rounded-2xl bg-red-500 p-5 text-left transition-all hover:bg-red-600"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                      <Siren className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{t("sosEmergency")}</p>
                      <p className="text-sm text-white/70">{t("callOrShare")}</p>
                    </div>
                  </div>
                </button>

                {/* Share Location */}
                <button
                  onClick={handleShareLocation}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
                      <MapPin className="h-7 w-7 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{t("shareLocation")}</p>
                      <p className="text-sm text-white/50">{t("sendToContacts")}</p>
                    </div>
                  </div>
                </button>

                {/* Emergency Number */}
                <a
                  href="tel:112"
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                    <Phone className="h-7 w-7 text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{t("call112")}</p>
                    <p className="text-sm text-white/50">{t("emergencyNumber")}</p>
                  </div>
                </a>
              </div>

              {/* Safety Tips */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{t("safetyTips")}</p>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                  <li>• {t("tip1")}</li>
                  <li>• {t("tip2")}</li>
                  <li>• {t("tip3")}</li>
                  <li>• {t("tip4")}</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Confirm Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-[#131313] p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">{t("emergencyQuestion")}</h3>
              <p className="mb-6 text-white/60">
                {t("emergencyDescription")}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleEmergencyCall}
                  className="w-full rounded-xl bg-red-500 py-4 text-lg font-bold text-white transition-all hover:bg-red-600"
                >
                  {t("call112")}
                </button>
                <button
                  onClick={handleShareLocation}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t("shareLocation")}
                </button>
                <button
                  onClick={() => setShowSOS(false)}
                  className="text-sm text-white/50 hover:text-white"
                >
                  {t("cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function openSOSModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-sos-modal"));
  }
}

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, MessageCircle, Send, X, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Analytics } from "@/lib/analytics";
import { Haptic } from "@/lib/haptic";

export interface ShareRideData {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  driverName?: string;
  trustScore?: number;
  driverRides?: number;
  driverRating?: number;
}

interface ShareRideProps {
  ride: ShareRideData;
  variant?: "button" | "icon" | "card";
  className?: string;
}

export function ShareRide({ ride, variant = "button", className = "" }: ShareRideProps) {
  const locale = useLocale();
  const t = useTranslations("ride");
  const ts = useTranslations("shareModal");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://andamus.it";
  const rideUrl = `${appUrl}/api/share/${ride.id}`;

  const priceText = ride.price > 0 ? `€${ride.price}` : ts("free");

  const formattedDate = (() => {
    try {
      return new Date(ride.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return ride.date;
    }
  })();

  const shareText = `🚗 *Passaggio su Andamus*

📍 *Da:* ${ride.from_city}
🏁 *A:* ${ride.to_city}
📅 *Quando:* ${formattedDate} ${ride.time.slice(0, 5)}
💰 *Contributo:* ${ride.price > 0 ? `€${ride.price}` : "Gratis"}
${ride.driverName ? `👤 *Autista:* ${ride.driverName}` : ""}

👇 *Vedi e prenota qui:*`;

  const handleShareNative = useCallback(async () => {
    Haptic.light();
    Analytics.shareEvent?.("share_native_attempted", { variant });
    if (navigator.share) {
      try {
        await navigator.share({
          title: ts("shareTitle", { from: ride.from_city, to: ride.to_city }),
          text: shareText,
          url: rideUrl,
        });
        Analytics.shareEvent?.("share_completed", { channel: "native", variant });
        setOpen(false);
        return;
      } catch {
        Analytics.shareEvent?.("share_cancelled", { channel: "native", variant });
      }
    }
    Analytics.shareEvent?.("share_opened", { variant, fallback: true });
    setOpen(true);
  }, [rideUrl, shareText, ride.from_city, ride.to_city, variant, ts]);

  const handleCopy = useCallback(async () => {
    Haptic.light();
    const textToCopy = shareText + `\n${rideUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      Analytics.trackEvent("route_shared", { channel: "copy", ride_id: ride.id, variant });
      Analytics.shareEvent?.("share_completed", { channel: "copy", variant });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      Analytics.trackEvent("route_shared", { channel: "copy", ride_id: ride.id, variant });
      Analytics.shareEvent?.("share_completed", { channel: "copy", variant });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText, rideUrl, variant, ride.id]);

  const handleWhatsApp = useCallback(() => {
    Haptic.light();
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ` ${rideUrl}`)}`;
    window.open(url, "_blank");
    Analytics.trackEvent("route_shared", { channel: "whatsapp", ride_id: ride.id, variant });
    Analytics.shareEvent?.("share_completed", { channel: "whatsapp", variant });
    setOpen(false);
  }, [shareText, rideUrl, variant, ride.id]);

  const handleTelegram = useCallback(() => {
    Haptic.light();
    const url = `https://t.me/share/url?url=${encodeURIComponent(rideUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    Analytics.trackEvent("route_shared", { channel: "telegram", ride_id: ride.id, variant });
    Analytics.shareEvent?.("share_completed", { channel: "telegram", variant });
    setOpen(false);
  }, [rideUrl, shareText, variant, ride.id]);

  const handleTwitter = useCallback(() => {
    Haptic.light();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(rideUrl)}`;
    window.open(url, "_blank");
    Analytics.trackEvent("route_shared", { channel: "twitter", ride_id: ride.id, variant });
    Analytics.shareEvent?.("share_completed", { channel: "twitter", variant });
    setOpen(false);
  }, [shareText, rideUrl, variant, ride.id]);

  const triggerButton = (() => {
    if (variant === "icon") {
      return (
        <button
          onClick={handleShareNative}
          className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${className}`}
          title={t("share")}
        >
          <Share2 className="w-4 h-4 text-white/60" />
        </button>
      );
    }
    if (variant === "card") {
      return (
        <button
          onClick={handleShareNative}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm font-medium ${className}`}
        >
          <Share2 className="w-4 h-4 text-[#4FB3C9]" />
          {t("share")}
        </button>
      );
    }
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleShareNative}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4FB3C9]/10 text-[#4FB3C9] hover:bg-[#4FB3C9]/20 transition-colors text-sm font-semibold ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {t("share")}
      </motion.button>
    );
  })();

  return (
    <>
      {triggerButton}
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        onCopy={handleCopy}
        onWhatsApp={handleWhatsApp}
        onTelegram={handleTelegram}
        onTwitter={handleTwitter}
        copied={copied}
        ride={ride}
      />
    </>
  );
}

function ShareModal({
  open,
  onClose,
  onCopy,
  onWhatsApp,
  onTelegram,
  onTwitter,
  copied,
  ride,
}: {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  onWhatsApp: () => void;
  onTelegram: () => void;
  onTwitter: () => void;
  copied: boolean;
  ride: ShareRideData;
}) {
  const ts = useTranslations("shareModal");

  const trustLabel = (() => {
    if (!ride.trustScore) return null;
    if (ride.trustScore >= 80) return "🛡️ " + ts("veryReliable");
    if (ride.trustScore >= 60) return "✅ " + ts("reliable");
    if (ride.trustScore >= 40) return "🌱 " + ts("newDriver");
    return null;
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="bg-surface border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{ts("title")}</h3>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-3 mb-4 border border-white/5">
                <p className="text-sm text-white/80 font-medium">
                  {ride.from_city} → {ride.to_city}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {ride.date} · {ride.time.slice(0, 5)} {ride.price > 0 ? `· €${ride.price}` : `· ${ts("free")}`}
                </p>
                {trustLabel && (
                  <p className="text-[10px] text-emerald-400/80 mt-1.5 font-medium">
                    {trustLabel}
                    {ride.driverRides ? ` · ${ride.driverRides} ${ts("ridesCompleted")}` : ""}
                    {ride.driverRating ? ` · ⭐ ${ride.driverRating.toFixed(1)}` : ""}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={onCopy}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Link2 className="w-5 h-5 text-white/60" />}
                  <span className="text-[10px] text-white/60">{copied ? ts("copied") : ts("copy")}</span>
                </button>
                <button
                  onClick={onWhatsApp}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] text-white/60">WhatsApp</span>
                </button>
                <button
                  onClick={onTelegram}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  <Send className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] text-white/60">Telegram</span>
                </button>
                <button
                  onClick={onTwitter}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-[10px] text-white/60">X</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

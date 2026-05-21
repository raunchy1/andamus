"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, MessageCircle, Send, X, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface ShareRideProps {
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    driverName?: string;
  };
  variant?: "button" | "icon" | "card";
  className?: string;
}

export function ShareRide({ ride, variant = "button", className = "" }: ShareRideProps) {
  const locale = useLocale();
  const t = useTranslations("ride");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://andamus.it";
  const rideUrl = `${appUrl}/${locale}/corsa/${ride.id}`;

  const shareText = ride.driverName
    ? `🚗 ${ride.driverName} offre un passaggio da ${ride.from_city} a ${ride.to_city} il ${ride.date} alle ${ride.time.slice(0, 5)}${ride.price > 0 ? ` — €${ride.price}` : " — Gratis!"} \n\nPrenota su Andamus: ${rideUrl}`
    : `🚗 Passaggio da ${ride.from_city} a ${ride.to_city} il ${ride.date} alle ${ride.time.slice(0, 5)}${ride.price > 0 ? ` — €${ride.price}` : " — Gratis!"} \n\nPrenota su Andamus: ${rideUrl}`;

  const handleShareNative = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passaggio ${ride.from_city} → ${ride.to_city}`,
          text: shareText,
          url: rideUrl,
        });
        setOpen(false);
        return;
      } catch {
        // User cancelled or share failed
      }
    }
    setOpen(true);
  }, [rideUrl, shareText, ride.from_city, ride.to_city]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    setOpen(false);
  }, [shareText]);

  const handleTelegram = useCallback(() => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(rideUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    setOpen(false);
  }, [rideUrl, shareText]);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleShareNative}
          className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${className}`}
          title={t("share")}
        >
          <Share2 className="w-4 h-4 text-white/60" />
        </button>
        <ShareModal
          open={open}
          onClose={() => setOpen(false)}
          onCopy={handleCopy}
          onWhatsApp={handleWhatsApp}
          onTelegram={handleTelegram}
          copied={copied}
          ride={ride}
        />
      </>
    );
  }

  if (variant === "card") {
    return (
      <>
        <button
          onClick={handleShareNative}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm font-medium ${className}`}
        >
          <Share2 className="w-4 h-4 text-[#e63946]" />
          {t("share")}
        </button>
        <ShareModal
          open={open}
          onClose={() => setOpen(false)}
          onCopy={handleCopy}
          onWhatsApp={handleWhatsApp}
          onTelegram={handleTelegram}
          copied={copied}
          ride={ride}
        />
      </>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleShareNative}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e63946]/10 text-[#e63946] hover:bg-[#e63946]/20 transition-colors text-sm font-semibold ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {t("share")}
      </motion.button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        onCopy={handleCopy}
        onWhatsApp={handleWhatsApp}
        onTelegram={handleTelegram}
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
  copied,
  ride,
}: {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  onWhatsApp: () => void;
  onTelegram: () => void;
  copied: boolean;
  ride: ShareRideProps["ride"];
}) {
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
          >
            <div className="bg-[#131313] border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Condividi passaggio</h3>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-3 mb-4 border border-white/5">
                <p className="text-sm text-white/80 font-medium">
                  {ride.from_city} → {ride.to_city}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {ride.date} · {ride.time.slice(0, 5)} {ride.price > 0 ? `· €${ride.price}` : "· Gratis"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onCopy}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Link2 className="w-5 h-5 text-white/60" />}
                  <span className="text-[10px] text-white/60">{copied ? "Copiato" : "Copia"}</span>
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
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

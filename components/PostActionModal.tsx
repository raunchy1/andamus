"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, ArrowRight, CheckCircle2, Star, Zap, Trophy, MessageCircle, Send, Link2, Check } from "lucide-react";
import { Haptic } from "@/lib/haptic";
import { useTranslations, useLocale } from "next-intl";
import { Analytics } from "@/lib/analytics";

export type PostActionType =
  | "ride_published"
  | "booking_confirmed"
  | "ride_completed"
  | "review_submitted"
  | "streak_milestone"
  | "premium_upgrade"
  | "referral";

interface PostActionModalProps {
  type: PostActionType;
  open: boolean;
  onClose: () => void;
  onPrimaryAction?: () => void;
  context?: {
    rideId?: string;
    fromCity?: string;
    toCity?: string;
    date?: string;
    time?: string;
    price?: number;
    driverName?: string;
    streakCount?: number;
    reviewRating?: number;
  };
  autoDismissMs?: number;
}

export function PostActionModal({
  type,
  open,
  onClose,
  onPrimaryAction,
  context,
  autoDismissMs = 8000,
}: PostActionModalProps) {
  const t = useTranslations("postAction");
  const locale = useLocale();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissTimer, setDismissTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const rideUrl = context?.rideId
    ? `${typeof window !== "undefined" ? window.location.origin : "https://andamus.it"}/${locale}/corsa/${context.rideId}`
    : "";

  const shareText = context
    ? (() => {
        const route = context.fromCity && context.toCity
          ? `${context.fromCity} → ${context.toCity}`
          : "";
        const priceText = context.price !== undefined
          ? context.price > 0
            ? `€${context.price}`
            : t("free")
          : "";
        const dateTime = context.date && context.time
          ? `${context.date} ${t("at")} ${context.time.slice(0, 5)}`
          : "";

        if (type === "ride_published" && context.driverName) {
          return t("shareTextDriver", { route, dateTime, price: priceText });
        }
        if (type === "booking_confirmed") {
          return t("shareTextBooking", { route, dateTime });
        }
        if (type === "ride_completed") {
          return t("shareTextCompleted", { route });
        }
        if (type === "streak_milestone" && context.streakCount) {
          return t("shareTextStreak", { count: context.streakCount });
        }
        if (type === "referral") {
          return t("shareTextReferral");
        }
        return t("shareTextDefault", { route, dateTime, price: priceText });
      })()
    : "";

  useEffect(() => {
    if (open) {
      Haptic.success();
      Analytics.shareEvent?.("share_opened", { type, ride_id: context?.rideId });

      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissMs);
      setDismissTimer(timer);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (dismissTimer) clearTimeout(dismissTimer);
    onClose();
  }, [dismissTimer, onClose]);

  const handleShareNative = async () => {
    Analytics.shareEvent?.("share_native_attempted", { type });
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text: shareText,
          url: rideUrl || undefined,
        });
        Analytics.shareEvent?.("share_completed", { type, channel: "native" });
        handleClose();
        return;
      } catch {
        // User cancelled
        Analytics.shareEvent?.("share_cancelled", { type, channel: "native" });
      }
    }
    setShowShare(true);
  };

  const handleCopy = async () => {
    const textToCopy = shareText + (rideUrl ? `\n${rideUrl}` : "");
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      Analytics.shareEvent?.("share_completed", { type, channel: "copy" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      Analytics.shareEvent?.("share_completed", { type, channel: "copy" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + (rideUrl ? ` ${rideUrl}` : ""))}`;
    window.open(url, "_blank");
    Analytics.shareEvent?.("share_completed", { type, channel: "whatsapp" });
    setShowShare(false);
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(rideUrl || "https://andamus.it")}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    Analytics.shareEvent?.("share_completed", { type, channel: "telegram" });
    setShowShare(false);
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(rideUrl || "https://andamus.it")}`;
    window.open(url, "_blank");
    Analytics.shareEvent?.("share_completed", { type, channel: "twitter" });
    setShowShare(false);
  };

  const config: Record<PostActionType, { icon: React.ReactNode; title: string; subtitle: string; primaryLabel: string; accent: string }> = {
    ride_published: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      title: t("ridePublishedTitle"),
      subtitle: t("ridePublishedSubtitle"),
      primaryLabel: t("shareRide"),
      accent: "emerald",
    },
    booking_confirmed: {
      icon: <CheckCircle2 className="w-8 h-8 text-[#e63946]" />,
      title: t("bookingConfirmedTitle"),
      subtitle: t("bookingConfirmedSubtitle"),
      primaryLabel: t("shareBooking"),
      accent: "rose",
    },
    ride_completed: {
      icon: <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />,
      title: t("rideCompletedTitle"),
      subtitle: t("rideCompletedSubtitle"),
      primaryLabel: t("shareTrip"),
      accent: "yellow",
    },
    review_submitted: {
      icon: <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />,
      title: t("reviewSubmittedTitle"),
      subtitle: t("reviewSubmittedSubtitle"),
      primaryLabel: t("shareReview"),
      accent: "yellow",
    },
    streak_milestone: {
      icon: <Zap className="w-8 h-8 text-orange-400" />,
      title: t("streakTitle", { count: context?.streakCount || 0 }),
      subtitle: t("streakSubtitle"),
      primaryLabel: t("shareStreak"),
      accent: "orange",
    },
    premium_upgrade: {
      icon: <Trophy className="w-8 h-8 text-purple-400" />,
      title: t("premiumTitle"),
      subtitle: t("premiumSubtitle"),
      primaryLabel: t("sharePremium"),
      accent: "purple",
    },
    referral: {
      icon: <Share2 className="w-8 h-8 text-blue-400" />,
      title: t("referralTitle"),
      subtitle: t("referralSubtitle"),
      primaryLabel: t("inviteFriends"),
      accent: "blue",
    },
  };

  const c = config[type];
  const accentBg = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    rose: "bg-[#e63946]/10 border-[#e63946]/20 text-[#e63946]",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  }[c.accent];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-lg sm:mx-4 sm:mb-0 mb-0"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="bg-[#131313] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-5 pb-4">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>

                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border ${accentBg}`}>
                    {c.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{c.title}</h2>
                    <p className="text-sm text-white/50">{c.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Ride preview card */}
              {context?.fromCity && context?.toCity && (
                <div className="mx-6 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {context.fromCity} → {context.toCity}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {context.date} · {context.time?.slice(0, 5)} {context.price !== undefined ? `· ${context.price > 0 ? `€${context.price}` : t("free")}` : ""}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${accentBg}`}>
                      {type === "ride_published" ? t("live") : type === "booking_confirmed" ? t("confirmed") : t("completed")}
                    </div>
                  </div>
                </div>
              )}

              {/* Share actions */}
              <div className="px-6 pb-2">
                {!showShare ? (
                  <div className="flex flex-col gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleShareNative}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#e63946] text-white font-semibold text-sm hover:bg-[#c92a37] transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      {c.primaryLabel}
                    </motion.button>

                    {onPrimaryAction && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          onPrimaryAction();
                          handleClose();
                        }}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/[0.05] text-white font-medium text-sm hover:bg-white/[0.08] transition-colors border border-white/10"
                      >
                        {t("continue")}
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Link2 className="w-5 h-5 text-white/60" />}
                        <span className="text-[10px] text-white/60">{copied ? t("copied") : t("copy")}</span>
                      </button>
                      <button
                        onClick={handleWhatsApp}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] text-white/60">WhatsApp</span>
                      </button>
                      <button
                        onClick={handleTelegram}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <Send className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] text-white/60">Telegram</span>
                      </button>
                      <button
                        onClick={handleTwitter}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-[10px] text-white/60">X</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setShowShare(false)}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors py-1"
                    >
                      {t("back")}
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-dismiss indicator */}
              <div className="px-6 pt-2 pb-5">
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
                    className="h-full bg-white/20 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

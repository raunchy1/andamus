"use client";

import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ShareAppProps {
  variant?: "button" | "icon" | "outline" | "card";
  className?: string;
  onShare?: () => void;
}

export function ShareApp({ variant = "button", className = "", onShare }: ShareAppProps) {
  const t = useTranslations("share");
  const SHARE_TEXT = t("discoveredMessage");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("appName"),
          text: SHARE_TEXT,
          url: "https://andamus.it",
        });
        toast.success(t("shareSuccess"));
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(SHARE_TEXT);
        setCopied(true);
        toast.success(t("linkCopied"));
        setTimeout(() => setCopied(false), 2000);
      }
      onShare?.();
    } catch {
      // User cancelled
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className={`p-2 rounded-full transition-colors hover:bg-white/10 ${className}`}
        title={t("share")}
      >
        <Share2 className="w-5 h-5" />
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-current transition-colors hover:bg-white/5 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">{t("share")}</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleShare}
        className={`w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#e63946]/10 to-[#ff6b6b]/10 border border-[#e63946]/20 transition-all hover:from-[#e63946]/20 hover:to-[#ff6b6b]/20 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#e63946]/20 flex items-center justify-center flex-shrink-0">
          <Share2 className="w-5 h-5 text-[#e63946]" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-white">{t("inviteFriends")}</p>
          <p className="text-sm text-white/60">{t("shareDescription")}</p>
        </div>
        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Link2 className="w-5 h-5 text-white/40" />}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e63946] text-white font-medium transition-colors hover:bg-[#c92a37] ${className}`}
    >
      <Share2 className="w-4 h-4" />
      <span>{t("share")}</span>
    </button>
  );
}

// Hook for sharing
export function useShareApp() {
  const t = useTranslations("share");
  const share = async (customText?: string) => {
    const text = customText || t("discoveredMessage");
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("appName"),
          text,
          url: "https://andamus.it",
        });
        return true;
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success(t("linkCopied"));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return { share };
}

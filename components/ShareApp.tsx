"use client";

import { Share2, Check, ChevronRight } from "lucide-react";
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
          url: process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it",
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
        className={`flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink ${className}`}
        aria-label={t("share")}
      >
        <Share2 className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-sand ${className}`}
      >
        <Share2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        {t("share")}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleShare}
        className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-left transition-colors hover:bg-sand ${className}`}
      >
        <Share2 className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{t("shareApp")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t("shareDescription")}</span>
        </span>
        {copied ? (
          <Check className="h-5 w-5 shrink-0 text-green" strokeWidth={1.5} aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden />
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleShare}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <Share2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      {t("share")}
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
          url: process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it",
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

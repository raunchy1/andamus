"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Share } from "lucide-react";
import { useTranslations } from "next-intl";
import { Haptic } from "@/lib/haptic";
import { Button } from "@/components/ui/button";

interface StepCompleteProps {
  locale: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

export default function StepComplete({ locale }: StepCompleteProps) {
  const t = useTranslations("onboarding.flow");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const iosMatch = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      setIsIOS(iosMatch && !isStandalone);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    Haptic.success();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleCerca = () => {
    Haptic.light();
    window.location.href = `/${locale}/cerca`;
  };

  const handleOffri = () => {
    Haptic.light();
    window.location.href = `/${locale}/offri`;
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col justify-between">
      <motion.div
        {...fadeUp}
        className="scrollbar-none max-h-[70vh] space-y-8 overflow-y-auto px-1 pb-4 text-center"
      >
        <div className="py-6">
          <p className="heading-editorial text-3xl text-fg">{t("completeTitle")}</p>
          <p className="mx-auto mt-3 max-w-xs text-xs text-muted">
            {t("completeSubtitle")}
          </p>
        </div>

        {deferredPrompt && (
          <div className="flex items-start gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
              <Download className="size-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-eyebrow">{t("installTitle")}</h4>
              <p className="text-[11px] leading-relaxed text-muted">
                {t("installDesc")}
              </p>
              <Button type="button" size="sm" onClick={handleInstallClick}>
                {t("installNow")}
              </Button>
            </div>
          </div>
        )}

        {isIOS && (
          <div className="flex items-start gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
              <Share className="size-5 text-muted" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-eyebrow">{t("addToHome")}</h4>
              <p className="text-[11px] leading-relaxed text-muted">
                {t.rich("installIosDesc", {
                  strong: (chunks) => <strong className="text-fg">{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.06 }}
        className="space-y-3 pt-6"
      >
        <Button type="button" onClick={handleCerca} className="w-full">
          {t("searchRide")}
        </Button>
        <Button type="button" variant="outline" onClick={handleOffri} className="w-full">
          {t("offerRide")}
        </Button>
      </motion.div>
    </div>
  );
}

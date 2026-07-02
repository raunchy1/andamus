"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Analytics } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PWAInstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
      }
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Custom event to trigger prompt manually (at psychological value moments)
    const triggerHandler = (e: Event) => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        Analytics.trackEvent("install_prompt_viewed", { trigger: e.type });
      }
    };

    window.addEventListener("trigger_pwa_prompt", triggerHandler);
    window.addEventListener("successful_search", triggerHandler);
    window.addEventListener("route_saved", triggerHandler);
    window.addEventListener("booking_intent", triggerHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("trigger_pwa_prompt", triggerHandler);
      window.removeEventListener("successful_search", triggerHandler);
      window.removeEventListener("route_saved", triggerHandler);
      window.removeEventListener("booking_intent", triggerHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      Analytics.trackEvent("install_prompt_conversion", { status: "accepted" });
    } else {
      Analytics.trackEvent("install_prompt_conversion", { status: "dismissed" });
    }
    setDeferredPrompt(null);
    window.deferredPrompt = null;
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
    setDismissed(true);
    Analytics.trackEvent("install_prompt_conversion", { status: "ignored" });
  }, []);

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-surface/90 border border-white/10 rounded-3xl p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#4FB3C9]/10 flex items-center justify-center border border-[#4FB3C9]/20">
            <Smartphone className="w-6 h-6 text-[#4FB3C9]" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-white">Ricevi notifiche sui tragitti</h4>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              Aggiungi Andamus per trovare passaggi più velocemente ed essere avvisato sulle corse di tuo interesse.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4FB3C9] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3d9db3] active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Installa
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

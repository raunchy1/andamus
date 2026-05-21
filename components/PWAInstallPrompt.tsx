"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
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
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
    setDismissed(true);
  }, []);

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-[#131313] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#e63946]/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-[#e63946]" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">Installa Andamus</h4>
            <p className="text-xs text-white/50 mt-0.5">
              Aggiungi alla home per un accesso più rapido e notifiche push.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#e63946] text-white text-sm font-semibold hover:bg-[#c92a37] transition-colors"
            >
              <Download className="w-4 h-4" />
              Installa
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

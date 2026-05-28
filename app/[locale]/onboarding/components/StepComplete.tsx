"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Download, Share } from "lucide-react";
import { Haptic } from "@/lib/haptic";

interface StepCompleteProps {
  locale: string;
}

export default function StepComplete({ locale }: StepCompleteProps) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect PWA install trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect iOS
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
    router.push(`/${locale}/cerca`);
  };

  const handleOffri = () => {
    Haptic.light();
    router.push(`/${locale}/offri`);
  };

  return (
    <div className="flex flex-col flex-1 justify-between h-full w-full">
      <div className="space-y-8 overflow-y-auto max-h-[70vh] pb-4 px-1 scrollbar-none text-center">
        
        {/* Animated Emoji Carousel */}
        <div className="py-6 flex justify-center">
          <div className="w-24 h-24 bg-white/[0.03] border border-white/[0.06] rounded-3xl flex items-center justify-center relative overflow-hidden">
            <div className="flex flex-col items-center justify-center h-[288px] absolute top-0 animate-[carousel-emojis_4.5s_infinite_ease-in-out]">
              <span className="text-4xl h-24 flex items-center justify-center">🚗</span>
              <span className="text-4xl h-24 flex items-center justify-center">🛣️</span>
              <span className="text-4xl h-24 flex items-center justify-center">🌊</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Sei pronto a partire!
          </h2>
          <p className="text-zinc-400 text-xs font-sans mt-2 max-w-xs mx-auto">
            Andamus ti dà il benvenuto nella community del carpooling sardo. Viaggia, condividi, risparmia.
          </p>
        </div>

        {/* PWA Prompt Card */}
        {deferredPrompt && (
          <div className="bg-gradient-to-br from-[#e63946]/10 to-transparent border border-[#e63946]/20 rounded-2xl p-5 text-left flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#e63946]/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-[#e63946]" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Installa Andamus</h4>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Salva Andamus sulla schermata iniziale per viaggiare offline e ricevere avvisi in tempo reale.
              </p>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-[#e63946] text-white text-xs font-bold rounded-lg transition-transform active:scale-[0.95]"
              >
                Installa ora
              </button>
            </div>
          </div>
        )}

        {isIOS && (
          <div className="bg-[#121212] border border-white/[0.06] rounded-2xl p-5 text-left flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center flex-shrink-0">
              <Share className="w-5 h-5 text-[#e63946]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aggiungi a Home</h4>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Premi <strong className="text-white">Condividi</strong> in basso nel browser Safari, poi seleziona <strong className="text-white">Aggiungi alla schermata Home</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="pt-6 space-y-3">
        <button
          onClick={handleCerca}
          className="w-full bg-[#e63946] text-white py-4 px-6 rounded-xl text-base font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          Cerca un passaggio →
        </button>
        <button
          onClick={handleOffri}
          className="w-full border border-white/5 bg-white/5 text-white py-4 px-6 rounded-xl text-base font-bold transition-all active:scale-[0.99]"
        >
          Offri un passaggio
        </button>
      </div>
    </div>
  );
}

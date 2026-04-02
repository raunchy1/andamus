"use client";

import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ShareAppProps {
  variant?: "button" | "icon" | "outline" | "card";
  className?: string;
  onShare?: () => void;
}

const SHARE_TEXT = "Am descoperit Andamus – app-ul gratuit de passaggi doar pentru Sardinia! Intră aici: https://andamus.it #Andamus #Sardegna";

export function ShareApp({ variant = "button", className = "", onShare }: ShareAppProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Andamus - Carpooling în Sardinia",
          text: SHARE_TEXT,
          url: "https://andamus.it",
        });
        toast.success("Grazie per condividere! 🎉");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(SHARE_TEXT);
        setCopied(true);
        toast.success("Link copiato! Incollalo dove preferisci 📋");
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
        title="Condividi Andamus"
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
        <span className="text-sm font-medium">Condividi</span>
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
          <p className="font-semibold text-white">Invita gli amici</p>
          <p className="text-sm text-white/60">Condividi Andamus e aiuta la community a crescere</p>
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
      <span>Condividi Andamus</span>
    </button>
  );
}

// Hook for sharing
export function useShareApp() {
  const share = async (customText?: string) => {
    const text = customText || SHARE_TEXT;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Andamus - Carpooling în Sardinia",
          text,
          url: "https://andamus.it",
        });
        return true;
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Link copiato! 📋");
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return { share };
}

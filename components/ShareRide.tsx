"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface ShareRideProps {
  rideId: string;
  fromCity: string;
  toCity: string;
  date: string;
  isDriver?: boolean;
}

export function ShareRide({ rideId, fromCity, toCity, date, isDriver = false }: ShareRideProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://andamus.app';
  const rideUrl = `${appUrl}/corsa/${rideId}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const shareText = isDriver
    ? `Offro un passaggio ${fromCity} → ${toCity} il ${formatDate(date)}. Prenota su Andamus: ${rideUrl}`
    : `Cerco un passaggio ${fromCity} → ${toCity} il ${formatDate(date)}. Trovalo su Andamus: ${rideUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(rideUrl);
      setCopied(true);
      toast.success("Link copiato!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Errore nella copia");
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const text = isDriver
      ? `Offro un passaggio ${fromCity} → ${toCity} il ${formatDate(date)}:`
      : `Cerco un passaggio ${fromCity} → ${toCity} il ${formatDate(date)}:`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(rideUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(rideUrl)}`;
    window.open(url, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passaggio ${fromCity} → ${toCity}`,
          text: shareText,
          url: rideUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={shareNative}
        className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20"
      >
        <Share2 className="h-4 w-4" />
        Condividi
      </button>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2a4a] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Condividi corsa</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Ride Info */}
              <div className="mb-6 rounded-xl bg-white/5 p-4">
                <p className="text-white font-semibold">
                  {fromCity} → {toCity}
                </p>
                <p className="text-white/60 text-sm">{formatDate(date)}</p>
              </div>

              {/* Copy Link */}
              <div className="flex gap-2 mb-6">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm truncate">
                  {rideUrl}
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center w-12 rounded-xl bg-[#e63946] text-white hover:bg-[#c92a37] transition-colors"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={shareWhatsApp}
                  className="flex flex-col items-center gap-2 rounded-xl bg-green-500/20 border border-green-500/30 py-4 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-xs">WhatsApp</span>
                </button>
                <button
                  onClick={shareTelegram}
                  className="flex flex-col items-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/30 py-4 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="text-xs">Telegram</span>
                </button>
                <button
                  onClick={shareFacebook}
                  className="flex flex-col items-center gap-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 py-4 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs">Facebook</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

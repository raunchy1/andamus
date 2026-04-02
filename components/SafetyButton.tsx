"use client";

import { useState } from "react";
import { AlertTriangle, Phone, MessageCircle, X, Shield } from "lucide-react";
import toast from "react-hot-toast";

export function SafetyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const handleEmergencyCall = () => {
    window.location.href = "tel:112";
    toast.success("Chiamata emergenza 112");
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          navigator.clipboard.writeText(mapsUrl);
          toast.success("Posizione copiata! Incollala ai tuoi contatti fidati");
        },
        () => {
          toast.error("Impossibile ottenere la posizione");
        }
      );
    }
  };

  return (
    <>
      {/* Floating Safety Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-110 hover:bg-red-600"
      >
        <Shield className="h-6 w-6" />
      </button>

      {/* Safety Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1e2a4a] p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                  <Shield className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Sicurezza</h3>
                  <p className="text-sm text-white/50">Strumenti di emergenza</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emergency Actions */}
            <div className="space-y-3">
              {/* SOS Button */}
              <button
                onClick={() => setShowSOS(true)}
                className="w-full rounded-2xl bg-red-500 p-5 text-left transition-all hover:bg-red-600"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">SOS Emergenza</p>
                    <p className="text-sm text-white/70">Chiama 112 o condividi posizione</p>
                  </div>
                </div>
              </button>

              {/* Share Location */}
              <button
                onClick={handleShareLocation}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
                    <MessageCircle className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Condividi posizione</p>
                    <p className="text-sm text-white/50">Invia ai contatti fidati</p>
                  </div>
                </div>
              </button>

              {/* Emergency Number */}
              <a
                href="tel:112"
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                  <Phone className="h-7 w-7 text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Chiama 112</p>
                  <p className="text-sm text-white/50">Numero di emergenza</p>
                </div>
              </a>
            </div>

            {/* Safety Tips */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Consigli di sicurezza:</p>
              <ul className="mt-2 space-y-1 text-xs text-white/60">
                <li>• Condividi sempre i dettagli del viaggio con qualcuno</li>
                <li>• Verifica l&apos;identità dell&apos;altro utente</li>
                <li>• Incontra in luoghi pubblici</li>
                <li>• Fidati del tuo istinto</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SOS Confirm Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-[#1e2a4a] p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">Emergenza?</h3>
            <p className="mb-6 text-white/60">
              Sei in pericolo? Chiama immediatamente il 112 o condividi la tua posizione.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleEmergencyCall}
                className="w-full rounded-xl bg-red-500 py-4 text-lg font-bold text-white transition-all hover:bg-red-600"
              >
                Chiama 112
              </button>
              <button
                onClick={handleShareLocation}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Condividi posizione
              </button>
              <button
                onClick={() => setShowSOS(false)}
                className="text-sm text-white/50 hover:text-white"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

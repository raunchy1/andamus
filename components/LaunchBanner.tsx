"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronDown, MapPin, Shield, MessageCircle, Trophy, Zap } from "lucide-react";

const NEW_FEATURES = [
  { icon: MapPin, text: "50+ città sarde connesse", color: "text-blue-400" },
  { icon: Shield, text: "Pulsante SOS per emergenze", color: "text-red-400" },
  { icon: MessageCircle, text: "Chat integrata tra utenti", color: "text-green-400" },
  { icon: Trophy, text: "Sistema livelli e punti", color: "text-yellow-400" },
  { icon: Zap, text: "Notifiche push in tempo reale", color: "text-purple-400" },
];

export function LaunchBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("launch_banner_dismissed_v1");
    if (!dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("launch_banner_dismissed_v1", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-[100]"
        >
          <div className="bg-gradient-to-r from-[#e63946] via-[#ff6b6b] to-[#e63946] text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium">
                    <span className="font-bold">🎉 Andamus è ora live!</span>
                    <span className="hidden sm:inline"> Il carpooling dei sardi è qui. </span>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="hidden md:inline-flex items-center gap-1 ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30 transition-colors"
                    >
                      Novità v1.0
                      <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                    </button>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="hidden sm:inline text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                    v1.0
                  </span>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Chiudi banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable "What's New" section */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 pb-2 border-t border-white/20 mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-3">
                        Cosa c&apos;è di nuovo in v1.0
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {NEW_FEATURES.map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2"
                          >
                            <feature.icon className={`w-4 h-4 ${feature.color}`} />
                            <span className="text-xs font-medium">{feature.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

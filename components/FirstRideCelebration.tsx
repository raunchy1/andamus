"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles, X } from "lucide-react";
import { Haptic } from "@/lib/haptic";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

function generateConfetti(count: number): ConfettiPiece[] {
  const colors = ["#e63946", "#ffb3b1", "#ffd700", "#10b981", "#3b82f6", "#f59e0b"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

interface CelebrationModalProps {
  type: "first_ride" | "first_booking" | "level_up" | "badge_earned";
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export function CelebrationModal({ type, title, subtitle, onClose }: CelebrationModalProps) {
  const [confetti] = useState(() => generateConfetti(40));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    Haptic.success();
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose?.(), 400);
  }, [onClose]);

  const defaults: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
    first_ride: {
      title: "Prima corsa pubblicata! 🎉",
      subtitle: "Hai guadagnato 50 punti. Continua così!",
      icon: <Trophy className="w-12 h-12 text-yellow-400" />,
    },
    first_booking: {
      title: "Prenotazione confermata! 🎉",
      subtitle: "Il tuo viaggio inizia qui. Buon viaggio!",
      icon: <Sparkles className="w-12 h-12 text-[#e63946]" />,
    },
    level_up: {
      title: title || "Livello superato! 🚀",
      subtitle: subtitle || "Sei più vicino alla Leggenda Sarda.",
      icon: <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />,
    },
    badge_earned: {
      title: title || "Nuovo badge sbloccato! 🏅",
      subtitle: subtitle || "Continua a esplorare per sbloccarne altri.",
      icon: <Trophy className="w-12 h-12 text-[#e63946]" />,
    },
  };

  const content = defaults[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                initial={{ y: -20, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
                animate={{
                  y: "110vh",
                  opacity: [1, 1, 0],
                  rotate: c.rotation + 720,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: c.delay,
                  ease: "easeIn",
                }}
                className="absolute top-0"
                style={{
                  width: c.size,
                  height: c.size * 0.6,
                  backgroundColor: c.color,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.2 }}
            className="relative w-full max-w-sm mx-4"
          >
            <button
              onClick={handleClose}
              className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-[#131313] border border-white/10 shadow-2xl p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#e63946]/10 to-transparent" />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.4 }}
                className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#e63946]/20 to-[#ffb3b1]/10 border border-[#e63946]/20 mb-6"
              >
                {content.icon}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative text-2xl font-bold text-white mb-2"
              >
                {content.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative text-white/60 mb-6"
              >
                {content.subtitle}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={handleClose}
                className="relative w-full py-3 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
              >
                Fantastico!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to trigger a one-time celebration.
 * Uses localStorage to ensure it only shows once per milestone.
 */
export function useCelebration(key: string) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`celebration_${key}`);
    if (!seen) {
      setShow(true);
    }
  }, [key]);

  const dismiss = useCallback(() => {
    localStorage.setItem(`celebration_${key}`, "true");
    setShow(false);
  }, [key]);

  return { show, dismiss };
}

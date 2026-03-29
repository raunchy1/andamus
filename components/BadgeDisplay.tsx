"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserBadges, getBadgeDetails, BADGES, type Badge } from "@/lib/gamification";
import { Award, X } from "lucide-react";

interface BadgeDisplayProps {
  userId: string;
  showAll?: boolean;
  maxDisplay?: number;
}

// Badge unlock notification component
export function BadgeUnlockNotification({
  badgeType,
  onClose,
}: {
  badgeType: string;
  onClose: () => void;
}) {
  const badge = getBadgeDetails(badgeType);

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="bg-gradient-to-r from-[#e63946] to-[#c92a37] text-white rounded-2xl shadow-2xl p-6 max-w-sm border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`w-16 h-16 rounded-2xl ${badge.color} flex items-center justify-center text-3xl shadow-lg`}
          >
            {badge.icon}
          </motion.div>
          
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Nuovo Badge Sbloccato!</p>
            <h4 className="text-white text-xl font-bold">{badge.name}</h4>
            <p className="text-white/70 text-sm mt-1">{badge.description}</p>
          </div>
        </div>
        
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 5, ease: "linear" }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl origin-left"
        />
      </div>
    </motion.div>
  );
}

// Individual badge item
function BadgeItem({ badge, index }: { badge: Badge; index: number }) {
  const details = getBadgeDetails(badge.type || 'unknown');
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-14 h-14 rounded-xl ${details.color} flex items-center justify-center text-2xl shadow-lg cursor-pointer transform transition-transform hover:scale-110`}
      >
        {details.icon}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10"
          >
            <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
              <p className="font-semibold text-sm">{details.name}</p>
              <p className="text-xs text-white/70">{details.description}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a2e]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main badge display component
export function BadgeDisplay({ userId, showAll = false, maxDisplay = 5 }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const fetchBadges = useCallback(async () => {
    const result = await getUserBadges(userId);
    if (result.success) {
      setBadges(result.badges || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setTimeout(() => fetchBadges(), 0);
  }, [fetchBadges]);

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-14 h-14 rounded-xl bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-6">
        <Award className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">Nessun badge ancora</p>
        <p className="text-white/30 text-xs mt-1">Completa azioni per sbloccare badge!</p>
      </div>
    );
  }

  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-3">
      {displayBadges.map((badge, index) => (
        <BadgeItem key={badge.id} badge={badge} index={index} />
      ))}
      
      {!showAll && remainingCount > 0 && (
        <button
          onClick={() => setShowUnlockModal(true)}
          className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
        >
          <span className="text-sm font-medium">+{remainingCount}</span>
        </button>
      )}

      {/* All badges modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUnlockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Tutti i Badge</h3>
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {badges.map((badge) => {
                  const details = getBadgeDetails(badge.type || 'unknown');
                  return (
                    <div key={badge.id} className="text-center">
                      <div
                        className={`w-14 h-14 rounded-xl ${details.color} flex items-center justify-center text-2xl shadow-lg mx-auto mb-2`}
                      >
                        {details.icon}
                      </div>
                      <p className="text-white text-xs font-medium truncate">{details.name}</p>
                      <p className="text-white/40 text-[10px]">
                        {new Date(badge.earned_at || '2024-01-01').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-white/60 text-sm font-medium mb-4">Badge da sbloccare</h4>
                <div className="space-y-3">
                  {Object.values(BADGES)
                    .filter((b) => !badges.some((ub) => ub.type === b.type))
                    .map((badge) => (
                      <div key={badge.type} className="flex items-center gap-3 opacity-40">
                        <div className={`w-10 h-10 rounded-lg ${badge.color} flex items-center justify-center text-lg`}>
                          {badge.icon}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{badge.name}</p>
                          <p className="text-white/50 text-xs">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Level progress component
export function LevelProgress({ points }: { points: number }) {
  const { current, next, progress } = (() => {
    const LEVELS = [
      { min: 0, max: 99, name: "Viaggiatore", emoji: "🚗" },
      { min: 100, max: 299, name: "Esploratore", emoji: "🗺️" },
      { min: 300, max: 599, name: "Sardo DOC", emoji: "🦁" },
      { min: 600, max: 999, name: "Re della Strada", emoji: "👑" },
      { min: 1000, max: Infinity, name: "Leggenda Sarda", emoji: "⭐" },
    ];
    
    const current = LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0];
    const currentIndex = LEVELS.findIndex((l) => l.name === current.name);
    const next = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
    
    let progressPercent = 100;
    if (next) {
      const range = next.min - current.min;
      const earned = points - current.min;
      progressPercent = Math.min(100, Math.max(0, (earned / range) * 100));
    }
    
    return { current, next, progress: progressPercent };
  })();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{current.emoji}</span>
          <div>
            <p className="text-white/60 text-sm">Livello attuale</p>
            <p className="text-white text-xl font-bold">{current.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-sm">Punti</p>
          <p className="text-[#e63946] text-2xl font-bold">{points}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#e63946] to-[#ff6b6b] rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span>{current.min} pts</span>
          {next ? (
            <span>{next.min} pts per {next.name}</span>
          ) : (
            <span>Livello massimo!</span>
          )}
        </div>
      </div>
      
      {next && (
        <p className="text-white/50 text-sm mt-4 text-center">
          Mancano <span className="text-[#e63946] font-semibold">{next.min - points}</span> punti per diventare {next.name} {next.emoji}
        </p>
      )}
    </div>
  );
}

// Points info component
export function PointsInfo() {
  const pointActions = [
    { action: "Prima corsa pubblicata", points: 50, icon: "🚗" },
    { action: "Ogni corsa pubblicata", points: 10, icon: "📍" },
    { action: "Prenotazione confermata", points: 15, icon: "✅" },
    { action: "Recensione 5 stelle ricevuta", points: 20, icon: "⭐" },
    { action: "Verifica identità completata", points: 30, icon: "🛡️" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-[#e63946]">💎</span>
        Come guadagnare punti
      </h3>
      
      <div className="space-y-3">
        {pointActions.map((item) => (
          <div key={item.action} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-white/80 text-sm">{item.action}</span>
            </div>
            <span className="text-[#e63946] font-semibold text-sm">+{item.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

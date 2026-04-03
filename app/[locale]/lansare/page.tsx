"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Car, 
  Search, 
  User, 
  Bell, 
  Share2, 
  Shield, 
  Star,
  ChevronRight,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShareApp } from "@/components/ShareApp";

const CHECKLIST_ITEMS = [
  {
    id: "profile",
    icon: User,
    title: "Completa il tuo profilo",
    description: "Aggiungi foto, verifica il numero di telefono e costruisci la tua reputazione",
    action: { href: "/profilo", label: "Vai al profilo" },
  },
  {
    id: "search",
    icon: Search,
    title: "Cerca un passaggio",
    description: "Trova corse disponibili nella tua zona e prenota il tuo primo viaggio",
    action: { href: "/cerca", label: "Cerca ora" },
  },
  {
    id: "offer",
    icon: Car,
    title: "Offri un passaggio",
    description: "Hai posti liberi? Pubblica una corsa e guadagna punti esperienza",
    action: { href: "/offri", label: "Pubblica corsa" },
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Attiva le notifiche",
    description: "Ricevi aggiornamenti in tempo reale su prenotazioni e messaggi",
    action: { href: "/profilo", label: "Impostazioni" },
  },
  {
    id: "share",
    icon: Share2,
    title: "Invita gli amici",
    description: "Condividi Andamus e aiuta la community a crescere",
    isShare: true,
  },
  {
    id: "safety",
    icon: Shield,
    title: "Scopri la sicurezza",
    description: "Conosci il pulsante SOS e le funzioni di sicurezza dell'app",
    action: { href: "/profilo", label: "Info sicurezza" },
  },
];

export default function LaunchPage() {
  const locale = useLocale();
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Schedule setState in microtask to avoid React 19 cascading render warning
    Promise.resolve().then(() => {
      setMounted(true);
      const saved = localStorage.getItem("andamus_launch_checklist");
      if (saved) {
        setCompletedItems(JSON.parse(saved));
      }
    });
  }, []);

  const toggleItem = (id: string) => {
    const newCompleted = completedItems.includes(id)
      ? completedItems.filter((item) => item !== id)
      : [...completedItems, id];
    setCompletedItems(newCompleted);
    localStorage.setItem("andamus_launch_checklist", JSON.stringify(newCompleted));
  };

  const progress = Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-[#e63946]">
          <Rocket className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#e63946] to-[#ff6b6b] mb-6"
          >
            <Rocket className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight mb-4"
          >
            Benvenuto su Andamus! 🎉
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#e5e2e1]/70 max-w-lg mx-auto"
          >
            Completa questi semplici passaggi per iniziare al meglio con il carpooling in Sardegna
          </motion.p>
        </div>

        {/* Progress */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#e5e2e1]/70">Progresso</span>
            <span className="text-sm font-bold text-[#e63946]">{progress}%</span>
          </div>
          <div className="h-3 bg-[#1c1b1b] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-[#e63946] to-[#ff6b6b] rounded-full"
            />
          </div>
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {CHECKLIST_ITEMS.map((item, index) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`relative p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? "bg-[#1c1b1b]/50 border-[#e63946]/30"
                    : "bg-[#1c1b1b] border-[#2a2a2a] hover:border-[#3a3a3a]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-[#e63946] border-[#e63946]"
                        : "border-[#e5e2e1]/30 hover:border-[#e63946]"
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? "bg-[#e63946]/20" : "bg-[#0a0a0a]"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isCompleted ? "text-[#e63946]" : "text-[#e5e2e1]/70"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 ${
                        isCompleted ? "text-[#e5e2e1]/50 line-through" : "text-white"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        isCompleted ? "text-[#e5e2e1]/30" : "text-[#e5e2e1]/60"
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Action */}
                    {!isCompleted && (
                      <div className="mt-3">
                        {item.isShare ? (
                          <ShareApp variant="outline" className="text-[#e63946] border-[#e63946]/50" />
                        ) : item.action ? (
                          <Link
                            href={`/${locale}${item.action.href}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#e63946] hover:text-[#ff6b6b] transition-colors"
                          >
                            {item.action.label}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4">
                    <Star className="w-5 h-5 text-[#e63946] fill-[#e63946]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Completion message */}
        {progress === 100 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[#e63946]/20 to-[#ff6b6b]/20 border border-[#e63946]/30 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 Complimenti! Sei pronto!
            </h2>
            <p className="text-[#e5e2e1]/70 mb-4">
              Hai completato tutti i passaggi. Inizia subito a usare Andamus!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/${locale}/cerca`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
              >
                <Search className="w-5 h-5" />
                Cerca un passaggio
              </Link>
              <Link
                href={`/${locale}/offri`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
              >
                <Car className="w-5 h-5" />
                Offri un passaggio
              </Link>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#e5e2e1]/40">
            Andamus v1.0 - Il carpooling dei sardi
          </p>
        </div>
      </div>
    </div>
  );
}

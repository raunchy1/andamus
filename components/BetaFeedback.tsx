"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Star, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type FeedbackType = "praise" | "issue" | "idea";

export function BetaFeedback() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!type || !message.trim() || rating === 0) {
      toast.error("Compila tutti i campi");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rating, message: message.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSubmitted(true);
      toast.success("Grazie per il tuo feedback! 🙏");
    } catch {
      toast.error("Errore nell'invio. Riprova più tardi.");
    } finally {
      setSending(false);
    }
  }, [type, message, rating]);

  const reset = useCallback(() => {
    setOpen(false);
    setSubmitted(false);
    setType(null);
    setRating(0);
    setMessage("");
  }, []);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring" }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 rounded-full bg-[#e63946] text-white shadow-lg shadow-[#e63946]/30 flex items-center justify-center hover:bg-[#c92a37] transition-colors"
        title="Feedback beta"
      >
        <MessageSquare className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={reset} />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-4 mb-4 sm:mb-0"
            >
              <div className="bg-[#131313] border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Feedback Beta</h3>
                    <p className="text-xs text-white/40">Aiutaci a migliorare Andamus</p>
                  </div>
                  <button onClick={reset} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <ThumbsUp className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-xl font-bold text-white mb-1">Grazie!</h4>
                    <p className="text-white/60 text-sm">Il tuo feedback ci aiuta a costruire un servizio migliore.</p>
                    <button
                      onClick={reset}
                      className="mt-4 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors text-sm"
                    >
                      Chiudi
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Type selector */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { id: "praise" as FeedbackType, label: "Mi piace", icon: ThumbsUp },
                        { id: "issue" as FeedbackType, label: "Problema", icon: AlertCircle },
                        { id: "idea" as FeedbackType, label: "Idea", icon: MessageSquare },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setType(item.id)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                            type === item.id
                              ? "border-[#e63946]/50 bg-[#e63946]/10 text-white"
                              : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Rating */}
                    <div className="mb-4">
                      <label className="text-xs text-white/40 mb-2 block">Come valuti l'esperienza?</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setRating(n)}
                            className="p-1 transition-colors"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                n <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descrivi la tua esperienza..."
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#e63946]/30 resize-none mb-4"
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={sending || !type || !message.trim() || rating === 0}
                      className="w-full py-2.5 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Invia feedback
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

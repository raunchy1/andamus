"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, AlertCircle, CheckCircle, Clock, Check, X } from "lucide-react";
import { resolveFeedback } from "@/lib/admin-actions";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  type: "praise" | "issue" | "idea";
  rating: number;
  message: string;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
  profiles: { name?: string; email?: string } | null;
}

const typeIcons = {
  praise: ThumbsUp,
  issue: AlertCircle,
  idea: MessageSquare,
};

const typeColors = {
  praise: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  issue: "text-red-400 bg-red-400/10 border-red-400/20",
  idea: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

export function FeedbackList({ initialItems }: { initialItems: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  const handleResolve = useCallback(async (id: string) => {
    try {
      await resolveFeedback(id, noteInput || undefined);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, resolved_at: new Date().toISOString(), notes: noteInput || item.notes }
            : item
        )
      );
      setShowNoteFor(null);
      setNoteInput("");
      toast.success("Feedback risolto");
    } catch {
      toast.error("Errore nella risoluzione");
    }
  }, [noteInput]);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-16 text-white/40">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nessun feedback ancora</p>
        </div>
      )}

      <AnimatePresence>
        {items.map((item) => {
          const Icon = typeIcons[item.type];
          const isResolved = !!item.resolved_at;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white/[0.02] border rounded-2xl p-5 transition-colors ${
                isResolved ? "border-white/5 opacity-60" : "border-white/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[item.type].replace("text-", "bg-").replace("border-", "")}`}
                >
                  <Icon className={`w-5 h-5 ${typeColors[item.type].split(" ")[0]}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.profiles?.name || "Anonimo"}</span>
                      <span className="text-[10px] text-white/30">{item.profiles?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${
                              n <= item.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      {isResolved ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Risolto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                          <Clock className="w-3 h-3" /> Aperto
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  {item.notes && (
                    <p className="text-xs text-emerald-400/70 mt-2">
                      Nota: {item.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-white/30">
                      {new Date(item.created_at).toLocaleString("it-IT")}
                    </span>

                    {!isResolved && (
                      <>
                        {showNoteFor === item.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Nota interna..."
                              className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30"
                            />
                            <button
                              onClick={() => handleResolve(item.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Risolvi
                            </button>
                            <button
                              onClick={() => { setShowNoteFor(null); setNoteInput(""); }}
                              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <X className="w-3 h-3 text-white/40" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNoteFor(item.id)}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                          >
                            Risolvi
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

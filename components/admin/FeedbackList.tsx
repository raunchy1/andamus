"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  Clock,
  Check,
  X,
} from "lucide-react";
import { resolveFeedback } from "@/lib/admin-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function StatusBadge({
  variant,
  label,
}: {
  variant: "ok" | "pending";
  label: string;
}) {
  const dotClass =
    variant === "ok" ? "bg-ok/70" : "bg-pending/70";
  const textClass = variant === "ok" ? "text-ok" : "text-pending";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[10px] lowercase",
        textClass
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

export function FeedbackList({ initialItems }: { initialItems: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  const handleResolve = useCallback(
    async (id: string) => {
      try {
        await resolveFeedback(id, noteInput || undefined);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  resolved_at: new Date().toISOString(),
                  notes: noteInput || item.notes,
                }
              : item
          )
        );
        setShowNoteFor(null);
        setNoteInput("");
        toast.success("Feedback risolto");
      } catch {
        toast.error("Errore nella risoluzione");
      }
    },
    [noteInput]
  );

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="py-16 text-center text-muted">
          <MessageSquare
            className="mx-auto mb-3 size-12 opacity-30"
            strokeWidth={1.5}
          />
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
              className={cn(
                "rounded-[var(--radius)] border bg-surface p-5 transition-colors",
                isResolved
                  ? "border-line opacity-60"
                  : "border-line"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
                  <Icon className="size-5 text-muted" strokeWidth={1.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg">
                        {item.profiles?.name || "Anonimo"}
                      </span>
                      <span className="font-mono text-[10px] text-dim">
                        {item.profiles?.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={cn(
                              "size-3",
                              n <= item.rating
                                ? "fill-accent text-accent"
                                : "text-dim/30"
                            )}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                      {isResolved ? (
                        <StatusBadge variant="ok" label="risolto" />
                      ) : (
                        <StatusBadge variant="pending" label="aperto" />
                      )}
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {item.message}
                  </p>

                  {item.notes && (
                    <p className="mt-2 font-mono text-xs text-dim">
                      Nota: {item.notes}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-dim">
                      {new Date(item.created_at).toLocaleString("it-IT")}
                    </span>

                    {!isResolved && (
                      <>
                        {showNoteFor === item.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Nota interna..."
                              className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-fg placeholder:text-dim focus:border-accent focus:outline-none"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleResolve(item.id)}
                              className="h-8 gap-1 px-3 text-xs"
                            >
                              <Check className="size-3" strokeWidth={1.5} />
                              risolvi
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNoteFor(null);
                                setNoteInput("");
                              }}
                              className="rounded-[var(--radius-sm)] p-1 transition-colors hover:bg-surface-2"
                            >
                              <X
                                className="size-3 text-dim"
                                strokeWidth={1.5}
                              />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowNoteFor(item.id)}
                            className="font-mono text-[10px] text-accent transition-colors hover:text-fg"
                          >
                            risolvi
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
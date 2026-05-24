"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCalendar } from "./premium-calendar";
import { useDeviceType } from "@/components/view-mode";

export interface PremiumDatePickerProps {
  date?: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClear?: () => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  label?: string;
  availabilityData?: Record<string, number>;
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PremiumDatePicker({
  date,
  onSelect,
  onClear,
  min,
  max,
  placeholder = "Seleziona data",
  className,
  label = "Data",
  availabilityData,
}: PremiumDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";

  const selectedDate = parseDate(date);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const handleSelect = (d: Date) => {
    onSelect(formatDate(d));
    setOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setOpen(false);
  };

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : placeholder;

  const isDisabled = (d: Date): boolean => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  // Close on ESC
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  // Lock body scroll on mobile when open
  React.useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, open]);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-4 w-full px-5 py-4 rounded-2xl",
          "transition-all cursor-pointer min-w-0 text-left"
        )}
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #141414 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-[#e63946]/10 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-[#e63946]" />
        </div>
        <div className="flex flex-col w-full min-w-0">
          {label && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b] mb-0.5">
              {label}
            </span>
          )}
          <span
            className={cn(
              "text-sm font-semibold truncate",
              selectedDate ? "text-[#f8f8f8]" : "text-[#444444]"
            )}
          >
            {displayDate}
          </span>
        </div>
        {selectedDate && onClear && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-[#444444] hover:text-[#a0a0a0]" />
          </button>
        )}
      </motion.button>

      {/* Overlay + Picker */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm",
                isMobile ? "" : ""
              )}
              onClick={() => setOpen(false)}
            />

            {/* Picker Container */}
            <motion.div
              initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: -10 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: -10 }}
              transition={isMobile
                ? { type: "spring", damping: 28, stiffness: 350 }
                : { type: "spring", damping: 25, stiffness: 300 }
              }
              className={cn(
                "fixed z-[101] overflow-hidden",
                isMobile
                  ? "inset-x-0 bottom-0 rounded-t-3xl"
                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl"
              )}
              style={{
                width: isMobile ? "100%" : "auto",
                maxWidth: isMobile ? "100%" : "520px",
              }}
            >
              <div
                className={cn(
                  "bg-[#0f0f12]/95 backdrop-blur-2xl",
                  "border border-white/10",
                  "shadow-[0_0_80px_rgba(230,57,70,0.12)]",
                  isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""
                )}
              >
                {/* Mobile drag handle */}
                {isMobile && (
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-sm font-bold text-white">Selectează data</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Calendar */}
                <div className="px-2 pb-4">
                  <PremiumCalendar
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={isDisabled}
                    availabilityData={availabilityData}
                    onClose={() => setOpen(false)}
                  />
                </div>

                {/* Mobile sticky action */}
                {isMobile && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full py-3.5 rounded-xl bg-[#e63946] text-white font-semibold text-sm hover:bg-[#c92a37] transition-colors"
                    >
                      Confirmă
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCalendar } from "./premium-calendar";
import { useDeviceType } from "@/components/view-mode";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export interface PremiumDatePickerProps {
  date?: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClear?: () => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  label?: string;
  triggerClassName?: string;
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
  triggerClassName,
  availabilityData,
}: PremiumDatePickerProps) {
  const locale = useLocale();
  const t = useTranslations("calendar");

  const resolvedPlaceholder = placeholder === "Seleziona data" ? t("selectDate") : placeholder;
  const resolvedLabel = label === "Data" ? t("selectedDate") : label;

  const [open, setOpen] = React.useState(false);
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";

  const selectedDate = parseDate(date);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const handleSelect = (d: Date) => {
    onSelect(formatDate(d));
    // On mobile the sheet keeps the day summary visible and closes on Conferma.
    if (!isMobile) setOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setOpen(false);
  };

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : resolvedPlaceholder;

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
      <motion.div
        role="button"
        tabIndex={0}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex items-center gap-3 w-full h-12 px-4 rounded-[var(--radius-sm)] border border-line bg-surface-2 transition-colors cursor-pointer min-w-0 text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/30 hover:border-line-strong",
          triggerClassName
        )}
      >
        <Calendar className="w-5 h-5 text-muted flex-shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col w-full min-w-0">
          {resolvedLabel ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim mb-0.5">
              {resolvedLabel}
            </span>
          ) : null}
          <span
            className={cn(
              "text-base font-medium truncate",
              selectedDate ? "text-fg" : "text-dim"
            )}
          >
            {displayDate}
          </span>
        </div>
        {selectedDate && onClear && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors flex-shrink-0"
            type="button"
            aria-label="Cancella data"
          >
            <X className="w-3.5 h-3.5 text-dim hover:text-muted" strokeWidth={1.5} />
          </button>
        )}
      </motion.div>

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
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
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
                  ? "inset-x-0 bottom-0 rounded-t-[var(--radius)]"
                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)]"
              )}
              style={{
                width: isMobile ? "100%" : "380px",
                maxWidth: isMobile ? "100%" : "420px",
              }}
            >
              <div
                className={cn(
                  "bg-surface border border-line shadow-2xl flex flex-col",
                  isMobile ? "max-h-[88dvh] pb-[env(safe-area-inset-bottom)]" : "max-h-[86vh]"
                )}
              >
                {/* Grabber / close */}
                <div className="relative flex items-center justify-center pt-2.5 pb-1 flex-shrink-0">
                  {isMobile && <div className="w-10 h-1 rounded-full bg-line" />}
                  <button
                    onClick={() => setOpen(false)}
                    className={cn(
                      "absolute right-3 p-2 rounded-full text-muted hover:text-ink hover:bg-surface-2 transition-colors",
                      isMobile ? "top-1.5" : "top-2"
                    )}
                    type="button"
                    aria-label={t("close")}
                  >
                    <X className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                </div>

                {/* Calendar */}
                <div className="flex-1 min-h-0 overflow-y-auto pt-2" style={{ overscrollBehavior: "contain" }}>
                  <PremiumCalendar
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={isDisabled}
                    availabilityData={availabilityData}
                    label={resolvedLabel || resolvedPlaceholder}
                    onClose={() => setOpen(false)}
                  />
                </div>

                {/* Mobile sticky action */}
                {isMobile && (
                  <div className="px-5 pt-3 pb-4 flex-shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      {t("confirm")}
                    </Button>
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
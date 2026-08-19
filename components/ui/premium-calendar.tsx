"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

export interface PremiumCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  min?: Date;
  max?: Date;
  onClose?: () => void;
  availabilityData?: Record<string, number>; // "YYYY-MM-DD" -> count
  /** Eyebrow above the month title — the field this calendar fills in. */
  label?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PremiumCalendar({
  selected,
  onSelect,
  disabled,
  min,
  max,
  availabilityData,
  label,
}: PremiumCalendarProps) {
  const locale = useLocale();
  const t = useTranslations("calendar");

  const WEEKDAYS = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      // 2026-05-25 is a Monday
      const d = new Date(2026, 4, 25 + i);
      return formatter.format(d).replace(/\.$/, "");
    });
  }, [locale]);

  const MONTHS = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2026, i, 1)));
  }, [locale]);

  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [direction, setDirection] = React.useState(0);
  const today = React.useMemo(() => new Date(), []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const isOutOfRange = React.useCallback(
    (d: Date) => Boolean(disabled?.(d)) || (min ? d < min : false) || (max ? d > max : false),
    [disabled, min, max]
  );

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(new Date(year, month + delta, 1));
  };

  const handleSelect = (day: number) => {
    const date = new Date(year, month, day);
    if (isOutOfRange(date)) return;
    onSelect?.(date);
  };

  const quickDates = React.useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const tomorrow = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    // Next Saturday (today, when today is a Saturday)
    const weekday = now.getDay();
    const untilSaturday = weekday === 6 ? 0 : (6 - weekday + 7) % 7;
    const saturday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + untilSaturday));
    return [
      { key: "today", label: t("today"), date: startOfDay(now) },
      { key: "tomorrow", label: t("tomorrow"), date: tomorrow },
      { key: "weekend", label: t("weekend"), date: saturday },
    ];
  }, [t]);

  const handleQuickSelect = (date: Date) => {
    if (isOutOfRange(date)) return;
    setDirection(date > currentMonth ? 1 : -1);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onSelect?.(date);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Availability is optional: without it the cells lose the count line and tighten up.
  const hasAvailability = Boolean(availabilityData && Object.keys(availabilityData).length > 0);
  const cellHeight = hasAvailability ? "h-[54px]" : "h-12";
  const selectedCount = selected && availabilityData ? availabilityData[formatDateKey(selected)] : undefined;

  const monthVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div className="flex flex-col">
      {/* Month header */}
      <div className="flex items-end justify-between gap-3 px-5 pb-3.5">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint truncate">
            {label || t("selectDate")}
          </span>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="flex items-baseline gap-1.5"
            >
              <span className="text-[26px] leading-none font-bold tracking-[-0.03em] text-ink lowercase">
                {MONTHS[month]}
              </span>
              <span className="text-[26px] leading-none font-medium tracking-[-0.03em] text-faint">{year}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigateMonth(-1)}
            aria-label={t("prevMonth")}
            className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-line-strong transition-colors"
          >
            <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={1.6} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => navigateMonth(1)}
            aria-label={t("nextMonth")}
            className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-ink hover:border-line-strong transition-colors"
          >
            <ChevronRight className="w-[18px] h-[18px]" strokeWidth={1.6} />
          </motion.button>
        </div>
      </div>

      {/* Quick picks */}
      <div className="flex gap-2 px-5 pb-3.5">
        {quickDates.map((q) => {
          const active = selected ? isSameDay(selected, q.date) : false;
          const unavailable = isOutOfRange(q.date);
          return (
            <motion.button
              key={q.key}
              type="button"
              whileTap={!unavailable ? { scale: 0.97 } : {}}
              onClick={() => handleQuickSelect(q.date)}
              disabled={unavailable}
              className={cn(
                "h-[34px] px-3.5 rounded-[10px] border text-[13px] font-medium transition-colors",
                active
                  ? "border-accent bg-accent-dim text-accent"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                unavailable && "opacity-40 cursor-not-allowed"
              )}
            >
              {q.label}
            </motion.button>
          );
        })}
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 px-3.5 pb-1.5 border-b border-line-soft">
        {WEEKDAYS.map((d, i) => (
          <span
            key={d}
            className={cn(
              "text-center font-mono text-[10px] uppercase tracking-[0.1em]",
              i > 4 ? "text-faint/70" : "text-faint"
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${year}-${month}`}
          custom={direction}
          variants={monthVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="grid grid-cols-7 gap-0.5 px-3.5 pt-1.5 pb-2"
        >
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className={cellHeight} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const isSelected = selected ? isSameDay(date, selected) : false;
            const isToday = isSameDay(date, today);
            const unavailable = isOutOfRange(date);
            const count = availabilityData?.[formatDateKey(date)];
            const showCount = !unavailable && count !== undefined && count > 0;

            return (
              <motion.button
                key={day}
                type="button"
                whileTap={!unavailable ? { scale: 0.94 } : {}}
                onClick={() => handleSelect(day)}
                disabled={unavailable}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  cellHeight,
                  "rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  isSelected && "bg-accent",
                  !isSelected && isToday && "bg-accent-dim",
                  !isSelected && !isToday && !unavailable && "hover:bg-surface-2",
                  unavailable && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "text-[15px] tracking-[-0.01em]",
                    isSelected || isToday ? "font-bold" : "font-medium",
                    isSelected
                      ? "text-accent-fg"
                      : unavailable
                        ? "text-faint/45"
                        : isToday
                          ? "text-accent"
                          : "text-ink"
                  )}
                >
                  {day}
                </span>
                {hasAvailability && (
                <span
                  className={cn(
                    "font-mono text-[10px] leading-none min-h-[10px]",
                    isSelected
                      ? "text-accent-fg/75"
                      : !showCount
                        ? "text-transparent"
                        : count >= 5
                          ? "text-accent"
                          : count >= 2
                            ? "text-pending"
                            : "text-faint"
                  )}
                >
                  {showCount ? count : ""}
                </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selected day summary */}
      {selected && (
        <div className="px-5 pt-3 pb-1 border-t border-line-soft">
          <motion.div
            key={selected.toISOString()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-0.5"
          >
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink lowercase">
              {selected.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
            </span>
            {selectedCount !== undefined && (
              <span className="font-mono text-[11px] text-muted">
                {t("ridesOnDay", { count: selectedCount })}
              </span>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

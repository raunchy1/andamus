"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, Sun, CloudSun, Sunrise } from "lucide-react";
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
  onClose,
  availabilityData,
}: PremiumCalendarProps) {
  const locale = useLocale();
  const t = useTranslations("calendar");

  const WEEKDAYS = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      // 2026-05-25 is a Monday
      const d = new Date(2026, 4, 25 + i);
      const dayStr = formatter.format(d);
      const clean = dayStr.replace(/\.$/, "");
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    });
  }, [locale]);

  const MONTHS = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2026, i, 1);
      const monthStr = formatter.format(d);
      return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    });
  }, [locale]);

  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [direction, setDirection] = React.useState(0);
  const today = React.useMemo(() => new Date(), []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(new Date(year, month + delta, 1));
  };

  const handleSelect = (day: number) => {
    const date = new Date(year, month, day);
    if (disabled?.(date)) return;
    if (min && date < min) return;
    if (max && date > max) return;
    onSelect?.(date);
  };

  const handleQuickSelect = (type: "today" | "tomorrow" | "weekend") => {
    const now = new Date();
    let target: Date;
    if (type === "today") {
      target = now;
    } else if (type === "tomorrow") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      // Next Saturday
      const day = now.getDay();
      const daysUntilSat = day === 0 ? 6 : 6 - day;
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSat);
    }
    if (disabled?.(target)) return;
    if (min && target < min) return;
    if (max && target > max) return;
    onSelect?.(target);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedDayInfo = selected
    ? {
        weekday: selected.toLocaleDateString(locale, { weekday: "long" }),
        day: selected.getDate(),
        month: MONTHS[selected.getMonth()],
        year: selected.getFullYear(),
      }
    : null;

  const totalAvailable = availabilityData
    ? Object.values(availabilityData).reduce((a, b) => a + b, 0)
    : null;

  const monthVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="flex flex-col sm:flex-row gap-0 sm:gap-1">
      {/* Left Panel — Selected Day Info + Quick Actions */}
      <div className="sm:w-52 p-5 sm:border-r border-white/5 flex flex-col justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-muted" strokeWidth={1.5} />
            <span className="text-eyebrow">{t("selectedDate")}</span>
          </div>

          {selectedDayInfo ? (
            <motion.div
              key={selected?.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center sm:text-left"
            >
              <p className="text-xs text-[#6b6b6b] capitalize">{selectedDayInfo.weekday}</p>
              <p className="text-5xl font-heading font-bold text-[#f8f8f8] tracking-tighter leading-none mt-1">{selectedDayInfo.day}</p>
              <p className="text-sm font-semibold text-[#a0a0a0] mt-1">{selectedDayInfo.month} {selectedDayInfo.year}</p>
            </motion.div>
          ) : (
            <div className="text-center sm:text-left py-4">
              <p className="text-sm text-[#444444]">{t("selectDate")}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <QuickButton icon={<Sun className="w-3.5 h-3.5" />} label={t("today")} onClick={() => handleQuickSelect("today")} />
            <QuickButton icon={<Sunrise className="w-3.5 h-3.5" />} label={t("tomorrow")} onClick={() => handleQuickSelect("tomorrow")} />
            <QuickButton icon={<CloudSun className="w-3.5 h-3.5" />} label={t("weekend")} onClick={() => handleQuickSelect("weekend")} />
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 pt-4 border-t border-white/5">
          {totalAvailable !== null && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11px] text-[#6b6b6b]">
                {t("ridesAvailable", { count: totalAvailable })}
              </span>
            </div>
          )}
          <p className="text-[10px] text-[#444444] mt-2 leading-relaxed">
            {t("calendarInfo")}
          </p>
        </div>
      </div>

      {/* Right Panel — Calendar Grid */}
      <div className="flex-1 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(-1)}
            className="w-9 h-9 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-muted hover:text-fg hover:bg-surface hover:border-line-strong transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.span
              key={`${year}-${month}`}
              custom={direction}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-white font-bold text-base tracking-tight"
            >
              {MONTHS[month]} <span className="text-white/40 font-semibold">{year}</span>
            </motion.span>
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth(1)}
            className="w-9 h-9 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-muted hover:text-fg hover:bg-surface hover:border-line-strong transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="h-9 flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#444444]">{d}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={monthVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="grid grid-cols-7 gap-1"
          >
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-11" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const isSelected = selected && isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              const isDisabled = disabled?.(date) || (min && date < min) || (max && date > max);
              const availCount = availabilityData?.[formatDateKey(date)];

              return (
                <motion.button
                  key={day}
                  whileHover={!isDisabled ? { scale: 1.08 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                  onClick={() => handleSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "relative h-11 rounded-xl flex flex-col items-center justify-center transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    isSelected && [
                      "bg-accent text-accent-fg",
                      "border border-accent/30"
                    ],
                    !isSelected && isToday && [
                      "border border-accent/50",
                      "text-accent font-bold",
                      "bg-accent-dim"
                    ],
                    !isSelected && !isToday && !isDisabled && [
                      "text-[#a0a0a0] hover:bg-white/[0.05] hover:text-[#f8f8f8]",
                      "bg-white/[0.02]"
                    ],
                    isDisabled && "opacity-20 cursor-not-allowed text-[#444444]"
                  )}
                >
                  <span className={cn("text-sm font-semibold", isSelected && "text-white")}>{day}</span>
                  {availCount !== undefined && !isSelected && !isDisabled && availCount > 0 && (
                    <span className={cn(
                      "absolute bottom-1 w-1 h-1 rounded-full",
                      availCount >= 5 ? "bg-emerald-400" : availCount >= 2 ? "bg-yellow-400" : "bg-white/30"
                    )} />
                  )}
                  {isToday && !isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-4">
          <LegendDot color="bg-emerald-400" label={t("legend5Plus")} />
          <LegendDot color="bg-yellow-400" label={t("legend2To4")} />
          <LegendDot color="bg-white/30" label={t("legend1")} />
        </div>
      </div>
    </div>
  );
}

function QuickButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-surface-2 border border-line hover:bg-surface hover:border-line-strong transition-all group"
    >
      <span className="text-muted group-hover:text-accent transition-colors">{icon}</span>
      <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{label}</span>
    </motion.button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
      <span className="text-[10px] text-white/30">{label}</span>
    </div>
  );
}

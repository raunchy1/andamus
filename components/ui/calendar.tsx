"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  locale?: string;
  todayButtonText?: string;
  clearButtonText?: string;
  onTodayClick?: () => void;
  onClearClick?: () => void;
};

const WEEKDAYS = ["L", "M", "M", "G", "V", "S", "D"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday, 1 = Monday, etc.
  const day = new Date(year, month, 1).getDay();
  // Convert to Monday = 0
  return day === 0 ? 6 : day - 1;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function _formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  todayButtonText = "Oggi",
  clearButtonText = "Șterge",
  onTodayClick,
  onClearClick,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  );
  const today = new Date();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(year, month, day);
    if (disabled?.(selectedDate)) return;
    onSelect?.(selectedDate);
  };

  const handleToday = () => {
    const todayDate = new Date();
    setCurrentMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    onTodayClick?.();
    onSelect?.(todayDate);
  };

  const handleClear = () => {
    onClearClick?.();
    onSelect?.(undefined);
  };

  const days: React.ReactElement[] = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(
      <div key={`empty-${i}`} className="h-9 w-9" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isSelected = selected && isSameDay(date, selected);
    const isToday = isSameDay(date, today);
    const isDisabled = disabled?.(date);

    days.push(
      <button
        key={day}
        onClick={() => handleSelectDate(day)}
        disabled={isDisabled}
        className={cn(
          "h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:bg-white/10 hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-[#e63946]/50",
          isSelected && [
            "bg-[#e63946] text-white",
            "hover:bg-[#e63946]/90",
            "shadow-[0_0_15px_rgba(230,57,70,0.4)]"
          ],
          !isSelected && isToday && "text-[#e63946] border border-[#e63946]/50",
          !isSelected && !isToday && "text-[#e5e2e1]",
          isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={handlePreviousMonth}
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#e5e2e1]/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Luna precedenta"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[#e5e2e1] font-semibold text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={handleNextMonth}
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#e5e2e1]/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Luna urmatoare"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="h-9 w-9 flex items-center justify-center text-[#e5e2e1]/50 text-xs font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {days}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <button
          onClick={handleClear}
          className="text-sm text-[#e5e2e1]/50 hover:text-white transition-colors font-medium"
        >
          {clearButtonText}
        </button>
        <button
          onClick={handleToday}
          className="text-sm text-[#e5e2e1]/50 hover:text-white transition-colors font-medium"
        >
          {todayButtonText}
        </button>
      </div>
    </div>
  );
}

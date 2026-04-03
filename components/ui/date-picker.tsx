"use client";

import * as React from "react";
// Native date formatting - no external dependency needed
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

interface DatePickerProps {
  date?: string;
  onSelect: (date: string) => void;
  onClear?: () => void;
  min?: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function DatePicker({
  date,
  onSelect,
  onClear,
  min,
  placeholder = "Seleziona data",
  className,
  label = "Data",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const selectedDate = date ? new Date(date + "T00:00:00") : undefined;
  const minDate = min ? new Date(min + "T00:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD in local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onSelect(`${year}-${month}-${day}`);
      setOpen(false);
    } else {
      onClear?.();
    }
  };

  const handleClear = () => {
    onClear?.();
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    onSelect(`${year}-${month}-${day}`);
    setOpen(false);
  };

  const isDisabled = (date: Date): boolean => {
    if (!minDate) return false;
    return date < minDate;
  };

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <div
            className={cn(
              "flex items-center gap-4 px-5 py-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 cursor-pointer min-w-0",
              className
            )}
          >
            <CalendarIcon className="w-5 h-5 text-[#ffb3b1] flex-shrink-0" />
            <div className="flex flex-col w-full min-w-0">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#e5e2e1]/40 mb-1">
                {label}
              </label>
              <span
                className={cn(
                  "text-base truncate",
                  selectedDate ? "text-[#e5e2e1]" : "text-[#e5e2e1]/50"
                )}
              >
                {displayDate}
              </span>
            </div>
          </div>
        }
      />
      <PopoverContent className="w-auto p-0 bg-[#1a1a1a]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDisabled}
            todayButtonText="Astăzi"
            clearButtonText="Șterge"
            onTodayClick={handleToday}
            onClearClick={handleClear}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocationCombobox } from "@/components/LocationCombobox";

interface StopsSectionProps {
  stops: string[];
  onChange: (stops: string[]) => void;
  variant?: "mobile" | "desktop";
  className?: string;
  errors?: { stops?: string };
}

export function StopsSection({
  stops,
  onChange,
  variant = "mobile",
  className = "",
  errors,
}: StopsSectionProps) {
  const t = useTranslations("offer");
  const labelSize = variant === "desktop" ? "text-[11px]" : "text-[10px]";

  return (
    <div className={`space-y-4 ${className}`}>
      <label className={`font-semibold uppercase tracking-widest ${labelSize} text-outline block`}>
        {t("intermediateStops")}
      </label>
      <div className="space-y-3">
        {stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <LocationCombobox
                value={stop}
                onChange={(val) => {
                  const next = [...stops];
                  next[index] = val;
                  onChange(next);
                }}
                placeholder={t("cityPlaceholder")}
                buttonClassName="bg-surface-container-highest border-none h-12"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const next = stops.filter((_, i) => i !== index);
                onChange(next);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        {stops.length < 3 && (
          <button
            type="button"
            onClick={() => onChange([...stops, ""])}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-2 text-sm font-medium text-outline hover:bg-surface-container-low transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addStop")}
          </button>
        )}
        {errors?.stops && <p className="text-sm text-error">{errors.stops}</p>}
      </div>
    </div>
  );
}

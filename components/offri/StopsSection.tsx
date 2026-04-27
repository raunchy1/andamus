"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface StopsSectionProps {
  stops: string[];
  cities: string[];
  onChange: (stops: string[] | string | boolean | number[]) => void;
  variant?: "mobile" | "desktop";
  className?: string;
  errors?: { stops?: string };
}

export function StopsSection({
  stops,
  cities,
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
            <select
              value={stop}
              onChange={(e) => {
                const next = [...stops];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="h-12 flex-1 rounded-xl border-none bg-surface-container-highest pl-4 pr-10 text-on-surface font-semibold outline-none focus:ring-1 focus:ring-primary appearance-none"
            >
              <option value="">{t("cityPlaceholder")}</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const next = stops.filter((_, i) => i !== index);
                onChange(next);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80"
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

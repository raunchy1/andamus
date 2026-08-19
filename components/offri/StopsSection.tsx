"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocationCombobox } from "@/components/LocationCombobox";
import { cn } from "@/lib/utils";

interface StopsSectionProps {
  stops: string[];
  onChange: (stops: string[]) => void;
  className?: string;
  errors?: { stops?: string };
}

const MAX_STOPS = 3;

export function StopsSection({ stops, onChange, className = "", errors }: StopsSectionProps) {
  const t = useTranslations("offer");

  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      <h2 className="text-[15px] font-semibold text-ink">{t("step1.stops")}</h2>

      {stops.length > 0 && (
        <div className="flex flex-col gap-2">
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <LocationCombobox
                  value={stop}
                  onChange={(val) => {
                    const next = [...stops];
                    next[index] = val;
                    onChange(next);
                  }}
                  placeholder={t("step1.stopNumber", { n: index + 1 })}
                />
              </div>
              <button
                type="button"
                aria-label={t("step1.removeStop")}
                onClick={() => onChange(stops.filter((_, i) => i !== index))}
                className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <X className="size-4" strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
      )}

      {stops.length < MAX_STOPS && (
        <button
          type="button"
          onClick={() => onChange([...stops, ""])}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-track bg-surface px-4 py-3.5 text-left transition-colors hover:border-accent"
        >
          <Plus className="size-[18px] flex-shrink-0 text-accent" strokeWidth={1.7} />
          <span className="flex flex-col gap-px">
            <span className="text-[15px] font-medium text-ink">{t("step1.addStop")}</span>
            {stops.length === 0 && (
              <span className="text-xs text-faint">{t("step1.addStopHint")}</span>
            )}
          </span>
        </button>
      )}

      {errors?.stops && <p className="text-sm text-bad">{errors.stops}</p>}
    </section>
  );
}

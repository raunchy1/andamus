"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocationCombobox } from "@/components/LocationCombobox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  className = "",
  errors,
}: StopsSectionProps) {
  const t = useTranslations("offer");

  if (stops.length === 0) {
    return (
      <section className={`space-y-3 ${className}`}>
        <p className="text-eyebrow">{t("intermediateStops")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([""])}
          className="gap-2"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          {t("addStop")}
        </Button>
        <Separator />
      </section>
    );
  }

  return (
    <section className={`space-y-3 ${className}`}>
      <p className="text-eyebrow">{t("intermediateStops")}</p>
      <div className="space-y-2">
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
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const next = stops.filter((_, i) => i !== index);
                onChange(next);
              }}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
        {stops.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...stops, ""])}
            className="gap-2"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            {t("addStop")}
          </Button>
        )}
        {errors?.stops && <p className="text-sm text-bad">{errors.stops}</p>}
      </div>
      <Separator />
    </section>
  );
}
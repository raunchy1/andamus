"use client";

import { useTranslations } from "next-intl";
import { Car } from "lucide-react";

import { cn } from "@/lib/utils";

interface SavedCarInfo {
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
}

interface CarInfoSectionProps {
  carModel: string;
  carColor: string;
  carYear: string;
  carPlate: string;
  useSavedCar: boolean;
  savedCarInfo?: SavedCarInfo | null;
  onChange: (field: string, value: string | boolean | string[] | number[]) => void;
  className?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
  inputMode,
  maxLength,
  uppercase,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  uppercase?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        type="text"
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink transition-colors",
          "placeholder:text-faint focus-visible:border-accent focus-visible:outline-none",
          uppercase && "uppercase"
        )}
      />
    </label>
  );
}

export function CarInfoSection({
  carModel,
  carColor,
  carYear,
  carPlate,
  useSavedCar,
  savedCarInfo,
  onChange,
  className = "",
}: CarInfoSectionProps) {
  const t = useTranslations("offer");

  const hasSavedCar = Boolean(savedCarInfo?.car_model);
  const savedSubtitle = [savedCarInfo?.car_year, savedCarInfo?.car_plate]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h2 className="text-[15px] font-semibold text-ink">{t("step3.car")}</h2>

      {hasSavedCar && useSavedCar ? (
        <button
          type="button"
          onClick={() => onChange("useSavedCar", false)}
          className="flex items-center gap-3 rounded-2xl border border-accent bg-surface p-4 text-left"
        >
          <span className="flex size-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-dim">
            <Car className="size-5 text-accent" strokeWidth={1.6} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold text-ink">
              {savedCarInfo?.car_model}
              {savedCarInfo?.car_color && ` · ${savedCarInfo.car_color}`}
            </span>
            {savedSubtitle && (
              <span className="font-mono text-[11px] text-muted">{savedSubtitle}</span>
            )}
          </span>
          <span className="flex-shrink-0 text-sm font-medium text-accent">
            {t("step3.carChange")}
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <Field
            label={t("step3.carModel")}
            placeholder={t("step3.carModelPlaceholder")}
            value={carModel}
            onChange={(v) => onChange("carModel", v)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Field
              label={t("step3.carColor")}
              placeholder={t("step3.carColorPlaceholder")}
              value={carColor}
              onChange={(v) => onChange("carColor", v)}
            />
            <Field
              label={t("step3.carYear")}
              placeholder={t("step3.carYearPlaceholder")}
              value={carYear}
              inputMode="numeric"
              onChange={(v) => onChange("carYear", v.replace(/\D/g, "").slice(0, 4))}
            />
            <Field
              label={t("step3.carPlate")}
              placeholder={t("step3.carPlatePlaceholder")}
              value={carPlate}
              uppercase
              onChange={(v) => onChange("carPlate", v.toUpperCase().slice(0, 7))}
            />
          </div>
          {hasSavedCar && (
            <button
              type="button"
              onClick={() => onChange("useSavedCar", true)}
              className="self-start text-sm font-medium text-accent"
            >
              {t("step3.carUseSaved")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

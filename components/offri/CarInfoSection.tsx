"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface SavedCarInfo {
  car_model?: string | null;
  car_color?: string | null;
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

  return (
    <section className={`space-y-4 ${className}`}>
      <p className="text-eyebrow">{t("vehicle")}</p>

      {savedCarInfo?.car_model && (
        <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
          <input
            type="checkbox"
            checked={useSavedCar}
            onChange={(e) => onChange("useSavedCar", e.target.checked)}
            className="size-4 rounded border-line text-accent focus:ring-accent/30"
          />
          <span className="text-sm text-fg">
            {t("useSavedCar")}:{" "}
            <span className="font-medium">{savedCarInfo.car_model}</span>
            {savedCarInfo.car_color && (
              <span className="text-muted"> ({savedCarInfo.car_color})</span>
            )}
          </span>
        </label>
      )}

      {(!useSavedCar || !savedCarInfo?.car_model) && (
        <div className="space-y-3">
          <Input
            placeholder={t("carModelPlaceholder")}
            value={carModel}
            onChange={(e) => onChange("carModel", e.target.value)}
            className="font-mono"
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder={t("carColorPlaceholder")}
              value={carColor}
              onChange={(e) => onChange("carColor", e.target.value)}
              className="font-mono text-sm"
            />
            <Input
              placeholder={t("carYearPlaceholder")}
              value={carYear}
              onChange={(e) =>
                onChange("carYear", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="font-mono text-sm tabular-nums"
            />
            <Input
              placeholder={t("carPlatePlaceholder")}
              value={carPlate}
              onChange={(e) =>
                onChange("carPlate", e.target.value.toUpperCase().slice(0, 7))
              }
              className="font-mono text-sm uppercase"
            />
          </div>
        </div>
      )}

      <Separator />
    </section>
  );
}
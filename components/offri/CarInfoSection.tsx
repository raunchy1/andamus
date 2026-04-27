"use client";

import { useTranslations } from "next-intl";

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
    <div className={`space-y-4 ${className}`}>
      <label className="font-semibold uppercase tracking-widest text-[10px] text-outline block">
        {t("vehicle")}
      </label>

      {savedCarInfo?.car_model && (
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="useSavedCar"
            checked={useSavedCar}
            onChange={(e) => onChange("useSavedCar", e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <label htmlFor="useSavedCar" className="text-sm text-on-surface">
            {t("useSavedCar")}: <span className="font-semibold">{savedCarInfo.car_model}</span>
            {savedCarInfo.car_color && ` (${savedCarInfo.car_color})`}
          </label>
        </div>
      )}

      {!useSavedCar || !savedCarInfo?.car_model ? (
        <div className="space-y-3 bg-surface-container-highest p-4 rounded-xl">
          <input
            type="text"
            placeholder={t("carModelPlaceholder")}
            value={carModel}
            onChange={(e) => onChange("carModel", e.target.value)}
            className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder={t("carColorPlaceholder")}
              value={carColor}
              onChange={(e) => onChange("carColor", e.target.value)}
              className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder={t("carYearPlaceholder")}
              value={carYear}
              onChange={(e) => onChange("carYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder={t("carPlatePlaceholder")}
              value={carPlate}
              onChange={(e) => onChange("carPlate", e.target.value.toUpperCase().slice(0, 7))}
              className="bg-surface-container p-2 rounded-lg text-sm text-on-surface border-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

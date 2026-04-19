"use client";

import { Car, Palette, Calendar, Hash } from "lucide-react";
import { useTranslations } from "next-intl";

interface CarInfoProps {
  model?: string | null;
  color?: string | null;
  plate?: string | null;
  year?: number | null;
}

export function CarInfoCard({ model, color, plate, year }: CarInfoProps) {
  const t = useTranslations("profile");

  // Don't show if no car info available
  if (!model && !color && !plate && !year) {
    return null;
  }

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-10 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
          <Car className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-label font-bold text-[10px] uppercase tracking-[0.15em] text-on-surface/40">
            {t("vehicle")}
          </p>
          <p className="font-headline font-bold text-lg text-on-surface">
            {model || t("driverCar")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {color && (
          <div className="flex items-center gap-3 bg-surface-container-high/50 rounded-2xl p-3">
            <Palette className="w-4 h-4 text-on-surface/50" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface/40">{t("colorLabel")}</p>
              <p className="font-semibold text-sm text-on-surface">{color}</p>
            </div>
          </div>
        )}
        
        {year && (
          <div className="flex items-center gap-3 bg-surface-container-high/50 rounded-2xl p-3">
            <Calendar className="w-4 h-4 text-on-surface/50" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface/40">{t("yearLabel")}</p>
              <p className="font-semibold text-sm text-on-surface">{year}</p>
            </div>
          </div>
        )}
        
        {plate && (
          <div className="col-span-2 flex items-center gap-3 bg-surface-container-high/50 rounded-2xl p-3">
            <Hash className="w-4 h-4 text-on-surface/50" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface/40">{t("plateLabel")}</p>
              <p className="font-semibold text-sm text-on-surface tracking-wider">{plate.toUpperCase()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for ride cards
export function CarInfoBadge({ model, color }: { model?: string | null; color?: string | null }) {
  if (!model) return null;
  
  return (
    <div className="flex items-center gap-2 text-on-surface/60">
      <Car className="w-4 h-4" />
      <span className="text-sm">
        {model}{color ? ` (${color})` : ""}
      </span>
    </div>
  );
}

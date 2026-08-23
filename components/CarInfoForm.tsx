"use client";

import { useState } from "react";
import Image from "next/image";
import { Car, Palette, Calendar, Hash, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { VehiclePicker, commonsThumb, isMirrored, type CatalogEntry } from "@/components/vehicles/VehiclePicker";

interface CarInfo {
  car_model?: string | null;
  car_image_url?: string | null;
  car_image_author?: string | null;
  car_image_license?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
}

interface CarInfoFormProps {
  initialData?: CarInfo;
  onSave: (data: CarInfo) => void;
  onCancel?: () => void;
}

const carColorKeys = [
  "white", "black", "gray", "silver", "blue", "red",
  "green", "yellow", "orange", "brown", "beige", "purple"
];

const colorKeyToItalian: Record<string, string> = {
  white: "Bianco",
  black: "Nero",
  gray: "Grigio",
  silver: "Argento",
  blue: "Blu",
  red: "Rosso",
  green: "Verde",
  yellow: "Giallo",
  orange: "Arancione",
  brown: "Marrone",
  beige: "Beige",
  purple: "Viola",
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function CarInfoForm({ initialData, onSave, onCancel }: CarInfoFormProps) {
  const t = useTranslations("profile");
  const [picked, setPicked] = useState<CatalogEntry | null>(null);
  // Vehicles saved before the catalog existed are plain strings; keep showing
  // them until the driver picks a catalogue entry.
  const model = picked?.label ?? initialData?.car_model ?? "";
  const [color, setColor] = useState(initialData?.car_color || "");
  const [plate, setPlate] = useState(initialData?.car_plate || "");
  const [year, setYear] = useState(initialData?.car_year?.toString() || "");
  const [isEditing, setIsEditing] = useState(!initialData?.car_model);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      car_model: model || null,
      car_image_url: picked?.image_url ?? initialData?.car_image_url ?? null,
      car_image_author: picked?.image_author ?? initialData?.car_image_author ?? null,
      car_image_license: picked?.image_license ?? initialData?.car_image_license ?? null,
      car_color: color || null,
      car_plate: plate || null,
      car_year: year ? parseInt(year) : null,
    });
    setIsEditing(false);
  };

  const formatPlate = (value: string) => {
    // Italian plate format: XX 123 XX
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  if (!isEditing && initialData?.car_model) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {initialData.car_image_url && (
          <div className="relative bg-sand-deep" style={{ aspectRatio: "16 / 9" }}>
            <Image
              src={commonsThumb(initialData.car_image_url, 800)}
              alt={initialData.car_model}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
              unoptimized={!isMirrored(initialData.car_image_url)}
            />
          </div>
        )}
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t("vehicle")}
              </p>
              <p className="mt-0.5 font-heading text-lg text-ink">{initialData.car_model}</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="shrink-0 text-sm font-medium text-green hover:underline"
            >
              {t("edit")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {initialData.car_color && (
              <div className="flex items-center gap-2 text-muted">
                <Palette className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                <span>{initialData.car_color}</span>
              </div>
            )}
            {initialData.car_year && (
              <div className="flex items-center gap-2 text-muted">
                <Calendar className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                <span>{initialData.car_year}</span>
              </div>
            )}
            {initialData.car_plate && (
              <div className="col-span-2 flex items-center gap-2 text-muted">
                <Hash className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                <span className="font-mono tracking-wider">{initialData.car_plate}</span>
              </div>
            )}
          </div>

          {initialData.car_image_author && (
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              {t("photoCredit", { author: initialData.car_image_author })}
              {initialData.car_image_license ? ` · ${initialData.car_image_license}` : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-bold text-lg text-fg">
          {initialData?.car_model ? t("editVehicle") : t("addVehicle")}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-elevated text-fg/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Model */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {t("carModelLabel")}
        </label>
        <VehiclePicker
          value={picked}
          fallbackLabel={initialData?.car_model}
          onChange={setPicked}
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-fg/40 mb-2">
          {t("colorLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {carColorKeys.map((key) => {
            const italianValue = colorKeyToItalian[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setColor(italianValue)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  color === italianValue
                    ? "bg-primary text-accent-fg"
                    : "bg-elevated text-fg/70 hover:bg-elevated"
                }`}
              >
                {t("colors." + key)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Year */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-fg/40 mb-2">
            {t("yearLabel")}
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg/30" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-elevated rounded-xl py-3 pl-12 pr-4 text-fg border border-transparent focus:border-primary/50 focus:outline-none transition-all appearance-none"
            >
              <option value="">{t("selectYear")}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Plate */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-fg/40 mb-2">
            {t("plateLabel")}
          </label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg/30" />
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(formatPlate(e.target.value))}
              placeholder="AB123CD"
              maxLength={7}
              className="w-full bg-elevated rounded-xl py-3 pl-12 pr-4 text-fg placeholder:text-fg/30 border border-transparent focus:border-primary/50 focus:outline-none transition-all font-mono uppercase"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-accent-fg py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {t("saveVehicle")}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Car, Palette, Calendar, Hash, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface CarInfo {
  car_model?: string | null;
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
  const [model, setModel] = useState(initialData?.car_model || "");
  const [color, setColor] = useState(initialData?.car_color || "");
  const [plate, setPlate] = useState(initialData?.car_plate || "");
  const [year, setYear] = useState(initialData?.car_year?.toString() || "");
  const [isEditing, setIsEditing] = useState(!initialData?.car_model);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      car_model: model || null,
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
      <div className="bg-surface-container-low rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-label font-bold text-[10px] uppercase tracking-wider text-on-surface/40">
                {t("vehicle")}
              </p>
              <p className="font-semibold text-on-surface">{initialData.car_model}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary text-sm font-semibold hover:underline"
          >
            {t("edit")}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {initialData.car_color && (
            <div className="flex items-center gap-2 text-on-surface/70">
              <Palette className="w-4 h-4" />
              <span>{initialData.car_color}</span>
            </div>
          )}
          {initialData.car_year && (
            <div className="flex items-center gap-2 text-on-surface/70">
              <Calendar className="w-4 h-4" />
              <span>{initialData.car_year}</span>
            </div>
          )}
          {initialData.car_plate && (
            <div className="col-span-2 flex items-center gap-2 text-on-surface/70">
              <Hash className="w-4 h-4" />
              <span className="font-mono tracking-wider">{initialData.car_plate}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-bold text-lg text-on-surface">
          {initialData?.car_model ? t("editVehicle") : t("addVehicle")}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Model */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface/40 mb-2">
          {t("carModelLabel")}
        </label>
        <div className="relative">
          <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/30" />
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("carModelPlaceholder")}
            className="w-full bg-surface-container-highest rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface/30 border border-transparent focus:border-primary/50 focus:outline-none transition-all"
            required
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface/40 mb-2">
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
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-on-surface/70 hover:bg-surface-container-high"
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface/40 mb-2">
            {t("yearLabel")}
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/30" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-surface-container-highest rounded-xl py-3 pl-12 pr-4 text-on-surface border border-transparent focus:border-primary/50 focus:outline-none transition-all appearance-none"
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface/40 mb-2">
            {t("plateLabel")}
          </label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/30" />
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(formatPlate(e.target.value))}
              placeholder="AB123CD"
              maxLength={7}
              className="w-full bg-surface-container-highest rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface/30 border border-transparent focus:border-primary/50 focus:outline-none transition-all font-mono uppercase"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {t("saveVehicle")}
      </button>
    </form>
  );
}

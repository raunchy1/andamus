"use client";

import { useTranslations } from "next-intl";

interface FormData {
  smokingAllowed: boolean;
  petsAllowed: boolean;
  largeLuggage: boolean;
  womenOnly: boolean;
  musicPreference: string;
}

interface PreferencesSectionProps {
  formData: FormData;
  onChange: (field: string, value: string | boolean | string[] | number[]) => void;
  variant?: "mobile" | "desktop";
  className?: string;
  errors?: { musicPreference?: string };
}

export function PreferencesSection({
  formData,
  onChange,
  variant = "mobile",
  className = "",
  errors,
}: PreferencesSectionProps) {
  const t = useTranslations("offer");
  const isDesktop = variant === "desktop";

  const labelSize = isDesktop ? "text-[11px]" : "text-[10px]";
  const pSize = isDesktop ? "p-5" : "p-4";
  const musicPadding = isDesktop ? "p-5 rounded-2xl focus-within:ring-1 ring-primary transition-all" : "p-4 rounded-xl";

  const toggles = [
    { key: "smokingAllowed", label: t("smokersAllowed") },
    { key: "petsAllowed", label: t("petsAllowed") },
    { key: "largeLuggage", label: t("largeLuggage") },
    { key: "womenOnly", label: t("womenOnly") },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <label className={`font-semibold uppercase tracking-widest ${labelSize} text-outline block`}>
        {t("travelPreferences")}
      </label>

      <div className="grid grid-cols-2 gap-3">
        {toggles.map(({ key, label }) => {
          const active = formData[key as keyof FormData] as boolean;
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl ${pSize} transition-colors ${
                active ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onChange(key, e.target.checked)}
                className="hidden"
              />
              <span className="text-sm font-semibold">{label}</span>
            </label>
          );
        })}
      </div>

      <div className={`bg-surface-container-highest ${musicPadding}`}>
        <label className={`font-semibold uppercase tracking-widest ${labelSize} text-outline block mb-2`}>
          {t("music")}
        </label>
        <select
          value={formData.musicPreference}
          onChange={(e) => onChange("musicPreference", e.target.value)}
          className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-semibold appearance-none cursor-pointer"
        >
          <option value="" className="bg-surface-container-highest">{t("musicAny")}</option>
          <option value="quiet" className="bg-surface-container-highest">{t("musicQuiet")}</option>
          <option value="music" className="bg-surface-container-highest">{t("musicMusic")}</option>
          <option value="talk" className="bg-surface-container-highest">{t("musicTalk")}</option>
        </select>
      </div>
      {errors?.musicPreference && <p className="text-sm text-error">{errors.musicPreference}</p>}
    </div>
  );
}

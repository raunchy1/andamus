"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { ToggleRow } from "@/components/offri/ToggleRow";

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
  className?: string;
  errors?: { musicPreference?: string };
}

export function PreferencesSection({
  formData,
  onChange,
  className = "",
  errors,
}: PreferencesSectionProps) {
  const t = useTranslations("offer");

  const toggles = [
    { key: "petsAllowed", label: t("step3.pets"), hint: t("step3.petsHint") },
    { key: "largeLuggage", label: t("step3.luggage"), hint: t("step3.luggageHint") },
    { key: "smokingAllowed", label: t("step3.smoking"), hint: t("step3.smokingHint") },
    { key: "womenOnly", label: t("step3.womenOnly"), hint: t("step3.womenOnlyHint") },
  ] as const;

  const moods = [
    { value: "", label: t("step3.moodAny") },
    { value: "quiet", label: t("step3.moodQuiet") },
    { value: "music", label: t("step3.moodMusic") },
    { value: "talk", label: t("step3.moodTalk") },
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold text-ink">{t("step3.onboard")}</h2>
        <div className="rounded-2xl border border-line bg-surface px-4">
          {toggles.map(({ key, label, hint }, i) => (
            <ToggleRow
              key={key}
              label={label}
              hint={hint}
              checked={formData[key as keyof FormData] as boolean}
              onChange={(next) => onChange(key, next)}
              last={i === toggles.length - 1}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold text-ink">{t("step3.mood")}</h2>
        <div className="grid grid-cols-4 gap-0.5 rounded-xl bg-surface-2 p-[3px]">
          {moods.map((m) => {
            const active = formData.musicPreference === m.value;
            return (
              <button
                key={m.value || "any"}
                type="button"
                onClick={() => onChange("musicPreference", m.value)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-[9px] px-1 text-center text-xs leading-tight transition-colors",
                  active
                    ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(22,33,28,0.08)]"
                    : "font-medium text-muted"
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {errors?.musicPreference && <p className="text-sm text-bad">{errors.musicPreference}</p>}
      </section>
    </div>
  );
}

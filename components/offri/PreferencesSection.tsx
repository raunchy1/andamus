"use client";

import { useTranslations } from "next-intl";
import {
  Cigarette,
  PawPrint,
  Luggage,
  UserCircle,
  Music,
  VolumeX,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

const toggles = [
  { key: "smokingAllowed", icon: Cigarette },
  { key: "petsAllowed", icon: PawPrint },
  { key: "largeLuggage", icon: Luggage },
  { key: "womenOnly", icon: UserCircle },
] as const;

const musicOptions = [
  { value: "", icon: Music },
  { value: "quiet", icon: VolumeX },
  { value: "music", icon: Music },
  { value: "talk", icon: MessageCircle },
] as const;

export function PreferencesSection({
  formData,
  onChange,
  className = "",
  errors,
}: PreferencesSectionProps) {
  const t = useTranslations("offer");

  const musicLabels: Record<string, string> = {
    "": t("musicAny"),
    quiet: t("musicQuiet"),
    music: t("musicMusic"),
    talk: t("musicTalk"),
  };

  return (
    <section className={cn("space-y-4", className)}>
      <p className="text-eyebrow">{t("travelPreferences")}</p>

      <div className="flex flex-wrap gap-2">
        {toggles.map(({ key, icon: Icon }) => {
          const active = formData[key as keyof FormData] as boolean;
          const label =
            key === "smokingAllowed"
              ? t("smokersAllowed")
              : key === "petsAllowed"
                ? t("petsAllowed")
                : key === "largeLuggage"
                  ? t("largeLuggage")
                  : t("womenOnly");

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key, !active)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-xs transition-colors",
                active
                  ? "border-accent text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-fg"
              )}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </button>
          );
        })}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-eyebrow">{t("music")}</p>
        <div className="flex flex-wrap gap-2">
          {musicOptions.map(({ value, icon: Icon }) => {
            const active = formData.musicPreference === value;
            return (
              <button
                key={value || "any"}
                type="button"
                onClick={() => onChange("musicPreference", value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-xs transition-colors",
                  active
                    ? "border-accent text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-fg"
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {musicLabels[value]}
              </button>
            );
          })}
        </div>
      </div>

      {errors?.musicPreference && (
        <p className="text-sm text-bad">{errors.musicPreference}</p>
      )}
    </section>
  );
}
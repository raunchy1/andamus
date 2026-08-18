"use client";

import { VEHICLE_FEATURES, type VehicleFeature } from "@/lib/types/vehicle";
import { FeatureIcon } from "./feature-icons";

interface VehicleFeatureTagsProps {
  features: VehicleFeature[];
  locale?: string;
  size?: "sm" | "md";
  editable?: boolean;
  onToggle?: (feature: VehicleFeature) => void;
}

export function VehicleFeatureTags({
  features,
  locale = "it",
  size = "md",
  editable = false,
  onToggle,
}: VehicleFeatureTagsProps) {
  // Show all features if editable (for wizard), only selected if not editable
  const displayFeatures = editable
    ? VEHICLE_FEATURES
    : VEHICLE_FEATURES.filter((f) => features.includes(f.key));

  if (displayFeatures.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {displayFeatures.map((feature) => {
        const isActive = features.includes(feature.key);
        const label =
          locale === "en"
            ? feature.labelEn
            : locale === "de"
            ? feature.labelDe
            : feature.labelIt;

        if (editable) {
          return (
            <button
              key={feature.key}
              type="button"
              onClick={() => onToggle?.(feature.key)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 select-none ${
                isActive
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              <FeatureIcon
                name={feature.icon}
                className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
              />
              <span className={size === "sm" ? "text-[11px]" : "text-sm"}>
                {label}
              </span>
            </button>
          );
        }

        return (
          <span
            key={feature.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted"
          >
            <FeatureIcon name={feature.icon} />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

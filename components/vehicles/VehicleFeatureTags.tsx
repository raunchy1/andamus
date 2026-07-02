"use client";

import { VEHICLE_FEATURES, type VehicleFeature } from "@/lib/types/vehicle";

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
                  : "bg-elevated border border-line/30 text-fg/60 hover:border-primary/30 hover:text-fg"
              }`}
            >
              <span
                className={size === "sm" ? "text-xs" : "text-sm"}
                aria-hidden="true"
              >
                {feature.icon}
              </span>
              <span className={size === "sm" ? "text-[11px]" : "text-sm"}>
                {label}
              </span>
            </button>
          );
        }

        return (
          <span
            key={feature.key}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-line/20 text-fg/70 text-sm"
          >
            <span aria-hidden="true">{feature.icon}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

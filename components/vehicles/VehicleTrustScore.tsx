"use client";

import { computeVehicleScore } from "@/lib/types/vehicle";
import type { VehicleWithImages } from "@/lib/types/vehicle";

interface VehicleTrustScoreProps {
  vehicle: Partial<VehicleWithImages>;
  showSuggestions?: boolean;
  size?: "sm" | "md" | "lg";
}

export function VehicleTrustScore({
  vehicle,
  showSuggestions = false,
  size = "md",
}: VehicleTrustScoreProps) {
  const score = computeVehicleScore(vehicle);
  const percent = score.total;

  const radius = size === "sm" ? 20 : size === "md" ? 28 : 36;
  const stroke = size === "sm" ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const svgSize = (radius + stroke) * 2;

  const color =
    percent >= 80 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#e63946";
  const label =
    percent >= 80 ? "Ottimo" : percent >= 50 ? "Buono" : "Incompleto";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular progress ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-surface-container-highest"
          />
          {/* Progress */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-extrabold leading-none ${
              size === "sm"
                ? "text-sm"
                : size === "md"
                ? "text-xl"
                : "text-3xl"
            }`}
            style={{ color }}
            aria-label={`Punteggio veicolo: ${percent}%`}
          >
            {percent}%
          </span>
        </div>
      </div>

      {/* Label below ring (hidden in sm) */}
      {size !== "sm" && (
        <div className="text-center">
          <p
            className="font-bold text-xs uppercase tracking-widest"
            style={{ color }}
          >
            {label}
          </p>
          <p className="text-[11px] text-on-surface/40 mt-0.5">
            Profilo veicolo
          </p>
        </div>
      )}

      {/* Improvement suggestions */}
      {showSuggestions && score.suggestions.length > 0 && (
        <div className="w-full space-y-2">
          {score.suggestions.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-on-surface/60 bg-surface-container-high px-3 py-2 rounded-xl"
            >
              <span className="text-amber-400 shrink-0" aria-hidden="true">
                💡
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

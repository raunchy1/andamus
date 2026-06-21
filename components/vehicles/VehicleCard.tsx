"use client";

import Image from "next/image";
import { Car, Star, CheckCircle2, Trash2, Edit3 } from "lucide-react";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import {
  VEHICLE_FEATURES,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/types/vehicle";
import { VehicleTrustScore } from "./VehicleTrustScore";

interface VehicleCardProps {
  vehicle: VehicleWithImages;
  locale?: string;
  onEdit?: (vehicle: VehicleWithImages) => void;
  onDelete?: (vehicleId: string) => void;
  onSetPrimary?: (vehicleId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (vehicle: VehicleWithImages) => void;
  compact?: boolean;
}

export function VehicleCard({
  vehicle,
  locale = "it",
  onEdit,
  onDelete,
  onSetPrimary,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
}: VehicleCardProps) {
  const primaryImage =
    vehicle.images?.find((i) => i.is_primary) ?? vehicle.images?.[0];
  const photoCount = vehicle.images?.length ?? 0;

  const fuelLabel = vehicle.fuel_type
    ? locale === "en"
      ? FUEL_TYPE_LABELS[vehicle.fuel_type].en
      : locale === "de"
      ? FUEL_TYPE_LABELS[vehicle.fuel_type].de
      : FUEL_TYPE_LABELS[vehicle.fuel_type].it
    : null;

  const transLabel = vehicle.transmission
    ? locale === "en"
      ? TRANSMISSION_LABELS[vehicle.transmission].en
      : locale === "de"
      ? TRANSMISSION_LABELS[vehicle.transmission].de
      : TRANSMISSION_LABELS[vehicle.transmission].it
    : null;

  const activeFeatures = VEHICLE_FEATURES.filter((f) =>
    vehicle.features?.includes(f.key)
  ).slice(0, 4);

  const handleClick = () => {
    if (selectable && onSelect) onSelect(vehicle);
  };

  // ── Compact variant (used inside pickers, ride forms, etc.) ──────────────
  if (compact) {
    return (
      <div
        onClick={handleClick}
        role={selectable ? "button" : undefined}
        tabIndex={selectable ? 0 : undefined}
        onKeyDown={
          selectable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") handleClick();
              }
            : undefined
        }
        aria-pressed={selectable ? selected : undefined}
        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
          selectable ? "cursor-pointer" : ""
        } ${
          selected
            ? "border-primary/50 bg-primary/5"
            : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40"
        }`}
      >
        {/* Thumbnail */}
        <div className="w-16 h-14 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${vehicle.make_name} ${vehicle.model_name}`}
              width={64}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car
                className="w-6 h-6 text-on-surface/30"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface truncate">
            {vehicle.make_name} {vehicle.model_name}
          </p>
          <p className="text-sm text-on-surface/50">
            {vehicle.year}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
            {fuelLabel ? ` · ${fuelLabel}` : ""}
          </p>
        </div>

        {selected && (
          <CheckCircle2
            className="w-5 h-5 text-primary shrink-0"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // ── Full card variant ────────────────────────────────────────────────────
  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all ${
        selected
          ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
          : "border-outline-variant/20 bg-surface-container-low"
      } ${selectable ? "cursor-pointer hover:border-primary/30" : ""}`}
      onClick={handleClick}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleClick();
            }
          : undefined
      }
      aria-pressed={selectable ? selected : undefined}
    >
      {/* ── Photo strip ── */}
      <div className="relative h-48 bg-surface-container-high">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={`${vehicle.make_name} ${vehicle.model_name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Car
              className="w-12 h-12 text-on-surface/20"
              aria-hidden="true"
            />
            <p className="text-xs text-on-surface/30">Nessuna foto</p>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {vehicle.primary_vehicle && (
            <span className="bg-primary text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Principale
            </span>
          )}
          {vehicle.verified && (
            <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Verificato
            </span>
          )}
        </div>

        {/* Photo count */}
        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
            +{photoCount - 1} foto
          </span>
        )}

        {/* Trust score (top-right) */}
        <div className="absolute top-3 right-3">
          <VehicleTrustScore vehicle={vehicle} size="sm" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5">
        {/* Title + action buttons */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-xl text-on-surface">
              {vehicle.make_name} {vehicle.model_name}
            </h3>
            <p className="text-sm text-on-surface/50 mt-0.5">
              {vehicle.year}
              {vehicle.color ? ` · ${vehicle.color}` : ""}
            </p>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(vehicle);
                  }}
                  aria-label="Modifica veicolo"
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface/60 hover:text-on-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(vehicle.id);
                  }}
                  aria-label="Elimina veicolo"
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-bad/20 text-on-surface/60 hover:text-bad transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bad"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spec pills */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {fuelLabel && (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high px-2 py-1 rounded-lg text-on-surface/60">
              {fuelLabel}
            </span>
          )}
          {transLabel && (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high px-2 py-1 rounded-lg text-on-surface/60">
              {transLabel}
            </span>
          )}
          {vehicle.seats_available != null && (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high px-2 py-1 rounded-lg text-on-surface/60">
              {vehicle.seats_available} posti
            </span>
          )}
          {vehicle.rides_count > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high px-2 py-1 rounded-lg text-primary">
              {vehicle.rides_count} corse
            </span>
          )}
        </div>

        {/* Feature emoji strip */}
        {activeFeatures.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {activeFeatures.map((f) => (
              <span
                key={f.key}
                title={locale === "it" ? f.labelIt : f.labelEn}
                className="text-base"
                aria-label={locale === "it" ? f.labelIt : f.labelEn}
              >
                {f.icon}
              </span>
            ))}
            {(vehicle.features?.length ?? 0) > 4 && (
              <span className="text-[11px] text-on-surface/40 self-center">
                +{(vehicle.features?.length ?? 0) - 4}
              </span>
            )}
          </div>
        )}

        {/* Set as primary CTA */}
        {onSetPrimary && !vehicle.primary_vehicle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary(vehicle.id);
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1"
          >
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
            Imposta come principale
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { Car, Star, CheckCircle2, Trash2, Edit3 } from "lucide-react";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import {
  VEHICLE_FEATURES,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/types/vehicle";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("vehicles");
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
        className={`flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-colors ${
          selectable ? "cursor-pointer" : ""
        } ${selected ? "border-green" : "border-line hover:border-line-strong"}`}
      >
        {/* Thumbnail */}
        <div className="w-16 h-14 rounded-xl overflow-hidden bg-elevated flex-shrink-0">
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
                className="h-5 w-5 text-muted" strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {vehicle.make_name} {vehicle.model_name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {vehicle.year}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
            {fuelLabel ? ` · ${fuelLabel}` : ""}
          </p>
        </div>

        {selected && (
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-green" strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // ── Full card variant ────────────────────────────────────────────────────
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${
        selected ? "border-green" : "border-line"
      } ${selectable ? "cursor-pointer hover:border-line-strong" : ""}`}
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
      <div className="relative h-44 bg-sand-deep">
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
            <Car className="h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-xs text-muted">{t("noPhoto")}</p>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {vehicle.primary_vehicle && (
            <span className="rounded-full bg-green px-2.5 py-1 text-[11px] font-medium text-white">
              {t("primary")}
            </span>
          )}
          {vehicle.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-ink">
              <CheckCircle2 className="h-3 w-3 text-green" strokeWidth={1.5} aria-hidden="true" />
              {t("verified")}
            </span>
          )}
        </div>

        {/* Photo count */}
        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 select-none rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-ink">
            {t("morePhotos", { count: photoCount - 1 })}
          </span>
        )}

      </div>

      {/* ── Content ── */}
      <div className="p-5">
        {/* Title + action buttons */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-heading text-lg text-ink">
              {vehicle.make_name} {vehicle.model_name}
            </h3>
            <p className="mt-0.5 text-sm text-muted">
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
                  aria-label={t("edit")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-sand hover:text-ink"
                >
                  <Edit3 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(vehicle.id);
                  }}
                  aria-label={t("delete")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-terracotta transition-colors hover:bg-sand"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spec pills */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {fuelLabel && (
            <span className="rounded-lg border border-line px-2 py-1 text-xs text-muted">
              {fuelLabel}
            </span>
          )}
          {transLabel && (
            <span className="rounded-lg border border-line px-2 py-1 text-xs text-muted">
              {transLabel}
            </span>
          )}
          {vehicle.seats_available != null && (
            <span className="rounded-lg border border-line px-2 py-1 text-xs text-muted">
              {t("seats", { count: vehicle.seats_available })}
            </span>
          )}
          {vehicle.rides_count > 0 && (
            <span className="rounded-lg border border-line px-2 py-1 text-xs text-green">
              {t("rides", { count: vehicle.rides_count })}
            </span>
          )}
        </div>

        {activeFeatures.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {activeFeatures.map((f) => (
              <span key={f.key}>{locale === "it" ? f.labelIt : f.labelEn}</span>
            ))}
            {(vehicle.features?.length ?? 0) > 4 && (
              <span>{t("moreFeatures", { count: (vehicle.features?.length ?? 0) - 4 })}</span>
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
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium text-muted transition-colors hover:bg-sand hover:text-ink"
          >
            <Star className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            {t("setPrimary")}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Car, Star, ShieldCheck, Fuel, Settings, Users, Sparkles,
} from "lucide-react";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import {
  VEHICLE_FEATURES, FUEL_TYPE_LABELS, TRANSMISSION_LABELS,
  computeVehicleScore,
} from "@/lib/types/vehicle";
import { VehicleGallery } from "./VehicleGallery";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { Reveal } from "@/components/ui/premium/reveal";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { FeatureIcon } from "./feature-icons";

interface MeetYourRideProps {
  vehicle: VehicleWithImages;
  driverName?: string;
  driverRating?: number;
  driverId?: string;
  onGalleryView?: () => void;
}

export function MeetYourRide({
  vehicle,
  driverName,
  driverRating,
  driverId,
  onGalleryView,
}: MeetYourRideProps) {
  const locale = useLocale();

  const score = computeVehicleScore(vehicle);
  const fuelLabel = vehicle.fuel_type
    ? (locale === "en"
        ? FUEL_TYPE_LABELS[vehicle.fuel_type].en
        : locale === "de"
        ? FUEL_TYPE_LABELS[vehicle.fuel_type].de
        : FUEL_TYPE_LABELS[vehicle.fuel_type].it)
    : null;
  const transLabel = vehicle.transmission
    ? (locale === "en"
        ? TRANSMISSION_LABELS[vehicle.transmission].en
        : locale === "de"
        ? TRANSMISSION_LABELS[vehicle.transmission].de
        : TRANSMISSION_LABELS[vehicle.transmission].it)
    : null;

  const featureIcons = VEHICLE_FEATURES.filter((f) =>
    vehicle.features?.includes(f.key)
  );

  return (
    <Reveal>
      <div className="mb-10">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-label font-bold text-[10px] uppercase tracking-[0.2em] text-fg/40">
              Il tuo viaggio
            </h3>
            <p className="font-headline font-bold text-xl text-fg">
              <GradientText>Ecco la tua auto</GradientText>
            </p>
          </div>
        </div>

        <TiltCard
          tiltStrength={3}
          className="overflow-hidden rounded-2xl border border-line bg-surface"
        >
          {/* Vehicle gallery */}
          {vehicle.images.length > 0 ? (
            <div className="px-5 pt-5">
              <VehicleGallery
                images={vehicle.images}
                vehicleName={`${vehicle.make_name} ${vehicle.model_name}`}
                onTrackView={onGalleryView}
              />
            </div>
          ) : (
            <div className="mx-5 mt-5 h-40 rounded-2xl bg-elevated flex flex-col items-center justify-center gap-2">
              <Car className="w-10 h-10 text-fg/20" />
              <p className="text-xs text-fg/30">Nessuna foto disponibile</p>
            </div>
          )}

          {/* Vehicle info */}
          <div className="p-5">
            {/* Name + specs row */}
            <div className="mb-4">
              <h4 className="font-headline font-bold text-2xl text-fg mb-1">
                {vehicle.make_name} {vehicle.model_name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-fg/60">{vehicle.year}</span>
                {vehicle.color && (
                  <>
                    <span className="text-fg/30">·</span>
                    <div className="flex items-center gap-1.5">
                      {vehicle.color_hex && (
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-line"
                          style={{ backgroundColor: vehicle.color_hex }}
                        />
                      )}
                      <span className="text-sm font-semibold text-fg/60">{vehicle.color}</span>
                    </div>
                  </>
                )}
                {fuelLabel && (
                  <>
                    <span className="text-fg/30">·</span>
                    <span className="text-sm font-semibold text-fg/60">{fuelLabel}</span>
                  </>
                )}
                {transLabel && (
                  <>
                    <span className="text-fg/30">·</span>
                    <span className="text-sm font-semibold text-fg/60">{transLabel}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick specs grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {vehicle.seats_available && (
                <div className="bg-surface rounded-2xl p-3 flex flex-col items-center gap-1">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/40">Posti</p>
                  <p className="font-bold text-fg">{vehicle.seats_available}</p>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="bg-surface rounded-2xl p-3 flex flex-col items-center gap-1">
                  <Fuel className="w-5 h-5 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/40">Motore</p>
                  <p className="font-bold text-fg text-center text-sm">{fuelLabel}</p>
                </div>
              )}
              {vehicle.transmission && (
                <div className="bg-surface rounded-2xl p-3 flex flex-col items-center gap-1">
                  <Settings className="w-5 h-5 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/40">Cambio</p>
                  <p className="font-bold text-fg text-center text-sm">{transLabel}</p>
                </div>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {vehicle.verified && (
                <div className="flex items-center gap-1.5 bg-green-tint border border-line px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-green" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green">
                    Veicolo Verificato
                  </span>
                </div>
              )}
              {score.total >= 80 && (
                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 text-primary fill-current" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Profilo Completo
                  </span>
                </div>
              )}
              {vehicle.rides_count > 0 && (
                <div className="flex items-center gap-1.5 bg-surface border border-line px-3 py-1.5 rounded-full">
                  <Car className="w-3.5 h-3.5 text-fg/50" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/50">
                    {vehicle.rides_count} corse effettuate
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="bg-surface border border-line rounded-2xl p-4 mb-4">
                <p className="text-sm text-fg/70 leading-relaxed italic">
                  &ldquo;{vehicle.description}&rdquo;
                </p>
              </div>
            )}

            {/* Comfort features */}
            {featureIcons.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/40 mb-2">
                  Comfort e dotazioni
                </p>
                <div className="flex flex-wrap gap-2">
                  {featureIcons.map((feature) => (
                    <span
                      key={feature.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted"
                    >
                      <FeatureIcon name={feature.icon} className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {locale === "en" ? feature.labelEn : locale === "de" ? feature.labelDe : feature.labelIt}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TiltCard>
      </div>
    </Reveal>
  );
}

// ─── Compact vehicle badge for ride cards ──────────────────────────────────

interface VehicleBadgeProps {
  makeName: string;
  modelName: string;
  year: number;
  color?: string | null;
}

export function VehicleBadge({ makeName, modelName, year, color }: VehicleBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-fg/60 text-sm">
      <Car className="w-3.5 h-3.5" />
      <span>
        {makeName} {modelName} {year}
        {color ? ` · ${color}` : ""}
      </span>
    </div>
  );
}

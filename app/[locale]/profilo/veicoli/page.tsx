"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft, Plus, Car, Loader2, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleWizard } from "@/components/vehicles/VehicleWizard";
import { VehicleEditPanel } from "@/components/vehicles/VehicleEditPanel";
import { toast } from "sonner";
import type { VehicleWithImages } from "@/lib/types/vehicle";

export default function VehiclesPage() {
  const locale = useLocale();
  const t = useTranslations("vehicles");
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithImages | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/join`);
        return;
      }

      const res = await fetch("/api/vehicles");
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } catch (err) {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (vehicleId: string) => {
    if (!confirm(t("confirmRemove"))) return;
    setDeleting(vehicleId);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(t("removed"));
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch {
      toast.error(t("removeError"));
    } finally {
      setDeleting(null);
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/primary`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("primaryUpdated"));
      await fetchVehicles();
    } catch {
      toast.error(t("updateError"));
    }
  };

  const handleWizardSuccess = async (newVehicleId: string) => {
    setShowWizard(false);
    toast.success(t("added"));
    await fetchVehicles();
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-5 py-8 pb-20">
          <VehicleWizard
            onSuccess={handleWizardSuccess}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      </div>
    );
  }

  // Show edit panel when a vehicle is selected
  if (editingVehicle) {
    // Find fresh version from state
    const freshVehicle = vehicles.find((v) => v.id === editingVehicle.id) ?? editingVehicle;
    return (
      <VehicleEditPanel
        vehicle={freshVehicle}
        onClose={() => setEditingVehicle(null)}
        onRefresh={async () => {
          await fetchVehicles();
          // Update editing vehicle with fresh data from new state
          setEditingVehicle((prev) => prev); // trigger re-render; freshVehicle re-derives from vehicles
        }}
      />
    );
  }

  return (
    <div className="w-full px-4 pb-12 pt-6 md:px-0 md:pt-8">
      <header className="mb-8">
        <Link
          href={`/${locale}/profilo`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t("backToProfile")}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-[26px] leading-tight text-ink sm:text-3xl">
              {t("title")}
            </h1>
            {vehicles.length > 0 && (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {t("count", { count: vehicles.length })}
              </p>
            )}
          </div>
          {vehicles.length > 0 && vehicles.length < 5 && (
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {t("add")}
            </button>
          )}
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" strokeWidth={1.5} aria-hidden />
        </div>
      )}

      {error && !loading && (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-terracotta">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {error}
        </p>
      )}

      {!loading && vehicles.length === 0 && !error && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-12 text-center">
          <Car className="mx-auto h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-4 font-heading text-xl text-ink">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {t("emptyBody")}
          </p>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            {t("addFirst")}
          </button>
        </section>
      )}

      {!loading && vehicles.length > 0 && (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={deleting === vehicle.id ? "pointer-events-none opacity-50" : ""}
            >
              <VehicleCard
                vehicle={vehicle}
                locale={locale}
                onEdit={(v) => setEditingVehicle(v)}
                onDelete={handleDelete}
                onSetPrimary={handleSetPrimary}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && vehicles.length > 0 && (
        <p className="mt-8 rounded-xl border border-line bg-green-tint px-4 py-3 text-sm leading-relaxed text-ink">
          {t("photoTip")}
        </p>
      )}
    </div>
  );
}

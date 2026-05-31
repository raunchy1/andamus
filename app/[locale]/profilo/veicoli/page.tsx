"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft, Plus, Car, Loader2, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleWizard } from "@/components/vehicles/VehicleWizard";
import { VehicleTrustScore } from "@/components/vehicles/VehicleTrustScore";
import { toast } from "sonner";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";

export default function VehiclesPage() {
  const locale = useLocale();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/auth/login`);
        return;
      }

      const res = await fetch("/api/vehicles");
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } catch (err) {
      setError("Errore nel caricamento dei veicoli");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Sei sicuro di voler rimuovere questo veicolo?")) return;
    setDeleting(vehicleId);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Veicolo rimosso");
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch {
      toast.error("Errore nella rimozione del veicolo");
    } finally {
      setDeleting(null);
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/primary`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Veicolo principale aggiornato");
      await fetchVehicles();
    } catch {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleWizardSuccess = async (newVehicleId: string) => {
    setShowWizard(false);
    toast.success("🚗 Veicolo aggiunto al tuo profilo!");
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

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <AuroraBackground className="relative h-44" showRadialMask={false}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
        <div className="absolute inset-x-0 top-0 px-5 pt-14 flex items-center justify-between">
          <Link
            href={`/${locale}/profilo`}
            className="p-3 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 text-on-surface hover:bg-white/[0.1] transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Aggiungi</span>
          </button>
        </div>
      </AuroraBackground>

      <div className="max-w-2xl mx-auto px-5 -mt-8">
        {/* Title */}
        <Reveal>
          <div className="mb-6">
            <p className="font-label font-bold text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
              Il tuo garage
            </p>
            <h1 className="font-headline font-extrabold text-4xl text-on-surface">
              I tuoi <GradientText>Veicoli</GradientText>
            </h1>
            {vehicles.length > 0 && (
              <p className="text-sm text-on-surface/50 mt-1">
                {vehicles.length} veicolo{vehicles.length !== 1 ? "i" : ""} nel tuo profilo
              </p>
            )}
          </div>
        </Reveal>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && vehicles.length === 0 && !error && (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6">
                <Car className="w-12 h-12 text-on-surface/20" />
              </div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">
                Nessun veicolo
              </h2>
              <p className="text-on-surface/50 text-sm mb-8 max-w-xs">
                Aggiungi il tuo veicolo per aumentare la fiducia dei passeggeri e personalizzare il tuo profilo.
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Aggiungi il tuo primo veicolo
              </button>

              {/* Benefits */}
              <div className="mt-10 grid grid-cols-1 gap-3 w-full text-left">
                {[
                  { icon: "🔒", title: "Più fiducia", desc: "I passeggeri sanno esattamente in che auto salgono" },
                  { icon: "📈", title: "Più prenotazioni", desc: "I profili con veicolo ricevono il 40% di prenotazioni in più" },
                  { icon: "⭐", title: "Profilo completo", desc: "Raggiungi il 100% di completamento del profilo" },
                ].map((benefit) => (
                  <div key={benefit.icon} className="flex items-start gap-4 bg-surface-container-low rounded-2xl p-4">
                    <span className="text-2xl">{benefit.icon}</span>
                    <div>
                      <p className="font-bold text-on-surface">{benefit.title}</p>
                      <p className="text-sm text-on-surface/50">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Vehicle list */}
        {!loading && vehicles.length > 0 && (
          <RevealStagger className="space-y-5">
            {vehicles.map((vehicle) => (
              <RevealItem key={vehicle.id}>
                <div className={deleting === vehicle.id ? "opacity-50 pointer-events-none" : ""}>
                  <VehicleCard
                    vehicle={vehicle}
                    locale={locale}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                  />
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        )}

        {/* Add another CTA */}
        {!loading && vehicles.length > 0 && vehicles.length < 5 && (
          <Reveal>
            <button
              onClick={() => setShowWizard(true)}
              className="w-full mt-5 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface/50 hover:border-primary/30 hover:text-primary transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Aggiungi un altro veicolo</span>
            </button>
          </Reveal>
        )}

        {/* Trust info */}
        {!loading && vehicles.length > 0 && (
          <Reveal>
            <div className="mt-8 bg-surface-container-low rounded-3xl p-5">
              <p className="font-bold text-sm text-on-surface mb-1">💡 Suggerimento</p>
              <p className="text-sm text-on-surface/60">
                Aggiungi almeno 3 foto del tuo veicolo e una descrizione per raggiungere
                il <span className="font-bold text-primary">punteggio massimo</span> e aumentare la fiducia dei passeggeri.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X, Upload, Camera, Loader2, Trash2, Check, Star,
  ChevronLeft, AlertCircle, ImagePlus,
} from "lucide-react";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import { VEHICLE_FEATURES } from "@/lib/types/vehicle";
import { VehicleTrustScore } from "./VehicleTrustScore";
import { toast } from "sonner";

interface VehicleEditPanelProps {
  vehicle: VehicleWithImages;
  onClose: () => void;
  onRefresh: () => void;
}

export function VehicleEditPanel({ vehicle, onClose, onRefresh }: VehicleEditPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingImg, setDeletingImg] = useState<string | null>(null);
  const [description, setDescription] = useState(vehicle.description ?? "");
  const [savingDesc, setSavingDesc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = vehicle.images ?? [];

  // ── Upload photos ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 10 - images.length;
    if (remaining <= 0) { toast.error("Hai già 10 foto!"); return; }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    for (const file of toUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/vehicles/${vehicle.id}/images`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload fallito");
        }
        toast.success("📸 Foto aggiunta!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore upload");
      }
    }

    setUploading(false);
    onRefresh();
  }, [vehicle.id, images.length, onRefresh]);

  // ── Delete photo ─────────────────────────────────────────────────────────
  const handleDeleteImage = async (imageId: string) => {
    setDeletingImg(imageId);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/images?imageId=${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore eliminazione");
      toast.success("Foto rimossa");
      onRefresh();
    } catch {
      toast.error("Errore nell'eliminare la foto");
    } finally {
      setDeletingImg(null);
    }
  };

  // ── Save description ─────────────────────────────────────────────────────
  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Errore salvataggio");
      toast.success("Descrizione salvata ✓");
      onRefresh();
    } catch {
      toast.error("Errore nel salvare la descrizione");
    } finally {
      setSavingDesc(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-xl border-b border-white/8 px-5 py-4 flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface/70 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-on-surface truncate">
            {vehicle.make_name} {vehicle.model_name}
          </h2>
          <p className="text-xs text-on-surface/50">{vehicle.year}</p>
        </div>
        <VehicleTrustScore vehicle={vehicle} size="sm" />
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-8">

        {/* ── FOTO SECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-on-surface">Foto del veicolo</h3>
              <p className="text-xs text-on-surface/50">{images.length}/10 foto · Tocca per eliminare</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 10}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              {uploading ? "Carico..." : "Aggiungi foto"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Photo grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-high group">
                  <Image
                    src={img.url}
                    alt={`Foto ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                  {/* Primary badge */}
                  {img.is_primary && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-extrabold uppercase bg-primary text-white px-1.5 py-0.5 rounded-md">
                      Principale
                    </span>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingImg === img.id}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 active:opacity-100"
                  >
                    {deletingImg === img.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
              {/* Add more slot */}
              {images.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Upload className="w-5 h-5 text-on-surface/30" />
                  <span className="text-[10px] text-on-surface/30">Aggiungi</span>
                </button>
              )}
            </div>
          ) : (
            /* Empty photos state */
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <Camera className="w-8 h-8 text-on-surface/30" />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-on-surface">
                  {uploading ? "Caricamento in corso..." : "Aggiungi le prime foto"}
                </p>
                <p className="text-xs text-on-surface/40 mt-0.5">
                  JPG, PNG o WebP · Max 5MB per foto
                </p>
              </div>
            </button>
          )}

          {/* Trust tip */}
          {images.length < 3 && (
            <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Aggiungi almeno <strong>3 foto</strong> per aumentare il tuo punteggio di fiducia
              </p>
            </div>
          )}
        </section>

        {/* ── DESCRIZIONE SECTION ── */}
        <section>
          <h3 className="font-bold text-lg text-on-surface mb-3">Descrizione</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Es. Auto comoda e climatizzata, perfetta per lunghi tragitti. Bagagliaio ampio..."
            rows={4}
            className="w-full bg-surface-container-highest rounded-2xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 border border-transparent focus:border-primary/50 focus:outline-none resize-none transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-on-surface/40">{description.length}/500</span>
            <button
              onClick={handleSaveDescription}
              disabled={savingDesc || description === (vehicle.description ?? "")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
            >
              {savingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salva
            </button>
          </div>
        </section>

        {/* ── COMFORT SECTION ── */}
        <section>
          <h3 className="font-bold text-lg text-on-surface mb-3">Comfort e caratteristiche</h3>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_FEATURES.map((feature) => {
              const active = vehicle.features?.includes(feature.key) ?? false;
              return (
                <div
                  key={feature.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    active
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-outline-variant/20 bg-surface-container-low text-on-surface/60"
                  }`}
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.labelIt}</span>
                  {active && <Check className="w-4 h-4 ml-auto" />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-on-surface/40 mt-3 text-center">
            Per modificare i comfort, usa il wizard per creare una nuova configurazione
          </p>
        </section>

        {/* ── INFO SECTION ── */}
        <section>
          <h3 className="font-bold text-lg text-on-surface mb-3">Dettagli veicolo</h3>
          <div className="bg-surface-container-low rounded-2xl divide-y divide-white/5">
            {[
              { label: "Marca", value: vehicle.make_name },
              { label: "Modello", value: vehicle.model_name },
              { label: "Anno", value: vehicle.year },
              { label: "Colore", value: vehicle.color ?? "—" },
              { label: "Carburante", value: vehicle.fuel_type ?? "—" },
              { label: "Cambio", value: vehicle.transmission ?? "—" },
              { label: "Posti totali", value: vehicle.seats_total ?? "—" },
              { label: "Posti passeggeri", value: vehicle.seats_available ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-on-surface/50">{label}</span>
                <span className="text-sm font-semibold text-on-surface capitalize">{String(value)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-on-surface/40 mt-3 text-center">
            Per modificare i dati del veicolo, crea un nuovo veicolo dal wizard
          </p>
        </section>

      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Car, ArrowLeft, ArrowRight, Check, Loader2, Upload, X,
  Camera, AlertCircle, ChevronDown,
} from "lucide-react";
import { VehicleMakeCombobox, VehicleModelCombobox } from "./VehicleCombobox";
import { VehicleFeatureTags } from "./VehicleFeatureTags";
import { VehicleTrustScore } from "./VehicleTrustScore";
import type {
  VehicleMake, VehicleModel, VehicleFeature,
  FuelType, TransmissionType,
} from "@/lib/types/vehicle";
import {
  FUEL_TYPE_LABELS, TRANSMISSION_LABELS, COLOR_SWATCHES, VEHICLE_FEATURES,
} from "@/lib/types/vehicle";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLocale } from "next-intl";

type WizardStep =
  | "brand"
  | "model"
  | "year"
  | "color"
  | "fuel"
  | "transmission"
  | "seats"
  | "photos"
  | "features"
  | "description"
  | "review";

const STEPS: WizardStep[] = [
  "brand", "model", "year", "color", "fuel", "transmission",
  "seats", "photos", "features", "description", "review",
];

const STEP_LABELS: Record<WizardStep, string> = {
  brand: "Marca",
  model: "Modello",
  year: "Anno",
  color: "Colore",
  fuel: "Carburante",
  transmission: "Cambio",
  seats: "Posti",
  photos: "Foto",
  features: "Comfort",
  description: "Descrizione",
  review: "Riepilogo",
};

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  uploading: boolean;
  error?: string;
}

interface VehicleWizardProps {
  onSuccess?: (vehicleId: string) => void;
  onCancel?: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 36 }, (_, i) => currentYear - i);

export function VehicleWizard({ onSuccess, onCancel }: VehicleWizardProps) {
  const locale = useLocale();
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState<WizardStep>("brand");
  const stepIndex = STEPS.indexOf(currentStep);

  // Form data
  const [selectedMake, setSelectedMake] = useState<VehicleMake | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [year, setYear] = useState<number>(currentYear - 3);
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [fuelType, setFuelType] = useState<FuelType | "">("");
  const [transmission, setTransmission] = useState<TransmissionType | "">("");
  const [seatsTotal, setSeatsTotal] = useState(5);
  const [seatsAvailable, setSeatsAvailable] = useState(4);
  const [features, setFeatures] = useState<VehicleFeature[]>([]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // UI state
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supabase] = useState(() => createClient());

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx]);
  };

  const goPrev = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx]);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "brand": return !!selectedMake;
      case "model": return !!selectedModel;
      case "year": return year >= 1990 && year <= currentYear + 1;
      default: return true;
    }
  };

  // Create vehicle in DB when reaching photos step
  const ensureVehicleCreated = useCallback(async () => {
    if (vehicleId) return vehicleId;
    if (!selectedMake || !selectedModel) return null;

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make_id: selectedMake.id,
          model_id: selectedModel.id,
          make_name: selectedMake.name,
          model_name: selectedModel.name,
          year,
          color: color || null,
          color_hex: colorHex || null,
          fuel_type: fuelType || null,
          transmission: transmission || null,
          seats_total: seatsTotal,
          seats_available: seatsAvailable,
          features,
          description: description || null,
          active: false, // draft until wizard complete
        }),
      });

      if (!res.ok) throw new Error("Failed to create vehicle");
      const data = await res.json();
      setVehicleId(data.id);
      return data.id as string;
    } catch (err) {
      toast.error("Errore nella creazione del veicolo");
      return null;
    } finally {
      setCreating(false);
    }
  }, [vehicleId, selectedMake, selectedModel, year, color, colorHex, fuelType, transmission, seatsTotal, seatsAvailable, features, description, supabase]);

  const handleStepNext = async () => {
    if (currentStep === "features") {
      // Create vehicle before photos
      const id = await ensureVehicleCreated();
      if (!id) return;
    }
    goNext();
  };

  // Image upload handler
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const vId = vehicleId ?? await ensureVehicleCreated();
    if (!vId) return;

    const maxPhotos = 10;
    const remaining = maxPhotos - images.length;
    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      const id = `${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);

      setImages((prev) => [
        ...prev,
        { id, url: previewUrl, file, uploading: true },
      ]);

      // Upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/vehicles/${vId}/images`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");

        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, url: data.url, uploading: false } : img
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, uploading: false, error: msg } : img
          )
        );
        toast.error(`Errore caricamento: ${msg}`);
      }
    }
  }, [vehicleId, images.length, ensureVehicleCreated]);

  const removeImage = useCallback(async (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  // Final submit
  const handleSubmit = async () => {
    const vId = vehicleId ?? await ensureVehicleCreated();
    if (!vId) return;

    setSubmitting(true);
    try {
      // Activate vehicle and update all fields
      const res = await fetch(`/api/vehicles/${vId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make_id: selectedMake?.id,
          model_id: selectedModel?.id,
          make_name: selectedMake?.name,
          model_name: selectedModel?.name,
          year,
          color: color || null,
          color_hex: colorHex || null,
          fuel_type: fuelType || null,
          transmission: transmission || null,
          seats_total: seatsTotal,
          seats_available: seatsAvailable,
          features,
          description: description || null,
          active: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save vehicle");

      toast.success("🚗 Veicolo aggiunto con successo!");
      onSuccess?.(vId);
    } catch (err) {
      toast.error("Errore nel salvare il veicolo");
    } finally {
      setSubmitting(false);
    }
  };

  // Progress bar
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={stepIndex === 0 ? onCancel : goPrev}
          className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface/60 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface/40">
              {stepIndex + 1} / {STEPS.length} — {STEP_LABELS[currentStep]}
            </span>
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {currentStep === "brand" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">Che marca è?</h2>
              <p className="text-sm text-on-surface/50">Cerca tra 100+ marche disponibili</p>
            </div>
            <VehicleMakeCombobox
              value={selectedMake}
              onChange={setSelectedMake}
              placeholder="Cerca marca (Fiat, VW, BMW...)"
            />
            {selectedMake && (
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">{selectedMake.name}</span>
                {selectedMake.country && (
                  <span className="text-xs text-on-surface/40 ml-auto">{selectedMake.country}</span>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === "model" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Che modello di {selectedMake?.name}?
              </h2>
              <p className="text-sm text-on-surface/50">Seleziona il modello specifico</p>
            </div>
            <VehicleModelCombobox
              makeId={selectedMake?.id ?? null}
              value={selectedModel}
              onChange={setSelectedModel}
              placeholder="Cerca modello (Golf, Panda, 3...)"
            />
          </div>
        )}

        {currentStep === "year" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Anno di immatricolazione
              </h2>
              <p className="text-sm text-on-surface/50">Quando è stata immatricolata?</p>
            </div>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full bg-surface-container-highest rounded-2xl py-4 pl-5 pr-12 text-on-surface text-lg font-bold border border-transparent focus:border-primary/50 focus:outline-none appearance-none"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/40 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high rounded-xl px-4 py-3">
              <Car className="w-4 h-4 text-on-surface/40" />
              <span className="text-sm text-on-surface/60">
                {selectedMake?.name} {selectedModel?.name} — {year}
              </span>
            </div>
          </div>
        )}

        {currentStep === "color" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Che colore è?
              </h2>
              <p className="text-sm text-on-surface/50">Aiuta i passeggeri a riconoscerti</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => { setColor(swatch.name); setColorHex(swatch.hex); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    color === swatch.name
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-surface-container-high hover:border-outline-variant/40"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white/10"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-[11px] font-medium text-on-surface/70 text-center leading-tight">
                    {swatch.name}
                  </span>
                </button>
              ))}
            </div>
            {color && (
              <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
                <div
                  className="w-5 h-5 rounded-full border border-white/10"
                  style={{ backgroundColor: colorHex }}
                />
                <span className="font-semibold text-on-surface">{color}</span>
              </div>
            )}
          </div>
        )}

        {currentStep === "fuel" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Tipo di carburante
              </h2>
              <p className="text-sm text-on-surface/50">Opzionale, ma utile per i filtri di ricerca</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFuelType(ft === fuelType ? "" : ft)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    fuelType === ft
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-outline-variant/20 bg-surface-container-high text-on-surface hover:border-outline-variant/40"
                  }`}
                >
                  <span className="text-2xl mb-2 block">
                    {ft === "electric" ? "⚡" : ft === "hybrid" ? "🔋" : ft === "diesel" ? "🛢️" : ft === "lpg" ? "🟢" : ft === "petrol" ? "⛽" : "🔧"}
                  </span>
                  <span className="font-semibold text-sm">{FUEL_TYPE_LABELS[ft].it}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "transmission" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Tipo di cambio
              </h2>
              <p className="text-sm text-on-surface/50">Opzionale</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(TRANSMISSION_LABELS) as TransmissionType[]).map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTransmission(tr === transmission ? "" : tr)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                    transmission === tr
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/20 bg-surface-container-high hover:border-outline-variant/40"
                  }`}
                >
                  <span className="text-2xl">
                    {tr === "manual" ? "⚙️" : tr === "automatic" ? "🤖" : "🔄"}
                  </span>
                  <div>
                    <p className={`font-bold text-base ${transmission === tr ? "text-primary" : "text-on-surface"}`}>
                      {TRANSMISSION_LABELS[tr].it}
                    </p>
                  </div>
                  {transmission === tr && <Check className="w-5 h-5 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "seats" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Quanti posti hai?
              </h2>
              <p className="text-sm text-on-surface/50">Posti totali e disponibili per i passeggeri</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 block mb-3">
                  Posti totali (incluso guidatore)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setSeatsTotal(n);
                        setSeatsAvailable(Math.min(seatsAvailable, n - 1));
                      }}
                      className={`w-12 h-12 rounded-xl font-bold text-base transition-all ${
                        seatsTotal === n
                          ? "bg-primary text-white"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 block mb-3">
                  Posti disponibili per passeggeri
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: seatsTotal - 1 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSeatsAvailable(n)}
                      className={`w-12 h-12 rounded-xl font-bold text-base transition-all ${
                        seatsAvailable === n
                          ? "bg-primary text-white"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === "photos" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Foto del veicolo
              </h2>
              <p className="text-sm text-on-surface/50">
                Le foto aumentano la fiducia del 40%. Max 10 foto, JPG/PNG/WebP fino a 5MB.
              </p>
            </div>

            {/* Upload area */}
            {images.length < 10 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-8 h-8 text-on-surface/30" />
                <div className="text-center">
                  <p className="font-semibold text-on-surface">Carica foto</p>
                  <p className="text-xs text-on-surface/40 mt-0.5">Drag & drop o tocca per selezionare</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface/40">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Puoi anche scattare una foto con la fotocamera</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
            )}

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-high">
                    <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                    {img.error && (
                      <div className="absolute inset-0 bg-bad/20 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-bad" />
                      </div>
                    )}
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-extrabold uppercase bg-primary text-white px-1.5 py-0.5 rounded-md">
                        Principale
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-bad transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <p className="text-center text-sm text-on-surface/40 py-2">
                Puoi aggiungere le foto anche in seguito dal profilo
              </p>
            )}
          </div>
        )}

        {currentStep === "features" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Comfort e caratteristiche
              </h2>
              <p className="text-sm text-on-surface/50">Seleziona tutto quello che offre il tuo veicolo</p>
            </div>
            <VehicleFeatureTags
              features={features}
              locale={locale}
              editable
              onToggle={(feature) => {
                setFeatures((prev) =>
                  prev.includes(feature)
                    ? prev.filter((f) => f !== feature)
                    : [...prev, feature]
                );
              }}
            />
            {features.length > 0 && (
              <p className="text-xs text-primary text-center">
                {features.length} comfort selezionat{features.length === 1 ? "o" : "i"}
              </p>
            )}
          </div>
        )}

        {currentStep === "description" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">
                Descrivi il tuo veicolo
              </h2>
              <p className="text-sm text-on-surface/50">Opzionale — aumenta la fiducia dei passeggeri</p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Es. Auto comoda e climatizzata, perfetta per lunghi tragitti. Bagagliaio ampio, musica in sottofondo se gradita..."
              rows={5}
              className="w-full bg-surface-container-highest rounded-2xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 border border-transparent focus:border-primary/50 focus:outline-none resize-none transition-all"
            />
            <div className="text-right text-xs text-on-surface/40">
              {description.length}/500
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">Riepilogo veicolo</h2>
              <p className="text-sm text-on-surface/50">Tutto pronto? Aggiungi il veicolo al tuo profilo.</p>
            </div>

            {/* Score preview */}
            <div className="flex items-center justify-center py-4">
              <VehicleTrustScore
                vehicle={{
                  make_name: selectedMake?.name,
                  model_name: selectedModel?.name,
                  images: images.filter(i => !i.error).map((img) => ({
                    id: img.id, url: img.url, vehicle_id: "", owner_id: "",
                    storage_path: "", thumbnail_url: null, order_index: 0,
                    is_primary: false, moderation_status: "pending" as const,
                    created_at: "",
                  })),
                  description: description || undefined,
                  features,
                  rides_count: 0,
                }}
                size="lg"
                showSuggestions
              />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-high rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">Veicolo</p>
                <p className="font-bold text-on-surface">{selectedMake?.name} {selectedModel?.name}</p>
              </div>
              <div className="bg-surface-container-high rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">Anno</p>
                <p className="font-bold text-on-surface">{year}</p>
              </div>
              {color && (
                <div className="bg-surface-container-high rounded-2xl p-4 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: colorHex }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-0.5">Colore</p>
                    <p className="font-bold text-on-surface">{color}</p>
                  </div>
                </div>
              )}
              {fuelType && (
                <div className="bg-surface-container-high rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">Carburante</p>
                  <p className="font-bold text-on-surface">{FUEL_TYPE_LABELS[fuelType].it}</p>
                </div>
              )}
              <div className="bg-surface-container-high rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">Posti</p>
                <p className="font-bold text-on-surface">{seatsAvailable} passeggeri</p>
              </div>
              <div className="bg-surface-container-high rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-1">Foto</p>
                <p className="font-bold text-on-surface">{images.filter(i => !i.error).length} foto</p>
              </div>
            </div>

            {features.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-2">Comfort</p>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => {
                    const info = VEHICLE_FEATURES.find((fi) => fi.key === f);
                    return (
                      <span key={f} className="text-sm bg-surface-container-high px-2 py-1 rounded-lg text-on-surface/70">
                        {info?.icon} {info?.labelIt}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {currentStep !== "review" ? (
          <>
            {currentStep === "photos" || currentStep === "features" || currentStep === "description" ? (
              <button
                type="button"
                onClick={currentStep === "features" ? handleStepNext : goNext}
                className="flex-1 py-2 text-sm text-on-surface/50 hover:text-on-surface transition-colors"
                disabled={creating}
              >
                Salta
              </button>
            ) : null}
            <button
              type="button"
              onClick={currentStep === "features" ? handleStepNext : goNext}
              disabled={!canProceed() || creating}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Continua</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Aggiungi veicolo</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

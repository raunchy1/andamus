"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Haptic } from "@/lib/haptic";

interface StepRoleProps {
  initialData: {
    role: "driver" | "passenger" | "both" | "";
    preferredZones: string[];
  };
  onNext: (data: {
    role: "driver" | "passenger" | "both";
    preferredZones: string[];
  }) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}

export default function StepRole({ initialData, onNext, onBack, onSkip }: StepRoleProps) {
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger" | "both" | "">(initialData.role || "");
  const [selectedZones, setSelectedZones] = useState<string[]>(initialData.preferredZones || []);
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    {
      id: "driver",
      emoji: "🚗",
      title: "Offro Passaggi",
      desc: "Pubblico le mie tratte e guadagno condividendo i costi",
      tag: "Più comune tra pendolari",
    },
    {
      id: "passenger",
      emoji: "🎒",
      title: "Cerco Passaggi",
      desc: "Trovo passaggi sicuri e verificati per i miei spostamenti",
      tag: null,
    },
    {
      id: "both",
      emoji: "⚡",
      title: "Entrambi",
      desc: "A volte guido, a volte sono passeggero",
      tag: "Consigliato",
    },
  ] as const;

  const zones = ["Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Alghero", "Iglesias", "Altra"];

  const handleRoleSelect = (roleId: "driver" | "passenger" | "both") => {
    Haptic.light();
    setSelectedRole(roleId);
  };

  const handleZoneToggle = (zone: string) => {
    Haptic.light();
    setSelectedZones((prev) => {
      if (prev.includes(zone)) {
        return prev.filter((z) => z !== zone);
      } else {
        return [...prev, zone];
      }
    });
  };

  const handleNext = async () => {
    if (!selectedRole || selectedZones.length === 0 || submitting) return;
    setSubmitting(true);
    Haptic.success();
    try {
      await onNext({
        role: selectedRole as "driver" | "passenger" | "both",
        preferredZones: selectedZones,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = selectedRole && selectedZones.length > 0;

  return (
    <div className="flex flex-col flex-1 justify-between h-full w-full">
      <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4 px-1 scrollbar-none">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Come usi Andamus?
          </h2>
          <p className="text-zinc-400 text-xs font-sans mt-1">
            Puoi modificare questa scelta in qualsiasi momento
          </p>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRoleSelect(r.id);
                  }
                }}
                className={`relative border cursor-pointer rounded-2xl p-4 flex gap-4 transition-all duration-200 active:scale-[0.98] outline-none ${
                  isSelected
                    ? "border-[#e63946] bg-[#e63946]/10"
                    : "border-white/[0.06] bg-[#121212] hover:border-white/[0.12]"
                }`}
              >
                {r.tag && (
                  <span className={`absolute top-3 right-3 text-[9px] font-bold rounded-full px-2 py-0.5 uppercase tracking-wide ${
                    isSelected ? "bg-[#e63946] text-white" : "bg-white/[0.06] text-zinc-400"
                  }`}>
                    {r.tag}
                  </span>
                )}
                
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl flex-shrink-0">
                  {r.emoji}
                </div>

                <div className="space-y-0.5 text-left pr-16">
                  <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                    {r.title}
                    {isSelected && <Check className="w-4 h-4 text-[#e63946]" />}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                    {r.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zones Selection */}
        <div className="space-y-3 text-left">
          <label className="text-xs font-bold text-zinc-300 block">Le tue zone di viaggio principali</label>
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => {
              const isSelected = selectedZones.includes(zone);
              return (
                <button
                  type="button"
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold font-sans border transition-all active:scale-[0.95] ${
                    isSelected
                      ? "bg-[#e63946] text-white border-[#e63946]"
                      : "bg-[#121212] text-zinc-400 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              Haptic.light();
              onBack();
            }}
            className="flex-1 py-4 border border-white/5 bg-white/5 text-white font-bold rounded-xl text-base transition-all active:scale-[0.99]"
          >
            Indietro
          </button>
          <button
            type="button"
            disabled={!isValid || submitting}
            onClick={handleNext}
            className="flex-1 py-4 bg-[#e63946] text-white font-bold rounded-xl text-base transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center"
          >
            Continua →
          </button>
        </div>
        
        <button
          type="button"
          onClick={() => {
            Haptic.light();
            onSkip();
          }}
          className="w-full text-zinc-500 hover:text-white font-semibold text-xs py-2 transition-colors"
        >
          Salta per ora
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Haptic } from "@/lib/haptic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

export default function StepRole({ initialData, onNext, onBack, onSkip }: StepRoleProps) {
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger" | "both" | "">(initialData.role || "");
  const [selectedZones, setSelectedZones] = useState<string[]>(initialData.preferredZones || []);
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    {
      id: "driver" as const,
      title: "offro passaggi",
      desc: "pubblico le mie tratte e condivido i costi",
      tag: "più comune tra pendolari",
    },
    {
      id: "passenger" as const,
      title: "cerco passaggi",
      desc: "trovo passaggi sicuri e verificati per i miei spostamenti",
      tag: null,
    },
    {
      id: "both" as const,
      title: "entrambi",
      desc: "a volte guido, a volte sono passeggero",
      tag: "consigliato",
    },
  ];

  const zones = ["Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Alghero", "Iglesias", "Altra"];

  const handleRoleSelect = (roleId: "driver" | "passenger" | "both") => {
    Haptic.light();
    setSelectedRole(roleId);
  };

  const handleZoneToggle = (zone: string) => {
    Haptic.light();
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
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
    <div className="flex h-full w-full flex-1 flex-col justify-between">
      <motion.div
        {...fadeUp}
        className="scrollbar-none max-h-[70vh] space-y-6 overflow-y-auto px-1 pb-4"
      >
        <div className="text-center">
          <h2 className="heading-editorial text-2xl text-fg">come usi andamus?</h2>
          <p className="mt-1 text-xs text-muted">puoi modificare questa scelta in qualsiasi momento</p>
        </div>

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
                className={cn(
                  "relative flex cursor-pointer gap-4 rounded-[var(--radius)] border p-4 outline-none transition-all duration-200 active:scale-[0.98]",
                  isSelected
                    ? "border-accent bg-accent-dim"
                    : "border-line bg-surface hover:border-line-strong"
                )}
              >
                {r.tag && (
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide",
                      isSelected ? "bg-accent text-accent-fg" : "bg-surface-2 text-dim"
                    )}
                  >
                    {r.tag}
                  </span>
                )}

                <div className="space-y-0.5 pr-16 text-left">
                  <h3 className="flex items-center gap-2 text-base font-semibold lowercase text-fg">
                    {r.title}
                    {isSelected && <Check className="size-4 text-accent" strokeWidth={1.5} />}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 text-left">
          <label className="text-eyebrow lowercase">le tue zone di viaggio principali</label>
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => {
              const isSelected = selectedZones.includes(zone);
              return (
                <button
                  type="button"
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={cn(
                    "rounded-full border px-4 py-2 font-mono text-xs lowercase transition-all active:scale-[0.95]",
                    isSelected
                      ? "border-accent bg-accent-dim text-fg"
                      : "border-line bg-surface text-muted hover:border-line-strong"
                  )}
                >
                  {zone.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.06 }}
        className="space-y-3 pt-6"
      >
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => { Haptic.light(); onBack(); }} className="flex-1">
            indietro
          </Button>
          <Button type="button" disabled={!isValid || submitting} onClick={handleNext} className="flex-1">
            continua
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            Haptic.light();
            onSkip();
          }}
          className="w-full py-2 text-xs font-medium text-dim transition-colors hover:text-fg"
        >
          salta per ora
        </button>
      </motion.div>
    </div>
  );
}
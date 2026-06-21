"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
import { Haptic } from "@/lib/haptic";
import { Button } from "@/components/ui/button";

interface StepWelcomeProps {
  displayName: string;
  onNext: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

export default function StepWelcome({ displayName, onNext }: StepWelcomeProps) {
  const firstName = useMemo(() => {
    if (!displayName) return "viaggiatore";
    return displayName.split(" ")[0].toLowerCase();
  }, [displayName]);

  const benefits = [
    {
      icon: Car,
      title: "conduci",
      description: "pubblica i tuoi passaggi e condividi i costi.",
    },
    {
      title: "viaggia",
      description: "trova passaggi sicuri e verificati in tutta la sardegna.",
    },
    {
      title: "risparmia",
      description: "fino a €200 al mese di carburante riducendo le emissioni.",
    },
  ];

  const handleStart = () => {
    Haptic.success();
    onNext();
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col justify-between">
      <motion.div {...fadeUp} className="pt-8 text-center">
        <h1 className="heading-editorial text-3xl text-fg md:text-4xl">
          ciao, {firstName}!
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          sei pronto a condividere i passaggi in tutta la sardegna?
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
        className="my-8 -mx-6 overflow-x-auto px-6 pb-4 md:overflow-visible md:px-0 md:pb-0"
      >
        <div className="flex min-w-max gap-4 md:grid md:min-w-0 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex w-[260px] flex-col items-start gap-3 rounded-[var(--radius)] border border-line bg-surface p-5 transition-transform active:scale-[0.98] md:w-auto"
            >
              {benefit.icon ? (
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
                  <benefit.icon className="size-5 text-muted" strokeWidth={1.5} />
                </div>
              ) : null}
              <div className="space-y-1">
                <h3 className="text-base font-semibold lowercase text-fg">{benefit.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.1 }}
        className="space-y-3 pb-8 text-center"
      >
        <Button type="button" onClick={handleStart} className="w-full">
          iniziamo
        </Button>
        <p className="text-xs text-dim">ci vogliono meno di 2 minuti per iniziare</p>
      </motion.div>
    </div>
  );
}
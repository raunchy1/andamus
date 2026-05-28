"use client";

import { useMemo } from "react";
import { Haptic } from "@/lib/haptic";

interface StepWelcomeProps {
  displayName: string;
  onNext: () => void;
}

export default function StepWelcome({ displayName, onNext }: StepWelcomeProps) {
  const firstName = useMemo(() => {
    if (!displayName) return "Viaggiatore";
    return displayName.split(" ")[0];
  }, [displayName]);

  const benefits = [
    {
      emoji: "🚗",
      title: "Conduci",
      description: "Pubblica i tuoi passaggi e guadagna condividendo i costi.",
    },
    {
      emoji: "🎒",
      title: "Viaggia",
      description: "Trova passaggi sicuri e verificati in tutta la Sardegna.",
    },
    {
      emoji: "🌍",
      title: "Risparmia",
      description: "Fino a €200 al mese di carburante riducendo le emissioni.",
    },
  ];

  const handleStart = () => {
    Haptic.success();
    onNext();
  };

  return (
    <div className="flex flex-col flex-1 justify-between h-full w-full">
      {/* Top Section */}
      <div className="text-center pt-8">
        <div className="w-20 h-20 bg-[#e63946]/10 border border-[#e63946]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl animate-[wave_1.5s_ease-in-out_infinite] origin-[70%_70%] inline-block">👋</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display mb-2">
          Ciao, {firstName}!
        </h1>
        <p className="text-zinc-400 text-sm md:text-base font-sans max-w-sm mx-auto">
          Sei pronto a condividere i passaggi in tutta la Sardegna?
        </p>
      </div>

      {/* Middle Section - Cards */}
      <div className="my-8 overflow-x-auto pb-4 -mx-6 px-6 md:overflow-visible md:pb-0 md:px-0">
        <div className="flex gap-4 md:grid md:grid-cols-3 min-w-max md:min-w-0">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-[#121212] border border-white/[0.06] rounded-2xl p-5 w-[260px] md:w-auto flex flex-col items-start gap-4 transition-transform active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl">
                {benefit.emoji}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base font-display">
                  {benefit.title}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pb-8 text-center space-y-3">
        <button
          onClick={handleStart}
          className="w-full bg-[#e63946] text-white py-4 px-6 rounded-xl text-base font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          Iniziamo →
        </button>
        <p className="text-zinc-500 text-xs font-sans">
          Ci vogliono meno di 2 minuti per iniziare
        </p>
      </div>
    </div>
  );
}

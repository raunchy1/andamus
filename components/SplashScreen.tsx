"use client";

import { useEffect, useState } from "react";
import { Car } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
  minimumDuration?: number;
}

export function SplashScreen({ onComplete, minimumDuration = 2000 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, minimumDuration - elapsed);
          
          setTimeout(() => {
            setVisible(false);
            onComplete?.();
          }, remaining);
          
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [minimumDuration, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center px-8">
      {/* Branding Container */}
      <div className="flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <Car className="w-16 h-16 text-primary" />
          <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full" />
        </div>

        {/* Wordmark */}
        <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-on-surface uppercase">
          Andamus
        </h1>

        {/* Tagline */}
        <div className="mt-2 overflow-hidden">
          <p className="font-label font-bold text-[11px] uppercase tracking-[0.3em] text-primary text-center opacity-80">
            Il carpooling dei sardi
          </p>
        </div>
      </div>

      {/* Bottom Detail */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1">
        <p className="font-label text-[9px] uppercase tracking-widest text-outline">
          Autentico • Sardo • Sicuro
        </p>
        {/* Loading indicator */}
        <div className="w-12 h-[2px] bg-surface-container-highest mt-4 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Background Texture */}
      <div className="absolute inset-0 z-[-1] opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
      </div>
    </div>
  );
}

import { Car } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e63946] to-[#c92a37] animate-pulse-glow">
            <Car className="h-8 w-8 text-white" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
            <div className="absolute -top-1 left-1/2 w-2 h-2 bg-[#e63946] rounded-full" />
          </div>
        </div>
        <p className="text-white/60 text-sm animate-pulse">Caricamento...</p>
      </div>
    </div>
  );
}

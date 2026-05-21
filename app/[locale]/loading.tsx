import { Car } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] bg-[#0a0a0a] flex items-start justify-center pt-32">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#e63946] to-[#c92a37] animate-pulse-glow">
            <Car className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-white/50 text-sm animate-pulse">Caricamento...</p>
      </div>
    </div>
  );
}

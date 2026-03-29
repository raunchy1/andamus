import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
        <p className="text-white/60 text-sm">Caricamento...</p>
      </div>
    </div>
  );
}

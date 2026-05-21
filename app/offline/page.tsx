import Link from "next/link";
import { WifiOff, Home, Clock, MapPin } from "lucide-react";
import { RetryButton } from "@/components/RetryButton";

export const metadata = {
  title: "Offline | Andamus",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#e63946]/20 blur-2xl rounded-full" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#e63946]/20 to-[#ffb3b1]/10 flex items-center justify-center border border-[#e63946]/20">
              <WifiOff className="h-12 w-12 text-[#e63946]" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Sei offline
        </h1>

        <p className="text-white/50 mb-8 leading-relaxed">
          Sembra che tu non sia connesso a internet.
          Non preoccuparti — le tue prenotazioni e i messaggi saranno sincronizzati appena tornerai online.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <RetryButton label="Riprova" />

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            <Home className="h-5 w-5" />
            Torna alla home
          </Link>
        </div>

        {/* Offline capabilities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-left">
            <Clock className="w-5 h-5 text-[#ffb3b1] mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">Cronologia</h3>
            <p className="text-xs text-white/40">Le tue corse salvate sono disponibili offline</p>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-left">
            <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">PWA</h3>
            <p className="text-xs text-white/40">Installa Andamus per un accesso più rapido</p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <h3 className="text-white font-medium mb-2 text-sm">Cosa puoi fare:</h3>
          <ul className="text-white/40 text-sm space-y-1.5 text-left">
            <li className="flex items-start gap-2">
              <span className="text-[#e63946] mt-0.5">•</span>
              Verifica che il Wi-Fi o i dati mobili siano attivi
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#e63946] mt-0.5">•</span>
              Prova a disattivare e riattivare la connessione
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#e63946] mt-0.5">•</span>
              Controlla se ci sono problemi con la tua rete
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Sei offline
        </h1>
        
        <p className="text-white/60 mb-8">
          Sembra che tu non sia connesso a internet. 
          Verifica la tua connessione e riprova.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Riprova
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <Home className="h-5 w-5" />
            Torna alla home
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-12 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-white font-medium mb-2">Cosa puoi fare:</h3>
          <ul className="text-white/60 text-sm space-y-1 text-left">
            <li>• Verifica che il Wi-Fi o i dati mobili siano attivi</li>
            <li>• Prova a disattivare e riattivare la connessione</li>
            <li>• Controlla se ci sono problemi con la tua rete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

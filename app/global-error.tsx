"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="it">
      <body className="bg-[#1a1a2e]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Errore critico
            </h1>
            
            <p className="text-white/60 mb-2">
              Si è verificato un errore grave nell&apos;applicazione.
            </p>
            
            {error.digest && (
              <p className="text-white/40 text-sm mb-8 font-mono">
                Codice errore: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              Ricarica l&apos;app
            </button>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm mb-2">
                Se il problema persiste, contattaci:
              </p>
              <a 
                href="mailto:support@andamus.it"
                className="inline-flex items-center gap-2 text-[#e63946] hover:text-[#c92a37] transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@andamus.it
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

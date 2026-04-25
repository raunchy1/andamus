"use client";

import { useEffect } from "react";
import { SearchX, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    console.error("Search page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-[#e63946]/10 flex items-center justify-center">
            <SearchX className="h-12 w-12 text-[#e63946]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Errore nella ricerca
        </h1>
        
        <p className="text-white/60 mb-8">
          Non siamo riusciti a caricare i risultati della ricerca. 
          Riprova tra qualche istante.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Riprova
          </button>
          
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <Home className="h-5 w-5" />
            Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Car, Home, Search } from "lucide-react";

export const metadata = {
  title: "Pagina non trovata | Andamus",
  description: "La pagina che stai cercando non esiste.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-[#e63946] flex items-center justify-center">
            <Car className="h-10 w-10 text-white" />
          </div>
        </div>
        
        {/* 404 Code */}
        <div className="mb-6">
          <span className="text-8xl font-bold text-[#e63946] opacity-50">404</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Pagina non trovata
        </h1>
        
        <p className="text-white/60 mb-8 text-lg">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>

        {/* Suggestions */}
        <div className="grid gap-3">
          <Link
            href="/it"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
          >
            <Home className="h-5 w-5" />
            Torna alla home
          </Link>
          
          <Link
            href="/it/cerca"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <Search className="h-5 w-5" />
            Cerca un passaggio
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#e63946] opacity-50" />
          <div className="h-2 w-2 rounded-full bg-[#e63946] opacity-30" />
          <div className="h-2 w-2 rounded-full bg-[#e63946] opacity-10" />
        </div>
      </div>
    </div>
  );
}

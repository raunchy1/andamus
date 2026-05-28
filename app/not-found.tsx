"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Home, Search } from "lucide-react";

const messages: Record<string, Record<string, string>> = {
  it: {
    title: "Pagina non trovata",
    desc: "La pagina che stai cercando non esiste o è stata spostata.",
    back: "Torna alla home",
    search: "Cerca un passaggio",
    redirecting: "Reindirizzamento alla home in corso...",
  },
  en: {
    title: "Page not found",
    desc: "The page you are looking for does not exist.",
    back: "Back to home",
    search: "Find a ride",
    redirecting: "Redirecting to home...",
  },
  de: {
    title: "Seite nicht gefunden",
    desc: "Die gesuchte Seite existiert nicht.",
    back: "Zur Startseite",
    search: "Mitfahrgelegenheit suchen",
    redirecting: "Weiterleitung zur Startseite...",
  },
};

export default function NotFound() {
  const [locale, setLocale] = useState("it");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? "it";
      setLocale(savedLocale);

      const path = window.location.pathname;
      // Trigger Zero-Fail Deterministic Fallback for ride details URLs: /corsa/[id] or /rides/[id]
      const rideIdMatch = path.match(/\/(?:corsa|rides)\/([a-zA-Z0-9-]+)/);
      if (rideIdMatch && rideIdMatch[1]) {
        const rideId = rideIdMatch[1];
        // Redirect directly to the dynamic details view which triggers the deterministic fallback
        window.location.replace(`/${savedLocale}/corsa/${rideId}`);
        return;
      }

      // Start 3-second countdown redirect to home page
      setRedirecting(true);
      const timer = setTimeout(() => {
        window.location.replace(`/${savedLocale}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const m = messages[locale] ?? messages.it;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
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
          {m.title}
        </h1>
        
        <p className="text-white/60 mb-4 text-lg">
          {m.desc}
        </p>

        {redirecting && (
          <p className="text-white/40 text-xs mb-8 animate-pulse">
            {m.redirecting}
          </p>
        )}

        {/* Suggestions */}
        <div className="grid gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
          >
            <Home className="h-5 w-5" />
            {m.back}
          </Link>
          
          <Link
            href={`/${locale}/cerca`}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <Search className="h-5 w-5" />
            {m.search}
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

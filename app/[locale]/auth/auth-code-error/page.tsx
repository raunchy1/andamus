"use client";

import { XCircle, Home } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function AuthCodeErrorPage() {
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-[#e63946]/10 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-[#e63946]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          Errore di autenticazione
        </h1>

        <p className="text-muted-foreground mb-8">
          Si è verificato un errore durante il login. Il link potrebbe essere scaduto o non valido. Prova ad accedere di nuovo.
        </p>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
        >
          <Home className="h-5 w-5" />
          Torna alla home
        </Link>
      </div>
    </main>
  );
}

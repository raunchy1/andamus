"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

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
      const rideIdMatch = path.match(/\/(?:corsa|rides)\/([a-zA-Z0-9-]+)/);
      if (rideIdMatch && rideIdMatch[1]) {
        const rideId = rideIdMatch[1];
        window.location.replace(`/${savedLocale}/corsa/${rideId}`);
        return;
      }

      setRedirecting(true);
      const timer = setTimeout(() => {
        window.location.replace(`/${savedLocale}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const m = messages[locale] ?? messages.it;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-[var(--radius)] border border-line bg-surface">
            <Car className="size-10 text-muted" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mb-6">
          <span className="font-mono text-7xl font-medium tabular-nums text-dim sm:text-8xl">
            404
          </span>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-[-0.03em] text-fg">{m.title}</h1>

        <p className="mb-4 text-lg text-muted">{m.desc}</p>

        {redirecting && (
          <p className="mb-8 animate-pulse font-mono text-xs text-dim">{m.redirecting}</p>
        )}

        <div className="grid gap-3">
          <Link href={`/${locale}`} className="block">
            <Button className="w-full gap-2">
              <Home className="size-5" strokeWidth={1.5} />
              {m.back}
            </Button>
          </Link>

          <Link href={`/${locale}/cerca`} className="block">
            <Button variant="outline" className="w-full gap-2">
              <Search className="size-5" strokeWidth={1.5} />
              {m.search}
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          <div className="size-2 rounded-full bg-muted" />
          <div className="size-2 rounded-full bg-dim" />
          <div className="size-2 rounded-full bg-line-strong" />
        </div>
      </div>
    </div>
  );
}
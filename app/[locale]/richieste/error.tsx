"use client";

import { ErrorCard } from "@/components/errors";

export default function BookingsError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <ErrorCard
        title="Errore di caricamento"
        message="Non è stato possibile caricare le tue prenotazioni. Riprova."
        onRetry={reset}
      />
    </div>
  );
}

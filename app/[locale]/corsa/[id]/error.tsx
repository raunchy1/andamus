"use client";

import { ErrorCard } from "@/components/errors";

export default function RideDetailError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <ErrorCard
        title="Errore di caricamento"
        message="Non è stato possibile caricare i dettagli della corsa. Riprova."
        onRetry={reset}
      />
    </div>
  );
}

"use client";

import { ErrorCard } from "@/components/errors";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <ErrorCard
        title="Errore di caricamento"
        message="Non è stato possibile caricare il profilo. Riprova."
        onRetry={reset}
      />
    </div>
  );
}

"use client";

import { ErrorCard } from "@/components/errors";

export default function SearchError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <ErrorCard
        title="Errore di ricerca"
        message="Non è stato possibile caricare i risultati. Riprova."
        onRetry={reset}
      />
    </div>
  );
}

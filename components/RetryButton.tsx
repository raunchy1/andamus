"use client";

import { RefreshCw } from "lucide-react";

export function RetryButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-xl font-medium hover:bg-[#c92a37] transition-colors"
    >
      <RefreshCw className="h-5 w-5" />
      {label}
    </button>
  );
}

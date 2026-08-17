"use client";

import { RefreshCw } from "lucide-react";

export function RetryButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D6A4F] text-white rounded-xl font-medium hover:bg-[#1E4A36] transition-colors"
    >
      <RefreshCw className="h-5 w-5" />
      {label}
    </button>
  );
}

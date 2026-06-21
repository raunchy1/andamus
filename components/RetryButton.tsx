"use client";

import { RefreshCw } from "lucide-react";

export function RetryButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4FB3C9] text-white rounded-xl font-medium hover:bg-[#3d9db3] transition-colors"
    >
      <RefreshCw className="h-5 w-5" />
      {label}
    </button>
  );
}

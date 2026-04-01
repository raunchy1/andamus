"use client";

import { useViewMode } from "./view-mode";

export function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button
      onClick={toggleViewMode}
      className="fixed top-4 right-4 z-[200] bg-[#e63946] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
    >
      {viewMode === "mobile" ? "Desktop View →" : "← Mobile View"}
    </button>
  );
}

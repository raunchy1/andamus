"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  isHome?: boolean;
}

export function ThemeToggle({ isHome = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isHome
            ? "text-white/70"
            : "text-gray-500"
        }`}
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
        isHome
          ? isDark
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
          : isDark
            ? "text-gray-400 hover:bg-gray-800 hover:text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
      title={isDark ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
    </button>
  );
}

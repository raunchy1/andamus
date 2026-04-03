"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Apply theme function - defined early to avoid TDZ issues
  const applyTheme = (next: Theme) => {
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
    }
  };

  useEffect(() => {
    // Schedule in microtask to avoid React 19 cascading render warning
    Promise.resolve().then(() => {
      setMounted(true);
      const saved = typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme | null) : null;
      const initial = saved || "dark";
      setThemeState(initial);
      applyTheme(initial);
    });
  }, []);

  // Prevent hydration mismatch by forcing dark on server/pre-mount
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

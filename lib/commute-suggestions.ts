"use client";

interface SearchEntry {
  from: string;
  to: string;
  timestamp: number;
  dayOfWeek: number; // 0-6
}

export function trackSearchInHistory(from: string, to: string) {
  if (typeof window === "undefined" || !from || !to) return;

  try {
    const stored = localStorage.getItem("andamus_search_history");
    let history: SearchEntry[] = stored ? JSON.parse(stored) : [];

    // Add new entry
    const now = new Date();
    const newEntry: SearchEntry = {
      from,
      to,
      timestamp: now.getTime(),
      dayOfWeek: now.getDay(),
    };

    // Filter out duplicates in last 5 minutes to prevent spamming history
    history = history.filter(
      (entry) =>
        !(entry.from === from && entry.to === to && now.getTime() - entry.timestamp < 5 * 60 * 1000)
    );

    history.unshift(newEntry);

    // Keep only last 20 searches
    localStorage.setItem("andamus_search_history", JSON.stringify(history.slice(0, 20)));
  } catch (err) {
    console.error("[commute-suggestions] Error tracking search:", err);
  }
}

export function getCommuteSuggestion(): { from: string; to: string; reason: string } | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("andamus_search_history");
    if (!stored) return null;

    const history: SearchEntry[] = JSON.parse(stored);
    if (history.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();

    // 1. Check for day-of-week pattern (e.g. same route searched on this day of week previously)
    const dayMatches = history.filter((entry) => entry.dayOfWeek === currentDay);
    if (dayMatches.length > 0) {
      // Find the most frequent route on this day
      const frequencyMap: Record<string, { count: number; from: string; to: string }> = {};
      dayMatches.forEach((entry) => {
        const key = `${entry.from}-${entry.to}`;
        if (!frequencyMap[key]) {
          frequencyMap[key] = { count: 0, from: entry.from, to: entry.to };
        }
        frequencyMap[key].count++;
      });

      const sortedMatches = Object.values(frequencyMap).sort((a, b) => b.count - a.count);
      if (sortedMatches.length > 0) {
        return {
          from: sortedMatches[0].from,
          to: sortedMatches[0].to,
          reason: "Solitamente cerchi questa tratta in questo giorno della settimana",
        };
      }
    }

    // 2. Fallback: Suggest the return route of the most recent search!
    // (e.g. if they searched Cagliari -> Sassari recently, suggest Sassari -> Cagliari as the return suggestion)
    const mostRecent = history[0];
    if (mostRecent) {
      return {
        from: mostRecent.to,
        to: mostRecent.from,
        reason: "Suggerito in base al tuo ultimo viaggio cercato",
      };
    }
  } catch (err) {
    console.error("[commute-suggestions] Error getting suggestion:", err);
  }

  return null;
}

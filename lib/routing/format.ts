export function foldPlaceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function makeWaypointsKey(cities: string[]): string {
  return cities.map(foldPlaceName).filter(Boolean).join("|");
}

export function stripRegionSuffix(input: string): string {
  return input.replace(/,?\s*Sardegna\b.*$/i, "").trim();
}

export function formatDurationMinutes(mins: number): string {
  const safe = Math.max(0, Math.round(mins));
  if (safe < 60) return `${safe} min`;
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatDistanceKm(meters: number): string {
  const km = Math.max(1, Math.round(meters / 1000));
  return `${km} km`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = ((h * 60 + m + Math.round(minutes)) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

import { SARDINIA_CITIES } from "@/lib/sardinia-cities";
import { foldPlaceName } from "@/lib/routing/format";
import type { RoutePoint, RoutePointKind } from "@/lib/routing/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface ResolvedPlace {
  name: string;
  lat: number;
  lng: number;
}

const SARDINIA_BBOX = {
  minLat: 38.7,
  maxLat: 41.5,
  minLng: 8.0,
  maxLng: 10.0,
};

let indexPromise: Promise<Map<string, ResolvedPlace>> | null = null;

function inSardinia(lat: number, lng: number): boolean {
  return (
    lat >= SARDINIA_BBOX.minLat &&
    lat <= SARDINIA_BBOX.maxLat &&
    lng >= SARDINIA_BBOX.minLng &&
    lng <= SARDINIA_BBOX.maxLng
  );
}

function indexPlace(map: Map<string, ResolvedPlace>, place: ResolvedPlace) {
  const primary = foldPlaceName(place.name);
  if (primary) map.set(primary, place);
  const withoutDi = foldPlaceName(place.name.replace(/\bdi\b/gi, " "));
  if (withoutDi && !map.has(withoutDi)) map.set(withoutDi, place);
}

async function loadIndex(): Promise<Map<string, ResolvedPlace>> {
  const map = new Map<string, ResolvedPlace>();

  for (const [name, coords] of Object.entries(SARDINIA_CITIES)) {
    if (!inSardinia(coords.lat, coords.lng)) continue;
    indexPlace(map, { name, lat: coords.lat, lng: coords.lng });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("locations")
      .select("name, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      console.error("[routing] locations lookup failed:", error.message);
    } else {
      for (const row of data ?? []) {
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inSardinia(lat, lng)) continue;
        indexPlace(map, { name: row.name, lat, lng });
      }
    }
  } catch (err) {
    console.error("[routing] locations index error:", err);
  }

  return map;
}

function getIndex(): Promise<Map<string, ResolvedPlace>> {
  if (!indexPromise) indexPromise = loadIndex();
  return indexPromise;
}

export async function resolvePlace(name: string): Promise<ResolvedPlace | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const index = await getIndex();
  return (
    index.get(foldPlaceName(trimmed)) ??
    index.get(foldPlaceName(trimmed.replace(/\bdi\b/gi, " "))) ??
    null
  );
}

export async function resolveRoutePoints(
  fromCity: string,
  toCity: string,
  viaCities: string[] = []
): Promise<RoutePoint[] | null> {
  const origin = await resolvePlace(fromCity);
  const destination = await resolvePlace(toCity);
  if (!origin || !destination) return null;

  const points: RoutePoint[] = [{ ...origin, name: fromCity, kind: "origin" }];

  for (const city of viaCities) {
    if (foldPlaceName(city) === foldPlaceName(fromCity)) continue;
    if (foldPlaceName(city) === foldPlaceName(toCity)) continue;
    const stop = await resolvePlace(city);
    if (!stop) continue;
    const kind: RoutePointKind = "stop";
    points.push({ ...stop, name: city, kind });
  }

  points.push({ ...destination, name: toCity, kind: "destination" });
  return points;
}

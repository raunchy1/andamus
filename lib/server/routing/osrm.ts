import { makeWaypointsKey } from "@/lib/routing/format";
import type { RideRoute, RouteLeg, RouteLineString, RoutePoint } from "@/lib/routing/types";
import { resolveRoutePoints } from "@/lib/server/routing/locations";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const OSRM_URL = (process.env.OSRM_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const OSRM_TIMEOUT_MS = 6_000;
const USER_AGENT = "Andamus/1.0 (carpooling; sardinia routing)";

const inflight = new Map<string, Promise<RideRoute | null>>();

interface CachedRow {
  waypoints_key: string;
  from_city: string;
  to_city: string;
  via_cities: string[] | null;
  distance_m: number;
  duration_s: number;
  geometry: RouteLineString;
  legs: RouteLeg[] | null;
  points: RoutePoint[] | null;
  provider: string | null;
}

function uniqueVia(fromCity: string, toCity: string, viaCities: string[]): string[] {
  const seen = new Set([fromCity.trim().toLowerCase(), toCity.trim().toLowerCase()]);
  const out: string[] = [];
  for (const city of viaCities) {
    const trimmed = city.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function chainNames(fromCity: string, toCity: string, via: string[]): string[] {
  return [fromCity, ...via, toCity];
}

function isLineString(value: unknown): value is RouteLineString {
  if (!value || typeof value !== "object") return false;
  const geo = value as RouteLineString;
  return geo.type === "LineString" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2;
}

function rowToRoute(row: CachedRow, fallbackPoints: RoutePoint[]): RideRoute {
  return {
    waypoints_key: row.waypoints_key,
    from_city: row.from_city,
    to_city: row.to_city,
    via_cities: row.via_cities ?? [],
    points: row.points && row.points.length >= 2 ? row.points : fallbackPoints,
    geometry: isLineString(row.geometry) ? row.geometry : null,
    distance_m: row.distance_m,
    duration_s: row.duration_s,
    legs: Array.isArray(row.legs) ? row.legs : [],
    provider: row.provider === "osrm" ? "osrm" : "osrm",
  };
}

function pointsOnlyRoute(
  key: string,
  fromCity: string,
  toCity: string,
  via: string[],
  points: RoutePoint[]
): RideRoute {
  return {
    waypoints_key: key,
    from_city: fromCity,
    to_city: toCity,
    via_cities: via,
    points,
    geometry: null,
    distance_m: null,
    duration_s: null,
    legs: [],
    provider: null,
  };
}

async function readCache(key: string): Promise<CachedRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("route_geometries")
    .select(
      "waypoints_key, from_city, to_city, via_cities, distance_m, duration_s, geometry, legs, points, provider"
    )
    .eq("waypoints_key", key)
    .maybeSingle();

  if (error) {
    console.error("[routing] cache read failed:", error.message);
    return null;
  }
  return (data as CachedRow | null) ?? null;
}

async function writeCache(route: RideRoute): Promise<void> {
  if (route.distance_m == null || route.duration_s == null || !route.geometry) return;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("route_geometries").upsert(
    {
      waypoints_key: route.waypoints_key,
      from_city: route.from_city,
      to_city: route.to_city,
      via_cities: route.via_cities,
      distance_m: route.distance_m,
      duration_s: route.duration_s,
      geometry: route.geometry,
      legs: route.legs,
      points: route.points,
      provider: "osrm",
      computed_at: new Date().toISOString(),
    },
    { onConflict: "waypoints_key" }
  );
  if (error) {
    console.error("[routing] cache write failed:", error.message);
  }
}

interface OsrmResponse {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: RouteLineString;
    legs?: Array<{ distance: number; duration: number }>;
  }>;
}

async function fetchOsrm(points: RoutePoint[]): Promise<OsrmResponse | null> {
  const coords = points.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(OSRM_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[routing] OSRM HTTP", res.status);
      return null;
    }
    return (await res.json()) as OsrmResponse;
  } catch (err) {
    console.error("[routing] OSRM request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function buildRouted(
  key: string,
  fromCity: string,
  toCity: string,
  via: string[],
  points: RoutePoint[],
  payload: OsrmResponse
): RideRoute | null {
  const route = payload.routes?.[0];
  if (payload.code !== "Ok" || !route || !isLineString(route.geometry)) return null;
  if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration)) return null;

  const osrmLegs = route.legs ?? [];
  const legs: RouteLeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const raw = osrmLegs[i];
    legs.push({
      from: points[i].name,
      to: points[i + 1].name,
      distance_m: Math.round(raw?.distance ?? 0),
      duration_s: Math.round(raw?.duration ?? 0),
    });
  }

  return {
    waypoints_key: key,
    from_city: fromCity,
    to_city: toCity,
    via_cities: via,
    points,
    geometry: route.geometry,
    distance_m: Math.round(route.distance),
    duration_s: Math.round(route.duration),
    legs,
    provider: "osrm",
  };
}

async function compute(fromCity: string, toCity: string, viaCities: string[]): Promise<RideRoute | null> {
  const via = uniqueVia(fromCity, toCity, viaCities);
  const key = makeWaypointsKey(chainNames(fromCity, toCity, via));
  if (!key.includes("|")) return null;

  const points = await resolveRoutePoints(fromCity, toCity, via);
  if (!points || points.length < 2) return null;

  const cached = await readCache(key);
  if (cached) return rowToRoute(cached, points);

  const payload = await fetchOsrm(points);
  const routed = payload ? buildRouted(key, fromCity, toCity, via, points, payload) : null;
  if (routed) {
    await writeCache(routed);
    return routed;
  }

  return pointsOnlyRoute(key, fromCity, toCity, via, points);
}

/**
 * Road route between two places, with optional intermediate stops as
 * OSRM waypoints. Hits `route_geometries` first; only calls OSRM on a miss.
 */
export async function getRouteForRide(
  fromCity: string,
  toCity: string,
  viaCities: string[] = []
): Promise<RideRoute | null> {
  const via = uniqueVia(fromCity, toCity, viaCities);
  const key = makeWaypointsKey(chainNames(fromCity, toCity, via));
  if (!key) return null;

  const existing = inflight.get(key);
  if (existing) return existing;

  const pending = compute(fromCity, toCity, via).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

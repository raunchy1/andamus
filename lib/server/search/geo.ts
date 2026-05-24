import "server-only";

/**
 * Geo Search
 * ==========
 * Location-aware search for rides near the user.
 * WHY: Users often want rides "near me" without specifying exact cities.
 * Geo search enables distance-based filtering and sorting.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoSearchOptions {
  center: GeoPoint;
  radiusKm: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface GeoSearchResult {
  id: string;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  date: string;
  time: string;
  price: number;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Distance calculation (Haversine)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLng2 = Math.sin(dLng / 2);

  const c = 2 * Math.atan2(
    Math.sqrt(sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLng2 * sinDLng2),
    Math.sqrt(1 - (sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLng2 * sinDLng2))
  );

  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ---------------------------------------------------------------------------
// City coordinates lookup
// ---------------------------------------------------------------------------

// Common Italian cities — in production, this would be a full geocoding DB
const CITY_COORDINATES: Record<string, GeoPoint> = {
  roma: { lat: 41.9028, lng: 12.4964 },
  milano: { lat: 45.4642, lng: 9.19 },
  napoli: { lat: 40.8518, lng: 14.2681 },
  torino: { lat: 45.0703, lng: 7.6869 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  firenze: { lat: 43.7696, lng: 11.2558 },
  venezia: { lat: 45.4408, lng: 12.3155 },
  verona: { lat: 45.4384, lng: 10.9916 },
  padova: { lat: 45.4064, lng: 11.8768 },
  genova: { lat: 44.4056, lng: 8.9463 },
  palermo: { lat: 38.1157, lng: 13.3615 },
  catania: { lat: 37.5079, lng: 15.083 },
  bari: { lat: 41.1171, lng: 16.8719 },
  lecce: { lat: 40.3515, lng: 18.175 },
  trieste: { lat: 45.6495, lng: 13.7768 },
  trento: { lat: 46.0748, lng: 11.1217 },
  perugia: { lat: 43.1107, lng: 12.3908 },
  ancona: { lat: 43.6158, lng: 13.5189 },
  pescara: { lat: 42.4646, lng: 14.2147 },
  brescia: { lat: 45.5416, lng: 10.2118 },
  bergamo: { lat: 45.6983, lng: 9.6773 },
  modena: { lat: 44.6471, lng: 10.9252 },
  parma: { lat: 44.8015, lng: 10.328 },
  rimini: { lat: 44.0571, lng: 12.5647 },
  pisa: { lat: 43.7228, lng: 10.4017 },
  siena: { lat: 43.3188, lng: 11.3308 },
  livorno: { lat: 43.5485, lng: 10.3106 },
  cagliari: { lat: 39.2238, lng: 9.1217 },
  sassari: { lat: 40.7259, lng: 8.5556 },
};

export function getCityCoordinates(cityName: string): GeoPoint | null {
  const normalized = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Geo search implementation
// ---------------------------------------------------------------------------

/**
 * Find rides departing from cities within a radius.
 * Uses in-memory filtering since we don't have PostGIS enabled.
 * For production scale, enable PostGIS extension and use spatial indexes.
 */
export async function searchRidesByLocation(
  options: GeoSearchOptions
): Promise<GeoSearchResult[]> {
  const supabase = await createServiceRoleClient();
  const today = options.dateFrom ?? new Date().toISOString().split("T")[0];
  const limit = Math.min(options.limit ?? 20, 50);

  // Fetch candidate rides (from active rides in the next 30 days)
  const { data, error } = await supabase
    .from("rides")
    .select(`
      id, from_city, to_city, date, time, price, seats, status,
      profiles!inner(name, avatar_url, rating)
    `)
    .eq("status", "active")
    .gte("date", today)
    .lte("date", options.dateTo ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(200);

  if (error || !data) {
    console.error("[geo] searchRidesByLocation error:", error?.message);
    return [];
  }

  // Compute distances and filter
  const results: GeoSearchResult[] = [];

  for (const ride of data as Array<Record<string, unknown>>) {
    const fromCityCoords = getCityCoordinates(ride.from_city as string);
    if (!fromCityCoords) continue;

    const distance = haversineDistance(options.center, fromCityCoords);
    if (distance <= options.radiusKm) {
      results.push({
        id: ride.id as string,
        fromCity: ride.from_city as string,
        toCity: ride.to_city as string,
        distanceKm: Math.round(distance * 10) / 10,
        date: ride.date as string,
        time: ride.time as string,
        price: ride.price as number,
        data: ride,
      });
    }
  }

  // Sort by distance, then by date
  results.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return results.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Popular nearby cities
// ---------------------------------------------------------------------------

export async function getNearbyCities(
  center: GeoPoint,
  options?: { radiusKm?: number; limit?: number }
): Promise<Array<{ name: string; distanceKm: number }>> {
  const radius = options?.radiusKm ?? 100;
  const limit = Math.min(options?.limit ?? 10, 50);

  const cities = Object.entries(CITY_COORDINATES)
    .map(([name, coords]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      distanceKm: haversineDistance(center, coords),
    }))
    .filter((c) => c.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return cities;
}

// ---------------------------------------------------------------------------
// PostGIS migration helper (for future enablement)
// ---------------------------------------------------------------------------

export const POSTGIS_SETUP_SQL = `
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to rides
ALTER TABLE rides ADD COLUMN IF NOT EXISTS from_location GEOGRAPHY(POINT);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS to_location GEOGRAPHY(POINT);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_rides_from_location ON rides USING GIST(from_location);
CREATE INDEX IF NOT EXISTS idx_rides_to_location ON rides USING GIST(to_location);

-- Update existing rides with coordinates
UPDATE rides r
SET from_location = ST_SetSRID(ST_MakePoint(c.lng, c.lat), 4326)::geography
FROM (
  SELECT unnest(ARRAY[
    'Roma', 'Milano', 'Napoli', 'Torino', 'Bologna', 'Firenze', 'Venezia'
  ]) AS city,
  unnest(ARRAY[
    POINT(12.4964, 41.9028), POINT(9.1900, 45.4642), POINT(14.2681, 40.8518),
    POINT(7.6869, 45.0703), POINT(11.3426, 44.4949), POINT(11.2558, 43.7696),
    POINT(12.3155, 45.4408)
  ]) AS coords
) c
WHERE r.from_city ILIKE c.city AND r.from_location IS NULL;

-- Function for nearby search
CREATE OR REPLACE FUNCTION nearby_rides(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE(id UUID, distance_meters DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, ST_Distance(r.from_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
  FROM rides r
  WHERE ST_DWithin(
    r.from_location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  AND r.status = 'active'
  AND r.date >= CURRENT_DATE
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
`;

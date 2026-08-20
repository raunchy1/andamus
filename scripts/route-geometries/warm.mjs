#!/usr/bin/env node
/**
 * Fill `route_geometries` for every distinct ride pair (and stop chain)
 * currently in the database, so the ride page never waits on OSRM.
 *
 * Usage:
 *   node --env-file=.env.local scripts/route-geometries/warm.mjs
 *   node --env-file=.env.local scripts/route-geometries/warm.mjs --dry
 */
import { createClient } from "@supabase/supabase-js";

const OSRM_URL = (process.env.OSRM_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const USER_AGENT = "Andamus/1.0 (carpooling; sardinia routing warm)";
const PAUSE_MS = 800;
const SARDINIA = { minLat: 38.7, maxLat: 41.5, minLng: 8.0, maxLng: 10.0 };

const fold = (s) =>
  s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function inSardinia(lat, lng) {
  return lat >= SARDINIA.minLat && lat <= SARDINIA.maxLat && lng >= SARDINIA.minLng && lng <= SARDINIA.maxLng;
}

function keyFor(cities) {
  return cities.map(fold).filter(Boolean).join("|");
}

async function main() {
  const dry = process.argv.includes("--dry");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("name, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (locErr) throw locErr;

  const byName = new Map();
  const put = (key, place) => {
    if (key && !byName.has(key)) byName.set(key, place);
  };
  for (const row of locations) {
    const lat = Number(row.latitude);
    const lng = Number(row.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inSardinia(lat, lng)) continue;
    const place = { name: row.name, lat, lng };
    put(fold(row.name), place);
    put(fold(row.name.replace(/\bdi\b/gi, " ")), place);
  }
  console.log(`locations with coordinates: ${byName.size}`);

  const { data: rides, error: rideErr } = await supabase
    .from("rides")
    .select("id, from_city, to_city");
  if (rideErr) throw rideErr;

  const { data: stops, error: stopErr } = await supabase
    .from("ride_stops")
    .select("ride_id, city, order_index")
    .order("order_index", { ascending: true });
  if (stopErr) console.warn("ride_stops:", stopErr.message);

  const stopsByRide = new Map();
  for (const s of stops ?? []) {
    if (!stopsByRide.has(s.ride_id)) stopsByRide.set(s.ride_id, []);
    stopsByRide.get(s.ride_id).push(s.city);
  }

  const chains = new Map();
  for (const ride of rides ?? []) {
    const via = (stopsByRide.get(ride.id) ?? []).filter(
      (c) => c && c !== ride.from_city && c !== ride.to_city
    );
    const cities = [ride.from_city, ...via, ride.to_city];
    const k = keyFor(cities);
    if (!k.includes("|")) continue;
    if (!chains.has(k)) chains.set(k, cities);
  }
  console.log(`unique waypoint chains: ${chains.size}`);

  const { data: existing, error: existErr } = await supabase
    .from("route_geometries")
    .select("waypoints_key");
  if (existErr) throw existErr;
  const have = new Set((existing ?? []).map((r) => r.waypoints_key));

  let computed = 0;
  let skipped = 0;
  let failed = 0;
  for (const [k, cities] of chains) {
    if (have.has(k)) {
      skipped++;
      continue;
    }
    const points = [];
    let missing = false;
    for (const city of cities) {
      const hit = byName.get(fold(city)) || byName.get(fold(city.replace(/\bdi\b/gi, " ")));
      if (!hit) {
        missing = true;
        break;
      }
      points.push({ name: city, ...hit });
    }
    if (missing) {
      failed++;
      console.warn("no coords:", cities.join(" → "));
      continue;
    }

    if (dry) {
      console.log("would route", cities.join(" → "));
      computed++;
      continue;
    }

    const coords = points.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
    const osrmUrl = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(osrmUrl, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      failed++;
      console.warn("OSRM", res.status, cities.join(" → "));
      await sleep(PAUSE_MS);
      continue;
    }
    const json = await res.json();
    const route = json.routes?.[0];
    if (json.code !== "Ok" || !route?.geometry?.coordinates) {
      failed++;
      console.warn("no route", cities.join(" → "));
      await sleep(PAUSE_MS);
      continue;
    }

    const legs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const raw = route.legs?.[i];
      legs.push({
        from: points[i].name,
        to: points[i + 1].name,
        distance_m: Math.round(raw?.distance ?? 0),
        duration_s: Math.round(raw?.duration ?? 0),
      });
    }

    const via_cities = cities.slice(1, -1);
    const { error: upErr } = await supabase.from("route_geometries").upsert(
      {
        waypoints_key: k,
        from_city: cities[0],
        to_city: cities[cities.length - 1],
        via_cities,
        distance_m: Math.round(route.distance),
        duration_s: Math.round(route.duration),
        geometry: route.geometry,
        legs,
        points: points.map((p, i) => ({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          kind: i === 0 ? "origin" : i === points.length - 1 ? "destination" : "stop",
        })),
        provider: "osrm",
        computed_at: new Date().toISOString(),
      },
      { onConflict: "waypoints_key" }
    );
    if (upErr) {
      failed++;
      console.warn("upsert", upErr.message, cities.join(" → "));
    } else {
      computed++;
      console.log(
        `${cities.join(" → ")}  ${Math.round(route.distance / 1000)} km / ${Math.round(route.duration / 60)} min`
      );
    }
    await sleep(PAUSE_MS);
  }

  console.log(`done. computed=${computed} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

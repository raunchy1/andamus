#!/usr/bin/env node
/**
 * Fill in `locations.latitude` / `locations.longitude` from Wikidata.
 *
 * The bulk import of the 378 Sardinian comuni arrived without coordinates —
 * only the hand-added ports, airports and frazioni had them. A location with
 * no point cannot be drawn on a map, measured, or routed through, so the ride
 * page showed "coordinates unavailable" for most trips.
 *
 * Idempotent: only rows that are still missing a coordinate are written, so
 * re-running is safe and cheap. Names are matched with accents and punctuation
 * folded away ("Alà dei Sardi" -> "aladeisardi").
 *
 * Usage:  SUPABASE_SERVICE_ROLE_KEY=... node scripts/location-coords/backfill.mjs [--dry]
 */
import { createClient } from "@supabase/supabase-js";

const SPARQL = `
SELECT ?itemLabel ?lat ?lon WHERE {
  ?item wdt:P31 wd:Q747074 .        # comune of Italy
  ?item wdt:P131* wd:Q1462 .        # ... located in Sardinia
  ?item p:P625 ?coord .
  ?coord psv:P625 ?node .
  ?node wikibase:geoLatitude ?lat .
  ?node wikibase:geoLongitude ?lon .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
}`;

const fold = (s) =>
  s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

async function fetchWikidata() {
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(SPARQL);
  const res = await fetch(url, {
    headers: {
      // Wikidata asks for a descriptive agent; anonymous bursts get throttled.
      "User-Agent": "Andamus/1.0 (carpooling; location coordinate backfill)",
      Accept: "application/sparql-results+json",
    },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map((b) => ({
    name: b.itemLabel.value,
    lat: Number(b.lat.value),
    lon: Number(b.lon.value),
  }));
}

async function main() {
  const dry = process.argv.includes("--dry");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const comuni = await fetchWikidata();
  const byName = new Map(comuni.map((c) => [fold(c.name), c]));
  console.log(`Wikidata: ${comuni.length} comuni with coordinates`);

  const { data: missing, error } = await supabase
    .from("locations")
    .select("id, name")
    .or("latitude.is.null,longitude.is.null");
  if (error) throw error;
  console.log(`locations missing coordinates: ${missing.length}`);

  let matched = 0;
  const unmatched = [];
  for (const row of missing) {
    const hit = byName.get(fold(row.name));
    if (!hit) {
      unmatched.push(row.name);
      continue;
    }
    matched++;
    if (!dry) {
      const { error: upErr } = await supabase
        .from("locations")
        .update({ latitude: hit.lat, longitude: hit.lon })
        .eq("id", row.id);
      if (upErr) console.error(`  ${row.name}: ${upErr.message}`);
    }
  }

  console.log(`${dry ? "would update" : "updated"}: ${matched}`);
  if (unmatched.length) {
    console.log(`no Wikidata match (${unmatched.length}):`);
    for (const n of unmatched) console.log(`  - ${n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

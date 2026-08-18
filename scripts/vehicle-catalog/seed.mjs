// Seeds vehicle_models from catalog.json. Idempotent: matches on (make_id, slug).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const { data: makes, error: mErr } = await db.from("vehicle_makes").select("id, slug");
if (mErr) throw mErr;
const makeId = Object.fromEntries(makes.map((m) => [m.slug, m.id]));

const rows = JSON.parse(fs.readFileSync("scripts/vehicle-catalog/catalog.json", "utf8"))
  .filter((r) => makeId[r.make_slug])
  .map((r) => ({
    make_id: makeId[r.make_slug],
    name: r.name,
    slug: slugify(r.name),
    image_url: r.image_url,
    image_author: r.image_author,
    image_license: r.image_license,
    image_source_url: r.image_source_url,
    // Wikipedia language-edition count is a good proxy for how well known a
    // nameplate is; it drives both the "popular" flag and the sort order.
    is_popular: (r.popularity ?? 0) >= 15,
    sort_order: 1000 - Math.min(r.popularity ?? 0, 999),
  }));

// Drop duplicate (make, slug) pairs — two labels can normalise to one nameplate.
const seen = new Set();
const unique = rows.filter((r) => {
  const k = r.make_id + "/" + r.slug;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log("seeding", unique.length, "models");
for (let i = 0; i < unique.length; i += 500) {
  const chunk = unique.slice(i, i + 500);
  const { error } = await db.from("vehicle_models").upsert(chunk, { onConflict: "make_id,slug" });
  if (error) throw error;
  process.stdout.write(`  ${i + chunk.length}/${unique.length}\r`);
}
console.log("\ndone");

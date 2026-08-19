// Wikidata's chosen photo is sometimes technically correct but a poor symbol
// (Cagliari's was shot through an aeroplane window). overrides.json pins a
// specific Commons file for a slug; this refreshes its credit and drops the
// mirrored copy so mirror.mjs fetches the new one.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const OVERRIDES = "scripts/location-photos/overrides.json";
const MANIFEST = "scripts/location-photos/manifest.json";
if (!existsSync(OVERRIDES)) { console.log("no overrides file"); process.exit(0); }

const overrides = JSON.parse(readFileSync(OVERRIDES, "utf8"));
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

for (const [slug, file] of Object.entries(overrides)) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2" +
    "&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1200&titles=" + encodeURIComponent(file);
  const json = await (await fetch(url, { headers: { "User-Agent": UA } })).json();
  const page = json?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info) { console.log("missing on Commons:", file); continue; }
  const meta = info.extmetadata || {};
  manifest[slug] = {
    name: manifest[slug]?.name || slug,
    ...(manifest[slug] || {}),
    file: page.title,
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    original: info.url,
    thumb: info.thumburl || info.url,
    author: stripHtml(meta.Artist?.value) || null,
    license: stripHtml(meta.LicenseShortName?.value) || null,
    licenseUrl: meta.LicenseUrl?.value || null,
  };
  delete manifest[slug].mirrorError;
  await db.storage.from("location-photos").remove([`${slug}.webp`]);
  console.log("override", slug, "→", page.title.slice(0, 60));
  await new Promise((r) => setTimeout(r, 250));
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("done — re-run mirror.mjs to fetch the replacements");

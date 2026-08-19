// Emits the compact map the app ships: normalised city name → photo credit.
// The image URL itself is derived from the slug, so it is not stored twice.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";

const manifest = JSON.parse(readFileSync("scripts/location-photos/manifest.json", "utf8"));
const out = {};
for (const [slug, v] of Object.entries(manifest)) {
  if (v.mirrorError) continue;
  out[slug] = {
    // Bumps whenever the source file changes, so a curated replacement is not
    // served from the CDN cache of the old one.
    v: createHash("sha1").update(v.file || slug).digest("hex").slice(0, 8),
    n: v.name || slug,
    a: v.author || null,
    l: v.license || null,
    lu: v.licenseUrl || null,
    s: v.source || null,
  };
}
mkdirSync("lib/data", { recursive: true });
writeFileSync("lib/data/location-photos.json", JSON.stringify(out));
console.log("emitted", Object.keys(out).length, "entries");

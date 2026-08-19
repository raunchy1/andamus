// Downloads each photo from Commons once, converts it to an 800px WebP and
// uploads it to the Supabase bucket, so a page render never depends on
// Commons (which rate-limits server-side fetches hard).
//
// Idempotent: files already in the bucket are skipped, so it can be re-run
// after an interruption.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "location-photos";
const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MANIFEST = "scripts/location-photos/manifest.json";
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

const { data: existing } = await db.storage.from(BUCKET).list("", { limit: 1000 });
const have = new Set((existing || []).map((f) => f.name));
const todo = Object.entries(manifest).filter(([slug]) => !have.has(`${slug}.webp`));
console.log(`in bucket: ${have.size} · to mirror: ${todo.length}`);

let done = 0, failed = 0;
for (const [slug, entry] of todo) {
  // Ask Commons for a 1200px rendering rather than the full-size original:
  // some of these files are 20 MB scans.
  const src = entry.thumb || entry.original;
  try {
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(src, { headers: { "User-Agent": UA } });
      if (res.ok) break;
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
      break;
    }
    if (!res?.ok) throw new Error(`http ${res?.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(buf)
      .rotate()
      .resize(800, 500, { fit: "cover", position: "attention" })
      .webp({ quality: 74 })
      .toBuffer();

    const { error } = await db.storage.from(BUCKET).upload(`${slug}.webp`, webp, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) throw error;
    done++;
    process.stdout.write(".");
  } catch (err) {
    failed++;
    manifest[slug] = { ...manifest[slug], mirrorError: String(err.message || err) };
    process.stdout.write("x");
  }
  if ((done + failed) % 50 === 0) console.log(` ${done + failed}/${todo.length}`);
  await sleep(400);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\nmirrored ${done}, failed ${failed}`);

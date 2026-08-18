// Downloads each model photo from Wikimedia Commons once, converts it to a
// 640px WebP and uploads it to Supabase Storage, then repoints image_url at
// our own CDN. Commons rate-limits server-side fetches (429), and we do not
// want a page render to depend on their availability.
//
// Idempotent: rows already pointing at Supabase are skipped, so it can be
// re-run after an interruption.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BUCKET = "vehicle-catalog";
const UA = "AndamusVehicleCatalog/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PostgREST caps a select at 1000 rows, so page through the backlog.
const rows = [];
for (let page = 0; ; page++) {
  const { data, error } = await db
    .from("vehicle_models")
    .select("id, slug, image_url, vehicle_makes!inner(slug)")
    .not("image_url", "is", null)
    .not("image_url", "like", "%supabase%")
    .order("sort_order")
    .range(page * 1000, page * 1000 + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

console.log("to mirror:", rows.length);
let done = 0, failed = 0;
// Commons rate-limits hard: eight parallel fetches got 2400 consecutive 429s
// while one at a time runs clean. This is a background backfill, so slow wins.
const CONCURRENCY = 1;
const queue = [...rows];

async function handle(row) {
  const path = `${row.vehicle_makes.slug}/${row.slug}.webp`;
  try {
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(`${row.image_url}?width=900`, {
        headers: { "User-Agent": UA },
        redirect: "follow",
      });
      if (res.status !== 429) break;
      await sleep(5000 * (attempt + 1));
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const webp = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(640, 360, { fit: "cover", position: "centre" })
      .webp({ quality: 78 })
      .toBuffer();

    const up = await db.storage.from(BUCKET).upload(path, webp, {
      contentType: "image/webp",
      upsert: true,
    });
    if (up.error) throw up.error;

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
    const { error: uErr } = await db
      .from("vehicle_models")
      .update({ image_url: pub.publicUrl })
      .eq("id", row.id);
    if (uErr) throw uErr;

    done++;
  } catch (err) {
    failed++;
    if (failed < 20) console.error("  fail", path, err.message);
  }
  if ((done + failed) % 100 === 0)
    process.stdout.write(`  ${done + failed}/${rows.length} ok:${done} fail:${failed}\n`);
  await sleep(300); // stay polite towards Commons
}

async function worker() {
  for (;;) {
    const row = queue.shift();
    if (!row) return;
    await handle(row);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nmirrored ${done}, failed ${failed}`);

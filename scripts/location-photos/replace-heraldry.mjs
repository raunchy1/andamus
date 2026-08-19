// Wikidata's P18 for the smallest comuni is often the town banner or, worse,
// a generic map of Italy. Those are not a picture of the place, so replace
// them with the first real photograph in the town's Commons category.
import { readFileSync, writeFileSync } from "fs";

const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "scripts/location-photos/manifest.json";
const manifest = JSON.parse(readFileSync(OUT, "utf8"));

const BAD = /gonfalone|stemma|bandiera|coat|flag|blason|wappen|location_map|locator|\.svg$/i;
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function api(params) {
  const url = "https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&" + params;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return res.json();
}

async function firstPhotoIn(category) {
  const json = await api(
    "action=query&generator=categorymembers&gcmtype=file&gcmlimit=40" +
      `&gcmtitle=${encodeURIComponent("Category:" + category)}` +
      "&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1200"
  );
  const pages = json?.query?.pages || [];
  const candidates = pages.filter(
    (p) => /\.(jpe?g|png)$/i.test(p.title) && !BAD.test(p.title)
  );
  return candidates[0] || null;
}

const targets = Object.entries(manifest).filter(([, v]) => BAD.test(v.file));
console.log("to replace:", targets.length);

let fixed = 0;
for (const [slug, entry] of targets) {
  // Try the town's own category, then the "<Name> (Italy)" variant.
  let page = await firstPhotoIn(entry.name);
  if (!page) { await sleep(200); page = await firstPhotoIn(`${entry.name}, Sardinia`); }
  if (!page) { console.log("no photo:", entry.name); await sleep(200); continue; }

  const info = page.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  manifest[slug] = {
    ...entry,
    file: page.title,
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    original: info?.url,
    thumb: info?.thumburl || info?.url,
    author: stripHtml(meta.Artist?.value) || null,
    license: stripHtml(meta.LicenseShortName?.value) || null,
    licenseUrl: meta.LicenseUrl?.value || null,
  };
  fixed++;
  console.log("ok  ", entry.name, "→", page.title.slice(0, 60));
  await sleep(250);
}
writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`replaced ${fixed}/${targets.length}`);

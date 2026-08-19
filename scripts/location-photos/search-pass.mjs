// Second pass for the towns with no Commons category: a plain Commons search,
// still filtered to photographs, still recording the licence.
import { readFileSync, writeFileSync } from "fs";
const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "scripts/location-photos/manifest.json";
const manifest = JSON.parse(readFileSync(OUT, "utf8"));
const BAD = /gonfalone|stemma|bandiera|coat|flag|blason|wappen|location_map|locator|\.svg$/i;
const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function api(params) {
  const res = await fetch("https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&" + params, {
    headers: { "User-Agent": UA },
  });
  return res.json();
}

const targets = Object.entries(manifest).filter(([, v]) => BAD.test(v.file));
console.log("search pass for:", targets.length);
let fixed = 0;
for (const [slug, entry] of targets) {
  const term = `${entry.name} Sardegna`;
  const search = await api(
    `action=query&list=search&srnamespace=6&srlimit=20&srsearch=${encodeURIComponent(term)}`
  );
  const hits = (search?.query?.search || [])
    .map((h) => h.title)
    .filter((t) => /\.(jpe?g|png)$/i.test(t) && !BAD.test(t));
  if (!hits.length) { console.log("none:", entry.name); await sleep(250); continue; }

  const info = await api(
    `action=query&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1200&titles=${encodeURIComponent(hits[0])}`
  );
  const page = info?.query?.pages?.[0];
  const ii = page?.imageinfo?.[0];
  const meta = ii?.extmetadata || {};
  manifest[slug] = {
    ...entry,
    file: page.title,
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    original: ii?.url,
    thumb: ii?.thumburl || ii?.url,
    author: stripHtml(meta.Artist?.value) || null,
    license: stripHtml(meta.LicenseShortName?.value) || null,
    licenseUrl: meta.LicenseUrl?.value || null,
  };
  fixed++;
  console.log("ok  ", entry.name, "→", page.title.slice(0, 55));
  await sleep(300);
}
writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`replaced ${fixed}/${targets.length}`);

import fs from "node:fs";
const cat = JSON.parse(fs.readFileSync("/tmp/catalog.json"));
const files = new Set();
for (const b of Object.values(cat))
  for (const m of b.models)
    if (m.img) files.add(decodeURIComponent(m.img.split("Special:FilePath/")[1]));

const list = [...files];
console.log("distinct commons files:", list.length);
const meta = {};
const UA = "AndamusVehicleCatalog/1.0 (cristiermurache@gmail.com)";
for (let i = 0; i < list.length; i += 50) {
  const batch = list.slice(i, i + 50).map(f => "File:" + f).join("|");
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo"
    + "&iiprop=extmetadata&iiextmetadatafilter=Artist|LicenseShortName|License&titles="
    + encodeURIComponent(batch);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    const j = await r.json();
    for (const p of Object.values(j.query?.pages ?? {})) {
      const e = p.imageinfo?.[0]?.extmetadata;
      if (!e) continue;
      const artist = (e.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      meta[p.title.replace(/^File:/, "")] = {
        author: artist.slice(0, 120) || null,
        license: e.LicenseShortName?.value ?? null,
      };
    }
  } catch (err) {
    console.error("batch", i, err.message);
  }
  if (i % 1000 === 0) console.log("…", i, "/", list.length);
}
fs.writeFileSync("/tmp/attrib.json", JSON.stringify(meta));
console.log("attribution rows:", Object.keys(meta).length);
const lic = {};
for (const v of Object.values(meta)) lic[v.license ?? "unknown"] = (lic[v.license ?? "unknown"] || 0) + 1;
console.log(Object.entries(lic).sort((a,b)=>b[1]-a[1]).slice(0,12));

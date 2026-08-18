import fs from "node:fs";

// Two Wikidata classes carry cars: "automobile model" and "automobile model
// series". The series level is the nameplate people actually name their car by
// (Fiat Panda), so it is loaded first and wins on conflicts.
const load = (f) => JSON.parse(fs.readFileSync(f)).results.bindings
  .map(r => ({ label: r.modelLabel.value, img: r.img?.value ?? null, qid: r.model.value.split("/").pop() }))
  .filter(r => !/^Q\d+$/.test(r.label));
const rows = [...load("/tmp/wd_series.json"), ...load("/tmp/wd_models.json")];

// The 71 curated makes already in the database, with the spellings Wikidata uses.
const MAKES = JSON.parse(fs.readFileSync("/tmp/makes.json"));

const alias = {
  "Citroen": ["Citroën", "Citroen"],
  "Skoda": ["Škoda", "Skoda"],
  "Seat": ["SEAT", "Seat"],
  "Mini": ["Mini", "MINI"],
  "DR Automobiles": ["DR"],
  "Lynk & Co": ["Lynk & Co", "Lynk&Co"],
  "Mercedes-Benz": ["Mercedes-Benz", "Mercedes"],
  "Rolls-Royce": ["Rolls-Royce"],
  "Land Rover": ["Land Rover", "Range Rover"],
};

// Generation / trim noise we do not want in a nameplate list.
const stripGen = (s) => s
  .replace(/\s*\((?:[A-Z]\d{1,3}[A-Za-z]?|[^)]*generation[^)]*|\d{4}[^)]*)\)\s*/gi, " ")
  .replace(/\s+Mk\.?\s?[IVX0-9]+\b/gi, " ")
  .replace(/\s+(?:Mark)\s+[IVX0-9]+\b/gi, " ")
  .replace(/\s+[A-Z]\d{1,2}\b(?=\s*$)/g, " ")
  .replace(/\s+(?:I{1,3}|IV|V|VI{0,3}|IX|X{1,2})\b(?=\s*$)/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const out = {};
for (const make of MAKES) {
  const prefixes = (alias[make.name] ?? [make.name]).sort((a, b) => b.length - a.length);
  const seen = new Map();
  for (const r of rows) {
    const p = prefixes.find(pre => r.label.startsWith(pre + " "));
    if (!p) continue;
    let name = stripGen(r.label.slice(p.length).trim());
    if (!name || name.length > 28) continue;
    if (/concept|prototype|study|racing|race car|rally|formula/i.test(name)) continue;
    if (/\band\b|litre|\bkg\b/i.test(name)) continue;
    if (!/^[A-Za-z0-9]/.test(name)) continue;
    const key = name.toLowerCase();
    // Prefer the entry whose original label carried a generation marker with the
    // highest number: that is usually the most recent car, so the nicest photo.
    const prev = seen.get(key);
    // First writer wins (series before models); only upgrade if we had no photo.
    if (!prev) seen.set(key, { name, img: r.img, qid: r.qid });
    else if (!prev.img && r.img) prev.img = r.img;
  }
  if (seen.size) out[make.slug] = { make, models: [...seen.values()].sort((a,b)=>a.name.localeCompare(b.name)) };
}

const total = Object.values(out).reduce((n, b) => n + b.models.length, 0);
console.log("makes with models:", Object.keys(out).length, "| models:", total);
for (const s of ["fiat","volkswagen","renault","bmw","dacia","mini"])
  console.log(" ", s, out[s]?.models.length, "→", out[s]?.models.slice(0,10).map(m=>m.name).join(", "));
fs.writeFileSync("/tmp/catalog.json", JSON.stringify(out));

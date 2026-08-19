// Harvests one photo per Sardinian place from Wikidata (P18) and matches it to
// our locations table by name. Writes photos.json for the mirror step.
import { writeFileSync } from "fs";

const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";

const query = `
SELECT ?item ?itemLabel ?image ?istat WHERE {
  ?item wdt:P131* wd:Q1462 .
  VALUES ?kind { wd:Q747074 wd:Q16110023 wd:Q3956976 }
  ?item wdt:P31 ?kind .
  ?item wdt:P18 ?image .
  OPTIONAL { ?item wdt:P635 ?istat }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en" }
}
`;

const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
if (!res.ok) {
  console.error("SPARQL failed", res.status, (await res.text()).slice(0, 300));
  process.exit(1);
}
const json = await res.json();
const rows = json.results.bindings.map((b) => ({
  qid: b.item.value.split("/").pop(),
  name: b.itemLabel.value,
  image: b.image.value,
}));
console.log("wikidata places with a photo:", rows.length);
writeFileSync("scripts/location-photos/wikidata.json", JSON.stringify(rows, null, 2));
console.log("sample:", rows.slice(0, 3).map((r) => `${r.name}`).join(", "));

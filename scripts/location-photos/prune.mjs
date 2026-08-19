// A wrong photo is worse than none: the plain-text search returned portraits of
// strangers and a sunflower for towns whose name is a common word. Anything
// that is not demonstrably a picture of the place is dropped, and the UI falls
// back to a plain card for those towns.
import { readFileSync, writeFileSync } from "fs";
const OUT = "scripts/location-photos/manifest.json";
const manifest = JSON.parse(readFileSync(OUT, "utf8"));

const WRONG_FILES = [
  "File:Murat Emir.jpg",
  "File:Elena Teodorescu (2).jpg",
  "File:Sardegna sassari santarelli mearza 2 angel writing.jpg",
  "File:Pauli-major-1.jpg",
  "File:Girasole con api 2.jpg",
];
const BAD = /gonfalone|stemma|bandiera|coat|flag|blason|wappen|location_map|locator|logo|\.svg$/i;

let dropped = 0;
for (const [slug, v] of Object.entries(manifest)) {
  if (WRONG_FILES.includes(v.file) || BAD.test(v.file)) {
    delete manifest[slug];
    dropped++;
  }
}
writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`dropped ${dropped}, kept ${Object.keys(manifest).length}`);

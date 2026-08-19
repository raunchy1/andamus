// For places Wikidata has no P18 for, take the lead image of the Italian
// Wikipedia article instead (pageimages). Same Commons licensing applies.
import { readFileSync, writeFileSync } from "fs";

const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const missing = JSON.parse(readFileSync("scripts/location-photos/missing-rows.json", "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const found = [];
for (const loc of missing) {
  const title = loc.wikiTitle || loc.name;
  const url = `https://it.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages&piprop=original&titles=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const json = await res.json();
    const page = json?.query?.pages?.[0];
    if (page?.original?.source) {
      found.push({ ...loc, image: page.original.source, source: "it.wikipedia" });
      process.stdout.write("+");
    } else {
      process.stdout.write(".");
    }
  } catch {
    process.stdout.write("!");
  }
  await sleep(250);
}
console.log(`\nfilled ${found.length}/${missing.length}`);
writeFileSync("scripts/location-photos/fallback.json", JSON.stringify(found, null, 2));

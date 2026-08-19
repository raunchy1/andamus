// Every photo comes from Wikimedia Commons, and most carry a CC BY / CC BY-SA
// licence — the credit is a condition of use, not a nicety. This pulls author
// and licence for each file so the app can print them under the photo.
import { readFileSync, writeFileSync, existsSync } from "fs";

const UA = "AndamusLocationPhotos/1.0 (https://andamus.vercel.app; cristiermurache@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const all = [
  ...JSON.parse(readFileSync("scripts/location-photos/matched.json", "utf8")),
  ...JSON.parse(readFileSync("scripts/location-photos/fallback.json", "utf8")),
  ...JSON.parse(readFileSync("scripts/location-photos/fallback2.json", "utf8")),
];

const OUT = "scripts/location-photos/manifest.json";
const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

function fileTitleFrom(url) {
  // .../commons/a/ab/Some_File.jpg[?query] → File:Some_File.jpg
  const clean = url.split("?")[0];
  const name = decodeURIComponent(clean.split("/").pop());
  return "File:" + name;
}

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

let n = 0;
for (const loc of all) {
  if (done[loc.slug]?.author !== undefined) continue;
  const title = fileTitleFrom(loc.image);
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2" +
    "&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1200&titles=" +
    encodeURIComponent(title);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const json = await res.json();
    const info = json?.query?.pages?.[0]?.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    done[loc.slug] = {
      id: loc.id,
      name: loc.name,
      type: loc.type,
      file: title,
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      original: info?.url || loc.image,
      thumb: info?.thumburl || loc.image,
      author: stripHtml(meta.Artist?.value) || null,
      license: stripHtml(meta.LicenseShortName?.value) || null,
      licenseUrl: meta.LicenseUrl?.value || null,
    };
    process.stdout.write(done[loc.slug].license ? "." : "?");
  } catch {
    process.stdout.write("!");
  }
  if (++n % 25 === 0) writeFileSync(OUT, JSON.stringify(done, null, 2));
  await sleep(220);
}
writeFileSync(OUT, JSON.stringify(done, null, 2));
const vals = Object.values(done);
console.log(`\nmanifest: ${vals.length} places`);
const byLicense = {};
for (const v of vals) byLicense[v.license || "unknown"] = (byLicense[v.license || "unknown"] || 0) + 1;
console.log(byLicense);

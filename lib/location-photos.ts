import photos from "@/lib/data/location-photos.json";

export interface LocationPhoto {
  /** Public URL of the mirrored 800×500 WebP. */
  url: string;
  /** Photographer, as Commons records them. Required by CC BY / CC BY-SA. */
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  /** The Commons file page, so the credit can link back to the source. */
  source: string | null;
}

interface RawEntry {
  v?: string;
  n: string;
  a: string | null;
  l: string | null;
  lu: string | null;
  s: string | null;
}

const entries = photos as Record<string, RawEntry>;

const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/location-photos`;

function normalise(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** name → slug, built once, so callers can pass "Cagliari" or "cagliari". */
const byName = new Map<string, string>();
for (const [slug, entry] of Object.entries(entries)) {
  const name = normalise(entry.n);
  if (name) byName.set(name, slug);
  byName.set(normalise(slug), slug);
}

/**
 * The photo for a place, or null when we have none — 17 of the smallest comuni
 * have nothing on Commons that is actually a picture of the town, and a wrong
 * photo is worse than a plain card.
 */
export function getLocationPhoto(cityName: string | null | undefined): LocationPhoto | null {
  if (!cityName) return null;
  const slug = byName.get(normalise(cityName));
  if (!slug) return null;
  const entry = entries[slug];
  return {
    url: `${BUCKET_URL}/${slug}.webp${entry.v ? `?v=${entry.v}` : ""}`,
    author: entry.a,
    license: entry.l,
    licenseUrl: entry.lu,
    source: entry.s,
  };
}

/** How many places ship with a photo — used by the pipeline's tests. */
export const locationPhotoCount = Object.keys(entries).length;

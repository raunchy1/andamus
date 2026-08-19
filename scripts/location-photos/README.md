# Location photos

One photograph per Sardinian place, mirrored from Wikimedia Commons into the
public Supabase bucket `location-photos` and shown wherever a trip is (ride
detail, booking summary, publish confirmation).

## Pipeline

```bash
node scripts/location-photos/harvest.mjs            # Wikidata P18 for Sardinian comuni
node scripts/location-photos/fallback-wikipedia.mjs  # lead image of the it.wikipedia article
node scripts/location-photos/replace-heraldry.mjs    # banners/maps → a real photo from the town's category
node scripts/location-photos/prune.mjs               # drop anything that is not a picture of the place
node scripts/location-photos/attrib.mjs              # author + licence from Commons
node scripts/location-photos/apply-overrides.mjs     # curated replacements (overrides.json)
node scripts/location-photos/mirror.mjs              # download → 800×500 WebP → bucket
node scripts/location-photos/emit.mjs                # lib/data/location-photos.json
```

`manifest.json` is the source of truth; `mirror.mjs` is idempotent, so an
interrupted run can simply be repeated.

## Two things not to undo

**The credit is mandatory.** Most photos are CC BY or CC BY-SA: the
photographer and licence must stay visible under the image. `LocationPhoto`
renders them; do not drop the `credit` prop from the ride detail.

**A wrong photo is worse than none.** A plain text search on Commons returns
portraits of strangers for towns whose name is a common word (Girasole,
Elini, Genuri). Seventeen of the smallest comuni ship without a photo on
purpose and fall back to a monogram card.

## Adding or fixing one

Put the Commons file in `overrides.json` (`"slug": "File:Foo.jpg"`), then run
`apply-overrides.mjs`, `mirror.mjs`, `emit.mjs`. The emitted `v` field busts
the CDN cache, so the new photo shows up immediately.

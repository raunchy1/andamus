# Location coordinates

`locations` needs a latitude/longitude on every row: the ride map places the
origin, the destination and any intermediate stop from those points, and the
route between them is measured and drawn from them. Rows without a point fall
back to "coordinates unavailable" and the trip cannot be mapped at all.

The 378 Sardinian comuni were imported without coordinates. `backfill.mjs`
fills them from Wikidata — every item that is a comune of Italy (P31 = Q747074)
located in Sardinia (P131* = Q1462) and carrying coordinates (P625) — matching
on the name with accents and punctuation folded away.

```bash
SUPABASE_SERVICE_ROLE_KEY=... node scripts/location-coords/backfill.mjs --dry
SUPABASE_SERVICE_ROLE_KEY=... node scripts/location-coords/backfill.mjs
```

It only writes rows that are still missing a coordinate, so it is safe to
re-run after adding new locations. Anything it cannot match is listed at the
end — those need a coordinate by hand, which is how the ports, airports and
frazioni got theirs.

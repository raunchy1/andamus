-- Cache road geometry so the ride page never waits on a routing API
-- ================================================================
-- Google Directions/Distance Matrix is billed (and currently denied).
-- We route once per unique waypoint chain through OSRM, store the
-- polyline plus real km/minutes, and serve every later view from here.
-- No PII: just public road geometry between Sardinian places.

CREATE TABLE IF NOT EXISTS public.route_geometries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waypoints_key text NOT NULL UNIQUE,
  from_city text NOT NULL,
  to_city text NOT NULL,
  via_cities text[] NOT NULL DEFAULT '{}',
  distance_m integer NOT NULL CHECK (distance_m >= 0),
  duration_s integer NOT NULL CHECK (duration_s >= 0),
  geometry jsonb NOT NULL,
  legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider text NOT NULL DEFAULT 'osrm',
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_geometries_cities_idx
  ON public.route_geometries (from_city, to_city);

COMMENT ON TABLE public.route_geometries IS
  'OSRM-derived driving route between Sardinian places, keyed by a folded waypoint chain.';
COMMENT ON COLUMN public.route_geometries.waypoints_key IS
  'fold(from)|fold(via...)|fold(to) — unique cache key.';
COMMENT ON COLUMN public.route_geometries.geometry IS
  'GeoJSON LineString, coordinates as [lng, lat].';
COMMENT ON COLUMN public.route_geometries.legs IS
  'Per-segment {from, to, distance_m, duration_s} matching the waypoints.';

ALTER TABLE public.route_geometries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Route geometries are viewable by everyone" ON public.route_geometries;
CREATE POLICY "Route geometries are viewable by everyone"
  ON public.route_geometries
  FOR SELECT
  USING (true);

GRANT SELECT ON public.route_geometries TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.route_geometries FROM PUBLIC, anon, authenticated;

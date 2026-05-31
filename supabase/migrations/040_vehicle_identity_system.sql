-- ============================================================
-- Migration: 040_vehicle_identity_system.sql
-- Description: Vehicle Identity System for Andamus
-- Creates vehicle_makes, vehicle_models, vehicles, vehicle_images
-- tables with full RLS policies, indexes, and triggers.
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 2. vehicle_makes
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicle_makes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  country     TEXT,
  logo_url    TEXT,
  is_popular  BOOLEAN     DEFAULT false,
  sort_order  INTEGER     DEFAULT 999,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  vehicle_makes IS 'Canonical list of vehicle manufacturers/brands.';
COMMENT ON COLUMN vehicle_makes.slug       IS 'URL-safe lowercase identifier, e.g. volkswagen';
COMMENT ON COLUMN vehicle_makes.is_popular IS 'Surfaces the brand in quick-pick lists';
COMMENT ON COLUMN vehicle_makes.sort_order IS 'Lower value = shown earlier in sorted lists';

-- ============================================================
-- 3. vehicle_models
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicle_models (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id     UUID        NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  body_type   TEXT,
  -- body_type: sedan, suv, hatchback, estate, coupe, convertible, van, truck, pickup
  is_popular  BOOLEAN     DEFAULT false,
  sort_order  INTEGER     DEFAULT 999,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (make_id, slug)
);

COMMENT ON TABLE  vehicle_models IS 'Model lines per make, e.g. Golf, Polo, Passat.';
COMMENT ON COLUMN vehicle_models.body_type IS 'sedan | suv | hatchback | estate | coupe | convertible | van | truck | pickup';
COMMENT ON COLUMN vehicle_models.slug      IS 'URL-safe lowercase identifier scoped to the make';

-- ============================================================
-- 4. vehicles
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make_id              UUID        REFERENCES vehicle_makes(id),
  model_id             UUID        REFERENCES vehicle_models(id),
  make_name            TEXT        NOT NULL,  -- denormalized for fast reads
  model_name           TEXT        NOT NULL,
  generation           TEXT,                  -- e.g. 'Golf VII', 'E46'
  year                 INTEGER     NOT NULL
                                   CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  color                TEXT,
  color_hex            TEXT,
  fuel_type            TEXT
                                   CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'other')),
  transmission         TEXT
                                   CHECK (transmission IN ('manual', 'automatic', 'semi-automatic')),
  seats_total          INTEGER     DEFAULT 5
                                   CHECK (seats_total   >= 2 AND seats_total   <= 9),
  seats_available      INTEGER     DEFAULT 4
                                   CHECK (seats_available >= 1 AND seats_available <= 8),
  license_plate_masked TEXT,       -- e.g. AB***CD  (never store the full plate)
  description          TEXT,
  features             TEXT[]      DEFAULT '{}',
  -- features examples: 'ac', 'usb', 'bluetooth', 'pet_friendly', 'non_smoker', 'wifi', 'child_seat'
  verified             BOOLEAN     DEFAULT false,
  active               BOOLEAN     DEFAULT true,
  primary_vehicle      BOOLEAN     DEFAULT false,
  rides_count          INTEGER     DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  vehicles IS 'Driver-owned vehicles used for rides.';
COMMENT ON COLUMN vehicles.make_name            IS 'Denormalized make name for fast reads without JOIN';
COMMENT ON COLUMN vehicles.model_name           IS 'Denormalized model name for fast reads without JOIN';
COMMENT ON COLUMN vehicles.generation           IS 'Informal generation tag, e.g. Golf VII, E46, W204';
COMMENT ON COLUMN vehicles.license_plate_masked IS 'Partially masked plate, e.g. AB***CD. Full plate never stored.';
COMMENT ON COLUMN vehicles.features             IS 'Array of feature slugs: ac, usb, bluetooth, pet_friendly, non_smoker, wifi, child_seat';
COMMENT ON COLUMN vehicles.primary_vehicle      IS 'True for the driver default vehicle shown on their profile';
COMMENT ON COLUMN vehicles.rides_count          IS 'Denormalized counter incremented by trigger or function after each ride';

-- ============================================================
-- 5. vehicle_images
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicle_images (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  owner_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path      TEXT        NOT NULL,
  url               TEXT        NOT NULL,
  thumbnail_url     TEXT,
  order_index       INTEGER     DEFAULT 0,
  is_primary        BOOLEAN     DEFAULT false,
  moderation_status TEXT        DEFAULT 'pending'
                                CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  vehicle_images IS 'Photos attached to a vehicle, stored in the vehicle-images bucket.';
COMMENT ON COLUMN vehicle_images.storage_path      IS 'Path inside the vehicle-images bucket, e.g. owner_id/vehicle_id/filename.webp';
COMMENT ON COLUMN vehicle_images.moderation_status IS 'pending -> approved | rejected by admin/function';

-- ============================================================
-- 6. Add vehicle_id column to rides
-- ============================================================

ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

COMMENT ON COLUMN rides.vehicle_id IS 'The vehicle used for this ride; nullable so old rides are unaffected';

-- ============================================================
-- 7. Indexes
-- ============================================================

-- vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id
  ON vehicles (owner_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_active
  ON vehicles (owner_id, active);

-- vehicle_images
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id
  ON vehicle_images (vehicle_id);

-- vehicle_makes - trigram index for fuzzy name search
CREATE INDEX IF NOT EXISTS idx_vehicle_makes_name_trgm
  ON vehicle_makes USING GIN (name gin_trgm_ops);

-- vehicle_models - trigram index for fuzzy name search
CREATE INDEX IF NOT EXISTS idx_vehicle_models_name_trgm
  ON vehicle_models USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_make_id
  ON vehicle_models (make_id);

-- rides - partial index only where vehicle_id is set
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_id
  ON rides (vehicle_id)
  WHERE vehicle_id IS NOT NULL;

-- ============================================================
-- 8. updated_at trigger for vehicles
-- ============================================================

-- Re-use or create a generic set_updated_at() function.
-- Uses OR REPLACE to be idempotent across migrations.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop existing trigger first so this migration is re-runnable.
DROP TRIGGER IF EXISTS trg_vehicles_set_updated_at ON vehicles;

CREATE TRIGGER trg_vehicles_set_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 9. Row-Level Security
-- ============================================================

-- Enable RLS on all four new tables
ALTER TABLE vehicle_makes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_models  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- vehicle_makes policies
-- Anyone can read; writes are restricted to service role only.
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "vehicle_makes: public read" ON vehicle_makes;
CREATE POLICY "vehicle_makes: public read"
  ON vehicle_makes
  FOR SELECT
  USING (true);

-- No INSERT / UPDATE / DELETE policies for regular users.
-- The service role bypasses RLS, so admins use service-role key.

-- ----------------------------------------------------------
-- vehicle_models policies
-- Anyone can read; writes are restricted to service role only.
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "vehicle_models: public read" ON vehicle_models;
CREATE POLICY "vehicle_models: public read"
  ON vehicle_models
  FOR SELECT
  USING (true);

-- ----------------------------------------------------------
-- vehicles policies
-- ----------------------------------------------------------

-- Owner can SELECT their own vehicles
DROP POLICY IF EXISTS "vehicles: owner select own" ON vehicles;
CREATE POLICY "vehicles: owner select own"
  ON vehicles
  FOR SELECT
  USING (owner_id = auth.uid());

-- Anyone (authenticated or anonymous) can SELECT active vehicles
-- Required for ride detail pages to show vehicle info.
DROP POLICY IF EXISTS "vehicles: public select active" ON vehicles;
CREATE POLICY "vehicles: public select active"
  ON vehicles
  FOR SELECT
  USING (active = true);

-- Owner can INSERT their own vehicles
DROP POLICY IF EXISTS "vehicles: owner insert" ON vehicles;
CREATE POLICY "vehicles: owner insert"
  ON vehicles
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owner can UPDATE their own vehicles
DROP POLICY IF EXISTS "vehicles: owner update" ON vehicles;
CREATE POLICY "vehicles: owner update"
  ON vehicles
  FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owner can DELETE their own vehicles
DROP POLICY IF EXISTS "vehicles: owner delete" ON vehicles;
CREATE POLICY "vehicles: owner delete"
  ON vehicles
  FOR DELETE
  USING (owner_id = auth.uid());

-- ----------------------------------------------------------
-- vehicle_images policies
-- ----------------------------------------------------------

-- Anyone can SELECT images that belong to an active vehicle
DROP POLICY IF EXISTS "vehicle_images: public select active vehicle images" ON vehicle_images;
CREATE POLICY "vehicle_images: public select active vehicle images"
  ON vehicle_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   vehicles v
      WHERE  v.id     = vehicle_images.vehicle_id
        AND  v.active = true
    )
  );

-- Owner can SELECT all their own images (including inactive vehicle images)
DROP POLICY IF EXISTS "vehicle_images: owner select own" ON vehicle_images;
CREATE POLICY "vehicle_images: owner select own"
  ON vehicle_images
  FOR SELECT
  USING (owner_id = auth.uid());

-- Owner can INSERT images for their own vehicles
DROP POLICY IF EXISTS "vehicle_images: owner insert" ON vehicle_images;
CREATE POLICY "vehicle_images: owner insert"
  ON vehicle_images
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM   vehicles v
      WHERE  v.id       = vehicle_images.vehicle_id
        AND  v.owner_id = auth.uid()
    )
  );

-- Owner can UPDATE their own images
DROP POLICY IF EXISTS "vehicle_images: owner update" ON vehicle_images;
CREATE POLICY "vehicle_images: owner update"
  ON vehicle_images
  FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owner can DELETE their own images
DROP POLICY IF EXISTS "vehicle_images: owner delete" ON vehicle_images;
CREATE POLICY "vehicle_images: owner delete"
  ON vehicle_images
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- 10. Storage bucket note
-- ============================================================
-- Create the storage bucket 'vehicle-images' manually in the
-- Supabase dashboard or via the SQL below (run once):
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('vehicle-images', 'vehicle-images', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- Suggested storage RLS policies (add in the Storage section or via SQL):
--
--   -- Allow any authenticated user to upload to their own folder
--   CREATE POLICY "vehicle-images: owner upload"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--       bucket_id = 'vehicle-images'
--       AND auth.uid()::text = (string_to_array(name, '/'))[1]
--     );
--
--   -- Allow anyone to read (bucket is public, but explicit policy is safer)
--   CREATE POLICY "vehicle-images: public read"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'vehicle-images');
--
--   -- Allow owner to delete their own objects
--   CREATE POLICY "vehicle-images: owner delete"
--     ON storage.objects FOR DELETE
--     USING (
--       bucket_id = 'vehicle-images'
--       AND auth.uid()::text = (string_to_array(name, '/'))[1]
--     );
-- ============================================================

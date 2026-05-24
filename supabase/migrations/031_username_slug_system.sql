-- Migration 031: Username / Slug System
-- Enables human-readable profile URLs like /u/marco-rossi

-- ── Add slug column to profiles ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- ── Function to generate URL-safe slug from name ──
CREATE OR REPLACE FUNCTION generate_profile_slug(p_name TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Normalize: lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(
    coalesce(p_name, 'user'),
    '[^a-z0-9]+', '-', 'g'
  ));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Ensure minimum length
  IF length(base_slug) < 2 THEN
    base_slug := 'user';
  END IF;
  -- Truncate to 30 chars
  base_slug := left(base_slug, 30);

  final_slug := base_slug;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != p_user_id) LOOP
    counter := counter + 1;
    IF counter > max_attempts THEN
      -- Fallback to user_id prefix
      final_slug := base_slug || '-' || left(p_user_id::text, 8);
      EXIT;
    END IF;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ── Backfill slugs for existing users ──
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, name FROM profiles WHERE slug IS NULL LOOP
    UPDATE profiles
    SET slug = generate_profile_slug(r.name, r.id)
    WHERE id = r.id;
  END LOOP;
END $$;

-- ── Update trigger to auto-generate slug on new signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    name,
    email,
    avatar_url,
    referral_code,
    rating,
    rides_count,
    points,
    level,
    slug
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url',
    generate_referral_code(),
    5.0,
    0,
    0,
    'Viaggiatore',
    generate_profile_slug(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.id)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Function to safely update slug (with uniqueness check) ──
CREATE OR REPLACE FUNCTION update_profile_slug(p_user_id UUID, p_new_slug TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  cleaned_slug TEXT;
BEGIN
  -- Clean the slug
  cleaned_slug := lower(regexp_replace(p_new_slug, '[^a-z0-9-]+', '-', 'g'));
  cleaned_slug := trim(both '-' from cleaned_slug);

  IF length(cleaned_slug) < 2 THEN
    RETURN QUERY SELECT false, 'Slug too short (min 2 chars)';
    RETURN;
  END IF;

  IF length(cleaned_slug) > 30 THEN
    cleaned_slug := left(cleaned_slug, 30);
  END IF;

  -- Check if taken by another user
  IF EXISTS (SELECT 1 FROM profiles WHERE slug = cleaned_slug AND id != p_user_id) THEN
    RETURN QUERY SELECT false, 'Slug already taken';
    RETURN;
  END IF;

  UPDATE profiles SET slug = cleaned_slug WHERE id = p_user_id;

  RETURN QUERY SELECT true, cleaned_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

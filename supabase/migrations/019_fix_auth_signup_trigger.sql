-- Fix auth signup: make handle_new_user trigger robust
-- The trigger was failing because profiles table has columns
-- that were not being populated (email, rating, rides_count, etc.)

-- 1. Ensure all profiles columns that might be NOT NULL have defaults
ALTER TABLE profiles ALTER COLUMN rating SET DEFAULT 5.0;
ALTER TABLE profiles ALTER COLUMN rides_count SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN email SET DEFAULT '';
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- 3. Add created_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 4. Recreate handle_new_user with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_code TEXT;
BEGIN
  BEGIN
    new_code := generate_referral_code();
    
    INSERT INTO public.profiles (
      id, 
      name, 
      email,
      avatar_url, 
      referral_code,
      rating,
      rides_count,
      points,
      level,
      created_at
    ) VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
      COALESCE(new.email, ''),
      new.raw_user_meta_data->>'avatar_url', 
      new_code,
      5.0,
      0,
      0,
      'Viaggiatore',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
  EXCEPTION WHEN OTHERS THEN
    -- Don't let profile creation fail the auth signup
    RAISE LOG 'handle_new_user error for %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NUCLEAR FIX FOR LOCATIONS SYSTEM
-- This script clears all conflicts and rebuilds the search function

-- 1. Activăm extensia (obligatoriu pentru similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Ștergem forțat funcția veche (pentru a evita erori de coloane/semnătură)
DROP FUNCTION IF EXISTS public.search_locations(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.search_locations(text) CASCADE;
DROP FUNCTION IF EXISTS public.search_locations() CASCADE;

-- 3. Adăugăm coloana parent_municipality în tabelul locations (dacă nu există)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME='locations' AND COLUMN_NAME='parent_municipality') THEN
    ALTER TABLE public.locations ADD COLUMN parent_municipality TEXT;
  END IF;
END $$;

-- 4. Re-creăm funcția de căutare cu noua structură de 11 coloane
CREATE OR REPLACE FUNCTION public.search_locations(search_query text, max_results integer DEFAULT 10)
RETURNS TABLE(
  id uuid, 
  name text, 
  slug text, 
  type text, 
  province text, 
  latitude double precision, 
  longitude double precision, 
  population integer, 
  popular boolean, 
  parent_municipality text, 
  similarity real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, l.name, l.slug, l.type, l.province, l.latitude, l.longitude, l.population, l.popular, l.parent_municipality,
    similarity(l.name, search_query) as similarity
  FROM public.locations l
  WHERE 
    l.name ILIKE '%' || search_query || '%'
    OR (l.parent_municipality IS NOT NULL AND l.parent_municipality ILIKE '%' || search_query || '%')
    OR similarity(l.name, search_query) > 0.2
  ORDER BY 
    (CASE WHEN l.name ILIKE search_query THEN 1 ELSE 0 END) DESC,
    similarity DESC,
    (CASE WHEN l.type = 'city' THEN 1 ELSE 0 END) DESC,
    l.popular DESC,
    l.population DESC
  LIMIT max_results;
END;
$$;

-- 5. Inserăm noile localități (frazioni)
INSERT INTO public.locations (name, slug, type, province, latitude, longitude, parent_municipality, popular) VALUES
('Villanova Strisaili', 'villanova-strisaili', 'frazione', 'NU', 39.9868, 9.3908, 'Villagrande Strisaili', TRUE),
('Santa Maria Navarrese', 'santa-maria-navarrese', 'frazione', 'NU', 40.0050, 9.6917, 'Baunei', TRUE),
('Porto Cervo', 'porto-cervo', 'frazione', 'SS', 41.1342, 9.5333, 'Arzachena', TRUE),
('Porto Rotondo', 'porto-rotondo', 'frazione', 'SS', 41.0289, 9.5414, 'Olbia', TRUE),
('La Caletta', 'la-caletta', 'frazione', 'NU', 40.6106, 9.7497, 'Siniscola', TRUE),
('Cannigione', 'cannigione', 'frazione', 'SS', 41.1078, 9.4406, 'Arzachena', TRUE),
('Arbatax', 'arbatax-frazione', 'frazione', 'NU', 39.9361, 9.7042, 'Tortolì', TRUE),
('Costa Rei', 'costa-rei', 'frazione', 'SU', 39.2489, 9.5700, 'Muravera', TRUE),
('Chia', 'chia', 'frazione', 'SU', 38.8953, 8.8822, 'Domus de Maria', TRUE),
('San Pantaleo', 'san-pantaleo', 'frazione', 'SS', 41.0333, 9.4833, 'Olbia', TRUE),
('Baja Sardinia', 'baja-sardinia', 'frazione', 'SS', 41.1333, 9.4833, 'Arzachena', TRUE),
('Putzu Idu', 'putzu-idu', 'frazione', 'OR', 40.0333, 8.4000, 'San Vero Milis', TRUE),
('Torre Grande', 'torre-grande', 'frazione', 'OR', 39.9058, 8.5133, 'Oristano', TRUE),
('Villasimius Porto', 'villasimius-porto', 'frazione', 'SU', 39.1250, 9.5189, 'Villasimius', FALSE),
('UniCa - Monserrato Campus', 'unica-monserrato-campus-frazione', 'frazione', 'CA', 39.2681, 9.1417, 'Monserrato', TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  parent_municipality = EXCLUDED.parent_municipality,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

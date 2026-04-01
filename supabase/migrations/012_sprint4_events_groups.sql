-- Sprint 4: Events, Carpool Groups, and Price Suggestions

-- ============================================================
-- 1. EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  city TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT USING (true);

-- Seed some famous Sardinian events
INSERT INTO events (slug, name, description, image_url, start_date, end_date, location, city)
VALUES
  ('sagra-sant-efisio', 'Sagra di Sant\'Efisio', 'La più importante festa religiosa della Sardegna, con la colorita processione da Cagliari a Nora.', 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9', '2025-05-01', '2025-05-01', 'Cattedrale di Cagliari', 'Cagliari'),
  ('cavalcata-sarda', 'Cavalcata Sarda', 'Grande sfilata di costumi e cavalli tradizionali sardi in centro a Sassari.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', '2025-05-18', '2025-05-18', 'Centro storico', 'Sassari'),
  ('autunno-barbagia', 'Autunno in Barbagia', 'Itinerario enogastronomico e culturale nei borghi della Barbagia.', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', '2025-09-06', '2025-12-08', 'Vari borghi', 'Nuoro'),
  ('calici-sotto-le-stelle', 'Calici di Stelle', 'Degustazione di vini sardi sotto il cielo stellato di Bosa.', 'https://images.unsplash.com/photo-1516594915287-0112c5aa2ac3', '2025-08-10', '2025-08-10', 'Lungo il fiume Temo', 'Bosa'),
  ('jazz-sardegna', 'Time in Jazz', 'Festival internazionale di jazz nelle piazze di Berchidda e dintorni.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', '2025-08-01', '2025-08-10', 'Berchidda', 'Berchidda')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. CARPOOL GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS carpool_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'university', 'airport', 'commute', 'event', 'other'
  city TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE carpool_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are viewable by everyone"
  ON carpool_groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON carpool_groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Seed some groups
INSERT INTO carpool_groups (name, description, type, city)
VALUES
  ('Università di Cagliari', 'Passaggi giornalieri per i campus di Cagliari e Monserrato.', 'university', 'Cagliari'),
  ('Aeroporto Olbia Costa Smeralda', 'Corse verso l\'aeroporto di Olbia da tutta la Gallura.', 'airport', 'Olbia'),
  ('Navetta Sassari - Alghero', 'Gruppo per i pendolari della tratta Sassari-Alghero.', 'commute', 'Sassari'),
  ('Fiera di Sant\'Efisio', 'Trova un passaggio per la Sagra di Sant\'Efisio.', 'event', 'Cagliari')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. GROUP MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES carpool_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group memberships are viewable by everyone"
  ON group_memberships FOR SELECT USING (true);

CREATE POLICY "Users can join groups"
  ON group_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_memberships FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. RIDE PRICE SUGGESTIONS LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_price_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  suggested_price DECIMAL NOT NULL,
  distance_km DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ride_price_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price logs are viewable by everyone"
  ON ride_price_logs FOR SELECT USING (true);

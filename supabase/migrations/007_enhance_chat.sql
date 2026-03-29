-- Enhance chat messages table with media support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration INTEGER; -- For audio messages (seconds)

-- Add constraint for message types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_type_check'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_type_check 
    CHECK (type IN ('text', 'image', 'location', 'audio'));
  END IF;
END $$;

-- Create storage bucket policies for chat-images
-- Note: Buckets should be created via Supabase Dashboard or CLI
-- Run these in Supabase SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-audio', 'chat-audio', true) ON CONFLICT DO NOTHING;

-- Storage policies for chat-images bucket
-- Users can upload images to chat
CREATE POLICY "Users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Chat images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

-- Storage policies for chat-audio bucket  
CREATE POLICY "Users can upload chat audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-audio');

CREATE POLICY "Chat audio is publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-audio');

-- Migration 034: Marketplace Liquidity Engine - Search Telemetry
-- Create search_logs table for recording search activity to identify spikes and dead routes

CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  date DATE,
  results_count INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,
  ip_hash TEXT, -- hashed to maintain privacy while allowing unique session identification
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by public (anonymous or authenticated)
DROP POLICY IF EXISTS "search_logs_insert_public" ON public.search_logs;
CREATE POLICY "search_logs_insert_public"
  ON public.search_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read search logs
DROP POLICY IF EXISTS "search_logs_select_admin" ON public.search_logs;
CREATE POLICY "search_logs_select_admin"
  ON public.search_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Only service role has full access
DROP POLICY IF EXISTS "search_logs_service_role" ON public.search_logs;
CREATE POLICY "search_logs_service_role"
  ON public.search_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Performance Indexes for Liquidity Aggregations & Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_search_logs_route ON public.search_logs (from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_results ON public.search_logs (results_count);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON public.search_logs (user_id);

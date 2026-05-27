-- Migration 036: Demand Intelligence & Event Domination
-- Adds indexes and schema updates to support real-time demand tracking and event-based carpooling

-- Optimize search_logs indexes for dynamic heatmap and dead-zone calculations
CREATE INDEX IF NOT EXISTS idx_search_logs_liquidity_calc 
  ON public.search_logs (from_city, to_city, results_count, created_at DESC);

-- Link rides to regional events/concerts/festivals
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rides_event ON public.rides (event_id);

-- Ensure RLS allows select on events and groups
CREATE POLICY "Allow anyone to select events" 
  ON public.events FOR SELECT USING (true);

-- Admin policies to manage events
CREATE POLICY "Allow admins to manage events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

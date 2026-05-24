"use server";

import { createClient } from "@/lib/supabase/server";

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  created_at: string;
}

/**
 * Get upcoming events.
 */
export async function getUpcomingEvents(limit = 20): Promise<Event[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`start_date.gte.${today},end_date.gte.${today}`)
    .order("start_date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[data/events] getUpcomingEvents error:", error.message);
    return [];
  }
  return (data || []) as Event[];
}

/**
 * Get a single event by slug.
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("[data/events] getEventBySlug error:", error?.message);
    return null;
  }
  return data as Event;
}

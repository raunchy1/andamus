"use server";

import { createClient } from "@/lib/supabase/server";

export type LocationType = 'city' | 'airport' | 'port' | 'university';

export interface Location {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  province?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  popular: boolean;
}

/**
 * Searches for locations based on a query string.
 * Uses PostgreSQL fuzzy matching (pg_trgm) via an RPC call.
 */
export async function searchLocations(query: string, limit: number = 20) {
  const supabase = await createClient();

  if (!query || query.length < 1) {
    // Return popular locations if no query
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('popular', true)
      .order('type', { ascending: true })
      .order('population', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular locations:', error);
      return [];
    }
    return data as Location[];
  }

  // Use the RPC function for fuzzy search
  const { data, error } = await supabase.rpc('search_locations', {
    search_query: query,
    max_results: limit
  });

  if (error) {
    console.error('Error searching locations:', error);
    // Fallback to simple ilike if RPC fails (e.g. if migration hasn't run yet)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('locations')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('popular', { ascending: false })
      .limit(limit);

    if (fallbackError) {
      console.error('Fallback search error:', fallbackError);
      return [];
    }
    return fallbackData as Location[];
  }

  return data as Location[];
}

/**
 * Gets a specific location by its slug.
 */
export async function getLocationBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching location by slug:', error);
    return null;
  }
  return data as Location;
}

/**
 * Returns all locations for client-side filtering.
 */
export async function getAllLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('popular', { ascending: false })
    .order('population', { ascending: false });

  if (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }
  return data as Location[];
}

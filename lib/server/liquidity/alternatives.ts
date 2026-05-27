"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SARDINIA_CITIES, getDistanceBetweenCities } from "@/lib/sardinia-cities";

export type AlternativeRouteSuggestion = {
  from_city: string;
  to_city: string;
  distance_diff: number;
  reason: string;
};

export type FlexibleDateSuggestion = {
  date: string;
  ride_count: number;
};

export type RecoveryData = {
  nearbySuggestions: AlternativeRouteSuggestion[];
  flexibleDates: FlexibleDateSuggestion[];
  matchingRequests: any[];
  otherSearchersCount: number;
};

/**
 * Resolves smart alternatives for empty search results to prevent dead-end user experiences.
 */
export async function getEmptySearchAlternatives(
  fromCity: string,
  toCity: string,
  searchDate?: string | null
): Promise<RecoveryData> {
  const supabase = createServiceRoleClient(); // service role to query safely across requests/rides

  const cleanFrom = fromCity?.trim();
  const cleanTo = toCity?.trim();

  // 1. Find nearby suggestions using Sardinia coordinate matrices
  const nearbySuggestions: AlternativeRouteSuggestion[] = [];
  
  // Find major hubs close to the search cities (distance <= 25km)
  const majorHubs = ["Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Alghero"];

  majorHubs.forEach(hub => {
    // Check if search origin is near this hub (and not the same city)
    if (cleanFrom && hub !== cleanFrom) {
      const dist = getDistanceBetweenCities(cleanFrom, hub);
      if (dist !== null && dist <= 25) {
        nearbySuggestions.push({
          from_city: hub,
          to_city: cleanTo,
          distance_diff: dist,
          reason: `Parti da ${hub} (a soli ${dist}km da ${cleanFrom})`
        });
      }
    }

    // Check if search destination is near this hub (and not the same city)
    if (cleanTo && hub !== cleanTo) {
      const dist = getDistanceBetweenCities(cleanTo, hub);
      if (dist !== null && dist <= 25) {
        nearbySuggestions.push({
          from_city: cleanFrom,
          to_city: hub,
          distance_diff: dist,
          reason: `Arriva a ${hub} (a soli ${dist}km da ${cleanTo})`
        });
      }
    }
  });

  // Limit suggestions to top 3 closest options
  nearbySuggestions.sort((a, b) => a.distance_diff - b.distance_diff);
  const selectedSuggestions = nearbySuggestions.slice(0, 3);

  // 2. Fetch flexible dates: find active rides on the EXACT same route but on other dates
  const flexibleDates: FlexibleDateSuggestion[] = [];
  try {
    const { data: dateRides, error: dateError } = await supabase
      .from("rides")
      .select("date")
      .eq("from_city", cleanFrom)
      .eq("to_city", cleanTo)
      .eq("status", "active")
      .order("date", { ascending: true })
      .limit(100);

    if (!dateError && dateRides) {
      const dateCounts: Record<string, number> = {};
      dateRides.forEach(ride => {
        if (ride.date && (!searchDate || ride.date !== searchDate)) {
          dateCounts[ride.date] = (dateCounts[ride.date] || 0) + 1;
        }
      });
      
      Object.entries(dateCounts).forEach(([date, count]) => {
        flexibleDates.push({ date, ride_count: count });
      });

      // Sort by date proximity
      flexibleDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  } catch (err) {
    console.error("[getEmptySearchAlternatives] flexibleDates error:", err);
  }

  // 3. Fetch active Passenger Ride Requests on the same route so drivers can see demand
  let matchingRequests: any[] = [];
  try {
    const { data: requests, error: reqError } = await supabase
      .from("ride_requests")
      .select(`
        id,
        from_city,
        to_city,
        date,
        time_window,
        seats_needed,
        user:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("from_city", cleanFrom)
      .eq("to_city", cleanTo)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3);

    if (!reqError && requests) {
      matchingRequests = requests;
    }
  } catch (err) {
    console.error("[getEmptySearchAlternatives] matchingRequests error:", err);
  }

  // 4. Count other recent searches on this route in the last 24h to show social proof/demand
  let otherSearchersCount = 0;
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { count, error: countError } = await supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .eq("from_city", cleanFrom)
      .eq("to_city", cleanTo)
      .gte("created_at", oneDayAgo.toISOString());

    if (!countError && count !== null) {
      // Exclude current searcher (assume at least current search counts, so we only display if count > 1)
      otherSearchersCount = Math.max(0, count - 1);
    }
  } catch (err) {
    console.error("[getEmptySearchAlternatives] otherSearchersCount error:", err);
  }

  return {
    nearbySuggestions: selectedSuggestions,
    flexibleDates: flexibleDates.slice(0, 3),
    matchingRequests,
    otherSearchersCount,
  };
}

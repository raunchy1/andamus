"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type CommuterPattern = {
  commuterType: "daily_commuter" | "weekend_student" | "occasional";
  frequencyScore: number; // 0 - 100
  primaryRoute: { from_city: string; to_city: string } | null;
  predictedUpcomingTrip: {
    from_city: string;
    to_city: string;
    date: string;
    timeWindow: "morning" | "evening" | "any";
    direction: "outbound" | "return";
  } | null;
  recommendedReturnTrip: {
    from_city: string;
    to_city: string;
    date: string;
    reason: string;
  } | null;
};

/**
 * Advanced Commuter Intelligence & Habit Clustering Engine.
 * Analyzes search history and ride bookings for a user over the past 30 days to detect
 * commute habits and predict upcoming trips.
 */
export async function getUserCommuterIntelligence(userId: string): Promise<CommuterPattern> {
  const defaultPattern: CommuterPattern = {
    commuterType: "occasional",
    frequencyScore: 0,
    primaryRoute: null,
    predictedUpcomingTrip: null,
    recommendedReturnTrip: null,
  };

  if (!userId) return defaultPattern;

  const supabase = createServiceRoleClient(); // system role for safe analysis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Fetch user search logs in the last 30 days
  const { data: searchLogs, error: searchError } = await supabase
    .from("search_logs")
    .select("from_city, to_city, created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (searchError) {
    console.error("[commuter-intelligence] Fetch search logs error:", searchError.message);
    return defaultPattern;
  }

  // 2. Fetch past bookings to cross-reference travel history
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      created_at,
      rides (
        from_city,
        to_city,
        date,
        time
      )
    `)
    .eq("passenger_id", userId)
    .eq("status", "confirmed")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (bookingsError) {
    console.error("[commuter-intelligence] Fetch bookings error:", bookingsError.message);
  }

  // Combine searches and confirmed bookings into "travel events"
  const travelEvents: { from_city: string; to_city: string; timestamp: Date }[] = [];

  if (searchLogs) {
    searchLogs.forEach(log => {
      travelEvents.push({
        from_city: log.from_city.trim(),
        to_city: log.to_city.trim(),
        timestamp: new Date(log.created_at),
      });
    });
  }

  if (bookings) {
    bookings.forEach(booking => {
      const ride = booking.rides as any;
      if (ride) {
        travelEvents.push({
          from_city: ride.from_city.trim(),
          to_city: ride.to_city.trim(),
          timestamp: new Date(booking.created_at),
        });
      }
    });
  }

  if (travelEvents.length === 0) {
    return defaultPattern;
  }

  // 3. Cluster travel events by route to find the primary corridor
  const routeCounts: Record<string, { from_city: string; to_city: string; count: number; weekdayCount: number; weekendCount: number }> = {};
  
  travelEvents.forEach(event => {
    const key = `${event.from_city.toLowerCase()}->${event.to_city.toLowerCase()}`;
    const day = event.timestamp.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday

    if (!routeCounts[key]) {
      routeCounts[key] = {
        from_city: event.from_city,
        to_city: event.to_city,
        count: 0,
        weekdayCount: 0,
        weekendCount: 0,
      };
    }
    
    routeCounts[key].count++;
    if (isWeekend) {
      routeCounts[key].weekendCount++;
    } else {
      routeCounts[key].weekdayCount++;
    }
  });

  // Pick primary route based on highest frequency
  const sortedRoutes = Object.values(routeCounts).sort((a, b) => b.count - a.count);
  const primaryRouteData = sortedRoutes[0];
  if (!primaryRouteData) return defaultPattern;

  const primaryRoute = {
    from_city: primaryRouteData.from_city,
    to_city: primaryRouteData.to_city,
  };

  // 4. Classify commuter type and frequency score
  const totalCorridorEvents = primaryRouteData.count;
  const frequencyScore = Math.min(100, Math.round(totalCorridorEvents * 8)); // scale score based on habit density

  let commuterType: "daily_commuter" | "weekend_student" | "occasional" = "occasional";

  if (totalCorridorEvents >= 6) {
    const weekdayRatio = primaryRouteData.weekdayCount / totalCorridorEvents;
    if (weekdayRatio >= 0.75) {
      commuterType = "daily_commuter";
    } else if (primaryRouteData.weekendCount / totalCorridorEvents >= 0.6) {
      commuterType = "weekend_student";
    }
  }

  // 5. Predict upcoming trip and return loop prompts
  const romeTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" });
  const currentDate = new Date(romeTime);
  const currentDay = currentDate.getDay(); // 0 = Sun, 6 = Sat
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  let predictedUpcomingTrip: CommuterPattern["predictedUpcomingTrip"] = null;
  let recommendedReturnTrip: CommuterPattern["recommendedReturnTrip"] = null;

  if (commuterType === "daily_commuter") {
    // Daily commuters travel Mon-Fri morning/evening. Predict travel for tomorrow morning.
    if (currentDay >= 1 && currentDay <= 4) {
      predictedUpcomingTrip = {
        from_city: primaryRoute.from_city,
        to_city: primaryRoute.to_city,
        date: tomorrowStr,
        timeWindow: "morning",
        direction: "outbound",
      };
      
      // Suggest evening return trip matching
      recommendedReturnTrip = {
        from_city: primaryRoute.to_city,
        to_city: primaryRoute.from_city,
        date: tomorrowStr,
        reason: "Rientro pendolari serale",
      };
    }
  } else if (commuterType === "weekend_student") {
    // Weekend students head out Fri, return Sun.
    if (currentDay === 4 || currentDay === 5) {
      // Thursday or Friday: predict outbound weekend trip
      predictedUpcomingTrip = {
        from_city: primaryRoute.from_city,
        to_city: primaryRoute.to_city,
        date: tomorrowStr,
        timeWindow: "evening",
        direction: "outbound",
      };

      // Recommend Sunday return trip
      const sundayDate = new Date(currentDate);
      sundayDate.setDate(sundayDate.getDate() + (7 - currentDay));
      const sundayStr = sundayDate.toISOString().split("T")[0];

      recommendedReturnTrip = {
        from_city: primaryRoute.to_city,
        to_city: primaryRoute.from_city,
        date: sundayStr,
        reason: "Rientro studenti domenicale",
      };
    } else if (currentDay === 0) {
      // Sunday: predict return trip today/tomorrow
      predictedUpcomingTrip = {
        from_city: primaryRoute.to_city,
        to_city: primaryRoute.from_city,
        date: tomorrowStr,
        timeWindow: "evening",
        direction: "return",
      };
    }
  }

  return {
    commuterType,
    frequencyScore,
    primaryRoute,
    predictedUpcomingTrip,
    recommendedReturnTrip,
  };
}

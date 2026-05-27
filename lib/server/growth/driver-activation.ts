"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";
import { sendPushToUser } from "@/lib/server/actions/notifications";
import { captureEvent } from "@/lib/posthog";

export type ActivationTriggerInput = {
  from_city: string;
  to_city: string;
  demand_score: number;
};

/**
 * Triggers the smart driver reactivation engine for a given route where a demand spike has been identified.
 * Finds drivers who previously served this route and nudges them to post a ride, enforcing quiet hours and cooldown gates.
 */
export async function triggerDriverReactivation(input: ActivationTriggerInput) {
  const cleanFrom = input.from_city?.trim();
  const cleanTo = input.to_city?.trim();

  if (!cleanFrom || !cleanTo || input.demand_score < 50) {
    return { success: false, reason: "Invalid trigger conditions or low demand." };
  }

  const supabase = createServiceRoleClient(); // service role to scan across profiles and historical rides safely
  const redis = getRedis();

  // Get current date context in Rome time zone to enforce quiet hours
  const romeTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" });
  const currentDate = new Date(romeTime);
  const currentHour = currentDate.getHours();

  if (currentHour >= 22 || currentHour < 7) {
    console.log(`[driver-activation] Quiet hours active (${currentHour}:00 Rome). Reactivation deferred.`);
    return { success: true, message: "Quiet hours active, notifications deferred." };
  }

  console.log(`[driver-activation] Scanning drivers for hot route: ${cleanFrom} ↔ ${cleanTo} (Demand Score: ${input.demand_score})`);

  // 1. Fetch drivers who historically published active/completed rides on this route
  const { data: historicalRides, error: ridesError } = await supabase
    .from("rides")
    .select("driver_id")
    .eq("from_city", cleanFrom)
    .eq("to_city", cleanTo)
    .limit(100);

  if (ridesError || !historicalRides || historicalRides.length === 0) {
    return { success: true, message: "No historical drivers found for this route." };
  }

  // De-duplicate historical driver IDs
  const candidateDriverIds = Array.from(new Set(historicalRides.map(r => r.driver_id).filter(Boolean))) as string[];
  let activationCount = 0;

  for (const driverId of candidateDriverIds) {
    try {
      // 2. Check 24-hour rate limit cooldown in Redis to avoid spamming the driver
      if (redis) {
        const cooldownKey = `driver-activation:cooldown:${driverId}`;
        const hasCooldown = await redis.get(cooldownKey);
        if (hasCooldown) {
          console.log(`[driver-activation] Driver ${driverId} is in cooldown. Skipping.`);
          continue;
        }
      }

      // Check if driver already has an active, upcoming ride scheduled on this route
      const todayStr = currentDate.toISOString().split("T")[0];
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", driverId)
        .eq("from_city", cleanFrom)
        .eq("to_city", cleanTo)
        .eq("status", "active")
        .gte("date", todayStr);

      if (upcomingError || (upcomingCount && upcomingCount > 0)) {
        // Driver already has an upcoming ride scheduled or error occurred. No nudge needed.
        continue;
      }

      // 3. Construct personalized, localized nudge copy
      const title = "Tratta molto richiesta! 📈";
      const body = `Molti passeggeri cercano un viaggio da ${cleanFrom} a ${cleanTo}. Pubblica subito il tuo tragitto e viaggia in compagnia!`;
      const url = `/it/offri?from=${encodeURIComponent(cleanFrom)}&to=${encodeURIComponent(cleanTo)}`;

      // 4. Dispatch Web Push and insert UI notification entry
      await sendPushToUser({
        userId: driverId,
        title,
        body,
        url,
      });

      await supabase.from("notifications").insert({
        user_id: driverId,
        type: "ride_alert",
        title,
        body,
        ride_id: null,
        booking_id: null,
        read: false,
      });

      // 5. Activate Redis cooldown for 24 hours (86400 seconds)
      if (redis) {
        const cooldownKey = `driver-activation:cooldown:${driverId}`;
        await redis.set(cooldownKey, "active", { ex: 86400 });
      }

      // PostHog analytics tracking
      captureEvent("driver_reactivation_pushed", {
        driver_id: driverId,
        from_city: cleanFrom,
        to_city: cleanTo,
        demand_score: input.demand_score,
      });

      activationCount++;
    } catch (err) {
      console.error(`[driver-activation] Error nudging driver ${driverId}:`, err);
    }
  }

  return {
    success: true,
    driversScanned: candidateDriverIds.length,
    driversNudged: activationCount,
  };
}

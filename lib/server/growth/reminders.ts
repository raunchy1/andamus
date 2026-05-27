"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendPushToUser } from "@/lib/server/actions/notifications";

/**
 * Commuter Retention Reminders Engine.
 * Automatically analyzes saved routes (ride_alerts) and dispatch personalization push
 * notifications to returning commuters to drive daily utility.
 */
export async function runCommuterRemindersEngine() {
  const supabase = createServiceRoleClient(); // service role to run system crons safely

  // Get current date context in Rome time zone
  const romeTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" });
  const currentDate = new Date(romeTime);
  const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = currentDate.getHours();

  // Enforce quiet hours at cron trigger level (22:00 to 07:00 Rome time)
  if (currentHour >= 22 || currentHour < 7) {
    console.log("[reminders-engine] Quiet hours active. Skipping execution.");
    return { success: true, message: "Quiet hours active, notifications deferred." };
  }

  // Calculate target search date: usually tomorrow
  const targetDateObj = new Date(currentDate);
  targetDateObj.setDate(targetDateObj.getDate() + 1);
  const targetDateStr = targetDateObj.toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(`[reminders-engine] Checking commute reminders for date: ${targetDateStr}, day of week: ${currentDayOfWeek}`);

  // 1. Fetch all users who have active push subscriptions
  const { data: subscribers, error: subError } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .order("created_at", { ascending: false });

  if (subError) {
    console.error("[reminders-engine] Fetch subscriptions error:", subError.message);
    return { success: false, error: subError.message };
  }

  if (!subscribers || subscribers.length === 0) {
    return { success: true, message: "No active push subscriptions found." };
  }

  // De-duplicate subscribers by user_id
  const uniqueUserIds = Array.from(new Set(subscribers.map(s => s.user_id)));
  let processedCount = 0;
  let sentCount = 0;

  for (const userId of uniqueUserIds) {
    try {
      // 2. Fetch saved routes (ride_alerts with null dates) for this user
      const { data: savedRoutes, error: alertError } = await supabase
        .from("ride_alerts")
        .select("from_city, to_city")
        .eq("user_id", userId)
        .is("start_date", null)
        .is("end_date", null);

      if (alertError || !savedRoutes || savedRoutes.length === 0) continue;
      processedCount++;

      // Pick the primary saved route (or first saved route)
      const primaryRoute = savedRoutes[0];
      const { from_city, to_city } = primaryRoute;

      // 3. Check for matching rides on this route for targetDateStr (tomorrow)
      const { count: rideCount, error: countError } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("from_city", from_city)
        .eq("to_city", to_city)
        .eq("status", "active")
        .eq("date", targetDateStr);

      if (countError) continue;

      let title = "";
      let body = "";
      let url = "";

      // Customize messages based on day of week and ride availability
      if (rideCount && rideCount > 0) {
        // MATCHING RIDES AVAILABLE (Passenger Notification)
        url = `/${currentDayOfWeek === 0 ? "it" : "en"}/cerca?from=${encodeURIComponent(from_city)}&to=${encodeURIComponent(to_city)}&date=${targetDateStr}`;
        
        if (currentDayOfWeek === 6) {
          // Saturday notification for Sunday return
          title = "Rientro domenicale attivo! 🚗";
          body = `Ci sono ${rideCount} passaggi pronti per domani da ${from_city} a ${to_city}. Prenota il tuo posto!`;
        } else {
          // Regular weekday commute
          title = "Passaggi per il tuo commute 📅";
          body = `Trovati ${rideCount} passaggi per domani da ${from_city} a ${to_city}. Condividi le spese di viaggio!`;
        }
      } else {
        // NO MATCHING RIDES (Driver/Scarcity Notification)
        url = `/${currentDayOfWeek === 0 ? "it" : "en"}/offri?from=${encodeURIComponent(from_city)}&to=${encodeURIComponent(to_city)}&date=${targetDateStr}`;
        
        title = "Nessun passaggio ancora? 🤔";
        body = `Nessun viaggio registrato per domani da ${from_city} a ${to_city}. Pubblica il tuo tragitto e viaggia in compagnia!`;
      }

      // 4. Check for notification history cooldown to avoid spamming the user
      // No more than 1 alert per 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSent } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "ride_alert")
        .gte("created_at", twentyFourHoursAgo)
        .maybeSingle();

      if (recentSent) {
        // Cooldown active, skip this user
        continue;
      }

      // 5. Send push and insert notification log
      await sendPushToUser({
        userId,
        title,
        body,
        url,
      });

      // Insert notification entry in the database so it appears in their UI panel
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "ride_alert",
        title,
        body,
        ride_id: null,
        booking_id: null,
        read: false,
      });

      sentCount++;
    } catch (err) {
      console.error(`[reminders-engine] Error processing user ${userId}:`, err);
    }
  }

  return {
    success: true,
    processedUsers: processedCount,
    notificationsSent: sentCount,
  };
}

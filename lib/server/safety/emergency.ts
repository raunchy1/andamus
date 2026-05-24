"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface EmergencyContact {
  id?: string;
  user_id: string;
  name: string;
  phone: string;
  relationship?: string | null;
  priority: number;
}

/**
 * Get emergency contacts for a user.
 */
export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  const sr = createServiceRoleClient();
  const { data, error } = await sr
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: true })
    .limit(5);

  if (error) {
    console.error("[safety] getEmergencyContacts error:", error.message);
    return [];
  }
  return (data || []) as EmergencyContact[];
}

/**
 * Add or update an emergency contact.
 */
export async function saveEmergencyContact(contact: EmergencyContact): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== contact.user_id) {
    throw new Error("Unauthorized");
  }

  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("emergency_contacts")
    .upsert(contact, { onConflict: "id" });

  if (error) {
    console.error("[safety] saveEmergencyContact error:", error.message);
    return false;
  }
  return true;
}

/**
 * Delete an emergency contact.
 */
export async function deleteEmergencyContact(userId: string, contactId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("emergency_contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Generate a shareable trip link for safety.
 */
export async function generateTripShareLink(
  rideId: string,
  passengerId: string
): Promise<string> {
  const sr = createServiceRoleClient();

  // Get ride and driver info
  const { data: ride } = await sr
    .from("rides")
    .select("from_city, to_city, date, time, driver_id, profiles(name)")
    .eq("id", rideId)
    .single();

  if (!ride) throw new Error("Ride not found");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://andamus.app";

  // Create a share token
  const token = btoa(`${rideId}:${passengerId}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);

  await sr.from("trip_share_tokens").insert({
    token,
    ride_id: rideId,
    passenger_id: passengerId,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return `${baseUrl}/trip/${token}`;
}

/**
 * Get trip info from a share token.
 */
export async function getTripFromToken(token: string): Promise<{
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  driverName: string;
  status: string;
} | null> {
  const sr = createServiceRoleClient();

  const { data: share } = await sr
    .from("trip_share_tokens")
    .select("ride_id")
    .eq("token", token)
    .single();

  if (!share) return null;

  const { data: ride } = await sr
    .from("rides")
    .select("from_city, to_city, date, time, status, profiles(name)")
    .eq("id", (share as Record<string, unknown>).ride_id as string)
    .single();

  if (!ride) return null;

  const rideData = ride as Record<string, unknown>;
  const profiles = rideData.profiles as Record<string, unknown> | Record<string, unknown>[];
  const driverName = Array.isArray(profiles) ? (profiles[0]?.name as string) : (profiles?.name as string);

  return {
    fromCity: rideData.from_city as string,
    toCity: rideData.to_city as string,
    date: rideData.date as string,
    time: rideData.time as string,
    driverName: driverName || "Sconosciuto",
    status: rideData.status as string,
  };
}

/**
 * Detect suspicious patterns in user behavior.
 */
export async function detectSuspiciousBehavior(userId: string): Promise<{
  riskScore: number;
  flags: string[];
}> {
  const sr = createServiceRoleClient();
  const flags: string[] = [];
  let riskScore = 0;

  // Check rapid booking cancellations
  const { count: cancellations } = await sr
    .from("booking_cancellations")
    .select("id", { count: "exact", head: true })
    .eq("canceled_by", userId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (cancellations && cancellations >= 3) {
    flags.push("rapid_cancellations");
    riskScore += 30;
  }

  // Check safety reports against user
  const { count: reports } = await sr
    .from("safety_reports")
    .select("id", { count: "exact", head: true })
    .eq("reported_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (reports && reports >= 2) {
    flags.push("multiple_reports");
    riskScore += 40;
  }

  // Check for duplicate ride postings
  const { data: recentRides } = await sr
    .from("rides")
    .select("from_city, to_city, date, time")
    .eq("driver_id", userId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const uniqueRides = new Set((recentRides || []).map((r) => JSON.stringify(r)));
  if (recentRides && recentRides.length > 5 && uniqueRides.size < recentRides.length / 2) {
    flags.push("duplicate_ride_spam");
    riskScore += 25;
  }

  // Check for new account + high activity
  const { data: profile } = await sr
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (profile) {
    const accountAgeDays = (Date.now() - new Date((profile as Record<string, unknown>).created_at as string).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 1 && (recentRides?.length || 0) > 3) {
      flags.push("new_account_high_activity");
      riskScore += 20;
    }
  }

  return {
    riskScore: Math.min(100, riskScore),
    flags,
  };
}

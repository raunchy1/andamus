"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveRoute(fromCity: string, toCity: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: authentication required");
  }

  // Check if already saved as a permanent alert (start_date/end_date is null)
  const { data: existing, error: fetchError } = await supabase
    .from("ride_alerts")
    .select("id")
    .eq("user_id", user.id)
    .eq("from_city", fromCity)
    .eq("to_city", toCity)
    .is("start_date", null)
    .is("end_date", null)
    .maybeSingle();

  if (fetchError) {
    console.error("[saved-routes] Error checking existing route:", fetchError.message);
    throw new Error("Database error");
  }

  if (existing) {
    return { success: true, id: existing.id, message: "Route already saved" };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ride_alerts")
    .insert({
      user_id: user.id,
      from_city: fromCity,
      to_city: toCity,
      start_date: null,
      end_date: null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[saved-routes] Error saving route:", insertError.message);
    throw new Error("Database error");
  }

  revalidatePath("/[locale]/cerca", "page");
  revalidatePath("/[locale]/profilo", "page");

  return { success: true, id: inserted.id, message: "Route saved successfully" };
}

export async function deleteSavedRoute(routeId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: authentication required");
  }

  const { error: deleteError } = await supabase
    .from("ride_alerts")
    .delete()
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[saved-routes] Error deleting route:", deleteError.message);
    throw new Error("Database error");
  }

  revalidatePath("/[locale]/cerca", "page");
  revalidatePath("/[locale]/profilo", "page");

  return { success: true };
}

export async function getSavedRoutes() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data: routes, error } = await supabase
    .from("ride_alerts")
    .select("*")
    .eq("user_id", user.id)
    .is("start_date", null)
    .is("end_date", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[saved-routes] Error fetching saved routes:", error.message);
    return [];
  }

  return routes;
}

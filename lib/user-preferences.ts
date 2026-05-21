"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateUserLocale(locale: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", user.id);

  if (error) {
    console.error("[user-preferences] update locale error:", error.message);
    return { success: false };
  }

  return { success: true };
}

export async function updatePushPreference(enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("profiles")
    .update({ push_notifications: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("[user-preferences] update push error:", error.message);
    return { success: false };
  }

  return { success: true };
}

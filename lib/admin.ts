"use server";

import { createClient } from "./supabase/server";
import { isAdmin } from "./admin-config";
export { isAdmin };

export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  return isAdmin(user.email);
}

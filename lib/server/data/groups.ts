"use server";

import { createClient } from "@/lib/supabase/server";

export interface CarpoolGroup {
  id: string;
  name: string;
  type: string;
  city: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMembership {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

/**
 * Get public carpool groups.
 */
export async function getPublicGroups(limit = 50): Promise<CarpoolGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carpool_groups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/groups] getPublicGroups error:", error.message);
    return [];
  }
  return (data || []) as CarpoolGroup[];
}

/**
 * Get a single group by ID.
 */
export async function getGroupById(groupId: string): Promise<CarpoolGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carpool_groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error || !data) {
    console.error("[data/groups] getGroupById error:", error?.message);
    return null;
  }
  return data as CarpoolGroup;
}

/**
 * Get group memberships for a user.
 */
export async function getUserGroupMemberships(userId: string): Promise<GroupMembership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_memberships")
    .select("group_id, user_id, role, joined_at")
    .eq("user_id", userId);

  if (error) {
    console.error("[data/groups] getUserGroupMemberships error:", error.message);
    return [];
  }
  return (data || []) as GroupMembership[];
}

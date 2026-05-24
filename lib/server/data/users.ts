"use server";

import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: string;
  rating: number;
  review_count?: number | null;
  rides_count?: number | null;
  completed_rides_count?: number | null;
  created_at?: string | null;
  phone_verified?: boolean;
  email_verified?: boolean;
  id_verified?: boolean;
  driver_verified?: boolean;
  phone?: string | null;
  referral_code?: string | null;
  referrals_count?: number | null;
  referral_points_earned?: number | null;
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
}

export interface UserStreak {
  current: number;
  longest: number;
}

/**
 * Get a user profile by ID.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("[data/users] getProfileById error:", error?.message);
    return null;
  }
  return data as Profile;
}

/**
 * Get the current authenticated user's profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  return getProfileById(user.id);
}

/**
 * Get user activity streak.
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_activity_weeks")
    .select("week_key")
    .eq("user_id", userId)
    .order("week_key", { ascending: false });

  if (error || !data || data.length === 0) return null;

  const weeks = data.map((d) => d.week_key as string);
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().split("T")[0];
  };

  const nowWeek = getWeekKey(new Date());
  const lastWeek = getWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const weekSet = new Set(weeks);

  let currentStreak = 0;
  if (weekSet.has(nowWeek) || weekSet.has(lastWeek)) {
    currentStreak = 1;
    const startWeek = weekSet.has(nowWeek) ? nowWeek : lastWeek;
    let checkWeek = startWeek;
    while (true) {
      const prev = new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevKey = prev.toISOString().split("T")[0];
      if (weekSet.has(prevKey)) {
        currentStreak++;
        checkWeek = prevKey;
      } else break;
    }
  }

  let longestStreak = 1;
  let tempStreak = 1;
  const sorted = [...weeks].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(new Date(sorted[i]).getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevKey = prev.toISOString().split("T")[0];
    if (sorted[i - 1] === prevKey) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get reviewed ride IDs for a user.
 */
export async function getReviewedRideIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("ride_id")
    .eq("reviewer_id", userId);

  if (error) {
    console.error("[data/users] getReviewedRideIds error:", error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.ride_id as string));
}

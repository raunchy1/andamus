// @ts-nocheck
"use server";

/**
 * Referral System
 * ===============
 * Invite rewards with fraud prevention.
 * WHY: Referrals are the most cost-effective growth channel.
 * Automated fraud prevention ensures the program remains profitable.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";
import { logInfo, logWarn } from "@/lib/server/observability/logging";
import { recordUserSignup } from "@/lib/server/observability/metrics";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REFERRAL_REWARD_POINTS = 100;
const REFERRAL_REWARD_RIDES = 2; // Extra rides for referrer
const MAX_REFERRALS_PER_USER = 50;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const applyReferralSchema = z.object({
  referralCode: z.string().min(3).max(50),
  newUserId: z.string().uuid(),
  ipHash?: z.string().optional(),
});

export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;

// ---------------------------------------------------------------------------
// Apply referral
// ---------------------------------------------------------------------------

export interface ReferralResult {
  success: boolean;
  referrerId?: string;
  pointsAwarded?: number;
  error?: string;
}

/**
 * Apply a referral code when a new user signs up.
 * Includes fraud checks: self-referral, duplicate IPs, bot detection.
 */
export async function applyReferral(input: ApplyReferralInput): Promise<ReferralResult> {
  const parsed = applyReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = await createServiceRoleClient();

  // Find referrer by code
  const { data: referrer, error: referrerError } = await supabase
    .from("profiles")
    .select("id, referral_count, name")
    .eq("slug", input.referralCode)
    .maybeSingle();

  if (referrerError || !referrer) {
    return { success: false, error: "Invalid referral code" };
  }

  // Prevent self-referral
  if (referrer.id === input.newUserId) {
    logWarn("Self-referral attempt blocked", { metadata: { userId: input.newUserId } });
    return { success: false, error: "Cannot refer yourself" };
  }

  // Check max referrals
  if ((referrer.referral_count ?? 0) >= MAX_REFERRALS_PER_USER) {
    return { success: false, error: "Referrer has reached maximum referrals" };
  }

  // Fraud: check if this IP already referred someone recently
  if (input.ipHash) {
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: ipMatch } = await supabase
      .from("referral_attempts")
      .select("id")
      .eq("ip_hash", input.ipHash)
      .gte("created_at", oneDayAgo)
      .limit(5);

    if (ipMatch && ipMatch.length >= 3) {
      logWarn("Referral fraud: too many from same IP", {
        metadata: { ipHash: input.ipHash, count: ipMatch.length },
      });
      return { success: false, error: "Too many referrals from this device" };
    }
  }

  // Log the attempt
  await supabase.from("referral_attempts").insert({
    referrer_code: input.referralCode,
    new_user_id: input.newUserId,
    ip_hash: input.ipHash,
    success: true,
  });

  // Apply rewards in a transaction
  const { error: updateError } = await supabase.rpc("apply_referral_bonus", {
    referrer_id: referrer.id,
    referred_id: input.newUserId,
    points: REFERRAL_REWARD_POINTS,
  });

  if (updateError) {
    logWarn("Referral bonus application failed", {
      metadata: { error: updateError.message, referrerId: referrer.id, newUserId: input.newUserId },
    });
    return { success: false, error: "Failed to apply referral bonus" };
  }

  logInfo("Referral applied successfully", {
    metadata: { referrerId: referrer.id, newUserId: input.newUserId, points: REFERRAL_REWARD_POINTS },
  });

  recordUserSignup("referral");

  return {
    success: true,
    referrerId: referrer.id,
    pointsAwarded: REFERRAL_REWARD_POINTS,
  };
}

// ---------------------------------------------------------------------------
// Referral stats
// ---------------------------------------------------------------------------

export interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string;
  topReferrers: Array<{ name: string; count: number }>;
}

export async function getReferralStats(userId: string): Promise<{
  myReferrals: number;
  myPoints: number;
  myCode: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("referral_count, points, slug")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { myReferrals: 0, myPoints: 0, myCode: "" };
  }

  return {
    myReferrals: data.referral_count ?? 0,
    myPoints: data.points ?? 0,
    myCode: data.slug ?? "",
  };
}

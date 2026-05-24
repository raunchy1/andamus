"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";

export type PlanTier = "free" | "premium" | "business";

export interface Entitlements {
  tier: PlanTier;
  ridesPerMonth: number;
  canBoostRides: boolean;
  canCreateGroups: boolean;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  expiresAt: string | null;
}

const PLAN_LIMITS: Record<PlanTier, Omit<Entitlements, "tier" | "expiresAt">> = {
  free: {
    ridesPerMonth: 5,
    canBoostRides: false,
    canCreateGroups: false,
    analyticsAccess: false,
    prioritySupport: false,
  },
  premium: {
    ridesPerMonth: -1, // unlimited
    canBoostRides: true,
    canCreateGroups: true,
    analyticsAccess: true,
    prioritySupport: true,
  },
  business: {
    ridesPerMonth: -1,
    canBoostRides: true,
    canCreateGroups: true,
    analyticsAccess: true,
    prioritySupport: true,
  },
};

/**
 * Get user entitlements based on active subscription.
 */
export async function getUserEntitlements(userId: string): Promise<Entitlements> {
  const cacheKey = `entitlements:${userId}`;
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get<Entitlements>(cacheKey);
      if (cached) return cached;
    } catch {
      // Cache miss
    }
  }

  const sr = createServiceRoleClient();

  const { data: subscription } = await sr
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let tier: PlanTier = "free";
  let expiresAt: string | null = null;

  if (subscription) {
    const planId = (subscription as Record<string, unknown>).plan_id as string;
    if (planId.includes("business")) tier = "business";
    else if (planId.includes("premium")) tier = "premium";
    expiresAt = (subscription as Record<string, unknown>).current_period_end as string;
  }

  const entitlements: Entitlements = {
    tier,
    expiresAt,
    ...PLAN_LIMITS[tier],
  };

  if (redis) {
    try {
      await redis.setex(cacheKey, 300, entitlements);
    } catch {
      // Cache write failure is non-blocking
    }
  }

  return entitlements;
}

/**
 * Check if user can publish a ride (respecting plan limits).
 */
export async function canPublishRide(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const entitlements = await getUserEntitlements(userId);

  if (entitlements.ridesPerMonth === -1) {
    return { allowed: true, remaining: -1 };
  }

  const sr = createServiceRoleClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await sr
    .from("rides")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", userId)
    .gte("created_at", monthStart);

  const used = count || 0;
  const remaining = entitlements.ridesPerMonth - used;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: "Hai raggiunto il limite mensile di corse. Passa a Premium per pubblicare senza limiti.",
      remaining: 0,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Check if user can boost a ride.
 */
export async function canBoostRide(userId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);
  return entitlements.canBoostRides;
}

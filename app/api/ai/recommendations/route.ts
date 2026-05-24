import { NextRequest } from "next/server";
import { getRecommendedRides } from "@/lib/server/ai/matching";
import { withAuth, apiSuccess } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, ctx: AuthContext) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 20);

  const recommendations = await getRecommendedRides(ctx.userId, limit);
  return apiSuccess(recommendations);
}

export const GET = withAuth(handler, { rateLimit: rateLimitPresets.standard });

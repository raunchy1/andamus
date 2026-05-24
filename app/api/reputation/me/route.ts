import { NextRequest } from "next/server";
import { calculateReputation } from "@/lib/server/reputation/engine";
import { withAuth, apiSuccess } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, ctx: AuthContext) {
  const metrics = await calculateReputation(ctx.userId);
  return apiSuccess(metrics);
}

export const GET = withAuth(handler, { rateLimit: rateLimitPresets.standard });

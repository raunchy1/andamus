import { NextRequest } from "next/server";
import { getPlatformEarnings } from "@/lib/server/payments/earnings";
import { withAdmin, apiSuccess } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, _ctx: AuthContext) {
  const { searchParams } = new URL(req.url);
  const parsed = Number.parseInt(searchParams.get("days") ?? "30", 10);
  const days = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 365) : 30;

  const earnings = await getPlatformEarnings(days);

  return apiSuccess(earnings);
}

export const GET = withAdmin(handler, { rateLimit: rateLimitPresets.generous });

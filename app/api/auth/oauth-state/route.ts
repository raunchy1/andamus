import { NextResponse } from "next/server";
import { generateOAuthState, setOAuthStateCookie } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";

async function handler(): Promise<NextResponse> {
  const state = generateOAuthState();
  const response = NextResponse.json({ state });
  setOAuthStateCookie(response, state);
  return response;
}

export const POST = withRateLimit(handler, { rateLimit: rateLimitPresets.strict });
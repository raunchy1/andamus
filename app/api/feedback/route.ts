import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withAuth, apiError, apiSuccess, parseBody } from "@/lib/server/api-utils";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message too long"),
  page: z.string().max(500).optional(),
});

async function handler(req: NextRequest, ctx: AuthContext) {
  const body = await parseBody(req, feedbackSchema);

  const supabase = await createClient();

  const { error } = await supabase.from("feedback").insert({
    user_id: ctx.userId,
    type: body.type,
    message: body.message,
    page: body.page || null,
  });

  if (error) {
    console.error("[feedback] DB error:", error);
    return apiError("Failed to submit feedback", "DB_ERROR", 500);
  }

  return apiSuccess({ submitted: true });
}

export const POST = withAuth(handler, { rateLimit: rateLimitPresets.standard });

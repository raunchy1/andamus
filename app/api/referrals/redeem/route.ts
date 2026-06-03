import { NextRequest, NextResponse } from "next/server";
import { applyReferral } from "@/lib/server/growth/referrals";
import { withAuth, rateLimitPresets } from "@/lib/server/api-utils";
import type { AuthContext } from "@/lib/server/guards/auth";
import crypto from "crypto";

/**
 * POST /api/referrals/redeem
 *
 * Redeems a referral code for the authenticated user.
 * Security: requires auth, enforces that the redeemed user IS the authenticated caller
 * (prevents spoofing another user's ID), and applies rate limiting.
 */
async function handler(req: NextRequest, ctx: AuthContext) {
  try {
    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid referralCode" },
        { status: 400 }
      );
    }

    // Validate referral code format (alphanumeric + hyphens, max 50 chars)
    if (!/^[A-Z0-9-]{3,50}$/i.test(referralCode)) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code format" },
        { status: 400 }
      );
    }

    // CRITICAL: Use the authenticated user's ID — never accept userId from the body.
    // This prevents any user from redeeming referrals on behalf of another user.
    const newUserId = ctx.userId;

    // Get IP for fraud check and hash it to prevent storing raw personal data
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "127.0.0.1";

    // Combined device+IP fingerprint for fraud detection
    const userAgent = req.headers.get("user-agent") || "";
    const deviceFingerprint = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}`)
      .digest("hex");

    // Call the server-side referral processor
    const result = await applyReferral({
      referralCode,
      newUserId,
      ipHash: deviceFingerprint,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(
      "[api/referrals/redeem] error:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler, {
  rateLimit: rateLimitPresets.strict,
});

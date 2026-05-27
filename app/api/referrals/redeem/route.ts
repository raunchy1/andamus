import { NextRequest, NextResponse } from "next/server";
import { applyReferral } from "@/lib/server/growth/referrals";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralCode, newUserId } = body;

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { success: false, error: "Missing referralCode or newUserId" },
        { status: 400 }
      );
    }

    // Get IP for fraud check and hash it to prevent storing raw personal data
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "127.0.0.1");
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // We can also include the user agent to add extra fraud protection layers
    const userAgent = req.headers.get("user-agent") || "";
    const deviceFingerprint = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}`)
      .digest("hex");

    // Call the server-side referral processor
    const result = await applyReferral({
      referralCode,
      newUserId,
      ipHash: deviceFingerprint, // leverage device+ip combined fingerprint for optimal protection
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/referrals/redeem] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

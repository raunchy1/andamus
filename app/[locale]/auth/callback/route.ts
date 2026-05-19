import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Extract locale from URL path (e.g. /it/auth/callback -> it)
  const pathSegments = new URL(request.url).pathname.split("/").filter(Boolean);
  const locale = pathSegments[0] || "it";

  // Handle OAuth provider errors — Supabase forwards error & error_description
  // as query params when the user denies consent or the provider fails.
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const description = searchParams.get("error_description") ?? oauthError;
    const errorUrl = new URL("/" + locale + "/auth/auth-code-error", origin);
    errorUrl.searchParams.set("error", oauthError);
    errorUrl.searchParams.set("error_description", description);
    console.error("OAuth callback error:", oauthError, description);
    return NextResponse.redirect(errorUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Check for pending referral code in cookie
      const cookieHeader = request.headers.get("cookie");
      const pendingRefMatch = cookieHeader?.match(/pending_referral_code=([^;]+)/);
      const pendingRefCode = pendingRefMatch ? decodeURIComponent(pendingRefMatch[1]) : null;

      if (pendingRefCode) {
        await supabase.rpc("apply_referral_bonus", {
          new_user_id: user.id,
          referrer_code: pendingRefCode
        });
      }

      // Check if user has a profile — new users go to onboarding, existing to profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      const redirectPath = profile ? "/" + locale + "/profilo" : "/" + locale + "/lansare";

      let response: NextResponse;
      if (isLocalEnv) {
        response = NextResponse.redirect(origin + redirectPath);
      } else if (forwardedHost) {
        response = NextResponse.redirect("https://" + forwardedHost + redirectPath);
      } else {
        response = NextResponse.redirect(origin + redirectPath);
      }

      // Clear the referral code cookie
      response.cookies.delete("pending_referral_code");

      return response;
    }

    console.error("Error exchanging code for session:", error);
    const exchangeErrorUrl = new URL("/" + locale + "/auth/auth-code-error", origin);
    if (error?.message) {
      exchangeErrorUrl.searchParams.set("error_description", error.message);
    }
    return NextResponse.redirect(exchangeErrorUrl.toString());
  }

  // No code and no error param — redirect to generic error page
  return NextResponse.redirect(origin + "/" + locale + "/auth/auth-code-error");
}

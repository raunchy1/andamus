import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // Extract locale from URL path (e.g. /it/auth/callback -> it)
  const pathSegments = new URL(request.url).pathname.split('/').filter(Boolean);
  const locale = pathSegments[0] || "it";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check for pending referral code in cookie
      const cookieHeader = request.headers.get('cookie');
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
      
      let redirectPath: string;
      if (profile) {
        redirectPath = `/${locale}/profilo`;
      } else {
        redirectPath = `/${locale}/lansare`;
      }
      
      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        response = NextResponse.redirect(`${origin}${redirectPath}`);
      }
      
      // Clear the referral code cookie
      response.cookies.delete('pending_referral_code');
      
      return response;
    }
    
    console.error("Error exchanging code for session:", error);
  }

  // Return the user to an error page
  return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}

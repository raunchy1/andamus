import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check for pending referral code in cookie
      const cookieHeader = request.headers.get('cookie');
      const pendingRefMatch = cookieHeader?.match(/pending_referral_code=([^;]+)/);
      const pendingRefCode = pendingRefMatch ? decodeURIComponent(pendingRefMatch[1]) : null;
      
      if (pendingRefCode) {
        // Apply referral bonus
        await supabase.rpc("apply_referral_bonus", {
          new_user_id: user.id,
          referrer_code: pendingRefCode
        });
      }
      
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}/profilo`);
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}/profilo`);
      } else {
        response = NextResponse.redirect(`${origin}/profilo`);
      }
      
      // Clear the referral code cookie
      response.cookies.delete('pending_referral_code');
      
      return response;
    }
    
    console.error("Error exchanging code for session:", error);
  }

  // Return the user to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

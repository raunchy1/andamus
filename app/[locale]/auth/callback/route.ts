import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get("code");
  const rawLocale = pathname.split('/')[1];
  const locale = ["it", "en", "de"].includes(rawLocale) ? rawLocale : "it";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      const cookieHeader = request.headers.get('cookie');
      const pendingRefMatch = cookieHeader?.match(/pending_referral_code=([^;]+)/);
      const pendingRefCode = pendingRefMatch ? decodeURIComponent(pendingRefMatch[1]) : null;

      if (pendingRefCode) {
        await supabase.rpc("apply_referral_bonus", {
          new_user_id: user.id,
          referrer_code: pendingRefCode
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

      const response = NextResponse.redirect(`${baseUrl}/${locale}/profilo`);
      response.cookies.delete('pending_referral_code');
      return response;
    }

    console.error("Error exchanging code for session:", error);
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}

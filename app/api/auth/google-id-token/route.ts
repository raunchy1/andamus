import { NextResponse } from "next/server";

/**
 * Exchange a Google OAuth authorization code (popup UX) for an ID token.
 * Used by the browser GIS flow so the account chooser is bound to this origin
 * instead of the Supabase project subdomain.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body?.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth is not fully configured on the server" },
        { status: 500 }
      );
    }

    // GIS popup code client uses postmessage redirect.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenJson.id_token) {
      return NextResponse.json(
        {
          error:
            tokenJson.error_description ||
            tokenJson.error ||
            "Failed to exchange Google authorization code",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ id_token: tokenJson.id_token });
  } catch (error) {
    console.error("[google-id-token]", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

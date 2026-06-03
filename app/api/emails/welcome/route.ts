import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails/send";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // H-02 Security: The userId must match the logged-in user to prevent spoofing welcome emails.
    if (body.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: ID mismatch" }, { status: 403 });
    }

    // Always use the email associated with the authenticated session, not the client-provided email
    const recipientEmail = user.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "User email not found in session" }, { status: 400 });
    }

    const recipientName = user.user_metadata?.full_name || body.name || "User";

    const result = await sendWelcomeEmail({
      userId: user.id,
      email: recipientEmail,
      name: recipientName,
      referralCode: body.referralCode || "",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in welcome API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

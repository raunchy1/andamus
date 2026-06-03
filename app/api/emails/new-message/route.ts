import { NextRequest, NextResponse } from "next/server";
import { sendNewMessageEmail, wasRecentlyOnline } from "@/lib/emails/send";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, recipientId, messagePreview } = body;

    if (!bookingId || !recipientId || !messagePreview) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId, recipientId, and messagePreview are required" },
        { status: 400 }
      );
    }

    // 2. Fetch booking details securely using Service Role client
    const serviceRole = createServiceRoleClient();
    
    const { data: booking, error: bookingError } = await serviceRole
      .from("bookings")
      .select(`
        id,
        passenger_id,
        ride:rides (
          id,
          from_city,
          to_city,
          driver_id
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[new-message API] Booking not found:", bookingError?.message);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = booking as any;

    // 3. Verify that the sender (user.id) is part of this booking (Zero-Trust)
    const isPassenger = bookingData.passenger_id === user.id;
    const isDriver = bookingData.ride.driver_id === user.id;

    if (!isPassenger && !isDriver) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to send messages for this booking" },
        { status: 403 }
      );
    }

    // 4. Verify recipient ID is indeed the OTHER participant of the booking (Zero-Trust)
    const expectedRecipientId = isPassenger ? bookingData.ride.driver_id : bookingData.passenger_id;
    if (recipientId !== expectedRecipientId) {
      return NextResponse.json(
        { error: "Forbidden: Invalid recipient for this message thread" },
        { status: 403 }
      );
    }

    // 5. Check if recipient was recently online (within last 5 minutes)
    // If so, skip sending email to avoid spam
    const recentlyOnline = await wasRecentlyOnline(recipientId);
    if (recentlyOnline) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason: "User was recently online" 
      });
    }

    // 6. Fetch the recipient's email from the Supabase Auth Admin API (safe server-side lookup)
    const { data: recipientUser, error: recipientUserError } = await serviceRole.auth.admin.getUserById(recipientId);
    if (recipientUserError || !recipientUser?.user?.email) {
      console.error("[new-message API] Recipient auth account not found:", recipientUserError?.message);
      return NextResponse.json({ error: "Recipient contact details not found" }, { status: 404 });
    }

    // 7. Fetch recipient and sender profile names
    const { data: recipientProfile } = await serviceRole
      .from("profiles")
      .select("name")
      .eq("id", recipientId)
      .single();

    const { data: senderProfile } = await serviceRole
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const recipientName = recipientProfile?.name || "User";
    const senderName = senderProfile?.name || "User";

    // 8. Send the new message email using verified database data (H-02)
    const result = await sendNewMessageEmail({
      recipientId: recipientId,
      recipientEmail: recipientUser.user.email,
      recipientName: recipientName,
      senderName: senderName,
      messagePreview: messagePreview,
      bookingId: bookingData.id,
      rideId: bookingData.ride.id,
      fromCity: bookingData.ride.from_city,
      toCity: bookingData.ride.to_city,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in new-message API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmedEmail } from "@/lib/emails/send";
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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // 2. Fetch booking details securely using Service Role client
    const serviceRole = createServiceRoleClient();
    
    const { data: booking, error: bookingError } = await serviceRole
      .from("bookings")
      .select(`
        id,
        passenger_id,
        status,
        ride:rides (
          id,
          from_city,
          to_city,
          date,
          time,
          meeting_point,
          driver:profiles (
            id,
            name,
            rating,
            phone
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[booking-confirmed API] Booking not found:", bookingError?.message);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = booking as any;

    // 3. Verify that the requester is the driver who owns the ride (Zero-Trust)
    if (bookingData.ride.driver.id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the driver of this ride can confirm bookings and send notification" },
        { status: 403 }
      );
    }

    // 4. Fetch the passenger's email from the Supabase Auth Admin API (safe server-side lookup)
    const passengerId = bookingData.passenger_id;
    const { data: passengerUser, error: passengerUserError } = await serviceRole.auth.admin.getUserById(passengerId);
    
    if (passengerUserError || !passengerUser?.user?.email) {
      console.error("[booking-confirmed API] Passenger auth account not found:", passengerUserError?.message);
      return NextResponse.json({ error: "Passenger contact details not found" }, { status: 404 });
    }

    // 5. Fetch passenger's profile details to get their name
    const { data: passengerProfile, error: passengerError } = await serviceRole
      .from("profiles")
      .select("name")
      .eq("id", passengerId)
      .single();

    if (passengerError || !passengerProfile) {
      console.error("[booking-confirmed API] Passenger profile not found:", passengerError?.message);
      return NextResponse.json({ error: "Passenger profile not found" }, { status: 404 });
    }

    // 6. Send the booking confirmed email using verified database data (H-02)
    const result = await sendBookingConfirmedEmail({
      passengerId: passengerId,
      passengerEmail: passengerUser.user.email,
      passengerName: passengerProfile.name || "Passenger",
      driverName: bookingData.ride.driver.name || "Driver",
      driverRating: Number(bookingData.ride.driver.rating) || 5.0,
      driverPhone: bookingData.ride.driver.phone || undefined,
      fromCity: bookingData.ride.from_city,
      toCity: bookingData.ride.to_city,
      date: bookingData.ride.date,
      time: bookingData.ride.time,
      meetingPoint: bookingData.ride.meeting_point || "",
      bookingId: bookingData.id,
      rideId: bookingData.ride.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in booking-confirmed API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendBookingRequestEmail } from "@/lib/emails/send";
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
    
    // Fetch booking, including ride and profiles details
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
          driver:profiles (
            id,
            name
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[booking-request API] Booking not found:", bookingError?.message);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = booking as any;

    // 3. Verify that the requester is the passenger who created the booking (Zero-Trust)
    if (bookingData.passenger_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only send email for your own booking requests" },
        { status: 403 }
      );
    }

    // 4. Fetch the driver's email from the Supabase Auth Admin API (safe server-side lookup)
    const driverId = bookingData.ride.driver.id;
    const { data: driverUser, error: driverUserError } = await serviceRole.auth.admin.getUserById(driverId);
    
    if (driverUserError || !driverUser?.user?.email) {
      console.error("[booking-request API] Driver auth account not found:", driverUserError?.message);
      return NextResponse.json({ error: "Driver contact details not found" }, { status: 404 });
    }

    // 5. Fetch passenger's profile details to get verified state and name
    const { data: passengerProfile, error: passengerError } = await serviceRole
      .from("profiles")
      .select("name, rating, phone_verified")
      .eq("id", user.id)
      .single();

    if (passengerError || !passengerProfile) {
      console.error("[booking-request API] Passenger profile not found:", passengerError?.message);
      return NextResponse.json({ error: "Passenger profile not found" }, { status: 404 });
    }

    // 6. Send the booking request email using verified database data (H-02)
    const result = await sendBookingRequestEmail({
      driverId: driverId,
      driverEmail: driverUser.user.email,
      driverName: bookingData.ride.driver.name || "Driver",
      passengerName: passengerProfile.name || "Passenger",
      passengerRating: Number(passengerProfile.rating) || 5.0,
      passengerVerified: passengerProfile.phone_verified || false,
      fromCity: bookingData.ride.from_city,
      toCity: bookingData.ride.to_city,
      date: bookingData.ride.date,
      time: bookingData.ride.time,
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
    console.error("Error in booking-request API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

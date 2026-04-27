import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmedEmail } from "@/lib/emails/send";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "passengerId",
      "passengerEmail",
      "passengerName",
      "driverName",
      "driverRating",
      "fromCity",
      "toCity",
      "date",
      "time",
      "meetingPoint",
      "bookingId",
      "rideId",
    ];

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== false) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const result = await sendBookingConfirmedEmail({
      passengerId: body.passengerId,
      passengerEmail: body.passengerEmail,
      passengerName: body.passengerName,
      driverName: body.driverName,
      driverRating: body.driverRating,
      driverPhone: body.driverPhone,
      fromCity: body.fromCity,
      toCity: body.toCity,
      date: body.date,
      time: body.time,
      meetingPoint: body.meetingPoint,
      bookingId: body.bookingId,
      rideId: body.rideId,
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

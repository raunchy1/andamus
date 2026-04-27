import { NextRequest, NextResponse } from "next/server";
import { sendRideReminderEmail } from "@/lib/emails/send";
import { createClient } from "@/lib/supabase/server";

// This endpoint should be called by Vercel Cron
// It sends reminders for rides happening tomorrow

interface ProfileData {
  name: string;
  email: string;
}

interface RideWithProfile {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  meeting_point: string | null;
  driver_id: string;
  reminder_sent: boolean;
  profiles: ProfileData | ProfileData[];
}

interface BookingWithProfile {
  id: string;
  passenger_id: string;
  profiles: ProfileData | ProfileData[];
}

function getProfileData(profiles: ProfileData | ProfileData[] | null | undefined): ProfileData | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) {
    return profiles[0] || null;
  }
  return profiles;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (fail closed)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find all active rides happening tomorrow that haven't been reminded yet
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select(`
        id,
        from_city,
        to_city,
        date,
        time,
        meeting_point,
        driver_id,
        reminder_sent,
        profiles!inner(name, email)
      `)
      .eq("date", tomorrowStr)
      .eq("status", "active")
      .neq("reminder_sent", true)
      .returns<RideWithProfile[]>();

    if (ridesError) {
      // Error fetching rides - logged silently
      return NextResponse.json(
        { error: "Failed to fetch rides" },
        { status: 500 }
      );
    }

    if (!rides || rides.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No rides to remind",
        remindersSent: 0 
      });
    }

    let remindersSent = 0;
    const errors: string[] = [];

    // Process each ride
    for (const ride of rides) {
      try {
        // Get confirmed bookings for this ride
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            passenger_id,
            profiles!inner(name, email)
          `)
          .eq("ride_id", ride.id)
          .eq("status", "confirmed")
          .returns<BookingWithProfile[]>();

        if (bookingsError) {
          // Error fetching bookings - logged silently
          errors.push(`Ride ${ride.id}: bookings error`);
          continue;
        }

        // Get driver profile
        const driverProfile = getProfileData(ride.profiles);

        // Send reminder to driver
        if (driverProfile?.email) {
          const driverResult = await sendRideReminderEmail({
            recipientId: ride.driver_id,
            recipientEmail: driverProfile.email,
            recipientName: driverProfile.name,
            isDriver: true,
            fromCity: ride.from_city,
            toCity: ride.to_city,
            date: ride.date,
            time: ride.time,
            meetingPoint: ride.meeting_point || `Piazza centrale, ${ride.from_city}`,
            bookingId: bookings?.[0]?.id || "",
            rideId: ride.id,
          });

          if (driverResult.success) {
            remindersSent++;
          } else {
            errors.push(`Driver ${ride.driver_id}: ${driverResult.error}`);
          }
        }

        // Send reminders to all confirmed passengers
        if (bookings && bookings.length > 0) {
          for (const booking of bookings) {
            const passengerProfile = getProfileData(booking.profiles);
            if (passengerProfile?.email) {
              const passengerResult = await sendRideReminderEmail({
                recipientId: booking.passenger_id,
                recipientEmail: passengerProfile.email,
                recipientName: passengerProfile.name,
                isDriver: false,
                fromCity: ride.from_city,
                toCity: ride.to_city,
                date: ride.date,
                time: ride.time,
                meetingPoint: ride.meeting_point || `Piazza centrale, ${ride.from_city}`,
                bookingId: booking.id,
                rideId: ride.id,
              });

              if (passengerResult.success) {
                remindersSent++;
              } else {
                errors.push(`Passenger ${booking.passenger_id}: ${passengerResult.error}`);
              }
            }
          }
        }

        // Mark ride as reminded
        await supabase
          .from("rides")
          .update({ reminder_sent: true })
          .eq("id", ride.id);

      } catch {
        // Error processing ride
        errors.push(`Ride ${ride.id}: processing error`);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      ridesProcessed: rides.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch {
    // Error in ride-reminders cron
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

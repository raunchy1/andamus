import { NextRequest } from "next/server";
import { sendRideReminderEmail } from "@/lib/emails/send";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { apiError, apiSuccess } from "@/lib/server/api-utils";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { env } from "@/lib/server/validators/env";

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
  if (Array.isArray(profiles)) return profiles[0] || null;
  return profiles;
}

export async function GET(request: NextRequest) {
  // ── Cron secret validation (fail closed) ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = env().CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  // ── Rate limit ──
  const rl = await checkRateLimit({
    identifier: "cron:ride-reminders",
    ...rateLimitPresets.cron,
  });
  if (!rl.success) {
    return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  try {
    const supabase = createServiceRoleClient();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

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
      console.error("[ride-reminders] Fetch error:", ridesError);
      return apiError("Failed to fetch rides", "DB_ERROR", 500);
    }

    if (!rides || rides.length === 0) {
      const response = apiSuccess({ message: "No rides to remind", remindersSent: 0 });
      response.headers.set("X-RateLimit-Limit", String(rl.limit));
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      return response;
    }

    let remindersSent = 0;
    const errors: string[] = [];

    for (const ride of rides) {
      try {
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
          errors.push(`Ride ${ride.id}: bookings error`);
          continue;
        }

        const driverProfile = getProfileData(ride.profiles);

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

          if (driverResult.success) remindersSent++;
          else errors.push(`Driver ${ride.driver_id}: ${driverResult.error}`);
        }

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

              if (passengerResult.success) remindersSent++;
              else errors.push(`Passenger ${booking.passenger_id}: ${passengerResult.error}`);
            }
          }
        }

        await supabase.from("rides").update({ reminder_sent: true }).eq("id", ride.id);
      } catch {
        errors.push(`Ride ${ride.id}: processing error`);
      }
    }

    const response = apiSuccess({
      remindersSent,
      ridesProcessed: rides.length,
      errors: errors.length > 0 ? errors : undefined,
    });
    response.headers.set("X-RateLimit-Limit", String(rl.limit));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch {
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

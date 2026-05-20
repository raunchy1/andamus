import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_FEE_PERCENT = 0.10; // 10%

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure passenger profile exists (safety: trigger may have failed at signup)
  await supabase.from("profiles").upsert({
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente",
    email: user.email || "",
    rating: 5.0,
    rides_count: 0,
    points: 0,
    level: "Viaggiatore",
  }, { onConflict: "id", ignoreDuplicates: true });

  try {
    const { rideId, locale = "it" } = await req.json();

    if (!rideId) {
      return NextResponse.json({ error: "rideId required" }, { status: 400 });
    }

    // Fetch ride and driver's Connect account
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, from_city, to_city, date, time, price, driver_id, seats, status")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (ride.status !== "active") {
      return NextResponse.json({ error: "Ride not available" }, { status: 400 });
    }

    // Reject expired rides (date + time already passed)
    const { isRideExpired } = await import("@/lib/date-utils");
    if (isRideExpired(ride.date, ride.time)) {
      return NextResponse.json({ error: "Ride has already departed" }, { status: 400 });
    }

    if (ride.price <= 0) {
      return NextResponse.json({ error: "Ride is free" }, { status: 400 });
    }

    if (ride.driver_id === user.id) {
      return NextResponse.json({ error: "Cannot book own ride" }, { status: 400 });
    }

    // Get driver's Connect account
    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, connect_onboarded, name")
      .eq("id", ride.driver_id)
      .single();

    if (!driverProfile?.stripe_connect_account_id || !driverProfile.connect_onboarded) {
      return NextResponse.json({ error: "Driver has not set up payments" }, { status: 400 });
    }

    // Check for duplicate booking
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("ride_id", rideId)
      .eq("passenger_id", user.id)
      .maybeSingle();

    if (existingBooking && existingBooking.status !== "rejected") {
      return NextResponse.json({ error: "Already booked" }, { status: 409 });
    }

    // Check seat availability
    const { count: confirmedCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("ride_id", rideId)
      .eq("status", "confirmed");

    if ((confirmedCount || 0) >= ride.seats) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 });
    }

    // Create (or recycle rejected) booking before redirecting to Stripe
    let finalBooking: { id: string } | null = null;

    if (existingBooking?.status === "rejected") {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "pending", payment_status: "awaiting_payment", payment_intent_id: null })
        .eq("id", existingBooking.id)
        .select("id")
        .single();
      if (error || !data) return NextResponse.json({ error: "Could not reset booking" }, { status: 500 });
      finalBooking = data;
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert({ ride_id: rideId, passenger_id: user.id, status: "pending", payment_status: "awaiting_payment" })
        .select("id")
        .single();
      if (error || !data) return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
      finalBooking = data;
    }

    const priceInCents = Math.round(ride.price * 100);
    const feeInCents = Math.round(priceInCents * PLATFORM_FEE_PERCENT);

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:7001";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: priceInCents,
            product_data: {
              name: `${ride.from_city} → ${ride.to_city}`,
              description: `Passaggio con ${driverProfile.name} — ${ride.date}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        application_fee_amount: feeInCents,
        transfer_data: {
          destination: driverProfile.stripe_connect_account_id,
        },
      },
      success_url: `${origin}/${locale}/chat/${finalBooking.id}?payment=success`,
      cancel_url: `${origin}/${locale}/corsa/${rideId}?payment=cancelled`,
      metadata: {
        booking_id: finalBooking.id,
        ride_id: rideId,
        passenger_id: user.id,
        driver_id: ride.driver_id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

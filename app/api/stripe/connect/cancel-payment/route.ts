import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

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

  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, payment_intent_id, payment_status, ride_id, rides(driver_id)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;

    if (ride?.driver_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!booking.payment_intent_id) {
      return NextResponse.json({ cancelled: false, free: true });
    }

    if (booking.payment_status === "cancelled") {
      return NextResponse.json({ cancelled: true });
    }

    await getStripe().paymentIntents.cancel(booking.payment_intent_id);

    await supabase
      .from("bookings")
      .update({ payment_status: "cancelled" })
      .eq("id", bookingId);

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

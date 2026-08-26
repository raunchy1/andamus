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

    // Fetch booking + verify caller is the driver
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
      // Free ride — just accept without payment capture
      return NextResponse.json({ captured: false, free: true });
    }

    if (booking.payment_status === "captured") {
      return NextResponse.json({ captured: true });
    }

    // Check seat availability before capturing (concurrent booking guard)
    const { data: rideData } = await supabase
      .from("rides")
      .select("seats")
      .eq("id", booking.ride_id)
      .single();
    const { count: confirmedCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("ride_id", booking.ride_id)
      .eq("status", "confirmed");
    if ((confirmedCount ?? 0) >= (rideData?.seats ?? 0)) {
      await getStripe().paymentIntents.cancel(booking.payment_intent_id);
      await supabase.from("bookings").update({ status: "rejected", payment_status: "cancelled" }).eq("id", bookingId);
      return NextResponse.json({ error: "No seats available" }, { status: 409 });
    }

    const intent = await getStripe().paymentIntents.capture(
      booking.payment_intent_id,
      { expand: ["latest_charge"] }
    );

    // Record what Stripe actually moved, rather than recomputing it from the
    // ride price later — the fee percentage and the price can both change.
    const charge =
      intent.latest_charge && typeof intent.latest_charge !== "string"
        ? intent.latest_charge
        : null;

    const amountGross = charge?.amount_captured ?? intent.amount_received ?? null;
    const platformFee =
      typeof charge?.application_fee_amount === "number"
        ? charge.application_fee_amount
        : intent.application_fee_amount ?? null;

    await supabase
      .from("bookings")
      .update({
        payment_status: "captured",
        status: "confirmed",
        amount_gross_cents: amountGross,
        platform_fee_cents: platformFee,
        currency: intent.currency,
        captured_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return NextResponse.json({ captured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

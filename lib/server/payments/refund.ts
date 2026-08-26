import "server-only";
import Stripe from "stripe";
import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type RefundOutcome =
  | { ok: true; refunded: boolean; cancelled?: boolean; free?: boolean }
  | { ok: false; error: string; status: number };

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

/**
 * Refunds (or cancels the authorization on) a booking's payment.
 *
 * Shared by the /api/stripe/connect/refund route and the cancelRide server
 * action so neither has to call the other over HTTP — a server-to-server fetch
 * would not carry the caller's session cookies and would fail authorization.
 *
 * `actorId` must be the passenger or the ride's driver.
 */
export async function refundBooking(
  supabase: ServerSupabase,
  bookingId: string,
  actorId: string
): Promise<RefundOutcome> {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, payment_intent_id, payment_status, passenger_id, ride_id, amount_refunded_cents, rides(driver_id)"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { ok: false, error: "Booking not found", status: 404 };
  }

  const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
  const isPassenger = booking.passenger_id === actorId;
  const isDriver = ride?.driver_id === actorId;

  if (!isPassenger && !isDriver) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  // Free ride — nothing to refund
  if (!booking.payment_intent_id) {
    return { ok: true, refunded: false, free: true };
  }

  if (booking.payment_status === "refunded") {
    return { ok: true, refunded: true };
  }

  const stripe = getStripe();

  if (booking.payment_status === "captured") {
    // Funds already settled to the driver: pull them back, including our fee.
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      reverse_transfer: true,
      refund_application_fee: true,
    });

    // Store the amount Stripe actually returned, accumulating in case a booking
    // is ever refunded in more than one step.
    const previouslyRefunded = booking.amount_refunded_cents ?? 0;

    await supabase
      .from("bookings")
      .update({
        payment_status: "refunded",
        amount_refunded_cents: previouslyRefunded + (refund.amount ?? 0),
        refunded_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return { ok: true, refunded: true };
  }

  if (
    booking.payment_status === "authorized" ||
    booking.payment_status === "awaiting_payment"
  ) {
    // Only a hold exists — releasing it never charges the passenger.
    await stripe.paymentIntents.cancel(booking.payment_intent_id);

    await supabase
      .from("bookings")
      .update({ payment_status: "cancelled" })
      .eq("id", bookingId);

    return { ok: true, refunded: false, cancelled: true };
  }

  return {
    ok: false,
    error: `Cannot refund payment with status: ${booking.payment_status}`,
    status: 400,
  };
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { env } from "@/lib/env";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/server/observability";

const getStripe = () => {
  const e = env();
  if (!e.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(e.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
};

function getEndpointSecret(): string {
  const e = env();
  if (!e.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return e.STRIPE_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") || "";

  // ── Rate limit by signature prefix to prevent replay floods ──
  const rl = await checkRateLimit({
    identifier: `stripe-webhook:${sig.slice(0, 32) || "no-sig"}`,
    ...rateLimitPresets.webhook,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig, getEndpointSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("[stripe/webhook] Signature verification failed", { message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // ── Idempotency: skip if already processed ──
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { error: insertErr } = await supabase
    .from("stripe_events")
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (insertErr && insertErr.code !== "23505") {
    logger.error("[stripe/webhook] Idempotency insert failed", { error: insertErr.message, code: insertErr.code });
  }

  // ── Event handlers ──
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;
      }
      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase);
        break;
      }
      case "account.updated": {
        await handleAccountUpdated(event.data.object as Stripe.Account, supabase);
        break;
      }
    }
  } catch (handlerErr) {
    const msg = handlerErr instanceof Error ? handlerErr.message : "Handler error";
    logger.error(`[stripe/webhook] Handler error for ${event.type}`, { message: msg, eventId: event.id });
    reportError(handlerErr, { route: "/api/stripe/webhook", method: "POST", extra: { eventType: event.type, eventId: event.id } });
    return NextResponse.json({ error: "Handler error", event: event.id }, { status: 500 });
  }

  const response = NextResponse.json({ received: true });
  response.headers.set("X-RateLimit-Limit", String(rl.limit));
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  return response;
}

// ─── Private handlers ────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const stripe = getStripe();

  // ── Connect marketplace booking payment ──
  const bookingId = session.metadata?.booking_id;
  if (bookingId && session.payment_intent) {
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_intent_id: session.payment_intent as string,
        payment_status: "authorized",
      })
      .eq("id", bookingId);

    if (error) {
      logger.error("[stripe/webhook] Failed to update booking payment", { error: error.message });
      throw new Error("Database error updating booking");
    }
    return;
  }

  // ── Subscription checkout ──
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (userId && planId && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const { error: subError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_id: planId,
      status: subscription.status,
      current_period_start: timestampToIso((subscription as unknown as Record<string, number>).current_period_start),
      current_period_end: timestampToIso((subscription as unknown as Record<string, number>).current_period_end),
    }, { onConflict: "stripe_subscription_id" });

    if (subError) {
      logger.error("[stripe/webhook] Failed to upsert subscription", { error: subError.message });
      throw new Error("Database error upserting subscription");
    }

    const { error: profileError } = await supabase.from("profiles").update({
      subscription_plan: planId,
      subscription_status: "active",
      subscription_period_end: timestampToIso((subscription as unknown as Record<string, number>).current_period_end),
    }).eq("id", userId);

    if (profileError) {
      logger.error("[stripe/webhook] Failed to update profile", { error: profileError.message });
      throw new Error("Database error updating profile");
    }
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const subscriptionId = typeof (invoice as unknown as Record<string, unknown>).subscription === "string"
    ? (invoice as unknown as Record<string, unknown>).subscription as string
    : ((invoice as unknown as Record<string, unknown>).subscription as { id?: string } | undefined)?.id;

  if (!subscriptionId) return;

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (subRow) {
    await supabase.from("subscriptions").update({ status: "past_due" })
      .eq("stripe_subscription_id", subscriptionId);
    await supabase.from("profiles").update({ subscription_status: "past_due" })
      .eq("id", subRow.user_id);
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!subRow) return;

  const canceledAt = subscription.canceled_at
    ? timestampToIso(subscription.canceled_at)
    : null;

  const { error: subUpdateError } = await supabase.from("subscriptions").update({
    status: subscription.status,
    canceled_at: canceledAt,
  }).eq("stripe_subscription_id", subscription.id);

  if (subUpdateError) {
    logger.error("[stripe/webhook] Failed to update subscription", { error: subUpdateError.message });
    throw new Error("Database error updating subscription");
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const periodEnd = timestampToIso((subscription as unknown as Record<string, number>).current_period_end);

  const { error: profileUpdateError } = await supabase.from("profiles").update({
    subscription_plan: isActive ? subRow.plan_id : "free",
    subscription_status: isActive ? "active" : subscription.status,
    subscription_period_end: periodEnd,
  }).eq("id", subRow.user_id);

  if (profileUpdateError) {
    logger.error("[stripe/webhook] Failed to update profile", { error: profileUpdateError.message });
    throw new Error("Database error updating profile");
  }
}

async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const onboarded = account.details_submitted && account.charges_enabled;

  if (onboarded) {
    await supabase
      .from("profiles")
      .update({ connect_onboarded: true })
      .eq("stripe_connect_account_id", account.id);
  }
}

function timestampToIso(ts: number | null | undefined): string | null {
  if (typeof ts !== "number") return null;
  return new Date(ts * 1000).toISOString();
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id;

      if (userId && planId && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);

        const { error: subError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          plan_id: planId,
          status: subscription.status,
          // @ts-expect-error stripe SDK types mismatch
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          // @ts-expect-error stripe SDK types mismatch
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: "stripe_subscription_id" });

        if (subError) {
          console.error("[stripe/webhook] Failed to upsert subscription:", subError);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        const { error: profileError } = await supabase.from("profiles").update({
          subscription_plan: planId,
          subscription_status: "active",
          // @ts-expect-error stripe SDK types mismatch
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq("id", userId);

        if (profileError) {
          console.error("[stripe/webhook] Failed to update profile:", profileError);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
      }
      break;
    }

    case "invoice.payment_failed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("user_id, plan_id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (subRow) {
        const canceledAt = subscription.canceled_at && typeof subscription.canceled_at === "number"
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null;

        const { error: subUpdateError } = await supabase.from("subscriptions").update({
          status: subscription.status,
          canceled_at: canceledAt,
        }).eq("stripe_subscription_id", subscription.id);

        if (subUpdateError) {
          console.error("[stripe/webhook] Failed to update subscription:", subUpdateError);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        const isActive = subscription.status === "active" || subscription.status === "trialing";
        // @ts-expect-error stripe SDK types mismatch
        const periodEnd = subscription.current_period_end && typeof subscription.current_period_end === "number"
          // @ts-expect-error stripe SDK types mismatch
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const { error: profileUpdateError } = await supabase.from("profiles").update({
          subscription_plan: isActive ? subRow.plan_id : "free",
          subscription_status: isActive ? "active" : subscription.status,
          subscription_period_end: periodEnd,
        }).eq("id", subRow.user_id);

        if (profileUpdateError) {
          console.error("[stripe/webhook] Failed to update profile:", profileUpdateError);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

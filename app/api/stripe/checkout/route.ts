import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

const PRICE_MAP: Record<string, string | undefined> = {
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
  driver: process.env.STRIPE_DRIVER_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId, locale = "it" } = await req.json();
    const priceId = PRICE_MAP[planId];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, name, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile?.email || user.email,
        name: profile?.name || user.user_metadata?.full_name,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:7001";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/${locale}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/premium/cancel`,
      metadata: { user_id: user.id, plan_id: planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

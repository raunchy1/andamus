import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, connect_onboarded")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({ onboarded: false, account_id: null });
    }

    // Check live status from Stripe and sync to DB
    const account = await getStripe().accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = account.details_submitted && account.charges_enabled;

    if (onboarded && !profile.connect_onboarded) {
      await supabase
        .from("profiles")
        .update({ connect_onboarded: true })
        .eq("id", user.id);
    }

    return NextResponse.json({
      onboarded,
      account_id: profile.stripe_connect_account_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

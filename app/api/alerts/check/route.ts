import { NextRequest, NextResponse } from "next/server";
import { ensureVapidDetails, webPush } from "@/lib/web-push";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  ensureVapidDetails();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
    }

    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    const { data: alerts } = await supabase
      .from("ride_alerts")
      .select("user_id")
      .eq("from_city", ride.from_city)
      .eq("to_city", ride.to_city)
      .or(
        `and(start_date.is.null,end_date.is.null),and(start_date.lte.${ride.date},end_date.gte.${ride.date})`
      )
      .or(
        `and(max_price.is.null,min_seats.is.null),and(max_price.gte.${ride.price},min_seats.is.null),and(max_price.is.null,min_seats.lte.${ride.seats}),and(max_price.gte.${ride.price},min_seats.lte.${ride.seats})`
      );

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const userIds = [...new Set(alerts.map((a) => a.user_id))];

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title: "Nuovo passaggio disponibile!",
      body: `Trovato un passaggio da ${ride.from_city} a ${ride.to_city} il ${ride.date}`,
      icon: "/icon-192x192.png",
      url: `/corsa/${ride.id}`,
    });

    let sent = 0;
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch {
          // Ignore individual send failures
        }
      })
    );

    return NextResponse.json({ sent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

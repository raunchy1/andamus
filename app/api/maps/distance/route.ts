import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { formatDistanceKm, formatDurationMinutes, stripRegionSuffix } from "@/lib/routing/format";
import { getRouteForRide } from "@/lib/server/routing/osrm";

async function handler(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    origin?: unknown;
    destination?: unknown;
  } | null;

  const origin = typeof body?.origin === "string" ? stripRegionSuffix(body.origin) : "";
  const destination = typeof body?.destination === "string" ? stripRegionSuffix(body.destination) : "";

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin and destination are required" },
      { status: 400 }
    );
  }

  const route = await getRouteForRide(origin, destination);
  if (!route || route.distance_m == null || route.duration_s == null) {
    return NextResponse.json({ error: "Distance calculation failed" }, { status: 502 });
  }

  const res = NextResponse.json({
    distance_m: route.distance_m,
    duration_s: route.duration_s,
    distance_km: Math.round(route.distance_m / 1000),
    rows: [
      {
        elements: [
          {
            status: "OK",
            distance: {
              value: route.distance_m,
              text: formatDistanceKm(route.distance_m),
            },
            duration: {
              value: route.duration_s,
              text: formatDurationMinutes(route.duration_s / 60),
            },
          },
        ],
      },
    ],
  });
  res.headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  return res;
}

export const POST = withRateLimit(handler, { rateLimit: rateLimitPresets.standard });

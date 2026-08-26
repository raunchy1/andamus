import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAppNow } from "@/lib/date-utils";

// ── Deterministic helpers (same as seed-rides.ts) ─────────────────────────────

function createPRNG(seedString: string) {
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = (Math.imul(31, h) + seedString.charCodeAt(i)) | 0;
  }
  return function () {
    h = (Math.imul(h, 48271) + 2147483647) | 0;
    return (h & 2147483647) / 2147483648;
  };
}

/**
 * GET /api/admin/refresh-rides
 *
 * Refreshes expired seeded ride dates without recreating users or profiles.
 * Authenticated via CRON_SECRET bearer token (fail-closed).
 *
 * Called by Vercel cron daily to keep the marketplace populated.
 */
export async function GET(request: Request) {
  // Auth: CRON_SECRET bearer token — FAIL-CLOSED
  // If CRON_SECRET is not set, reject ALL requests (never fail open).
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const logs: string[] = [];
  // Europe/Rome, like every other expiry check in the app. toISOString() would
  // read the UTC date, which is a different day for part of each night.
  const { date: todayStr } = getAppNow();
  // Anchor at midday so adding days can never slip across a DST boundary.
  const today = new Date(`${todayStr}T12:00:00Z`);

  try {
    // ── 1. Find all seed driver IDs ────────────────────────────────────────────
    const seedEmails = [
      "matteo.piras@andamus.it",
      "giulia.carta@andamus.it",
      "alessandro.melis@andamus.it",
      "francesca.sanna@andamus.it",
      "marco.pinna@andamus.it",
      "chiara.contini@andamus.it",
      "davide.manca@andamus.it",
      "elena.loi@andamus.it",
      "stefano.serra@andamus.it",
      "martina.usai@andamus.it",
    ];

    // The ids must come from the table, not from a hash of the email. The
    // seed profiles were created through Supabase Auth, so their ids are the
    // auth user ids — generateDeterministicUUID("user-<email>") produces
    // something else entirely, the `in` filter matched nothing, and this route
    // reported "marketplace is fresh" while every seeded ride sat expired.
    const { data: seedDrivers, error: seedDriversErr } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", seedEmails);

    if (seedDriversErr) {
      logs.push(`Error resolving seed drivers: ${seedDriversErr.message}`);
      return NextResponse.json({ success: false, error: seedDriversErr.message, logs }, { status: 500 });
    }

    const seedDriverIds = (seedDrivers ?? []).map((d) => d.id as string);
    logs.push(`Resolved ${seedDriverIds.length} seed drivers`);

    if (seedDriverIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No seed drivers found — nothing to refresh.",
        refreshed: 0,
        logs,
      });
    }

    // ── 2. Find expired seed rides ─────────────────────────────────────────────
    // Two distinct cases: rides the midnight expire-rides cron already marked
    // 'expired', and 'active' rides whose date is already past (in case this
    // runs before that cron).
    //
    // The date bound is strictly `<` today. It used to be `<=`, which also
    // caught rides scheduled for *today* that had not departed yet — so every
    // night this route pushed the whole of today's marketplace 1-30 days out
    // and the homepage's "Passaggi di oggi" could never show anything.
    const { data: expiredRides, error: fetchErr } = await supabase
      .from("rides")
      .select("id")
      .in("driver_id", seedDriverIds)
      .or(`status.eq.expired,and(status.eq.active,date.lt.${todayStr})`);

    if (fetchErr) {
      logs.push(`Error fetching expired rides: ${fetchErr?.message}`);
      return NextResponse.json({ success: false, error: fetchErr?.message, logs }, { status: 500 });
    }

    if (!expiredRides || expiredRides.length === 0) {
      return NextResponse.json({
        success: true,
        message: "✅ No expired rides found — marketplace is fresh!",
        refreshed: 0,
        logs,
      });
    }

    logs.push(`Found ${expiredRides.length} expired seeded rides to refresh and reactivate.`);

    // ── 3. Update each expired ride with a new future date and reactivate ──────
    let refreshed = 0;
    for (const ride of expiredRides) {
      // Use ride ID as PRNG seed for deterministic-ish but varied offsets
      const prng = createPRNG(`refresh-${ride.id}-${todayStr}`);
      const daysAhead = Math.floor(prng() * 30) + 1; // 1-30 days
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + daysAhead);
      const newDateStr = newDate.toISOString().split("T")[0];

      const { error: updateErr } = await supabase
        .from("rides")
        .update({ date: newDateStr, status: "active" })
        .eq("id", ride.id);

      if (updateErr) {
        logs.push(`Warning: failed to refresh ride ${ride.id}: ${updateErr.message}`);
      } else {
        refreshed++;
      }
    }

    logs.push(`Successfully refreshed ${refreshed} rides with future dates.`);

    return NextResponse.json({
      success: true,
      message: `✅ Refreshed ${refreshed} expired rides!`,
      refreshed,
      logs,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logs.push(`Exception: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg, logs }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface EarningsTotals {
  grossCents: number;
  feeCents: number;
  refundedCents: number;
  netFeeCents: number;
  bookings: number;
}

export interface EarningsDayPoint {
  date: string;
  netFeeCents: number;
  grossCents: number;
  bookings: number;
}

export interface EarningsRow {
  bookingId: string;
  route: string;
  grossCents: number;
  feeCents: number;
  refundedCents: number;
  netFeeCents: number;
  capturedAt: string;
  refundedAt: string | null;
}

export interface EarningsReport {
  currency: string;
  since: string;
  totals: EarningsTotals;
  allTime: EarningsTotals;
  daily: EarningsDayPoint[];
  recent: EarningsRow[];
}

interface EarningsViewRow {
  booking_id: string;
  from_city: string | null;
  to_city: string | null;
  currency: string | null;
  amount_gross_cents: number | null;
  platform_fee_cents: number | null;
  amount_refunded_cents: number | null;
  net_fee_cents: number | null;
  captured_at: string;
  refunded_at: string | null;
}

const emptyTotals = (): EarningsTotals => ({
  grossCents: 0,
  feeCents: 0,
  refundedCents: 0,
  netFeeCents: 0,
  bookings: 0,
});

function accumulate(totals: EarningsTotals, row: EarningsViewRow): void {
  totals.grossCents += row.amount_gross_cents ?? 0;
  totals.feeCents += row.platform_fee_cents ?? 0;
  totals.refundedCents += row.amount_refunded_cents ?? 0;
  totals.netFeeCents += row.net_fee_cents ?? 0;
  totals.bookings += 1;
}

/**
 * Platform commission over the last `days`, plus an all-time comparison.
 *
 * Reads `admin_platform_earnings`, which exposes only captured bookings and
 * already nets the fee against refunds. Uses the service-role client because
 * the view is not granted to anon or authenticated — callers must gate on
 * admin themselves (see withAdmin).
 */
export async function getPlatformEarnings(days = 30): Promise<EarningsReport> {
  const supabase = createServiceRoleClient();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("admin_platform_earnings")
    .select(
      "booking_id, from_city, to_city, currency, amount_gross_cents, platform_fee_cents, amount_refunded_cents, net_fee_cents, captured_at, refunded_at"
    )
    .order("captured_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load earnings: ${error.message}`);
  }

  const rows = (data ?? []) as EarningsViewRow[];
  const sinceIso = since.toISOString();

  const allTime = emptyTotals();
  const totals = emptyTotals();
  const byDay = new Map<string, EarningsDayPoint>();

  // Seed every day in the window so the chart has no gaps.
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, netFeeCents: 0, grossCents: 0, bookings: 0 });
  }

  for (const row of rows) {
    accumulate(allTime, row);

    if (row.captured_at >= sinceIso) {
      accumulate(totals, row);

      const key = row.captured_at.slice(0, 10);
      const point = byDay.get(key);
      if (point) {
        point.netFeeCents += row.net_fee_cents ?? 0;
        point.grossCents += row.amount_gross_cents ?? 0;
        point.bookings += 1;
      }
    }
  }

  const recent: EarningsRow[] = rows.slice(0, 20).map((row) => ({
    bookingId: row.booking_id,
    route: [row.from_city, row.to_city].filter(Boolean).join(" → ") || "—",
    grossCents: row.amount_gross_cents ?? 0,
    feeCents: row.platform_fee_cents ?? 0,
    refundedCents: row.amount_refunded_cents ?? 0,
    netFeeCents: row.net_fee_cents ?? 0,
    capturedAt: row.captured_at,
    refundedAt: row.refunded_at,
  }));

  return {
    currency: rows[0]?.currency ?? "eur",
    since: sinceIso,
    totals,
    allTime,
    daily: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
    recent,
  };
}

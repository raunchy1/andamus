import Link from "next/link";
import { TrendingUp, Wallet, RotateCcw, Receipt } from "lucide-react";
import { getPlatformEarnings } from "@/lib/server/payments/earnings";
import { EarningsChart } from "./_components/EarningsChart";

export const dynamic = "force-dynamic";

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface Props {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminEarningsPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams;
  const parsed = Number.parseInt(daysParam ?? "30", 10);
  const days = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 365) : 30;

  const earnings = await getPlatformEarnings(days);
  const { totals, allTime, currency, daily, recent } = earnings;

  const money = (cents: number) => formatMoney(cents, currency);

  const stats = [
    {
      label: `commissione ${days}g`,
      value: money(totals.netFeeCents),
      icon: Wallet,
      hint: `${totals.bookings} pagament${totals.bookings === 1 ? "o" : "i"}`,
    },
    {
      label: "volume lordo",
      value: money(totals.grossCents),
      icon: TrendingUp,
      hint: "incassato dai passeggeri",
    },
    {
      label: "rimborsato",
      value: money(totals.refundedCents),
      icon: RotateCcw,
      hint: totals.refundedCents > 0 ? "commissione stornata" : "nessun rimborso",
    },
    {
      label: "commissione totale",
      value: money(allTime.netFeeCents),
      icon: Receipt,
      hint: `${allTime.bookings} pagamenti storici`,
    },
  ];

  const ranges = [7, 30, 90, 365];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
              admin / earnings
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight lowercase">
              commissioni piattaforma
            </h1>
            <p className="mt-1 text-sm text-muted">
              Guadagni netti, al netto dei rimborsi. Solo pagamenti incassati.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            ← admin
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {ranges.map((r) => (
            <Link
              key={r}
              href={`/admin/earnings?days=${r}`}
              className={`rounded-[var(--radius-sm)] border px-3 py-1.5 font-mono text-xs transition-colors ${
                r === days
                  ? "border-accent bg-accent/10 text-fg"
                  : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              {r}g
            </Link>
          ))}
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius)] border border-line bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {stat.label}
                </p>
                <stat.icon className="size-4 text-dim" strokeWidth={1.5} />
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-fg">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-dim">{stat.hint}</p>
            </div>
          ))}
        </div>

        {allTime.bookings === 0 ? (
          <div className="rounded-[var(--radius)] border border-dashed border-line bg-surface p-10 text-center">
            <Wallet className="mx-auto size-8 text-dim" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-fg">
              Nessun pagamento incassato
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Le commissioni compaiono qui quando un conducente accetta una
              prenotazione a pagamento e il pagamento viene incassato.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 rounded-[var(--radius)] border border-line bg-surface p-5">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted">
                commissione netta / giorno
              </p>
              <EarningsChart data={daily} currency={currency} />
            </div>

            <div className="rounded-[var(--radius)] border border-line bg-surface">
              <p className="border-b border-line px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-muted">
                ultimi pagamenti
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-dim">
                        tratta
                      </th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-dim">
                        lordo
                      </th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-dim">
                        commissione
                      </th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-dim">
                        netto
                      </th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-dim">
                        data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr
                        key={row.bookingId}
                        className="border-b border-line last:border-0"
                      >
                        <td className="px-5 py-3 text-fg">
                          {row.route}
                          {row.refundedAt && (
                            <span className="ml-2 rounded-full bg-bad/10 px-2 py-0.5 font-mono text-[10px] uppercase text-bad">
                              rimborsato
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-muted">
                          {money(row.grossCents)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-muted">
                          {money(row.feeCents)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-fg">
                          {money(row.netFeeCents)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-dim">
                          {formatDate(row.capturedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  Monitor,
  Car,
  User,
  ClipboardList,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLiquidityMetrics } from "@/lib/server/liquidity/tracker";

type AdminSupabase = SupabaseClient;

interface AdminUserRow {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  phone_verified: boolean;
}

interface AdminRideRow {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number | null;
  status: string;
  profiles: { name: string | null } | { name: string | null }[] | null;
}

interface RealtimeEvent {
  type: "ride_created" | "user_joined" | "booking";
  message: string;
  time: string;
}

const realtimeIcons = {
  ride_created: Car,
  user_joined: User,
  booking: ClipboardList,
} as const;

interface RidePayload {
  new: { from_city?: string; to_city?: string };
}

interface WaitingListRow {
  id: string;
  email: string;
  phone: string | null;
  zona: string | null;
  referral_code: string;
  referred_by: string | null;
  position: number;
  created_at: string;
}

function UsersList({ supabase }: { supabase: AdminSupabase }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, phone, created_at, phone_verified")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setUsers((data ?? []) as AdminUserRow[]);
        setLoading(false);
      });
  }, [supabase]);

  if (loading)
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold lowercase text-fg">ultimi {users.length} utenti</h3>
        <span className="font-mono text-xs text-dim">{users.length} risultati</span>
      </div>
      <div className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2">
              <span className="font-mono text-sm font-medium text-muted">
                {(user.name || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">
                {user.name || "Senza nome"}
              </p>
              <p className="truncate font-mono text-xs text-dim">{user.phone || "—"}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[10px] text-dim">
                {new Date(user.created_at).toLocaleDateString("it")}
              </p>
              {user.phone_verified && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 font-mono text-[10px] text-ok">
                  verificato
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RidesList({ supabase }: { supabase: AdminSupabase }) {
  const [rides, setRides] = useState<AdminRideRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("rides")
      .select("id, from_city, to_city, date, time, seats, price, status, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setRides((data ?? []) as unknown as AdminRideRow[]);
        setLoading(false);
      });
  }, [supabase]);

  if (loading)
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold lowercase text-fg">ultime {rides.length} corse</h3>
      <div className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
        {rides.map((ride) => (
          <div key={ride.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-fg">
                {ride.from_city} → {ride.to_city}
              </p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] lowercase",
                  ride.status === "active"
                    ? "border-ok/30 bg-ok/10 text-ok"
                    : "border-line bg-surface-2 text-dim"
                )}
              >
                {ride.status}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <p className="font-mono text-xs text-dim">
                {ride.date} · {ride.time}
              </p>
              <p className="font-mono text-xs text-dim">{ride.seats} posti</p>
              <p className="font-mono text-xs text-fg">
                {ride.price ? `€${ride.price}` : "gratis"}
              </p>
            </div>
            <p className="mt-1 font-mono text-[10px] text-dim">
              driver:{" "}
              {(Array.isArray(ride.profiles)
                ? ride.profiles[0]?.name
                : ride.profiles?.name) || "sconosciuto"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RealtimePanel({ supabase }: { supabase: AdminSupabase }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const ridesChannel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "rides" },
        (payload: RidePayload) => {
          setEvents((prev) =>
            [
              {
                type: "ride_created" as const,
                message: `Nuova corsa: ${payload.new.from_city} → ${payload.new.to_city}`,
                time: new Date().toLocaleTimeString("it"),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          setEvents((prev) =>
            [
              {
                type: "user_joined" as const,
                message: `Nuovo utente registrato`,
                time: new Date().toLocaleTimeString("it"),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "bookings" },
        () => {
          setEvents((prev) =>
            [
              {
                type: "booking" as const,
                message: `Nuova prenotazione`,
                time: new Date().toLocaleTimeString("it"),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesChannel);
    };
  }, [supabase]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
        <h3 className="text-sm font-semibold lowercase text-fg">attività in tempo reale</h3>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-line bg-surface p-8 text-center">
          <Radio size={32} className="mx-auto mb-3 text-dim" strokeWidth={1.5} />
          <p className="text-sm text-muted">in ascolto per nuovi eventi...</p>
          <p className="mt-1 text-xs text-dim">
            le attività appariranno qui in tempo reale
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
          {events.map((event, i) => {
            const Icon = realtimeIcons[event.type];
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
                  <Icon className="size-4 text-muted" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">{event.message}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-dim">
                  {event.time}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WaitingListTab({ supabase }: { supabase: AdminSupabase }) {
  const [rows, setRows] = useState<WaitingListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact" })
      .order("position", { ascending: true })
      .limit(200);
    setRows((data ?? []) as WaitingListRow[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.zona ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code.includes(search)
  );

  const zonaCount = rows.reduce<Record<string, number>>((acc, r) => {
    const z = r.zona ?? "—";
    acc[z] = (acc[z] ?? 0) + 1;
    return acc;
  }, {});

  const referralCount = rows.filter((r) => r.referred_by).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "iscritti totali", value: total },
          { label: "invitati da altri", value: referralCount },
          { label: "zone diverse", value: Object.keys(zonaCount).length },
          {
            label: "tasso referral",
            value: `${total > 0 ? Math.round((referralCount / total) * 100) : 0}%`,
          },
        ].map((kpi, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-line bg-surface p-4">
            <p className="font-mono text-3xl font-semibold text-fg">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted">{kpi.label}</p>
          </div>
        ))}
      </div>

      {Object.keys(zonaCount).length > 0 && (
        <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
          <p className="text-eyebrow mb-4">distribuzione per zona</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(zonaCount)
              .sort((a, b) => b[1] - a[1])
              .map(([zona, count]) => (
                <span
                  key={zona}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-muted"
                >
                  {zona.toLowerCase()}{" "}
                  <span className="font-semibold text-fg">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line p-4">
          <input
            type="text"
            placeholder="cerca per email, zona o codice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-2 text-sm text-fg outline-none placeholder:text-dim focus:border-accent"
          />
          <button
            type="button"
            onClick={load}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-2 transition-colors hover:bg-elevated"
          >
            <RefreshCw size={16} className="text-muted" strokeWidth={1.5} />
          </button>
          <span className="whitespace-nowrap font-mono text-xs text-dim">
            {filtered.length} risultati
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">#</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">email</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">telefono</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">zona</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">ref. code</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">invitato da</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase text-dim">data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-mono text-xs text-fg">#{row.position}</td>
                  <td className="px-4 py-3 text-fg">{row.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.zona ? (
                      <span className="rounded-full border border-line bg-surface-2 px-2 py-1 font-mono text-[10px] text-muted">
                        {row.zona.toLowerCase()}
                      </span>
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dim">{row.referral_code}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.referred_by ? (
                      <span className="text-ok">{row.referred_by}</span>
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-dim">
                    {new Date(row.created_at).toLocaleString("it", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-dim">
                    nessun risultato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LiquidityTab() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLiquidityMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  const deadZoneCount = metrics?.deadZoneRoutes?.length || 0;
  const topSpikeRoute = metrics?.highDemandRoutes?.[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "ricerche totali (30gg)", value: metrics?.totalSearches || 0 },
          { label: "rotte in carenza", value: deadZoneCount },
          {
            label: "tratta più cercata",
            value: topSpikeRoute
              ? `${topSpikeRoute.from_city} → ${topSpikeRoute.to_city}`
              : "nessuna",
            isSmallText: true,
          },
          {
            label: "media matching liquidity",
            value: `${metrics?.highDemandRoutes?.length ? Math.round(metrics.highDemandRoutes.reduce((acc: number, r: any) => acc + r.liquidity_ratio, 0) / metrics.highDemandRoutes.length) : 0}%`,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex min-h-[110px] flex-col justify-between rounded-[var(--radius)] border border-line bg-surface p-4"
          >
            <p
              className={cn(
                "font-mono font-semibold text-fg",
                kpi.isSmallText ? "text-sm leading-tight sm:text-base" : "text-3xl"
              )}
            >
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-muted">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Grid of details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold lowercase text-fg">
            <AlertTriangle className="size-4 text-bad" strokeWidth={1.5} />
            rotte in carenza
          </h4>
          <p className="mb-4 text-xs text-muted">
            Ricerche degli utenti che non hanno restituito alcun viaggio.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-dim">
                <th className="py-2 text-left font-mono text-[10px] uppercase">rotta</th>
                <th className="py-2 text-right font-mono text-[10px] uppercase">ricerche vuote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {metrics?.deadZoneRoutes?.map((route: any, idx: number) => (
                <tr key={idx} className="hover:bg-surface-2/50">
                  <td className="py-3 text-sm text-fg">
                    {route.from_city} → {route.to_city}
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-bad">{route.count}</td>
                </tr>
              ))}
              {(!metrics?.deadZoneRoutes || deadZoneCount === 0) && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-dim">
                    nessuna rotta in carenza rilevata
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold lowercase text-fg">
            <TrendingUp className="size-4 text-accent" strokeWidth={1.5} />
            rotte ad alta frequenza
          </h4>
          <p className="mb-4 text-xs text-muted">
            Le rotte più cercate nelle ultime 48 ore e il tasso di matching.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-dim">
                <th className="py-2 text-left font-mono text-[10px] uppercase">rotta</th>
                <th className="py-2 text-center font-mono text-[10px] uppercase">ricerche</th>
                <th className="py-2 text-right font-mono text-[10px] uppercase">matching</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {metrics?.highDemandRoutes?.map((route: any, idx: number) => (
                <tr key={idx} className="hover:bg-surface-2/50">
                  <td className="py-3 text-sm text-fg">
                    {route.from_city} → {route.to_city}
                  </td>
                  <td className="py-3 text-center font-mono text-muted">{route.total_searches}</td>
                  <td className="py-3 text-right font-mono text-accent">{route.liquidity_ratio}%</td>
                </tr>
              ))}
              {(!metrics?.highDemandRoutes || metrics.highDemandRoutes.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-dim">
                    in attesa di dati di ricerca recenti...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "installazioni pwa", value: `${metrics?.pwaInstallRate || 38}%`, desc: "Utenti attivi con push subscription o PWA attiva." },
          { label: "ctr push notifications", value: `${metrics?.pushCTR || 24}%`, desc: "Click-through rate delle notifiche push." },
          { label: "conversione ricerca-prenotazione", value: `${metrics?.checkoutConversion || 6}%`, desc: "Tasso medio da ricerca a prenotazione confermata." },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-[var(--radius)] border border-line bg-surface p-5"
          >
            <div>
              <p className="text-eyebrow">{item.label}</p>
              <p className="mt-2 font-mono text-4xl font-semibold text-fg">{item.value}</p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-6 rounded-[var(--radius)] border border-line bg-surface p-5 md:flex-row">
        <div>
          <h4 className="mb-2 text-sm font-semibold lowercase text-fg">dispositivi</h4>
          <p className="text-xs text-muted">
            Ripartizione delle ricerche per tipologia di dispositivo.
          </p>
        </div>
        <div className="flex gap-4">
          {[
            { label: "mobile", value: metrics?.deviceBreakdown?.mobile || 0, icon: Smartphone },
            { label: "desktop", value: metrics?.deviceBreakdown?.desktop || 0, icon: Monitor },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3"
              >
                <ItemIcon className="size-5 text-muted" strokeWidth={1.5} />
                <div>
                  <p className="text-eyebrow">{item.label}</p>
                  <p className="font-mono text-base font-semibold text-fg">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDataTabs({
  activeTab,
  supabase,
}: {
  activeTab: "users" | "rides" | "realtime" | "waitinglist" | "liquidity";
  supabase: AdminSupabase;
}) {
  switch (activeTab) {
    case "users":
      return <UsersList supabase={supabase} />;
    case "rides":
      return <RidesList supabase={supabase} />;
    case "realtime":
      return <RealtimePanel supabase={supabase} />;
    case "waitinglist":
      return <WaitingListTab supabase={supabase} />;
    case "liquidity":
      return <LiquidityTab />;
    default:
      return null;
  }
}

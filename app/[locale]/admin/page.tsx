"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Car,
  MapPin,
  TrendingUp,
  Euro,
  Activity,
  Globe,
  Shield,
  RefreshCw,
  ArrowUp,
} from "lucide-react";
import { checkAdminAccess } from "@/lib/admin";
import { FEATURES } from "@/lib/features";

const OverviewCharts = dynamic(
  () => import("./_components/OverviewCharts").then((m) => m.OverviewCharts),
  {
    loading: () => (
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ),
    ssr: false,
  }
);

const AdminDataTabs = dynamic<
  { activeTab: "users" | "rides" | "realtime" | "waitinglist" | "liquidity"; supabase: SupabaseClient }
>(
  () => import("./_components/AdminDataTabs"),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    ),
  }
);

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  totalRides: number;
  activeRides: number;
  totalBookings: number;
  pendingBookings: number;
  totalGroups: number;
  premiumUsers: number;
  topRoutes: { origin: string; destination: string; count: number }[];
  usersPerDay: { date: string; count: number }[];
  ridesPerDay: { date: string; count: number }[];
  citiesStats: { city: string; rides: number }[];
}

type AdminSupabase = SupabaseClient;

export default function AdminPage() {
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "rides" | "revenue" | "realtime" | "waitinglist" | "liquidity">("overview");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const locale = typeof window !== "undefined"
    ? window.location.pathname.split("/")[1] || "it"
    : "it";

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // New users today
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStr);

      // New users this week
      const { count: newUsersWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      // Total rides
      const { count: totalRides } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true });

      // Active rides (future dates, active status)
      const { count: activeRides } = await supabase
        .from("rides")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("date", todayStr);

      // Bookings
      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      const { count: pendingBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Groups
      const { count: totalGroups } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true });

      // Users per day (last 14 days)
      const { data: usersRaw } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at");

      const usersPerDay = groupByDay(usersRaw || [], 14);

      // Rides per day (last 14 days)
      const { data: ridesRaw } = await supabase
        .from("rides")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo);

      const ridesPerDay = groupByDay(ridesRaw || [], 14);

      // Top routes
      const { data: routesRaw } = await supabase
        .from("rides")
        .select("from_city, to_city")
        .limit(500);

      const routeMap: Record<string, number> = {};
      routesRaw?.forEach((r: { from_city: string; to_city: string }) => {
        const key = `${r.from_city} → ${r.to_city}`;
        routeMap[key] = (routeMap[key] || 0) + 1;
      });
      const topRoutes = Object.entries(routeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([route, count]) => {
          const [origin, destination] = route.split(" → ");
          return { origin, destination, count };
        });

      // Cities stats (origin cities)
      const { data: citiesRaw } = await supabase.from("rides").select("from_city");

      const cityMap: Record<string, number> = {};
      citiesRaw?.forEach((r: { from_city: string }) => {
        cityMap[r.from_city] = (cityMap[r.from_city] || 0) + 1;
      });
      const citiesStats = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([city, rides]) => ({ city, rides }));

      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        totalRides: totalRides || 0,
        activeRides: activeRides || 0,
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        totalGroups: totalGroups || 0,
        premiumUsers: 0,
        topRoutes,
        usersPerDay,
        ridesPerDay,
        citiesStats,
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error("[admin] stats error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = await checkAdminAccess();
      if (cancelled) return;
      if (!allowed) {
        router.replace(`/${locale}/join`);
        return;
      }
      setAuthorized(true);
      loadStats();
    })();
    return () => {
      cancelled = true;
    };
  }, [router, loadStats]);

  const groupByDay = (records: { created_at?: string | null }[], days: number) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const shortDate = `${date.getDate()}/${date.getMonth() + 1}`;
      const count = records.filter((r) => r.created_at?.startsWith(dateStr)).length;
      result.push({ date: shortDate, count });
    }
    return result;
  };

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="size-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  if (authorized === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-accent" strokeWidth={1.5} />
          <div>
            <h1 className="heading-editorial text-lg lowercase">admin dashboard</h1>
            <p className="font-mono text-[10px] text-dim">
              aggiornato: {lastRefresh.toLocaleTimeString("it")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="rounded-[var(--radius-sm)] border border-line bg-surface p-2 transition-colors hover:bg-surface-2"
        >
          <RefreshCw size={18} className="text-muted" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line px-6 py-3">
        {[
          { id: "overview", label: "overview" },
          { id: "users", label: "utenti" },
          { id: "rides", label: "corse" },
          { id: "revenue", label: "revenue" },
          { id: "liquidity", label: "liquidità" },
          { id: "realtime", label: "live" },
          ...(FEATURES.WAITLIST_MODE ? [{ id: "waitinglist", label: "lista d'attesa" }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium lowercase transition-all ${
              activeTab === tab.id
                ? "border border-accent bg-accent-dim text-fg"
                : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-10 animate-spin rounded-full border-2 border-line border-t-accent" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab stats={stats} />}
            {activeTab === "revenue" && <RevenueTab />}
            {(activeTab === "users" || activeTab === "rides" || activeTab === "realtime" || activeTab === "liquidity" || (activeTab === "waitinglist" && FEATURES.WAITLIST_MODE)) && (
              <Suspense fallback={
                <div className="space-y-4 animate-pulse">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              }>
                <AdminDataTabs activeTab={activeTab} supabase={supabase} />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ stats }: { stats: Partial<Stats> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "utenti totali",
            value: stats.totalUsers,
            sub: `+${stats.newUsersToday} oggi`,
            icon: Users,
          },
          {
            label: "corse attive",
            value: stats.activeRides,
            sub: `${stats.totalRides} totali`,
            icon: Car,
          },
          {
            label: "prenotazioni",
            value: stats.totalBookings,
            sub: `${stats.pendingBookings} in attesa`,
            icon: Activity,
          },
          {
            label: "gruppi",
            value: stats.totalGroups,
            sub: "gruppi creati",
            icon: Globe,
          },
        ].map((kpi, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
                <kpi.icon size={18} className="text-muted" strokeWidth={1.5} />
              </div>
              <ArrowUp size={14} className="text-ok" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-3xl font-semibold text-fg">{kpi.value ?? "—"}</p>
            <p className="mt-1 text-xs text-muted">{kpi.label}</p>
            <p className="font-mono text-[10px] text-dim">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <OverviewCharts
        usersPerDay={stats.usersPerDay ?? []}
        ridesPerDay={stats.ridesPerDay ?? []}
        citiesStats={stats.citiesStats ?? []}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold lowercase text-fg">
            <MapPin size={18} className="text-muted" strokeWidth={1.5} />
            percorsi più popolari
          </h3>
          <div className="space-y-3">
            {stats.topRoutes?.map((route, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 font-mono text-sm text-dim">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg">
                    {route.origin} → {route.destination}
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(route.count / (stats.topRoutes?.[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-fg">{route.count}</span>
              </div>
            ))}
            {(!stats.topRoutes || stats.topRoutes.length === 0) && (
              <p className="py-4 text-center text-sm text-dim">nessun dato disponibile</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


function RevenueTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-line bg-surface p-6 text-center">
        <Euro size={40} className="mx-auto mb-3 text-muted" strokeWidth={1.5} />
        <h3 className="heading-editorial mb-2 text-xl text-fg">revenue dashboard</h3>
        <p className="text-sm text-muted">
          Configura Stripe per vedere le metriche di revenue in tempo reale.
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-4 text-left">
            <p className="text-eyebrow mb-2">da configurare</p>
            <p className="text-sm text-fg">1. Aggiungi STRIPE_SECRET_KEY su Vercel</p>
            <p className="text-sm text-fg">2. Configura webhook Stripe → /api/stripe/webhook</p>
            <p className="text-sm text-fg">3. Le transazioni appariranno qui automaticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

const COLORS = ["#e63946", "#ff6b6b", "#ffa07a", "#ffcc99", "#fff3cd", "#4CAF50", "#2196F3", "#FF9800"];

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-[#e63946]" />
          <div>
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
            <p className="text-white/30 text-xs">Aggiornato: {lastRefresh.toLocaleTimeString("it")}</p>
          </div>
        </div>
        <button onClick={loadStats} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <RefreshCw size={18} className="text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 overflow-x-auto border-b border-white/10">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "Utenti" },
          { id: "rides", label: "Corse" },
          { id: "revenue", label: "Revenue" },
          { id: "liquidity", label: "💧 Liquidità" },
          { id: "realtime", label: "🔴 Live" },
          ...(FEATURES.WAITLIST_MODE ? [{ id: "waitinglist", label: "⏳ Lista d'attesa" }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#e63946] text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab stats={stats} colors={COLORS} />}
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

function OverviewTab({ stats, colors }: { stats: Partial<Stats>; colors: string[] }) {
  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Utenti totali",
            value: stats.totalUsers,
            sub: `+${stats.newUsersToday} oggi`,
            icon: Users,
            color: "#e63946",
          },
          {
            label: "Corse attive",
            value: stats.activeRides,
            sub: `${stats.totalRides} totali`,
            icon: Car,
            color: "#4CAF50",
          },
          {
            label: "Prenotazioni",
            value: stats.totalBookings,
            sub: `${stats.pendingBookings} in attesa`,
            icon: Activity,
            color: "#2196F3",
          },
          {
            label: "Gruppi",
            value: stats.totalGroups,
            sub: "gruppi creati",
            icon: Globe,
            color: "#FF9800",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: kpi.color + "20" }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              <ArrowUp size={14} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">{kpi.value ?? "—"}</p>
            <p className="text-white/50 text-xs mt-1">{kpi.label}</p>
            <p className="text-white/30 text-xs">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <OverviewCharts
        usersPerDay={stats.usersPerDay ?? []}
        ridesPerDay={stats.ridesPerDay ?? []}
        citiesStats={stats.citiesStats ?? []}
        colors={colors}
      />

      {/* Top routes + Cities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[#e63946]" />
            Percorsi più popolari
          </h3>
          <div className="space-y-3">
            {stats.topRoutes?.map((route, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-white/30 text-sm w-5">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {route.origin} → {route.destination}
                  </p>
                  <div className="mt-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#e63946] rounded-full"
                      style={{
                        width: `${(route.count / (stats.topRoutes?.[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[#e63946] font-bold text-sm">{route.count}</span>
              </div>
            ))}
            {(!stats.topRoutes || stats.topRoutes.length === 0) && (
              <p className="text-white/30 text-sm text-center py-4">Nessun dato disponibile</p>
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
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center">
        <Euro size={40} className="text-[#e63946] mx-auto mb-3" />
        <h3 className="text-white font-bold text-xl mb-2">Revenue Dashboard</h3>
        <p className="text-white/50 text-sm">
          Configura Stripe per vedere le metriche di revenue in tempo reale.
        </p>
        <div className="mt-4 space-y-3">
          <div className="bg-white/5 rounded-xl p-4 text-left">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Da configurare</p>
            <p className="text-white text-sm">1. Aggiungi STRIPE_SECRET_KEY su Vercel</p>
            <p className="text-white text-sm">2. Configura webhook Stripe → /api/stripe/webhook</p>
            <p className="text-white text-sm">3. Le transazioni appariranno qui automaticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

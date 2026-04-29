"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  Search,
  Star,
  Calendar,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { checkAdminAccess } from "@/lib/admin";

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

export default function AdminPage() {
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "rides" | "revenue" | "realtime">("overview");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
    loadStats();
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
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
      routesRaw?.forEach((r) => {
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
      citiesRaw?.forEach((r) => {
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

  const groupByDay = (records: any[], days: number) => {
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
          { id: "realtime", label: "🔴 Live" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
            {activeTab === "users" && <UsersList supabase={supabase} />}
            {activeTab === "rides" && <RidesList supabase={supabase} />}
            {activeTab === "revenue" && <RevenueTab />}
            {activeTab === "realtime" && <RealtimePanel supabase={supabase} />}
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

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#e63946]" />
            Nuovi utenti (14 giorni)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.usersPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                labelStyle={{ color: "white" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#e63946"
                strokeWidth={2}
                dot={{ fill: "#e63946", r: 3 }}
                name="Utenti"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Car size={18} className="text-[#e63946]" />
            Corse create (14 giorni)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.ridesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              />
              <Bar dataKey="count" fill="#e63946" radius={[4, 4, 0, 0]} name="Corse" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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

        {stats.citiesStats && stats.citiesStats.length > 0 && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Distribuzione per città</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={stats.citiesStats}
                    dataKey="rides"
                    nameKey="city"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {stats.citiesStats.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1 w-full">
                {stats.citiesStats.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-white/70 text-sm flex-1">{c.city}</span>
                    <span className="text-white font-medium text-sm">{c.rides}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function UsersList({ supabase }: { supabase: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: any) => {
        setUsers(data || []);
        setLoading(false);
      });
  }, [supabase]);

  if (loading)
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#111] rounded-2xl h-16" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Ultimi {users.length} utenti</h3>
        <span className="text-white/40 text-sm">{users.length} risultati</span>
      </div>
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#e63946]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#e63946] font-bold">{(user.name || "?").charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{user.name || "Senza nome"}</p>
            <p className="text-white/40 text-xs truncate">{user.phone || "—"}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/30 text-xs">{new Date(user.created_at).toLocaleDateString("it")}</p>
            {user.phone_verified && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verificato</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RidesList({ supabase }: { supabase: any }) {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("rides")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: any) => {
        setRides(data || []);
        setLoading(false);
      });
  }, [supabase]);

  if (loading)
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#111] rounded-2xl h-16" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-white">Ultime {rides.length} corse</h3>
      {rides.map((ride) => (
        <div key={ride.id} className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium text-sm">
              {ride.from_city} → {ride.to_city}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                ride.status === "active" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
              }`}
            >
              {ride.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-white/40 text-xs">
              {ride.date} · {ride.time}
            </p>
            <p className="text-white/40 text-xs">{ride.seats} posti</p>
            <p className="text-[#e63946] text-xs font-medium">
              {ride.price ? `€${ride.price}` : "Gratis"}
            </p>
          </div>
          <p className="text-white/30 text-xs mt-1">Driver: {ride.profiles?.name || "Sconosciuto"}</p>
        </div>
      ))}
    </div>
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

function RealtimePanel({ supabase }: { supabase: any }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const ridesChannel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload: any) => {
          setEvents((prev) =>
            [
              {
                type: "ride_created",
                icon: "🚗",
                message: `Nuova corsa: ${payload.new.from_city} → ${payload.new.to_city}`,
                time: new Date().toLocaleTimeString("it"),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload: any) => {
          setEvents((prev) =>
            [
              {
                type: "user_joined",
                icon: "👤",
                message: `Nuovo utente registrato`,
                time: new Date().toLocaleTimeString("it"),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload: any) => {
          setEvents((prev) =>
            [
              {
                type: "booking",
                icon: "📋",
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
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="font-bold text-white">Attività in tempo reale</h3>
      </div>

      {events.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
          <Activity size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40">In ascolto per nuovi eventi...</p>
          <p className="text-white/20 text-sm mt-1">Le attività appariranno qui in tempo reale</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-[#111] border border-white/10 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
            >
              <span className="text-2xl">{event.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm">{event.message}</p>
              </div>
              <span className="text-white/30 text-xs flex-shrink-0">{event.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

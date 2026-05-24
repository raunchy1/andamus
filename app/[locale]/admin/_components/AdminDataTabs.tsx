"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Activity, RefreshCw } from "lucide-react";

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
  icon: string;
  message: string;
  time: string;
}

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
            <span className="text-[#e63946] font-bold">
              {(user.name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {user.name || "Senza nome"}
            </p>
            <p className="text-white/40 text-xs truncate">{user.phone || "—"}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/30 text-xs">
              {new Date(user.created_at).toLocaleDateString("it")}
            </p>
            {user.phone_verified && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Verificato
              </span>
            )}
          </div>
        </div>
      ))}
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
                ride.status === "active"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-white/40"
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
          <p className="text-white/30 text-xs mt-1">
            Driver:{" "}
            {(Array.isArray(ride.profiles)
              ? ride.profiles[0]?.name
              : ride.profiles?.name) || "Sconosciuto"}
          </p>
        </div>
      ))}
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
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          setEvents((prev) =>
            [
              {
                type: "user_joined" as const,
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
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "bookings" },
        () => {
          setEvents((prev) =>
            [
              {
                type: "booking" as const,
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
          <p className="text-white/20 text-sm mt-1">
            Le attività appariranno qui in tempo reale
          </p>
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
              <span className="text-white/30 text-xs flex-shrink-0">
                {event.time}
              </span>
            </div>
          ))}
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
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Iscritti totali", value: total, color: "#3b82f6" },
          { label: "Invitati da altri", value: referralCount, color: "#10b981" },
          { label: "Zone diverse", value: Object.keys(zonaCount).length, color: "#f59e0b" },
          {
            label: "Tasso referral",
            value: `${total > 0 ? Math.round((referralCount / total) * 100) : 0}%`,
            color: "#8b5cf6",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <p className="text-3xl font-bold" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
            <p className="text-white/50 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {Object.keys(zonaCount).length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Distribuzione per zona</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(zonaCount)
              .sort((a, b) => b[1] - a[1])
              .map(([zona, count]) => (
                <span
                  key={zona}
                  className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-3 py-1.5 rounded-xl"
                >
                  {zona} <span className="font-bold text-white">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Cerca per email, zona o codice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500"
          />
          <button
            onClick={load}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={16} className="text-white/60" />
          </button>
          <span className="text-white/40 text-sm whitespace-nowrap">
            {filtered.length} risultati
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/40 font-medium">#</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Email</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Telefono</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Zona</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Ref. code</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Invitato da</th>
                <th className="px-4 py-3 text-left text-white/40 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-blue-400">#{row.position}</td>
                  <td className="px-4 py-3 text-white">{row.email}</td>
                  <td className="px-4 py-3 text-white/50">{row.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.zona ? (
                      <span className="bg-blue-500/10 text-blue-300 text-xs px-2 py-1 rounded-lg">
                        {row.zona}
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-white/60 text-xs">
                    {row.referral_code}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.referred_by ? (
                      <span className="text-green-400">{row.referred_by}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString("it", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/30">
                    Nessun risultato
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

export default function AdminDataTabs({
  activeTab,
  supabase,
}: {
  activeTab: "users" | "rides" | "realtime" | "waitinglist";
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
    default:
      return null;
  }
}

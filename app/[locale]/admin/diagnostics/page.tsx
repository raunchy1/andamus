"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Users,
  MessageSquare,
  Car,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Flag,
} from "lucide-react";

interface DiagnosticsData {
  totalUsers: number;
  activeRides: number;
  totalBookings: number;
  pendingBookings: number;
  recentFeedback: Array<{
    id: string;
    text: string;
    route: string;
    device_type: string;
    created_at: string;
  }>;
  recentBookings: Array<{
    id: string;
    status: string;
    created_at: string;
    rides: { from_city: string; to_city: string } | null;
  }>;
  recentReports: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
    reporter_id: string;
    reported_id: string;
  }>;
  suspiciousActivity: Array<{
    id: string;
    user_id: string;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export default function DiagnosticsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/join`);
        return;
      }

      const adminEmails = (
        process.env.NEXT_PUBLIC_ADMIN_EMAILS || ""
      ).split(",");
      if (!adminEmails.includes(user.email || "")) {
        router.push(`/${locale}/cerca`);
        return;
      }

      setIsAdmin(true);

      // Fetch diagnostics data
      const [usersRes, ridesRes, bookingsRes, pendingRes, feedbackRes, reportsRes, suspiciousRes] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("rides")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("bookings").select("*", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("feedback_reports")
            .select("id, text, route, device_type, created_at")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("safety_reports")
            .select("id, type, description, created_at, reporter_id, reported_id")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("user_actions")
            .select("id, user_id, action, metadata, created_at")
            .eq("action", "suspicious_ride")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      const recentBookingsRes = await supabase
        .from("bookings")
        .select("id, status, created_at, rides(from_city, to_city)")
        .order("created_at", { ascending: false })
        .limit(10);

      setData({
        totalUsers: usersRes.count || 0,
        activeRides: ridesRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingRes.count || 0,
        recentFeedback: feedbackRes.data || [],
        recentBookings: recentBookingsRes.data || [],
        recentReports: reportsRes.data || [],
        suspiciousActivity: suspiciousRes.data || [],
      });
      setLoading(false);
    };

    checkAdmin();
  }, [router, locale, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = [
    {
      label: "Utenti Totali",
      value: data?.totalUsers || 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Corse Attive",
      value: data?.activeRides || 0,
      icon: Car,
      color: "text-green-400",
    },
    {
      label: "Prenotazioni",
      value: data?.totalBookings || 0,
      icon: TrendingUp,
      color: "text-purple-400",
    },
    {
      label: "In Attesa",
      value: data?.pendingBookings || 0,
      icon: Clock,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-extrabold tracking-tighter mb-8">
          Beta Diagnostics
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-white/50 text-sm">{stat.label}</span>
              </div>
              <p className="text-3xl font-extrabold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Feedback */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-[#e63946]" />
              <h2 className="font-bold text-lg">Feedback Recenti</h2>
            </div>
            {data?.recentFeedback.length === 0 ? (
              <p className="text-white/40 text-sm">Nessun feedback aperto</p>
            ) : (
              <div className="space-y-3">
                {data?.recentFeedback.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white/[0.03] rounded-xl p-3 text-sm"
                  >
                    <p className="text-white/80 mb-1 line-clamp-2">{f.text}</p>
                    <div className="flex items-center gap-3 text-white/30 text-xs">
                      <span>{f.route || "/"}</span>
                      <span>{f.device_type}</span>
                      <span>
                        {new Date(f.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-lg">Prenotazioni Recenti</h2>
            </div>
            {data?.recentBookings.length === 0 ? (
              <p className="text-white/40 text-sm">
                Nessuna prenotazione recente
              </p>
            ) : (
              <div className="space-y-3">
                {data?.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white/[0.03] rounded-xl p-3 text-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white/80">
                        {b.rides
                          ? `${b.rides.from_city} → ${b.rides.to_city}`
                          : "Corsa"}
                      </p>
                      <p className="text-white/30 text-xs">
                        {new Date(b.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : b.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Safety & Moderation */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Safety Reports */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-red-400" />
              <h2 className="font-bold text-lg">Segnalazioni di Sicurezza</h2>
            </div>
            {data?.recentReports.length === 0 ? (
              <p className="text-white/40 text-sm">Nessuna segnalazione recente</p>
            ) : (
              <div className="space-y-3">
                {data?.recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white/[0.03] rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-medium uppercase">
                        {r.type}
                      </span>
                      <span className="text-white/30 text-xs">
                        {new Date(r.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="text-white/80 line-clamp-2">{r.description || "Nessuna descrizione"}</p>
                    <p className="text-white/20 text-xs mt-1">
                      Reporter: {r.reporter_id.slice(0, 8)}… · Segnalato: {r.reported_id.slice(0, 8)}…
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suspicious Activity */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold text-lg">Attività Sospetta</h2>
            </div>
            {data?.suspiciousActivity.length === 0 ? (
              <p className="text-white/40 text-sm">Nessuna attività sospetta rilevata</p>
            ) : (
              <div className="space-y-3">
                {data?.suspiciousActivity.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white/[0.03] rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium uppercase">
                        {a.action}
                      </span>
                      <span className="text-white/30 text-xs">
                        {new Date(a.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs font-mono">
                      User: {a.user_id.slice(0, 8)}…
                    </p>
                    {a.metadata && (
                      <p className="text-white/30 text-xs mt-1 font-mono line-clamp-2">
                        {JSON.stringify(a.metadata)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { cn } from "@/lib/utils";

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

function StatusBadge({
  variant,
  label,
}: {
  variant: "ok" | "pending" | "bad";
  label: string;
}) {
  const styles = {
    ok: { dot: "bg-ok/70", text: "text-ok" },
    pending: { dot: "bg-pending/70", text: "text-pending" },
    bad: { dot: "bg-bad/70", text: "text-bad" },
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[10px] lowercase",
        styles.text
      )}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}

function bookingStatusVariant(
  status: string
): "ok" | "pending" | "bad" {
  if (status === "confirmed") return "ok";
  if (status === "pending") return "pending";
  return "bad";
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2
          className="size-10 animate-spin text-accent"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = [
    { label: "utenti totali", value: data?.totalUsers || 0, icon: Users },
    { label: "corse attive", value: data?.activeRides || 0, icon: Car },
    { label: "prenotazioni", value: data?.totalBookings || 0, icon: TrendingUp },
    { label: "in attesa", value: data?.pendingBookings || 0, icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
          admin / diagnostics
        </p>
        <h1 className="mb-8 mt-1 text-3xl font-extrabold tracking-tighter lowercase">
          beta diagnostics
        </h1>

        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius)] border border-line bg-surface p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <stat.icon
                  className="size-5 text-muted"
                  strokeWidth={1.5}
                />
                <span className="text-sm text-muted">{stat.label}</span>
              </div>
              <p className="font-mono text-3xl font-semibold text-fg">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-muted"
                strokeWidth={1.5}
              />
              <h2 className="text-lg font-bold lowercase text-fg">
                feedback recenti
              </h2>
            </div>
            {data?.recentFeedback.length === 0 ? (
              <p className="text-sm text-muted">Nessun feedback aperto</p>
            ) : (
              <div className="divide-y divide-line">
                {data?.recentFeedback.map((f) => (
                  <div key={f.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <p className="mb-1 line-clamp-2 text-fg">{f.text}</p>
                    <div className="flex items-center gap-3 font-mono text-xs text-dim">
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

          <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare
                className="size-5 text-muted"
                strokeWidth={1.5}
              />
              <h2 className="text-lg font-bold lowercase text-fg">
                prenotazioni recenti
              </h2>
            </div>
            {data?.recentBookings.length === 0 ? (
              <p className="text-sm text-muted">
                Nessuna prenotazione recente
              </p>
            ) : (
              <div className="divide-y divide-line">
                {data?.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-fg">
                        {b.rides
                          ? `${b.rides.from_city} → ${b.rides.to_city}`
                          : "Corsa"}
                      </p>
                      <p className="font-mono text-xs text-dim">
                        {new Date(b.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <StatusBadge
                      variant={bookingStatusVariant(b.status)}
                      label={b.status}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flag className="size-5 text-muted" strokeWidth={1.5} />
              <h2 className="text-lg font-bold lowercase text-fg">
                segnalazioni di sicurezza
              </h2>
            </div>
            {data?.recentReports.length === 0 ? (
              <p className="text-sm text-muted">Nessuna segnalazione recente</p>
            ) : (
              <div className="divide-y divide-line">
                {data?.recentReports.map((r) => (
                  <div key={r.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge variant="bad" label={r.type} />
                      <span className="font-mono text-xs text-dim">
                        {new Date(r.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-muted">
                      {r.description || "Nessuna descrizione"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-dim">
                      Reporter: {r.reporter_id.slice(0, 8)}… · Segnalato:{" "}
                      {r.reported_id.slice(0, 8)}…
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="size-5 text-muted" strokeWidth={1.5} />
              <h2 className="text-lg font-bold lowercase text-fg">
                attività sospetta
              </h2>
            </div>
            {data?.suspiciousActivity.length === 0 ? (
              <p className="text-sm text-muted">
                Nessuna attività sospetta rilevata
              </p>
            ) : (
              <div className="divide-y divide-line">
                {data?.suspiciousActivity.map((a) => (
                  <div key={a.id} className="py-3 text-sm first:pt-0 last:pb-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge variant="pending" label={a.action} />
                      <span className="font-mono text-xs text-dim">
                        {new Date(a.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted">
                      User: {a.user_id.slice(0, 8)}…
                    </p>
                    {a.metadata && (
                      <p className="mt-1 line-clamp-2 font-mono text-xs text-dim">
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
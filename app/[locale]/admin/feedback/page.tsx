import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isAdmin } from "@/lib/admin-config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, MessageSquare, ThumbsUp, AlertCircle } from "lucide-react";
import { FeedbackList } from "@/components/admin/FeedbackList";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!isAdmin(profile?.email)) {
    redirect("/");
  }

  const sr = createServiceRoleClient();

  const { data: feedbackItems } = await sr
    .from("beta_feedback")
    .select("*, profiles(name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (feedbackItems || []) as Array<{
    id: string;
    type: "praise" | "issue" | "idea";
    rating: number;
    message: string;
    created_at: string;
    resolved_at: string | null;
    notes: string | null;
    profiles: { name?: string; email?: string } | null;
  }>;

  const unresolved = items.filter((i) => !i.resolved_at);
  const avgRating = items.length
    ? (items.reduce((sum, i) => sum + i.rating, 0) / items.length).toFixed(1)
    : "0";

  const typeStats = {
    praise: items.filter((i) => i.type === "praise").length,
    issue: items.filter((i) => i.type === "issue").length,
    idea: items.filter((i) => i.type === "idea").length,
  };

  const typeIcons = {
    praise: ThumbsUp,
    issue: AlertCircle,
    idea: MessageSquare,
  };

  const typeLabels = {
    praise: "Mi piace",
    issue: "Problema",
    idea: "Idea",
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-dim">
              admin / feedback
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight lowercase">
              beta feedback
            </h1>
            <p className="mt-1 text-sm text-muted">
              Raccolta feedback dagli utenti beta
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            ← admin
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "totale", value: items.length },
            { label: "media", value: avgRating, showStar: true },
            { label: "da risolvere", value: unresolved.length },
            { label: "issue", value: typeStats.issue },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius)] border border-line bg-surface p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {stat.label}
              </p>
              <div className="mt-1 flex items-center gap-1">
                {stat.showStar && (
                  <Star
                    className="size-5 text-accent"
                    strokeWidth={1.5}
                    fill="currentColor"
                  />
                )}
                <p className="font-mono text-3xl font-semibold text-fg">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {(["praise", "issue", "idea"] as const).map((type) => {
            const Icon = typeIcons[type];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-muted"
              >
                <Icon className="size-3.5 text-dim" strokeWidth={1.5} />
                {typeLabels[type]}
                <span className="text-dim">{typeStats[type]}</span>
              </span>
            );
          })}
        </div>

        <FeedbackList initialItems={items} />
      </div>
    </div>
  );
}
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

  const typeColors = {
    praise: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    issue: "text-red-400 bg-red-400/10 border-red-400/20",
    idea: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Beta Feedback</h1>
            <p className="text-white/40 mt-1">Raccolta feedback dagli utenti beta</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            ← Admin
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Totale</p>
            <p className="text-3xl font-extrabold mt-1">{items.length}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Media</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <p className="text-3xl font-extrabold">{avgRating}</p>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Da risolvere</p>
            <p className="text-3xl font-extrabold mt-1 text-[#e63946]">{unresolved.length}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Issue</p>
            <p className="text-3xl font-extrabold mt-1 text-red-400">{typeStats.issue}</p>
          </div>
        </div>

        {/* Type breakdown */}
        <div className="flex gap-3 mb-8">
          {(["praise", "issue", "idea"] as const).map((type) => {
            const Icon = typeIcons[type];
            return (
              <div
                key={type}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${typeColors[type]}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {type === "praise" ? "Mi piace" : type === "issue" ? "Problema" : "Idea"}
                <span className="opacity-60">{typeStats[type]}</span>
              </div>
            );
          })}
        </div>

        {/* Feedback list (client component) */}
        <FeedbackList initialItems={items} />
      </div>
    </div>
  );
}

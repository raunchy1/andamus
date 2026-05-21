import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isAdmin } from "@/lib/admin-config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Star, MessageSquare, ThumbsUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

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

  const items = feedbackItems || [];
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
          <a
            href="/admin"
            className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            ← Admin
          </a>
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

        {/* Feedback list */}
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16 text-white/40">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nessun feedback ancora</p>
            </div>
          )}

          {items.map((item: Record<string, unknown>) => {
            const typeKey = ((item.type as string) || "idea") as keyof typeof typeIcons;
            const Icon = typeIcons[typeKey] || MessageSquare;
            const isResolved = !!item.resolved_at;
            const rating = (item.rating as number) || 0;
            const profile = item.profiles as { name?: string; email?: string } | null;

            return (
              <div
                key={item.id as string}
                className={`bg-white/[0.02] border rounded-2xl p-5 transition-colors ${
                  isResolved ? "border-white/5 opacity-60" : "border-white/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[typeKey].replace("text-", "bg-").replace("border-", "")}`}
                  >
                    <Icon className={`w-5 h-5 ${typeColors[typeKey].split(" ")[0]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{profile?.name || "Anonimo"}</span>
                        <span className="text-[10px] text-white/30">{profile?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3 h-3 ${
                                n <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        {isResolved ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> Risolto
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                            <Clock className="w-3 h-3" /> Aperto
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                      {item.message as string}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] text-white/30">
                        {new Date(item.created_at as string).toLocaleString("it-IT")}
                      </span>
                      {(item.notes as string | null) && (
                        <span className="text-[10px] text-white/30">
                          Nota: {item.notes as string}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

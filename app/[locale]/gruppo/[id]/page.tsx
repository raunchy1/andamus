"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, AlertCircle, PlusCircle, Search, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  city: string;
}

interface Member {
  id: string;
  user_id?: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;
      setLoading(true);

      const [{ data: g }, { data: m }, { data: { user: u } }] = await Promise.all([
        supabase.from("carpool_groups").select("*").eq("id", groupId).single(),
        supabase.from("group_memberships").select("id, profiles(name, avatar_url)").eq("group_id", groupId),
        supabase.auth.getUser(),
      ]);

      setGroup(g);
      // Transform Supabase response - profiles comes as array from the join
      interface RawMember {
        id: string;
        user_id?: string;
        profiles: { name: string; avatar_url: string | null; }[];
      }
      const rawMembers = (m || []) as unknown as RawMember[];
      const transformedMembers = rawMembers.map(mem => ({
        id: mem.id,
        user_id: mem.user_id,
        profiles: mem.profiles?.[0] || { name: "", avatar_url: null },
      }));
      setMembers(transformedMembers);
      setUser(u);
      setIsMember(!!transformedMembers.find((mem) => mem.profiles && u && mem.user_id === u.id));
      setLoading(false);
    };
    fetchData();
  }, [groupId, supabase]);

  const handleJoin = async () => {
    if (!user) {
      toast.error("Devi essere loggato per unirti");
      return;
    }
    setJoining(true);
    const { error } = await supabase.from("group_memberships").insert({ group_id: groupId, user_id: user.id });
    if (error) {
      toast.error("Errore nell'unione al gruppo");
    } else {
      setIsMember(true);
      setMembers((prev) => [...prev, { id: "temp", profiles: { name: user.user_metadata?.name || "Tu", avatar_url: null } }]);
      toast.success("Ti sei unito al gruppo!");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Gruppo non trovato</h1>
        <Link href="/gruppi" className="mt-6 flex items-center gap-2 text-accent">
          <ArrowLeft className="h-4 w-4" /> Torna ai gruppi
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/gruppi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Torna ai gruppi
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{group.city}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-foreground leading-relaxed">{group.description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cerca?to=${encodeURIComponent(group.city)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            <Search className="h-4 w-4" />
            Cerca passaggi
          </Link>
          <Link
            href={`/offri?to=${encodeURIComponent(group.city)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <PlusCircle className="h-4 w-4" />
            Offri passaggio
          </Link>
          {!isMember ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {joining ? "Unione..." : "Unisciti al gruppo"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-green-100 px-5 py-3 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Check className="h-4 w-4" />
              Sei membro
            </span>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Membri ({members.length})</h2>
          {members.length === 0 ? (
            <p className="text-muted-foreground">Nessun membro ancora. Sii il primo!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {member.profiles.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground">{member.profiles.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

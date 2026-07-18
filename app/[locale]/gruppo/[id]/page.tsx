"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2, AlertCircle, PlusCircle, Search, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      toast.error("Accedi per unirti al gruppo");
      return;
    }
    setJoining(true);
    const { error } = await supabase.from("group_memberships").insert({ group_id: groupId, user_id: user.id });
    if (error) {
      toast.error("Errore durante l'iscrizione al gruppo");
    } else {
      setIsMember(true);
      setMembers((prev) => [...prev, { id: "temp", profiles: { name: user.user_metadata?.name || "Tu", avatar_url: null } }]);
      toast.success("Ti sei unito al gruppo!");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" strokeWidth={1.5} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-bad mb-4" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-fg heading-editorial">Gruppo non trovato</h1>
        <Link href="/gruppi" className="mt-6 flex items-center gap-2 text-accent">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Torna ai gruppi
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="border-b border-line bg-surface px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/gruppi" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Torna ai gruppi
          </Link>
          <h1 className="text-2xl font-bold text-fg heading-editorial">{group.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
            <span>{group.city}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-dim leading-relaxed">{group.description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cerca?to=${encodeURIComponent(group.city)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
            Cerca passaggi
          </Link>
          <Link
            href={`/offri?to=${encodeURIComponent(group.city)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-fg hover:bg-surface-2"
          >
            <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
            Offri passaggio
          </Link>
          {!isMember ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-50"
            >
              {joining ? "Iscrizione in corso..." : "Unisciti al gruppo"}
            </button>
          ) : (
            <Badge variant="ok" className="px-5 py-3 text-sm font-semibold">
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Sei membro
            </Badge>
          )}
        </div>

        <div className="mt-10 border-t border-line pt-8">
          <h2 className="text-lg font-semibold text-fg mb-4 heading-editorial">membri ({members.length})</h2>
          {members.length === 0 ? (
            <p className="text-muted">Nessun membro ancora. Sii il primo!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
                  <Avatar name={member.profiles.name} size="sm" src={member.profiles.avatar_url} />
                  <span className="text-sm text-fg">{member.profiles.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

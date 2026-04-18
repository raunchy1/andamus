"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Loader2, MapPin, GraduationCap, Plane, Bus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  city: string;
  member_count?: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  university: <GraduationCap className="h-5 w-5" />,
  airport: <Plane className="h-5 w-5" />,
  commute: <Bus className="h-5 w-5" />,
  event: <Users className="h-5 w-5" />,
  other: <Users className="h-5 w-5" />,
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const locale = useLocale();

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from("carpool_groups")
        .select(`*, group_memberships(count)`)
        .order("created_at", { ascending: false });
      setGroups(
        (data || []).map((g) => ({
          ...g,
          member_count: (g as unknown as { group_memberships?: { count: number }[] }).group_memberships?.[0]?.count || 0,
        })) as Group[]
      );
      setLoading(false);
    };
    fetchGroups();
  }, [supabase]);

  const typeLabels: Record<string, string> = {
    university: t("typeUniversity"),
    airport: t("typeAirport"),
    commute: t("typeCommute"),
    event: t("typeEvent"),
    other: t("typeOther"),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
            </div>
          ) : groups.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">{t("noGroups")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/gruppo/${group.id}`}
                  className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                        {typeIcons[group.type] || typeIcons.other}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{group.name}</h3>
                        <p className="text-xs text-muted-foreground">{typeLabels[group.type] || group.type}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {group.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {t("members", { count: group.member_count || 0 })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

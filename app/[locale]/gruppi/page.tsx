"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Users, Plus, MapPin, Search, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LocationCombobox } from "@/components/LocationCombobox";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────

interface Group {
  id: string;
  name: string;
  description: string | null;
  origin: string;
  destination: string;
  creator_id: string;
  member_count: number;
  is_public: boolean;
  avatar_color: string;
  created_at: string;
}

interface CreateForm {
  name: string;
  description: string;
  origin: string;
  destination: string;
  color: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const GROUP_COLORS = [
  "#4FB3C9", "#2196F3", "#5FA87A", "#C2A24E",
  "#9C27B0", "#00BCD4", "#607D8B", "#8B9DAF",
];

const EMPTY_FORM: CreateForm = {
  name: "",
  description: "",
  origin: "",
  destination: "",
  color: "#4FB3C9",
};

// ── Component ───────────────────────────────────────────────────────────────

export default function GruppiPage() {
  const t = useTranslations("groups");
  const supabase = createClient();

  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadGroups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: allGroups, error } = await supabase
        .from("groups")
        .select("*")
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      if (error) throw error;
      setGroups((allGroups as Group[]) ?? []);

      if (user) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        setMyGroupIds(new Set((memberships ?? []).map((m: { group_id: string }) => m.group_id)));
      }
    } catch (err) {
      console.error("[gruppi] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleJoin = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    setJoiningId(groupId);
    try {
      if (myGroupIds.has(groupId)) {
        await supabase.from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", user.id);
        setMyGroupIds((prev) => { const next = new Set(prev); next.delete(groupId); return next; });
        setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, member_count: g.member_count - 1 } : g));
        toast.success(t("leftGroup"));
      } else {
        const { error } = await supabase.from("group_members")
          .insert({ group_id: groupId, user_id: user.id });
        if (error) throw error;
        setMyGroupIds((prev) => new Set([...prev, groupId]));
        setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
        toast.success(t("joinedGroup"));
      }
    } catch (err) {
      console.error("[gruppi] join/leave error:", err);
      toast.error(t("errorRetry"));
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.origin || !form.destination) {
      toast.error(t("fillRequired"));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    setCreating(true);
    try {
      const { data: newGroup, error } = await supabase
        .from("groups")
        .insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          origin: form.origin,
          destination: form.destination,
          creator_id: user.id,
          avatar_color: form.color,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as creator
      await supabase.from("group_members")
        .insert({ group_id: (newGroup as Group).id, user_id: user.id });

      toast.success(t("groupCreated"));
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      loadGroups();
    } catch (err) {
      console.error("[gruppi] create error:", err);
      toast.error(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = groups.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.origin.toLowerCase().includes(q) ||
      g.destination.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg pb-28">

      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Indietro
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fg heading-editorial">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            <Plus size={18} strokeWidth={1.5} />
            {t("createGroup")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <Search size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={16} strokeWidth={1.5} className="text-muted hover:text-fg" />
            </button>
          )}
        </div>
      </div>

      {/* Groups list */}
      <div className="space-y-3 px-5">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface border border-line" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} strokeWidth={1.5} className="mb-3 text-muted opacity-40" />
            <p className="text-lg font-medium text-dim">{t("noGroups")}</p>
            <p className="mt-1 text-sm text-muted">{t("createFirst")}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-fg"
            >
              {t("createGroup")}
            </button>
          </div>
        ) : (
          filtered.map((group) => {
            const isMember = myGroupIds.has(group.id);
            const isJoining = joiningId === group.id;
            return (
              <div
                key={group.id}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
              >
                <Avatar
                  name={group.name}
                  size="lg"
                  className="rounded-2xl"
                  style={{ backgroundColor: group.avatar_color ?? "#4FB3C9" }}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{group.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin size={11} strokeWidth={1.5} />
                    <span className="truncate">{group.origin} → {group.destination}</span>
                  </div>
                  <div className="mt-1.5">
                    <Badge>
                      {group.member_count} {group.member_count === 1 ? t("member") : t("members")}
                    </Badge>
                  </div>
                </div>

                <button
                  onClick={() => handleJoin(group.id)}
                  disabled={isJoining}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                    isMember
                      ? "border border-line bg-surface-2 text-dim"
                      : "bg-accent text-accent-fg"
                  }`}
                >
                  {isJoining ? "…" : isMember ? t("joined") : t("joinGroup")}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE MODAL ─────────────────────────────────────────────────── */}
      {showCreateModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[201] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface border-t border-line">

            {/* Handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-line-strong" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-xl font-bold text-fg heading-editorial">{t("createGroup")}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full bg-surface-2 p-2 hover:bg-elevated transition-colors"
              >
                <X size={18} strokeWidth={1.5} className="text-fg" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 p-5 pb-12">

              {/* Name */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("groupName")} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("groupNamePlaceholder")}
                  maxLength={50}
                  className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3.5 text-fg placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              {/* Origin */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("origin")} *
                </label>
                <LocationCombobox
                  value={form.origin}
                  onChange={(val) => setForm((p) => ({ ...p, origin: val }))}
                  placeholder={t("selectCity")}
                  buttonClassName="border-line bg-surface-2 h-[52px]"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("destination")} *
                </label>
                <LocationCombobox
                  value={form.destination}
                  onChange={(val) => setForm((p) => ({ ...p, destination: val }))}
                  placeholder={t("selectCity")}
                  buttonClassName="border-line bg-surface-2 h-[52px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder={t("descriptionPlaceholder")}
                  rows={3}
                  maxLength={200}
                  className="w-full resize-none rounded-xl border border-line bg-surface-2 px-4 py-3.5 text-fg placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("groupColor")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      className={`h-9 w-9 rounded-xl transition-transform ${
                        form.color === color ? "scale-110 ring-2 ring-white" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 rounded-2xl bg-surface-2 border border-line p-4">
                <Avatar
                  name={form.name || "?"}
                  size="lg"
                  className="rounded-2xl"
                  style={{ backgroundColor: form.color }}
                />
                <div>
                  <p className="font-semibold text-fg">{form.name || t("groupName")}</p>
                  <p className="text-xs text-muted">
                    {form.origin || t("origin")} → {form.destination || t("destination")}
                  </p>
                  <p className="text-xs text-muted">1 {t("member")}</p>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-2xl bg-accent py-4 text-base font-bold text-accent-fg transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {creating ? `${t("creating")}…` : `+ ${t("createGroup").toUpperCase()}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailPreferencesProps {
  userId: string;
}

interface Preferences {
  email_booking_requests: boolean;
  email_booking_confirmed: boolean;
  email_new_messages: boolean;
  email_ride_reminders: boolean;
  email_marketing: boolean;
}

const preferenceKeys = [
  "email_booking_requests",
  "email_booking_confirmed",
  "email_new_messages",
  "email_ride_reminders",
  "email_marketing",
] as const;

/** Token-driven switch. Sits on any surface, unlike the old white-knob build. */
function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-green" : "bg-track"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </span>
  );
}

export function EmailPreferences({ userId }: EmailPreferencesProps) {
  const t = useTranslations("emailPrefs");
  const [preferences, setPreferences] = useState<Preferences>({
    email_booking_requests: true,
    email_booking_confirmed: true,
    email_new_messages: true,
    email_ride_reminders: true,
    email_marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("email_booking_requests, email_booking_confirmed, email_new_messages, email_ride_reminders, email_marketing")
          .eq("id", userId)
          .single();

        if (error) throw error;

        if (data) {
          setPreferences({
            email_booking_requests: data.email_booking_requests ?? true,
            email_booking_confirmed: data.email_booking_confirmed ?? true,
            email_new_messages: data.email_new_messages ?? true,
            email_ride_reminders: data.email_ride_reminders ?? true,
            email_marketing: data.email_marketing ?? false,
          });
        }
      } catch {
        // Preferences fall back to the defaults above.
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId, supabase]);

  const handleToggle = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(preferences)
        .eq("id", userId);

      if (error) throw error;
      setDirty(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-sand-deep" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-line-soft">
        {preferenceKeys.map((key) => (
          <li key={key}>
            <label className="flex min-h-[56px] cursor-pointer items-center gap-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{t(`${key}.label`)}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t(`${key}.hint`)}</span>
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={preferences[key]}
                onChange={() => handleToggle(key)}
              />
              <Switch checked={preferences[key]} />
            </label>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}

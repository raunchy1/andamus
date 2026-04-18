"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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

const preferenceOptions = [
  { key: "email_booking_requests", label: "Richieste di passaggio", icon: "✉️" },
  { key: "email_booking_confirmed", label: "Conferme prenotazione", icon: "✅" },
  { key: "email_new_messages", label: "Nuovi messaggi", icon: "💬" },
  { key: "email_ride_reminders", label: "Promemoria corse", icon: "⏰" },
  { key: "email_marketing", label: "Aggiornamenti Andamus", icon: "📢" },
] as const;

export function EmailPreferences({ userId }: EmailPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    email_booking_requests: true,
    email_booking_confirmed: true,
    email_new_messages: true,
    email_ride_reminders: true,
    email_marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

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
        // Error fetching preferences
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId, supabase]);

  const handleToggle = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(preferences)
        .eq("id", userId);

      if (error) throw error;
      toast.success("Preferenze salvate!");
    } catch {
      toast.error("Errore nel salvare le preferenze");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-on-surface">Preferenze Notifiche Email</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-on-surface">Preferenze Notifiche Email</h3>
      </div>

      <div className="space-y-3 mb-6">
        {preferenceOptions.map((option) => (
          <label
            key={option.key}
            className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{option.icon}</span>
              <span className="text-on-surface">{option.label}</span>
            </div>
            <div
              className={`w-12 h-6 rounded-full relative transition-colors ${
                preferences[option.key] ? "bg-primary" : "bg-white/20"
              }`}
              onClick={() => handleToggle(option.key)}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences[option.key] ? "left-7" : "left-1"
                }`}
              />
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Salva preferenze
          </>
        )}
      </button>
    </div>
  );
}

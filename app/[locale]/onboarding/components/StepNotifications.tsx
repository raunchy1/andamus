"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Haptic } from "@/lib/haptic";

interface StepNotificationsProps {
  onNext: (enabled: boolean) => Promise<void>;
  onBack: () => void;
}

export default function StepNotifications({ onNext, onBack }: StepNotificationsProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If notification permission is already determined, bypass this screen immediately
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted" || Notification.permission === "denied") {
        onNext(Notification.permission === "granted");
      }
    }
  }, [onNext]);

  const handleRequestPermission = async () => {
    Haptic.light();
    if (typeof window === "undefined" || !("Notification" in window)) {
      await onNext(false);
      return;
    }

    setSubmitting(true);
    try {
      const permission = await Notification.requestPermission();
      Haptic.success();
      
      if (permission === "granted") {
        // Trigger subscription API endpoint if service worker is ready
        try {
          const reg = await navigator.serviceWorker.ready;
          const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          
          if (key) {
            const subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key,
            });

            // Send subscription payload to server subscription database
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription),
            });
          }
        } catch (pushErr) {
          console.warn("[onboarding/notifications] push manager subscribe failed:", pushErr);
        }
        await onNext(true);
      } else {
        await onNext(false);
      }
    } catch (err) {
      console.error(err);
      await onNext(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    Haptic.light();
    setSubmitting(true);
    try {
      await onNext(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: "🔔",
      text: "Nuovi passaggi sulla tua tratta preferita",
    },
    {
      icon: "✅",
      text: "Notifica istantanea quando un viaggio viene accettato",
    },
    {
      icon: "💬",
      text: "Messaggi e coordinamento chat in tempo reale",
    },
  ];

  return (
    <div className="flex flex-col flex-1 justify-between h-full w-full">
      <div className="space-y-8 overflow-y-auto max-h-[70vh] pb-4 px-1 scrollbar-none text-center">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Resta Aggiornato
          </h2>
          <p className="text-zinc-400 text-xs font-sans mt-1">
            Ti avvisiamo subito quando ricevi una prenotazione o un messaggio
          </p>
        </div>

        {/* Animated Bell Icon */}
        <div className="py-6 flex justify-center">
          <div className="w-24 h-24 bg-[#e63946]/10 border border-[#e63946]/20 rounded-full flex items-center justify-center relative animate-pulse">
            <Bell className="w-10 h-10 text-[#e63946] animate-[bell-ring_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-4 max-w-sm mx-auto text-left bg-[#121212] border border-white/[0.06] rounded-2xl p-6">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="text-lg flex-shrink-0">{b.icon}</span>
              <p className="text-zinc-300 text-xs leading-relaxed font-sans font-medium m-0">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-6 space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              Haptic.light();
              onBack();
            }}
            className="flex-1 py-4 border border-white/5 bg-white/5 text-white font-bold rounded-xl text-base transition-all active:scale-[0.99] disabled:opacity-50"
            disabled={submitting}
          >
            Indietro
          </button>
          
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={submitting}
            className="flex-1 py-4 bg-[#e63946] text-white font-bold rounded-xl text-base transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Attiva notifiche"
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          className="w-full text-zinc-500 hover:text-white font-semibold text-xs py-2 transition-colors disabled:opacity-50"
        >
          Non ora
        </button>
      </div>

      <style jsx global>{`
        @keyframes bell-ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(15deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
}

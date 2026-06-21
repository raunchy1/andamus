"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Loader2, MessageSquare } from "lucide-react";
import { Haptic } from "@/lib/haptic";
import { Button } from "@/components/ui/button";

interface StepNotificationsProps {
  onNext: (enabled: boolean) => Promise<void>;
  onBack: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

export default function StepNotifications({ onNext, onBack }: StepNotificationsProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
        try {
          const reg = await navigator.serviceWorker.ready;
          const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (key) {
            const subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key,
            });

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
    { icon: Bell, text: "nuovi passaggi sulla tua tratta preferita" },
    { icon: CheckCheck, text: "notifica istantanea quando un viaggio viene accettato" },
    { icon: MessageSquare, text: "messaggi e coordinamento chat in tempo reale" },
  ];

  return (
    <div className="flex h-full w-full flex-1 flex-col justify-between">
      <motion.div
        {...fadeUp}
        className="scrollbar-none max-h-[70vh] space-y-8 overflow-y-auto px-1 pb-4 text-center"
      >
        <div>
          <h2 className="heading-editorial text-2xl text-fg">resta aggiornato</h2>
          <p className="mt-1 text-xs text-muted">
            ti avvisiamo subito quando ricevi una prenotazione o un messaggio
          </p>
        </div>

        <div className="flex justify-center py-4">
          <div className="flex size-20 items-center justify-center rounded-full border border-line bg-surface">
            <Bell className="size-9 text-accent" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mx-auto max-w-sm space-y-4 rounded-[var(--radius)] border border-line bg-surface p-6 text-left">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <b.icon className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.5} />
              <p className="m-0 text-xs leading-relaxed text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.06 }}
        className="space-y-3 pt-6"
      >
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              Haptic.light();
              onBack();
            }}
            disabled={submitting}
            className="flex-1"
          >
            indietro
          </Button>

          <Button
            type="button"
            onClick={handleRequestPermission}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" strokeWidth={1.5} /> : "attiva notifiche"}
          </Button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          className="w-full py-2 text-xs font-medium text-dim transition-colors hover:text-fg disabled:opacity-50"
        >
          non ora
        </button>
      </motion.div>
    </div>
  );
}
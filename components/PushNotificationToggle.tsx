"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false);
      setLoading(false);
      return;
    }
    setIsSupported(true);

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        setIsSubscribed(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    setProcessing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Configurazione VAPID mancante");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: (subscription.toJSON() as { keys?: { p256dh: string } }).keys?.p256dh || "",
            auth: (subscription.toJSON() as { keys?: { auth: string } }).keys?.auth || "",
          },
        }),
      });

      if (!res.ok) throw new Error("Subscribe failed");

      setIsSubscribed(true);
      toast.success("Notifiche push attivate");
    } catch {
      toast.error("Errore nell'attivazione delle notifiche");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!isSupported) return;
    setProcessing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
      setIsSubscribed(false);
      toast.success("Notifiche push disattivate");
    } catch {
      toast.error("Errore nella disattivazione");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Caricamento...
      </div>
    );
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        Il tuo browser non supporta le notifiche push.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={processing}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
        isSubscribed
          ? "border border-border bg-card text-foreground hover:bg-muted"
          : "bg-accent text-white hover:bg-accent/90"
      }`}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isSubscribed ? "Disattiva notifiche push" : "Attiva notifiche push"}
    </button>
  );
}

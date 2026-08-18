"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePushPreference } from "@/lib/user-preferences";

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
  const t = useTranslations("push");
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
        toast.error(t("configMissing"));
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
      await updatePushPreference(true);
      toast.success(t("enabled"));
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error(t("blocked"));
      } else {
        toast.error(t("enableError"));
      }
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
      await updatePushPreference(false);
      toast.success(t("disabled"));
    } catch {
      toast.error(t("disableError"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted" aria-busy="true">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        {t("checking")}
      </p>
    );
  }

  if (!isSupported) {
    const denied =
      typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied";
    return (
      <p className="text-xs leading-relaxed text-muted">
        {denied ? t("blockedHint") : t("unsupported")}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={processing}
      className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
        isSubscribed
          ? "border border-line bg-surface font-medium text-ink hover:bg-sand"
          : "bg-green text-white hover:opacity-90"
      }`}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      )}
      {isSubscribed ? t("disable") : t("enable")}
    </button>
  );
}

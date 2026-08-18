"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StripeConnectBanner() {
  const locale = useLocale();
  const t = useTranslations("stripeConnect");
  const [status, setStatus] = useState<"loading" | "not_started" | "pending" | "active">("loading");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.onboarded) setStatus("active");
        else if (data.account_id) setStatus("pending");
        else setStatus("not_started");
      })
      .catch(() => setStatus("not_started"));
  }, []);

  const handleOnboard = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t("onboardError"));
        setIsRedirecting(false);
      }
    } catch {
      toast.error(t("networkError"));
      setIsRedirecting(false);
    }
  };

  if (status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted" aria-busy="true">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        {t("checking")}
      </p>
    );
  }

  if (status === "active") {
    return (
      <p className="flex items-start gap-2.5 text-sm text-ink">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" strokeWidth={1.5} aria-hidden />
        <span>
          <span className="block font-medium">{t("activeTitle")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t("activeBody")}</span>
        </span>
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">
        {status === "pending" ? t("pendingTitle") : t("startTitle")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {status === "pending" ? t("pendingBody") : t("startBody")}
      </p>
      <button
        onClick={handleOnboard}
        disabled={isRedirecting}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isRedirecting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        )}
        {isRedirecting ? t("redirecting") : status === "pending" ? t("continueSetup") : t("startSetup")}
      </button>
    </div>
  );
}

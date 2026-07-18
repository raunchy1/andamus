"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { CreditCard, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StripeConnectBanner() {
  const locale = useLocale();
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
        toast.error(data.error || "Errore durante l'attivazione dei pagamenti");
        setIsRedirecting(false);
      }
    } catch {
      toast.error("Errore di rete");
      setIsRedirecting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#4FB3C9]" />
        <span className="text-sm text-fg/60">Verifica pagamenti...</span>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-fg">Pagamenti attivi</p>
          <p className="text-xs text-fg/50">Puoi ricevere pagamenti per le tue corse a pagamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#4FB3C9]/20 bg-[#4FB3C9]/5 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-[#4FB3C9] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-fg">
            {status === "pending" ? "Completa la configurazione pagamenti" : "Attiva i pagamenti per le tue corse"}
          </p>
          <p className="text-xs text-fg/50 mt-1">
            {status === "pending"
              ? "Hai iniziato l'attivazione ma non l'hai completata. Clicca per continuare."
              : "Connetti il tuo conto Stripe per ricevere pagamenti dai passeggeri (Andamusu trattiene il 10%)."}
          </p>
        </div>
      </div>
      <button
        onClick={handleOnboard}
        disabled={isRedirecting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4FB3C9]/20 border border-[#4FB3C9]/30 px-4 py-2.5 text-sm font-semibold text-[#4FB3C9] hover:bg-[#4FB3C9]/30 transition-colors disabled:opacity-60"
      >
        {isRedirecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        {isRedirecting ? "Reindirizzamento..." : status === "pending" ? "Continua configurazione" : "Configura pagamenti"}
      </button>
    </div>
  );
}

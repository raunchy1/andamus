"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ChevronRight, 
  Coins, 
  ShieldCheck, 
  TrendingUp 
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Haptic } from "@/lib/haptic";

interface StripeStatus {
  onboarded: boolean;
  account_id: string | null;
  error?: string;
}

const LOCALIZATION = {
  it: {
    title: "Stato Pagamenti",
    subtitle: "Configura Stripe Connect per ricevere i pagamenti direttamente sul tuo conto.",
    back: "Indietro",
    loading: "Verifica dello stato...",
    connected: "Stripe Connect Attivo",
    connectedDesc: "Il tuo account Stripe Connect è configurato e pronto a ricevere pagamenti. I passeggeri pagheranno online e i fondi verranno accreditati automaticamente.",
    connectedStatus: "Stato: Collegato e Attivo",
    pending: "Configurazione Incompleta",
    pendingDesc: "Hai creato un account Stripe, ma non hai ancora completato la verifica o inserito i dati di accreditamento. Completa la configurazione per poter offrire passaggi a pagamento.",
    pendingStatus: "Stato: In Attesa di Completamento",
    notConnected: "Pagamenti Non Collegati",
    notConnectedDesc: "Per offrire passaggi a pagamento ed essere rimborsato online, devi collegare un conto tramite Stripe Connect. La procedura è sicura e richiede solo pochi minuti.",
    notConnectedStatus: "Stato: Non Configurato",
    btnComplete: "Completa Configurazione",
    btnConnect: "Attiva Stripe Connect",
    benefitTitle: "Perché attivare i pagamenti online?",
    benefit1Title: "Ricevi pagamenti sicuri",
    benefit1Desc: "I passeggeri pagano in anticipo tramite carta di credito o Apple Pay/Google Pay.",
    benefit2Title: "Accrediti diretti",
    benefit2Desc: "I fondi vengono accreditati direttamente sul tuo IBAN senza costi nascosti.",
    benefit3Title: "Zero stress",
    benefit3Desc: "Niente gestione di contanti o resti in auto. Tutto gestito digitalmente.",
    errorCheck: "Impossibile caricare lo stato di Stripe. Riprova più tardi.",
    initiating: "Reindirizzamento a Stripe...",
  },
  en: {
    title: "Payouts Status",
    subtitle: "Configure Stripe Connect to receive payouts directly to your bank account.",
    back: "Back",
    loading: "Checking status...",
    connected: "Stripe Connect Active",
    connectedDesc: "Your Stripe Connect account is fully configured and ready to receive payouts. Passengers will pay online and funds are transferred automatically.",
    connectedStatus: "Status: Connected & Active",
    pending: "Setup Incomplete",
    pendingDesc: "You created a Stripe account but haven't finished verification or payout setup. Complete configuration to offer paid rides.",
    pendingStatus: "Status: Awaiting Verification",
    notConnected: "Payments Not Connected",
    notConnectedDesc: "To offer paid rides and receive online payouts, connect a bank account via Stripe Connect. The process is secure and takes just a few minutes.",
    notConnectedStatus: "Status: Not Configured",
    btnComplete: "Complete Setup",
    btnConnect: "Activate Stripe Connect",
    benefitTitle: "Why enable online payouts?",
    benefit1Title: "Secure Payments",
    benefit1Desc: "Passengers pay securely upfront via credit card or digital wallets.",
    benefit2Title: "Direct Payouts",
    benefit2Desc: "Funds are transferred directly to your IBAN with complete transparency.",
    benefit3Title: "Zero Friction",
    benefit3Desc: "No need for cash or change inside the car. Everything is handled digitally.",
    errorCheck: "Could not retrieve Stripe status. Try again later.",
    initiating: "Redirecting to Stripe...",
  },
  de: {
    title: "Auszahlungsstatus",
    subtitle: "Konfigurieren Sie Stripe Connect, um Auszahlungen direkt auf Ihr Bankkonto zu erhalten.",
    back: "Zurück",
    loading: "Status überprüfen...",
    connected: "Stripe Connect Aktiv",
    connectedDesc: "Ihr Stripe Connect-Konto ist vollständig konfiguriert und bereit für Auszahlungen. Passagiere zahlen online und Auszahlungen erfolgen automatisch.",
    connectedStatus: "Status: Verbunden & Aktiv",
    pending: "Einrichtung Unvollständig",
    pendingDesc: "Sie haben ein Stripe-Konto erstellt, aber die Verifizierung oder Auszahlungseinrichtung nicht abgeschlossen. Schließen Sie die Einrichtung ab, um kostenpflichtige Fahrten anzubieten.",
    pendingStatus: "Status: Warte auf Verifizierung",
    notConnected: "Zahlungen nicht verbunden",
    notConnectedDesc: "Um kostenpflichtige Fahrten anzubieten und online Auszahlungen zu erhalten, verbinden Sie ein Bankkonto über Stripe Connect. Der Vorgang ist sicher und dauert nur wenige Minuten.",
    notConnectedStatus: "Status: Nicht konfiguriert",
    btnComplete: "Einrichtung abschließen",
    btnConnect: "Stripe Connect aktivieren",
    benefitTitle: "Warum Online-Auszahlungen aktivieren?",
    benefit1Title: "Sichere Zahlungen",
    benefit1Desc: "Passagiere zahlen sicher im Voraus per Kreditkarte oder E-Wallets.",
    benefit2Title: "Direkte Auszahlungen",
    benefit2Desc: "Das Geld wird direkt und transparent auf Ihr IBAN-Konto überwiesen.",
    benefit3Title: "Keine Barzahlung",
    benefit3Desc: "Kein Wechselgeld im Auto nötig. Alles wird digital abgewickelt.",
    errorCheck: "Stripe-Status konnte nicht abgerufen werden. Später versuchen.",
    initiating: "Weiterleitung zu Stripe...",
  }
};

export default function StripeStatusPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as "it" | "en" | "de") || "it";
  const texts = LOCALIZATION[locale] || LOCALIZATION.it;

  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [supabase] = useState(() => createClient());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/connect/status");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error(texts.errorCheck);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOnboard = () => {
    Haptic.heavy();
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/connect/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        });
        if (!res.ok) throw new Error("Onboarding request failed");
        const data = await res.json();
        if (data.url) {
          toast.success(texts.initiating);
          window.location.href = data.url;
        } else {
          throw new Error("No URL returned");
        }
      } catch (err) {
        Haptic.error();
        toast.error(err instanceof Error ? err.message : "Error connecting to Stripe");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 animate-spin text-[#e63946] mb-4" />
        <p className="text-white/50 text-sm font-medium">{texts.loading}</p>
      </div>
    );
  }

  const isConnected = status?.onboarded === true;
  const isPendingSetup = status?.account_id !== null && !isConnected;
  const isNotConnected = status?.account_id === null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Top Header */}
      <header className="bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06] transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{texts.title}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Intro */}
        <div className="space-y-1">
          <p className="text-sm text-white/50 leading-relaxed">{texts.subtitle}</p>
        </div>

        {/* Status Card */}
        <div className="bg-[#141414]/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle accent glows */}
          {isConnected && <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />}
          {isPendingSetup && <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />}
          {isNotConnected && <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#e63946]/10 rounded-full blur-2xl pointer-events-none" />}

          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            {/* Status Icons */}
            {isConnected && (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            )}
            {isPendingSetup && (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            )}
            {isNotConnected && (
              <div className="w-16 h-16 rounded-2xl bg-[#e63946]/10 border border-[#e63946]/20 flex items-center justify-center shadow-lg shadow-[#e63946]/5">
                <CreditCard className="w-8 h-8 text-[#ffb3b1]" />
              </div>
            )}

            {/* Status Text */}
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight">
                {isConnected && texts.connected}
                {isPendingSetup && texts.pending}
                {isNotConnected && texts.notConnected}
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                {isConnected && <span className="text-emerald-400">{texts.connectedStatus}</span>}
                {isPendingSetup && <span className="text-amber-400">{texts.pendingStatus}</span>}
                {isNotConnected && <span className="text-red-400">{texts.notConnectedStatus}</span>}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-white/60 leading-relaxed">
              {isConnected && texts.connectedDesc}
              {isPendingSetup && texts.pendingDesc}
              {isNotConnected && texts.notConnectedDesc}
            </p>

            {/* Action Buttons */}
            {!isConnected && (
              <button
                type="button"
                onClick={handleOnboard}
                disabled={isPending}
                className="w-full mt-4 py-4 px-6 rounded-2xl bg-[#e63946] text-white font-extrabold text-sm uppercase tracking-wider hover:bg-[#c92a37] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#e63946]/20"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPendingSetup ? (
                  <>
                    {texts.btnComplete}
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {texts.btnConnect}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 px-1">{texts.benefitTitle}</h3>

          <div className="space-y-3">
            <div className="bg-[#141414]/40 border border-white/5 rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-[#ffb3b1]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{texts.benefit1Title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{texts.benefit1Desc}</p>
              </div>
            </div>

            <div className="bg-[#141414]/40 border border-white/5 rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#ffb3b1]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{texts.benefit2Title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{texts.benefit2Desc}</p>
              </div>
            </div>

            <div className="bg-[#141414]/40 border border-white/5 rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#ffb3b1]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{texts.benefit3Title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{texts.benefit3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

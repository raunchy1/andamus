"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Check, Loader2 } from "lucide-react";

export default function PremiumSuccessPage() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();
  const locale = useLocale();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setVerifying(false);
      setError(true);
      return;
    }

    const verifySession = async () => {
      try {
        const res = await fetch(`/api/premium/verify?session_id=${sessionId}`);
        if (!res.ok) throw new Error('Verifica fallita');
        setVerifying(false);
      } catch (err) {
        console.error('[premium/success] verify error:', err);
        setVerifying(false);
        setError(true);
      }
    };

    verifySession();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-error mb-4">Verifica fallita. Contatta il supporto.</p>
          <Link href={`/${locale}`} className="inline-flex items-center justify-center rounded-xl bg-[#e63946] px-6 py-3 text-white font-medium hover:bg-[#c92a37] transition-colors">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
          {verifying ? (
            <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
          ) : (
            <Check className="h-10 w-10 text-green-400" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          {verifying ? "Attivazione in corso..." : "Abbonamento attivato!"}
        </h1>
        <p className="text-white/60 mb-8">
          {verifying
            ? "Stiamo confermando il tuo pagamento."
            : "Grazie per il tuo supporto. Le funzionalità Premium sono ora attive sul tuo account."}
        </p>
        <Link
          href={`/${locale}/profilo`}
          className="inline-flex items-center justify-center rounded-xl bg-[#e63946] px-6 py-3 text-white font-medium hover:bg-[#c92a37] transition-colors"
        >
          Vai al profilo
        </Link>
      </div>
    </div>
  );
}

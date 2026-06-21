"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

const messages: Record<string, Record<string, string>> = {
  it: {
    title: "Errore critico",
    desc: "Si è verificato un errore grave nell'applicazione.",
    reload: "Ricarica l'app",
    contact: "Se il problema persiste, contattaci:",
  },
  en: {
    title: "Critical error",
    desc: "A serious error has occurred in the application.",
    reload: "Reload the app",
    contact: "If the problem persists, contact us:",
  },
  de: {
    title: "Kritischer Fehler",
    desc: "Ein schwerwiegender Fehler ist in der Anwendung aufgetreten.",
    reload: "App neu laden",
    contact: "Wenn das Problem weiterhin besteht, kontaktieren Sie uns:",
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale =
    typeof document !== "undefined"
      ? document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? "it"
      : "it";
  const m = messages[locale] ?? messages.it;

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { error_type: "global_error", locale },
      extra: { digest: error.digest },
    });
  }, [error, locale]);

  return (
    <html lang={locale}>
      <body className="bg-[#0a0a0a]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-bad/10 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-bad" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              {m.title}
            </h1>
            
            <p className="text-white/60 mb-2">
              {m.desc}
            </p>
            
            {error.digest && (
              <p className="text-white/40 text-sm mb-8 font-mono">
                Codice errore: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4FB3C9] text-white rounded-xl font-medium hover:bg-[#3d9db3] transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              {m.reload}
            </button>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm mb-2">
                {m.contact}
              </p>
              <a 
                href="mailto:support@andamus.it"
                className="inline-flex items-center gap-2 text-[#4FB3C9] hover:text-[#3d9db3] transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@andamus.it
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

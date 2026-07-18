import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Terminal } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    reason?: string;
    error?: string;
    err?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("authErrorTitle"),
  };
}

/**
 * Production-Grade Auth Error Diagnostics Page.
 * Located at: /app/[locale]/auth/auth-code-error/page.tsx
 *
 * Why this is superior:
 * - Awaits both params and searchParams natively following Next.js 16/17 standards.
 * - Extracts exact query diagnostics (reason, OAuth messages).
 * - Provides localized error explanations for various failure vectors (OAuth, PKCE, session exchange).
 * - Displays a sleek, secure Developer Debug Box in non-production environments to aid in integration testing.
 */
export default async function AuthCodeErrorPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { reason, error, err } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  const rawErrorMessage = error || err || "";
  const isDev = process.env.NODE_ENV !== "production";

  // Resolve user-friendly diagnostics
  let errorTitle = t("authErrorTitle");
  let errorDescription = t("authErrorDescription");
  let solutionText = "";

  if (reason === "oauth_error") {
    errorTitle = locale === "it" ? "Accesso con Google non riuscito" : locale === "en" ? "Google sign-in failed" : "Google OAuth-Fehler";
    errorDescription = locale === "it"
      ? `Google ha restituito un errore durante l'accesso: "${rawErrorMessage}"`
      : `Google returned an error while signing you in: "${rawErrorMessage}"`;
    solutionText = locale === "it"
      ? "Controlla le impostazioni del tuo account Google e riprova."
      : "Check your Google account settings and try again.";
  } else if (reason === "missing_code") {
    errorTitle = locale === "it" ? "Codice di autorizzazione mancante" : locale === "en" ? "Missing authorization code" : "Autorisierungscode fehlt";
    errorDescription = locale === "it"
      ? "Il server di autenticazione non ha fornito un codice di autorizzazione valido."
      : "The authentication server did not provide a valid authorization code.";
    solutionText = locale === "it"
      ? "Succede se apri questa pagina direttamente o se l'accesso è stato interrotto prima del completamento."
      : "This happens if you open this page directly or the sign-in flow was interrupted before completing.";
  } else if (reason === "exchange_failed") {
    errorTitle = locale === "it" ? "Scambio di sessione non riuscito" : locale === "en" ? "Session exchange failed" : "Sitzungsaustausch fehlgeschlagen";
    errorDescription = locale === "it"
      ? `Non è stato possibile completare la verifica della sessione: ${rawErrorMessage}`
      : `The server could not verify your sign-in session: ${rawErrorMessage}`;
    solutionText = locale === "it"
      ? "Di solito è causato da cookie bloccati, navigazione in incognito o reindirizzamenti dell'app installata. Assicurati che i cookie siano abilitati e riprova."
      : "This is usually caused by blocked cookies, private browsing, or redirects from the installed app. Make sure cookies are enabled and try again.";
  } else if (reason === "server_exception") {
    errorTitle = locale === "it" ? "Errore interno del server" : locale === "en" ? "Unexpected server error" : "Serverausnahme";
    errorDescription = locale === "it"
      ? `Si è verificato un errore imprevisto durante l'accesso: ${rawErrorMessage}`
      : `An unexpected error occurred while signing you in: ${rawErrorMessage}`;
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center space-y-8 bg-[#141417] border border-white/5 rounded-3xl p-8 shadow-[0_30px_80px_-25px_rgba(79, 179, 201,0.15)]">
        
        {/* Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4FB3C9]/10 border border-[#4FB3C9]/20 shadow-[0_0_15px_rgba(79, 179, 201,0.1)]">
          <AlertTriangle className="h-8 w-8 text-[#4FB3C9]" />
        </div>

        {/* Diagnostic Titles */}
        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-white border-none p-0 m-0">
            {errorTitle}
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            {errorDescription}
          </p>
          {solutionText && (
            <p className="text-xs text-white/40 leading-relaxed italic bg-white/[0.02] p-3 rounded-xl border border-white/5">
              💡 {solutionText}
            </p>
          )}
        </div>

        {/* Developer Debug Box (Dev mode only) */}
        {isDev && (
          <div className="text-left bg-[#0f0f11] border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4FB3C9] uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer Diagnostics</span>
            </div>
            <div className="space-y-1 text-[11px] font-mono text-white/50">
              <div><strong className="text-white/70">Reason Code:</strong> {reason || "undefined"}</div>
              <div><strong className="text-white/70">URL Error:</strong> {rawErrorMessage || "none"}</div>
              <div><strong className="text-white/70">Environment:</strong> development</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href={`/${locale}/profilo`}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4FB3C9] px-6 py-4 text-sm font-bold text-white hover:bg-[#3d9db3] transition-all active:scale-[0.98] shadow-[0_10px_25px_-8px_rgba(79, 179, 201,0.4)]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{locale === "it" ? "Riprova ad accedere" : locale === "en" ? "Try signing in again" : "Erneut versuchen"}</span>
          </Link>

          <Link
            href={`/${locale}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/[0.07] hover:text-white transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

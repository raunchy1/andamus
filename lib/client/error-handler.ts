/**
 * User-friendly error handling for Client Components, 
 * especially when dealing with Server Action failures in production.
 */

const NEXT_RSC_ERROR_PHRASE = "An error occurred in the Server Components render";

/**
 * Returns a user-friendly error message from a caught error.
 * Prevents leaking Next.js internal RSC error messages in production.
 */
export function getFriendlyErrorMessage(err: unknown, fallback: string = "Si è verificato un errore imprevisto"): string {
  if (err instanceof Error) {
    if (err.message.includes(NEXT_RSC_ERROR_PHRASE)) {
      return "Il server è temporaneamente sovraccarico. Riprova tra qualche istante.";
    }
    return err.message;
  }
  if (typeof err === "string") {
    if (err.includes(NEXT_RSC_ERROR_PHRASE)) {
      return "Problema di connessione al server. Riprova.";
    }
    return err;
  }
  return fallback;
}

/**
 * Specifically for translation-aware components
 */
export function getTranslatedErrorMessage(err: unknown, t: (key: string) => string, fallbackKey: string = "unknownError"): string {
  const message = err instanceof Error ? err.message : String(err);
  
  if (message.includes(NEXT_RSC_ERROR_PHRASE)) {
    // If we have a specific key for server overload, use it
    return t("serverOverload") || "Il server è momentaneamente occupato. Riprova a breve.";
  }
  
  return err instanceof Error ? err.message : t(fallbackKey);
}

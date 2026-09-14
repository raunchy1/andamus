import { Resend } from "resend";

let _resend: Resend | null = null;

/** Lazy Resend client — avoids build-time crash when RESEND_API_KEY is unset. */
export function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  _resend = new Resend(key);
  return _resend;
}

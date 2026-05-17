import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_EMAIL = "cristiermurache@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://andamus.vercel.app";
const FROM = "Andamus <onboarding@resend.dev>";

interface InsertResult {
  position: number;
  referral_code: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Email di conferma per l'utente ──────────────────────────────────────────
function buildConfirmationEmail(position: number, referralCode: string): string {
  const referralLink = `${BASE_URL}/coming-soon?ref=${referralCode}`;
  const isTop50 = position <= 50;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sei in lista — Andamus</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background:#0a0f1a;border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3b82f6;">
                BENVENUTO SU
              </p>
              <h1 style="margin:0;font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
                Andamus
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:#94a3b8;line-height:1.5;">
                Il carpooling pensato per la Sardegna
              </p>
            </td>
          </tr>

          <!-- HERO POSITION -->
          <tr>
            <td style="background:#111827;padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 0;text-align:center;border-bottom:1px solid #1f2937;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">
                      LA TUA POSIZIONE IN LISTA
                    </p>
                    <p style="margin:0;font-size:72px;font-weight:900;color:#3b82f6;line-height:1;">
                      #${position}
                    </p>
                    ${isTop50 ? `
                    <p style="margin:12px auto 0;display:inline-block;background:#1e3a5f;color:#60a5fa;font-size:12px;font-weight:700;padding:6px 16px;border-radius:999px;letter-spacing:1px;text-transform:uppercase;">
                      🏆 &nbsp;Sei nella Top 50 — Accesso beta garantito
                    </p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#111827;padding:32px 40px 0;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#f9fafb;">
                Grazie per esserti iscritto! 🎉
              </h2>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#9ca3af;">
                Stai per far parte della prima community di carpooling sarda.
                Andamus nasce per connettere le persone in Sardegna — per viaggiare
                insieme, risparmiare sul carburante e scoprire l'isola in modo diverso.
              </p>
            </td>
          </tr>

          <!-- REFERRAL -->
          <tr>
            <td style="background:#111827;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1929;border:1px solid #1e3a5f;border-radius:12px;padding:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#3b82f6;">
                      IL TUO LINK PERSONALE
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.5;">
                      Condividilo con i tuoi amici e scala la lista d'attesa.
                      Più amici inviti, prima accedi ad Andamus.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;border:1px solid #1e40af;border-radius:8px;">
                      <tr>
                        <td style="padding:14px 16px;font-family:monospace;font-size:13px;color:#60a5fa;word-break:break-all;">
                          ${referralLink}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- REWARDS -->
          <tr>
            <td style="background:#111827;padding:0 40px 32px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">
                PREMI PER CHI INVITA
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:22px;">🏆</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#f9fafb;">Top 50 in lista</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Accesso beta esclusivo prima di tutti</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:22px;">🎁</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#f9fafb;">Invita 3 amici</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Badge Fondatore permanente sul tuo profilo</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:22px;">⭐</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#f9fafb;">Invita 10 amici</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">6 mesi di Andamus Premium completamente gratis</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#111827;padding:0 40px 40px;text-align:center;">
              <a href="${referralLink}"
                 style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;">
                Condividi il tuo link →
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#4b5563;line-height:1.6;">
                Ti avviseremo non appena Andamus sarà disponibile nella tua zona.<br />
                Nel frattempo, tieni d'occhio la tua email.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0a0f1a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">
                Hai ricevuto questa email perché ti sei iscritto alla lista d'attesa di Andamus.<br />
                © 2025 Andamus · Sardegna, Italia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Notifica admin ──────────────────────────────────────────────────────────
async function notifyAdmin(data: {
  email: string;
  phone: string | null;
  zona: string | null;
  position: number;
  referral_code: string;
  referred_by: string | null;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `🎉 Nuovo iscritto #${data.position} — Lista d'attesa Andamus`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0f1a;color:#e5e2e1;border-radius:12px;">
          <h2 style="color:#3b82f6;margin-top:0;">Nuovo iscritto alla lista d'attesa</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#9ca3af;width:120px;">Posizione</td><td style="padding:8px 0;font-weight:bold;color:#fff;">#${data.position}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Email</td><td style="padding:8px 0;">${data.email}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Telefono</td><td style="padding:8px 0;">${data.phone ?? "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Zona</td><td style="padding:8px 0;">${data.zona ?? "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Codice ref.</td><td style="padding:8px 0;font-family:monospace;">${data.referral_code}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Invitato da</td><td style="padding:8px 0;font-family:monospace;">${data.referred_by ?? "—"}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#4b5563;">Andamus · Lista d'attesa</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[waiting-list] admin notify error:", err);
  }
}

// ── Conferma per l'utente ───────────────────────────────────────────────────
async function sendConfirmation(to: string, position: number, referralCode: string) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `✅ Sei in lista! Benvenuto su Andamus — #${position}`,
      html: buildConfirmationEmail(position, referralCode),
    });
  } catch (err) {
    console.error("[waiting-list] confirmation email error:", err);
  }
}

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const { email, phone, zona, referred_by } = body as Record<string, string | undefined | null>;

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
  }

  const supabase = getSupabase();

  let validReferral: string | null = null;
  if (referred_by) {
    const { data: referrer } = await supabase
      .from("waiting_list")
      .select("referral_code")
      .eq("referral_code", referred_by)
      .maybeSingle();
    if (referrer) validReferral = referred_by;
  }

  const { data, error } = await supabase
    .from("waiting_list")
    .insert({
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      zona: zona || null,
      referred_by: validReferral,
    })
    .select("position, referral_code")
    .single<InsertResult>();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, error: "email_exists" }, { status: 409 });
    }
    console.error("[waiting-list] insert error:", error.message);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Send both emails in parallel
  await Promise.all([
    notifyAdmin({
      email: cleanEmail,
      phone: phone?.trim() || null,
      zona: zona || null,
      position: data.position,
      referral_code: data.referral_code,
      referred_by: validReferral,
    }),
    sendConfirmation(cleanEmail, data.position, data.referral_code),
  ]);

  return NextResponse.json({
    success: true,
    position: data.position,
    referral_code: data.referral_code,
  });
}

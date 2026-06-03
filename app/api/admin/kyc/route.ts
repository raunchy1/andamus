import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Andamus <noreply@andamus.app>";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * GET /api/admin/kyc
 * Fetch pending KYC verification requests.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("verifications")
    .select(`
      *,
      profiles(name, email, avatar_url)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/admin/kyc] fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

/**
 * POST /api/admin/kyc
 * Approve or reject a verification request.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const body = await request.json().catch(() => ({}));
  const { id, action, reason } = body;

  if (!id || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  // 1. Fetch verification record
  const { data: verif, error: fetchError } = await supabase
    .from("verifications")
    .select("*, profiles(name, email)")
    .eq("id", id)
    .single();

  if (fetchError || !verif) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const userProfile = Array.isArray(verif.profiles) ? verif.profiles[0] : verif.profiles;
  const userEmail = userProfile?.email;
  const userName = userProfile?.name || "Utente";

  if (action === "approve") {
    // 2a. Approve verification
    const { error: updateVerifErr } = await supabase
      .from("verifications")
      .update({ status: "approved" })
      .eq("id", id);

    if (updateVerifErr) {
      return NextResponse.json({ error: updateVerifErr.message }, { status: 500 });
    }

    // 2b. Update profiles verification flag
    const isIdDoc = verif.type === "id_document";
    const updateField = isIdDoc ? { id_verified: true } : { driver_verified: true };

    const { error: updateProfileErr } = await supabase
      .from("profiles")
      .update(updateField)
      .eq("id", verif.user_id);

    if (updateProfileErr) {
      console.error("[api/admin/kyc] failed to update profile flag:", updateProfileErr);
    }

    // 2c. Send success email (optional but great for UX)
    if (userEmail) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: "Profilo Verificato! 🎉 | Andamus",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
              <h2 style="color: #e63946;">Ciao ${userName},</h2>
              <p>Siamo felici di informarti che il tuo documento (<b>${verif.type === "id_document" ? "Identità" : "Patente"}</b>) è stato approvato con successo!</p>
              <p>Il badge di verifica è ora attivo sul tuo profilo, aumentando la fiducia della community nei tuoi confronti.</p>
              <br/>
              <p>Grazie per viaggiare in sicurezza con Andamus,</p>
              <p>Il Team Andamus</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[api/admin/kyc] success email failed:", err);
      }
    }

    return NextResponse.json({ success: true, status: "approved" });
  } else {
    // 3a. Reject verification
    const { error: updateVerifErr } = await supabase
      .from("verifications")
      .update({ status: "rejected" })
      .eq("id", id);

    if (updateVerifErr) {
      return NextResponse.json({ error: updateVerifErr.message }, { status: 500 });
    }

    // 3b. Send rejection email (mandatory requirement)
    if (userEmail) {
      try {
        const safeReason = reason 
          ? escapeHtml(reason) 
          : "Il documento caricato non è leggibile o è scaduto. Ti preghiamo di riprovare con una foto più nitida.";

        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: "Aggiornamento sulla verifica dei documenti | Andamus",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
              <h2 style="color: #e63946;">Ciao ${userName},</h2>
              <p>Ti informiamo che la tua richiesta di verifica del documento (<b>${verif.type === "id_document" ? "Identità" : "Patente"}</b>) non è stata accettata per il seguinte motivo:</p>
              <blockquote style="background: #f7f7f7; border-left: 4px solid #e63946; padding: 15px; margin: 20px 0; font-style: italic;">
                ${safeReason}
              </blockquote>
              <p>Puoi accedere nuovamente alla sezione <b>Verifica</b> dell'applicazione per caricare un nuovo documento valido.</p>
              <br/>
              <p>Grazie per la collaborazione,</p>
              <p>Il Team Andamus</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[api/admin/kyc] rejection email failed:", err);
      }
    }

    return NextResponse.json({ success: true, status: "rejected" });
  }
}

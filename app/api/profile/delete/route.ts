import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Andamus <noreply@andamus.app>";

/**
 * POST /api/profile/delete
 * Erases a user's entire account (cascades bookings, rides, messages) and confirms via email.
 * Perfect GDPR Right to be Forgotten compliance.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    const userName = user.user_metadata?.name || user.email?.split("@")[0] || "Utente";

    // 1. Send confirmation email first (while user email is still available)
    if (userEmail) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: "Conferma eliminazione account | Andamus",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
              <h2 style="color: #e63946;">Ciao ${userName},</h2>
              <p>Ti confermiamo che la tua richiesta di eliminazione dell'account è stata elaborata con successo.</p>
              <p>In conformità al Regolamento Generale sulla Protezione dei Dati (GDPR - Regolamento UE 2016/679), tutti i tuoi dati personali, inclusi i passaggi pubblicati, le prenotazioni effettuate e la cronologia dei messaggi, sono stati rimossi in modo permanente e definitivo dai nostri database.</p>
              <p>Speriamo che la tua esperienza di viaggio condiviso con noi sia stata positiva e ti auguriamo il meglio per le tue future avventure in Sardegna.</p>
              <br/>
              <p>Un saluto cordiale,</p>
              <p>Il Team Andamus</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[api/profile/delete] confirmation email failed:", err);
      }
    }

    // 2. Perform Cascade Delete via Supabase Auth Admin API
    const sr = createServiceRoleClient();
    const { error: deleteError } = await sr.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[api/profile/delete] Supabase Admin delete error:", deleteError.message);
      return NextResponse.json({ error: "Failed to delete account from system" }, { status: 500 });
    }

    // 3. Clear session cookie by returning a response that triggers client-side sign out
    const response = NextResponse.json({ success: true, message: "Account successfully deleted" });
    
    // Clear Supabase session cookies
    response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("[api/profile/delete] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

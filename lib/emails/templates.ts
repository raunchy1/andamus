// Email HTML Templates for Andamus
// Uses responsive design with the Andamus red (#e63946) color scheme

const brandColor = "#e63946";
const bgColor = "#0a0a0a";
const surfaceColor = "#1a1a1a";
const textColor = "#ffffff";
const textMuted = "#9ca3af";

function getBaseTemplate(content: string, unsubscribeToken?: string): string {
  const unsubscribeSection = unsubscribeToken
    ? `<tr>
        <td style="padding: 30px 40px; background-color: ${surfaceColor}; border-top: 1px solid #333;">
          <p style="margin: 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            Non vuoi più ricevere queste email? 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: ${brandColor}; text-decoration: underline;">Disiscriviti</a>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            Andamus - Il carpooling dei sardi
          </p>
        </td>
      </tr>`
    : `<tr>
        <td style="padding: 30px 40px; background-color: ${surfaceColor}; border-top: 1px solid #333;">
          <p style="margin: 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            Andamus - Il carpooling dei sardi
          </p>
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Andamus</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${surfaceColor}; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: ${brandColor}; padding: 30px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">ANDAMUS</h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Il carpooling dei sardi</p>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          ${content}
          
          <!-- Footer -->
          ${unsubscribeSection}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// A) BOOKING REQUEST EMAIL (to driver)
export function getBookingRequestEmailTemplate(data: {
  driverName: string;
  passengerName: string;
  passengerRating: number;
  passengerVerified: boolean;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  bookingId: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const content = `<tr>
    <td style="padding: 40px;">
      <h2 style="margin: 0 0 20px 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Ciao ${data.driverName}! 👋</h2>
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6;">
        <strong style="color: ${brandColor};">${data.passengerName}</strong> ha richiesto di unirsi al tuo passaggio!
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid ${brandColor};">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 18px; font-weight: 600;">${data.fromCity} → ${data.toCity}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 14px;">📅 ${data.date} · 🕐 ${data.time}</p>
      </div>
      
      <!-- Passenger Info -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Info passeggero</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background-color: ${surfaceColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">👤</div>
          <div>
            <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">${data.passengerName}</p>
            <p style="margin: 4px 0 0 0; color: ${textMuted}; font-size: 14px;">
              ⭐ ${data.passengerRating.toFixed(1)}
              ${data.passengerVerified ? ' · <span style="color: #22c55e;">✓ Verificato</span>' : ''}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/profilo" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin-right: 12px; margin-bottom: 12px;">✅ Accetta</a>
        <a href="${data.baseUrl}/profilo" style="display: inline-block; background-color: #374151; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">❌ Rifiuta</a>
      </div>
      
      <p style="margin: 30px 0 0 0; color: ${textMuted}; font-size: 14px; text-align: center;">
        Gestisci la richiesta direttamente dal tuo profilo
      </p>
    </td>
  </tr>`;

  return {
    subject: "🚗 Nuova richiesta di passaggio - Andamus",
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// B) BOOKING CONFIRMED EMAIL (to passenger)
export function getBookingConfirmedEmailTemplate(data: {
  passengerName: string;
  driverName: string;
  driverRating: number;
  driverPhone?: string | null;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  meetingPoint: string;
  bookingId: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const phoneSection = data.driverPhone
    ? `<p style="margin: 8px 0 0 0; color: ${textMuted}; font-size: 14px;">📞 ${data.driverPhone}</p>`
    : "";

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">✅</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Passaggio confermato!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Ottima notizia! <strong style="color: ${brandColor};">${data.driverName}</strong> ha accettato la tua richiesta 🎉
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 18px; font-weight: 600;">${data.fromCity} → ${data.toCity}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 14px;">📅 ${data.date} · 🕐 ${data.time}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 14px;">📍 ${data.meetingPoint}</p>
      </div>
      
      <!-- Driver Info -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Il tuo autista</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background-color: ${surfaceColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">🚗</div>
          <div>
            <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">${data.driverName}</p>
            <p style="margin: 4px 0 0 0; color: ${textMuted}; font-size: 14px;">⭐ ${data.driverRating.toFixed(1)}</p>
            ${phoneSection}
          </div>
        </div>
      </div>
      
      <!-- Safety Reminder -->
      <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <p style="margin: 0; color: #22c55e; font-size: 14px; line-height: 1.6;">
          <strong>🔒 Consiglio di sicurezza:</strong> Conferma sempre i dettagli del viaggio in chat prima della partenza. In caso di emergenza, contatta il numero verde Andamus.
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/chat/${data.bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">💬 Apri la chat</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: "✅ Passaggio confermato! - Andamus",
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// C) BOOKING REJECTED EMAIL (to passenger)
export function getBookingRejectedEmailTemplate(data: {
  passengerName: string;
  driverName: string;
  fromCity: string;
  toCity: string;
  date: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: #374151; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">😔</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Richiesta non accettata</h2>
      </div>
      
      <p style="margin: 0 0 16px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Purtroppo <strong>${data.driverName}</strong> non può accettare la tua richiesta per il passaggio:
      </p>
      
      <p style="margin: 0 0 30px 0; color: ${textMuted}; font-size: 16px; text-align: center;">
        ${data.fromCity} → ${data.toCity} · ${data.date}
      </p>
      
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
        <p style="margin: 0; color: ${textColor}; font-size: 16px; line-height: 1.6;">
          Non ti preoccupare! Ci sono tante altre corse disponibili 🚗
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/cerca" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">🔍 Cerca altri passaggi</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: "Richiesta non accettata - Andamus",
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// D) NEW MESSAGE EMAIL (to recipient)
export function getNewMessageEmailTemplate(data: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  bookingId: string;
  fromCity: string;
  toCity: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: ${brandColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">💬</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Nuovo messaggio!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        <strong style="color: ${brandColor};">${data.senderName}</strong> ti ha inviato un messaggio riguardo il passaggio <strong>${data.fromCity} → ${data.toCity}</strong>
      </p>
      
      <!-- Message Preview -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid ${brandColor};">
        <p style="margin: 0; color: ${textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Anteprima messaggio</p>
        <p style="margin: 0; color: ${textColor}; font-size: 16px; line-height: 1.6; font-style: italic;">
          "${data.messagePreview.length > 100 ? data.messagePreview.substring(0, 100) + "..." : data.messagePreview}"
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${data.baseUrl}/chat/${data.bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Rispondi ora</a>
      </div>
      
      <p style="margin: 0; color: ${textMuted}; font-size: 14px; text-align: center;">
        📱 Rispondi direttamente dall'app per una comunicazione più veloce
      </p>
    </td>
  </tr>`;

  return {
    subject: `💬 Nuovo messaggio da ${data.senderName} - Andamus`,
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// E) WELCOME EMAIL (to new user)
export function getWelcomeEmailTemplate(data: {
  name: string;
  referralCode: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const content = `<tr>
    <td style="padding: 40px;">
      <h2 style="margin: 0 0 20px 0; color: ${textColor}; font-size: 28px; font-weight: 700;">Benvenuto su Andamus! 🚗</h2>
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6;">
        Ciao <strong>${data.name}</strong>, benvenuto nella community del carpooling sardo!
      </p>
      
      <!-- 3 Steps -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 24px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Inizia in 3 semplici passi</h3>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; background-color: ${brandColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">1</div>
            <div>
              <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">Cerca</p>
              <p style="margin: 4px 0 0 0; color: ${textMuted}; font-size: 14px;">Trova passaggi sulla tua tratta</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; background-color: ${brandColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">2</div>
            <div>
              <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">Prenota</p>
              <p style="margin: 4px 0 0 0; color: ${textMuted}; font-size: 14px;">Richiedi un posto in pochi click</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; background-color: ${brandColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">3</div>
            <div>
              <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">Viaggia</p>
              <p style="margin: 4px 0 0 0; color: ${textMuted}; font-size: 14px;">Incontra persone fantastiche e risparmia</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Referral Code -->
      <div style="background-color: ${bgColor}; border: 2px dashed ${brandColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 14px;">Il tuo codice invito</p>
        <p style="margin: 0; color: ${brandColor}; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; font-family: monospace;">${data.referralCode}</p>
        <p style="margin: 8px 0 0 0; color: ${textMuted}; font-size: 12px;">Condividilo con gli amici per ottenere punti extra!</p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/cerca" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Inizia subito</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: "Benvenuto su Andamus! 🚗",
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// F) RIDE REMINDER EMAIL (to driver + passengers)
export function getRideReminderEmailTemplate(data: {
  recipientName: string;
  isDriver: boolean;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  meetingPoint: string;
  bookingId: string;
  baseUrl: string;
  unsubscribeToken?: string;
}): { subject: string; html: string } {
  const roleText = data.isDriver ? "guidi" : "partecipi";
  const emoji = data.isDriver ? "🚗" : "🚶";

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: ${brandColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">⏰</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Domani ${roleText}!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Ciao ${data.recipientName}, ti ricordiamo che <strong style="color: ${brandColor};">domani</strong> hai un passaggio in programma ${emoji}
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid ${brandColor};">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 20px; font-weight: 700;">${data.fromCity} → ${data.toCity}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 16px;">📅 ${data.date}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 16px;">🕐 ${data.time}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 16px;">📍 ${data.meetingPoint}</p>
      </div>
      
      <!-- Reminder Note -->
      <div style="background-color: rgba(230, 57, 70, 0.1); border: 1px solid rgba(230, 57, 70, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <p style="margin: 0; color: ${brandColor}; font-size: 14px; line-height: 1.6; text-align: center;">
          <strong>💡 Suggerimento:</strong> Contatta l'${data.isDriver ? "altro passeggero" : "autista"} in chat per confermare i dettagli dell'incontro.
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/chat/${data.bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">💬 Apri la chat</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: "⏰ Domani parti! - Andamus",
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

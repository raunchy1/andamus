// Email HTML Templates for Andamus
// Light transactional template with teal accent (#4FB3C9)

import { escapeHtml } from "./escape";

const brandColor = "#4FB3C9";
const bgColor = "#f6f7f8";
const surfaceColor = "#ffffff";
const textColor = "#1a1a18";
const textMuted = "#6b7280";
const borderColor = "#e5e7eb";

function getBaseTemplate(content: string, unsubscribeToken?: string): string {
  const unsubscribeSection = unsubscribeToken
    ? `<tr>
        <td style="padding: 30px 40px; background-color: ${surfaceColor}; border-top: 1px solid ${borderColor};">
          <p style="margin: 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            Non vuoi più ricevere queste email? 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: ${brandColor}; text-decoration: underline;">Disiscriviti</a>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            andamus — il carpooling dei sardi
          </p>
        </td>
      </tr>`
    : `<tr>
        <td style="padding: 30px 40px; background-color: ${surfaceColor}; border-top: 1px solid ${borderColor};">
          <p style="margin: 0; font-size: 12px; color: ${textMuted}; text-align: center;">
            andamus — il carpooling dei sardi
          </p>
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>andamus</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${surfaceColor}; border-radius: 16px; overflow: hidden; border: 1px solid ${borderColor};">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid ${borderColor};">
              <h1 style="margin: 0; color: ${textColor}; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; text-transform: lowercase;">andamus</h1>
              <p style="margin: 8px 0 0 0; color: ${textMuted}; font-size: 13px; font-weight: 500;">il carpooling dei sardi</p>
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
  const driverName = escapeHtml(data.driverName);
  const passengerName = escapeHtml(data.passengerName);
  const fromCity = escapeHtml(data.fromCity);
  const toCity = escapeHtml(data.toCity);
  const date = escapeHtml(data.date);
  const time = escapeHtml(data.time);

  const content = `<tr>
    <td style="padding: 40px;">
      <h2 style="margin: 0 0 20px 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Ciao ${driverName}! 👋</h2>
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6;">
        <strong style="color: ${brandColor};">${passengerName}</strong> ha richiesto di unirsi al tuo passaggio!
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid ${borderColor}; border-left: 4px solid ${brandColor};">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 18px; font-weight: 600;">${fromCity} → ${toCity}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 14px;">📅 ${date} · 🕐 ${time}</p>
      </div>
      
      <!-- Passenger Info -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Info passeggero</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background-color: ${surfaceColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">👤</div>
          <div>
            <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">${passengerName}</p>
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
  locale?: EmailLocale;
}): { subject: string; html: string } {
  const L = data.locale || "it";
  const _ = (key: string) => tEmail(L, key);
  const driverName = escapeHtml(data.driverName);
  const fromCity = escapeHtml(data.fromCity);
  const toCity = escapeHtml(data.toCity);
  const date = escapeHtml(data.date);
  const time = escapeHtml(data.time);
  const meetingPoint = escapeHtml(data.meetingPoint);
  const bookingId = escapeHtml(data.bookingId);
  const phoneSection = data.driverPhone
    ? `<p style="margin: 8px 0 0 0; color: ${textMuted}; font-size: 14px;">📞 ${escapeHtml(data.driverPhone)}</p>`
    : "";

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">✅</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Passaggio confermato!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Ottima notizia! <strong style="color: ${brandColor};">${driverName}</strong> ha accettato la tua richiesta 🎉
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 18px; font-weight: 600;">${fromCity} → ${toCity}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 14px;">📅 ${date} · 🕐 ${time}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 14px;">📍 ${meetingPoint}</p>
      </div>
      
      <!-- Driver Info -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Il tuo autista</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background-color: ${surfaceColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">🚗</div>
          <div>
            <p style="margin: 0; color: ${textColor}; font-size: 16px; font-weight: 600;">${driverName}</p>
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
        <a href="${data.baseUrl}/chat/${bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">💬 Apri la chat</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: _("bookingConfirmedSubject"),
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
  const driverName = escapeHtml(data.driverName);
  const fromCity = escapeHtml(data.fromCity);
  const toCity = escapeHtml(data.toCity);
  const date = escapeHtml(data.date);

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: #374151; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">😔</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Richiesta non accettata</h2>
      </div>
      
      <p style="margin: 0 0 16px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Purtroppo <strong>${driverName}</strong> non può accettare la tua richiesta per il passaggio:
      </p>
      
      <p style="margin: 0 0 30px 0; color: ${textMuted}; font-size: 16px; text-align: center;">
        ${fromCity} → ${toCity} · ${date}
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
  const senderName = escapeHtml(data.senderName);
  const fromCity = escapeHtml(data.fromCity);
  const toCity = escapeHtml(data.toCity);
  const bookingId = escapeHtml(data.bookingId);
  const preview = escapeHtml(
    data.messagePreview.length > 100
      ? data.messagePreview.substring(0, 100) + "..."
      : data.messagePreview
  );

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: ${brandColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">💬</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Nuovo messaggio!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        <strong style="color: ${brandColor};">${senderName}</strong> ti ha inviato un messaggio riguardo il passaggio <strong>${fromCity} → ${toCity}</strong>
      </p>
      
      <!-- Message Preview -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid ${borderColor}; border-left: 4px solid ${brandColor};">
        <p style="margin: 0; color: ${textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Anteprima messaggio</p>
        <p style="margin: 0; color: ${textColor}; font-size: 16px; line-height: 1.6; font-style: italic;">
          "${preview}"
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${data.baseUrl}/chat/${bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Rispondi ora</a>
      </div>
      
      <p style="margin: 0; color: ${textMuted}; font-size: 14px; text-align: center;">
        📱 Rispondi direttamente dall'app per una comunicazione più veloce
      </p>
    </td>
  </tr>`;

  return {
    subject: `💬 Nuovo messaggio da ${senderName} - Andamus`,
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}

// E) WELCOME EMAIL (to new user)
import { tEmail, type EmailLocale } from "./i18n";

export function getWelcomeEmailTemplate(data: {
  name: string;
  referralCode: string;
  baseUrl: string;
  unsubscribeToken?: string;
  locale?: EmailLocale;
}): { subject: string; html: string } {
  const L = data.locale || "it";
  const _ = (key: string) => tEmail(L, key);
  const name = escapeHtml(data.name);
  const referralCode = escapeHtml(data.referralCode);

  const content = `<tr>
    <td style="padding: 40px;">
      <h2 style="margin: 0 0 20px 0; color: ${textColor}; font-size: 28px; font-weight: 700;">Benvenuto su Andamus! 🚗</h2>
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6;">
        Ciao <strong>${name}</strong>, benvenuto nella community del carpooling sardo!
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
        <p style="margin: 0; color: ${brandColor}; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; font-family: monospace;">${referralCode}</p>
        <p style="margin: 8px 0 0 0; color: ${textMuted}; font-size: 12px;">Condividilo con gli amici per ottenere punti extra!</p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/cerca" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Inizia subito</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: _("welcomeSubject"),
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
  locale?: EmailLocale;
}): { subject: string; html: string } {
  const L = data.locale || "it";
  const _ = (key: string) => tEmail(L, key);
  const roleText = data.isDriver ? "guidi" : "partecipi";
  const emoji = data.isDriver ? "🚗" : "🚶";
  const recipientName = escapeHtml(data.recipientName);
  const fromCity = escapeHtml(data.fromCity);
  const toCity = escapeHtml(data.toCity);
  const date = escapeHtml(data.date);
  const time = escapeHtml(data.time);
  const meetingPoint = escapeHtml(data.meetingPoint);
  const bookingId = escapeHtml(data.bookingId);

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: ${brandColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">⏰</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Domani ${roleText}!</h2>
      </div>
      
      <p style="margin: 0 0 30px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Ciao ${recipientName}, ti ricordiamo che <strong style="color: ${brandColor};">domani</strong> hai un passaggio in programma ${emoji}
      </p>
      
      <!-- Ride Details Box -->
      <div style="background-color: ${bgColor}; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid ${borderColor}; border-left: 4px solid ${brandColor};">
        <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dettagli corsa</h3>
        <p style="margin: 0 0 8px 0; color: ${textColor}; font-size: 20px; font-weight: 700;">${fromCity} → ${toCity}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 16px;">📅 ${date}</p>
        <p style="margin: 0 0 8px 0; color: ${textMuted}; font-size: 16px;">🕐 ${time}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 16px;">📍 ${meetingPoint}</p>
      </div>
      
      <!-- Reminder Note -->
      <div style="background-color: #eef8fb; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <p style="margin: 0; color: ${textColor}; font-size: 14px; line-height: 1.6; text-align: center;">
          <strong>💡 Suggerimento:</strong> Contatta l'${data.isDriver ? "altro passeggero" : "autista"} in chat per confermare i dettagli dell'incontro.
        </p>
      </div>
      
      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${data.baseUrl}/chat/${bookingId}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">💬 Apri la chat</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: _("rideReminderSubject"),
    html: getBaseTemplate(content, data.unsubscribeToken),
  };
}


// G) WEEKLY DIGEST EMAIL
export function getWeeklyDigestEmailTemplate(data: {
  name: string;
  rides: Array<{ from: string; to: string; date: string; time: string; price: number; driver: string }>;
  hasStreak: boolean;
  streakWeeks: number;
  baseUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(data.name);
  const rideItems = data.rides
    .map(
      (r) => `
    <tr>
      <td style="padding: 16px; background-color: ${bgColor}; border-radius: 8px; margin-bottom: 8px;">
        <p style="margin: 0 0 4px 0; color: ${textColor}; font-size: 16px; font-weight: 700;">${escapeHtml(r.from)} → ${escapeHtml(r.to)}</p>
        <p style="margin: 0; color: ${textMuted}; font-size: 14px;">📅 ${escapeHtml(r.date)} · 🕐 ${escapeHtml(r.time)} · 👤 ${escapeHtml(r.driver)}${r.price > 0 ? ` · €${escapeHtml(r.price)}` : ""}</p>
      </td>
    </tr>
    <tr><td style="height: 8px;"></td></tr>
  `
    )
    .join("");

  const streakSection = data.hasStreak
    ? `<div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 600;">🔥 Streak attiva! Sei attivo da ${data.streakWeeks} settimane consecutive.</p>
       </div>`
    : "";

  const content = `<tr>
    <td style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 64px; height: 64px; background-color: ${brandColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;">📬</div>
        <h2 style="margin: 0; color: ${textColor}; font-size: 24px; font-weight: 700;">Il tuo riepilogo settimanale</h2>
      </div>
      
      <p style="margin: 0 0 24px 0; color: ${textColor}; font-size: 16px; line-height: 1.6; text-align: center;">
        Ciao ${name}, ecco i passaggi disponibili questa settimana in Sardegna 🚗
      </p>
      
      ${streakSection}
      
      <h3 style="margin: 0 0 16px 0; color: ${textColor}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Passaggi della settimana</h3>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rideItems}
      </table>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.baseUrl}/cerca" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Cerca altri passaggi</a>
      </div>
    </td>
  </tr>`;

  return {
    subject: "📬 Il tuo riepilogo settimanale — Andamus",
    html: getBaseTemplate(content),
  };
}

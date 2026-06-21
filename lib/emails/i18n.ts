// Email template translations
// Lightweight i18n for transactional emails

export type EmailLocale = "it" | "en" | "de";

const EMAIL_STRINGS: Record<EmailLocale, Record<string, string>> = {
  it: {
    welcomeSubject: "Benvenuto su Andamus! ",
    welcomeTitle: "Benvenuto,",
    welcomeBody:
      "Grazie per esserti unito ad Andamus, la community di carpooling in Sardegna.",
    welcomeCta: "Trova un passaggio",
    welcomeReferralTitle: "Invita gli amici",
    welcomeReferralBody:
      "Condividi il tuo codice referral e guadagna 25 punti per ogni amico che si registra!",
    welcomeReferralCta: "Invita ora",
    welcomeFooter: "Buoni viaggi! Il team di Andamus",

    bookingConfirmedSubject: " Passaggio confermato! - Andamus",
    bookingConfirmedTitle: "Passaggio confermato!",
    bookingConfirmedBody: "ha accettato la tua richiesta",
    rideDetailsTitle: "Dettagli corsa",
    pickupTitle: "Punto di ritiro",
    driverInfoTitle: "Info autista",
    openChatCta: " Apri la chat",
    reminderTip:
      "<strong> Suggerimento:</strong> Contatta l'autista in chat per confermare i dettagli dell'incontro.",

    rideReminderSubject: " Domani parti! - Andamus",
    rideReminderTitle: "Domani parti!",
    rideReminderBody: "ti ricordiamo che <strong style=\"color: #4FB3C9;\">domani</strong> hai un passaggio in programma",
    rideReminderDriverTip:
      "<strong> Suggerimento:</strong> Contatta l'altro passeggero in chat per confermare i dettagli dell'incontro.",
    rideReminderPassengerTip:
      "<strong> Suggerimento:</strong> Contatta l'autista in chat per confermare i dettagli dell'incontro.",

    genericManageProfile: "Gestisci dal tuo profilo",
    genericPerPerson: "a persona",
    genericFree: "Gratis",
  },
  en: {
    welcomeSubject: "Welcome to Andamus! ",
    welcomeTitle: "Welcome,",
    welcomeBody:
      "Thank you for joining Andamus, the Sardinian carpooling community.",
    welcomeCta: "Find a ride",
    welcomeReferralTitle: "Invite friends",
    welcomeReferralBody:
      "Share your referral code and earn 25 points for every friend who signs up!",
    welcomeReferralCta: "Invite now",
    welcomeFooter: "Happy travels! The Andamus team",

    bookingConfirmedSubject: " Ride confirmed! - Andamus",
    bookingConfirmedTitle: "Ride confirmed!",
    bookingConfirmedBody: "has accepted your request",
    rideDetailsTitle: "Ride details",
    pickupTitle: "Pickup point",
    driverInfoTitle: "Driver info",
    openChatCta: " Open chat",
    reminderTip:
      "<strong> Tip:</strong> Contact the driver in chat to confirm meeting details.",

    rideReminderSubject: " You're leaving tomorrow! - Andamus",
    rideReminderTitle: "You're leaving tomorrow!",
    rideReminderBody:
      "we remind you that <strong style=\"color: #4FB3C9;\">tomorrow</strong> you have a ride scheduled",
    rideReminderDriverTip:
      "<strong> Tip:</strong> Contact the other passenger in chat to confirm meeting details.",
    rideReminderPassengerTip:
      "<strong> Tip:</strong> Contact the driver in chat to confirm meeting details.",

    genericManageProfile: "Manage from your profile",
    genericPerPerson: "per person",
    genericFree: "Free",
  },
  de: {
    welcomeSubject: "Willkommen bei Andamus! ",
    welcomeTitle: "Willkommen,",
    welcomeBody:
      "Danke, dass du Andamus beigetreten bist, der sardischen Fahrgemeinschaft.",
    welcomeCta: "Fahrt finden",
    welcomeReferralTitle: "Freunde einladen",
    welcomeReferralBody:
      "Teile deinen Referral-Code und verdiene 25 Punkte für jeden Freund, der sich anmeldet!",
    welcomeReferralCta: "Jetzt einladen",
    welcomeFooter: "Gute Reise! Das Andamus-Team",

    bookingConfirmedSubject: " Fahrt bestätigt! - Andamus",
    bookingConfirmedTitle: "Fahrt bestätigt!",
    bookingConfirmedBody: "hat deine Anfrage angenommen",
    rideDetailsTitle: "Fahrtdetails",
    pickupTitle: "Treffpunkt",
    driverInfoTitle: "Fahrerinfo",
    openChatCta: " Chat öffnen",
    reminderTip:
      "<strong> Tipp:</strong> Kontaktiere den Fahrer im Chat, um die Treffdetails zu bestätigen.",

    rideReminderSubject: " Du fährst morgen! - Andamus",
    rideReminderTitle: "Du fährst morgen!",
    rideReminderBody:
      "wir erinnern dich daran, dass du <strong style=\"color: #4FB3C9;\">morgen</strong> eine Fahrt geplant hast",
    rideReminderDriverTip:
      "<strong> Tipp:</strong> Kontaktiere den anderen Mitfahrer im Chat, um die Treffdetails zu bestätigen.",
    rideReminderPassengerTip:
      "<strong> Tipp:</strong> Kontaktiere den Fahrer im Chat, um die Treffdetails zu bestätigen.",

    genericManageProfile: "Vom Profil verwalten",
    genericPerPerson: "pro Person",
    genericFree: "Kostenlos",
  },
};

export function tEmail(locale: EmailLocale, key: string): string {
  return EMAIL_STRINGS[locale]?.[key] || EMAIL_STRINGS.it[key] || key;
}

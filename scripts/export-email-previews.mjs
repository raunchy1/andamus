import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const outDir = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "../../audit");
mkdirSync(outDir, { recursive: true });

const templatesPath = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), "../lib/emails/templates.ts"));
const { getWelcomeEmailTemplate, getBookingRequestEmailTemplate, getBookingConfirmedEmailTemplate, getBookingRejectedEmailTemplate, getNewMessageEmailTemplate } = await import(templatesPath.href);

const baseUrl = "https://andamus.vercel.app";
const samples = [
  ["email-welcome", getWelcomeEmailTemplate({ name: "Mario Rossi", referralCode: "ANDAMUS25", baseUrl })],
  ["email-booking-request", getBookingRequestEmailTemplate({ driverName: "Luca", passengerName: "Giulia", passengerRating: 4.8, passengerVerified: true, fromCity: "Cagliari", toCity: "Nuoro", date: "22 giu", time: "09:00", bookingId: "demo", baseUrl })],
  ["email-booking-confirmed", getBookingConfirmedEmailTemplate({ passengerName: "Giulia", driverName: "Luca", driverRating: 4.9, fromCity: "Cagliari", toCity: "Nuoro", date: "22 giu", time: "09:00", meetingPoint: "Stazione FS", bookingId: "demo", baseUrl })],
  ["email-booking-rejected", getBookingRejectedEmailTemplate({ passengerName: "Giulia", driverName: "Luca", fromCity: "Cagliari", toCity: "Nuoro", date: "22 giu", baseUrl })],
  ["email-new-message", getNewMessageEmailTemplate({ recipientName: "Luca", senderName: "Giulia", messagePreview: "Ciao, confermiamo il punto di ritrovo?", bookingId: "demo", fromCity: "Cagliari", toCity: "Nuoro", baseUrl })],
];

for (const [name, tpl] of samples) {
  writeFileSync(path.join(outDir, `${name}.html`), tpl.html, "utf8");
  const hasRed = tpl.html.includes("#e63946");
  console.log(`${name}.html written legacyRed=${hasRed}`);
}
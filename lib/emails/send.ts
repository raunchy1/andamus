import { Resend } from "resend";
import {
  getBookingRequestEmailTemplate,
  getBookingConfirmedEmailTemplate,
  getBookingRejectedEmailTemplate,
  getNewMessageEmailTemplate,
  getWelcomeEmailTemplate,
  getRideReminderEmailTemplate,
} from "./templates";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Andamus <noreply@andamus.app>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://andamus.app";

// Generate unsubscribe token
async function getUnsubscribeToken(userId: string): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    // Create a simple token based on userId and timestamp
    const token = Buffer.from(`${userId}:${Date.now()}`).toString("base64");
    return token;
  } catch {
    return undefined;
  }
}

// Check if user has email notifications enabled
async function shouldSendEmail(
  userId: string,
  emailType: "booking_requests" | "booking_confirmed" | "new_messages" | "ride_reminders" | "marketing"
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_booking_requests, email_booking_confirmed, email_new_messages, email_ride_reminders, email_marketing")
      .eq("id", userId)
      .single();

    if (!profile) return true; // Default to sending if no profile

    switch (emailType) {
      case "booking_requests":
        return profile.email_booking_requests !== false;
      case "booking_confirmed":
        return profile.email_booking_confirmed !== false;
      case "new_messages":
        return profile.email_new_messages !== false;
      case "ride_reminders":
        return profile.email_ride_reminders !== false;
      case "marketing":
        return profile.email_marketing === true;
      default:
        return true;
    }
  } catch {
    return true; // Default to sending on error
  }
}

// Get user email from auth
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    return user?.email || null;
  } catch {
    return null;
  }
}

// A) Send booking request email to driver
export async function sendBookingRequestEmail(data: {
  driverId: string;
  driverEmail: string;
  driverName: string;
  passengerName: string;
  passengerRating: number;
  passengerVerified: boolean;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  bookingId: string;
  rideId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if driver has booking request notifications enabled
    const shouldSend = await shouldSendEmail(data.driverId, "booking_requests");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.driverId);
    const { subject, html } = getBookingRequestEmailTemplate({
      driverName: data.driverName,
      passengerName: data.passengerName,
      passengerRating: data.passengerRating,
      passengerVerified: data.passengerVerified,
      fromCity: data.fromCity,
      toCity: data.toCity,
      date: data.date,
      time: data.time,
      bookingId: data.bookingId,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.driverEmail,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending booking request email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendBookingRequestEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// B) Send booking confirmed email to passenger
export async function sendBookingConfirmedEmail(data: {
  passengerId: string;
  passengerEmail: string;
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
  rideId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if passenger has booking confirmed notifications enabled
    const shouldSend = await shouldSendEmail(data.passengerId, "booking_confirmed");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.passengerId);
    const { subject, html } = getBookingConfirmedEmailTemplate({
      passengerName: data.passengerName,
      driverName: data.driverName,
      driverRating: data.driverRating,
      driverPhone: data.driverPhone,
      fromCity: data.fromCity,
      toCity: data.toCity,
      date: data.date,
      time: data.time,
      meetingPoint: data.meetingPoint,
      bookingId: data.bookingId,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.passengerEmail,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending booking confirmed email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendBookingConfirmedEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// C) Send booking rejected email to passenger
export async function sendBookingRejectedEmail(data: {
  passengerId: string;
  passengerEmail: string;
  passengerName: string;
  driverName: string;
  fromCity: string;
  toCity: string;
  date: string;
  bookingId: string;
  rideId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if passenger has booking confirmed notifications enabled
    const shouldSend = await shouldSendEmail(data.passengerId, "booking_confirmed");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.passengerId);
    const { subject, html } = getBookingRejectedEmailTemplate({
      passengerName: data.passengerName,
      driverName: data.driverName,
      fromCity: data.fromCity,
      toCity: data.toCity,
      date: data.date,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.passengerEmail,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending booking rejected email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendBookingRejectedEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// D) Send new message email to recipient
export async function sendNewMessageEmail(data: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  bookingId: string;
  rideId: string;
  fromCity: string;
  toCity: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if recipient has new message notifications enabled
    const shouldSend = await shouldSendEmail(data.recipientId, "new_messages");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.recipientId);
    const { subject, html } = getNewMessageEmailTemplate({
      recipientName: data.recipientName,
      senderName: data.senderName,
      messagePreview: data.messagePreview,
      bookingId: data.bookingId,
      fromCity: data.fromCity,
      toCity: data.toCity,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending new message email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendNewMessageEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// E) Send welcome email to new user
export async function sendWelcomeEmail(data: {
  userId: string;
  email: string;
  name: string;
  referralCode: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has marketing notifications enabled (welcome email is considered marketing)
    const shouldSend = await shouldSendEmail(data.userId, "marketing");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.userId);
    const { subject, html } = getWelcomeEmailTemplate({
      name: data.name,
      referralCode: data.referralCode,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendWelcomeEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// F) Send ride reminder email
export async function sendRideReminderEmail(data: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  isDriver: boolean;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  meetingPoint: string;
  bookingId: string;
  rideId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if recipient has ride reminder notifications enabled
    const shouldSend = await shouldSendEmail(data.recipientId, "ride_reminders");
    if (!shouldSend) {
      return { success: true };
    }

    const unsubscribeToken = await getUnsubscribeToken(data.recipientId);
    const { subject, html } = getRideReminderEmailTemplate({
      recipientName: data.recipientName,
      isDriver: data.isDriver,
      fromCity: data.fromCity,
      toCity: data.toCity,
      date: data.date,
      time: data.time,
      meetingPoint: data.meetingPoint,
      bookingId: data.bookingId,
      baseUrl: BASE_URL,
      unsubscribeToken,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject,
      html,
    });

    if (error) {
      // console.error("Error sending ride reminder email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // console.error("Error in sendRideReminderEmail:", error);
    return { success: false, error: "Internal error" };
  }
}

// Check if user was recently online (within last 5 minutes)
export async function wasRecentlyOnline(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_seen")
      .eq("id", userId)
      .single();

    if (!profile?.last_seen) return false;

    const lastSeen = new Date(profile.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  } catch {
    return false;
  }
}

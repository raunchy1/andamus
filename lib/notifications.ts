import { createClient } from "@/lib/supabase/client";

export type NotificationType = 
  | 'booking_request' 
  | 'booking_accepted' 
  | 'booking_rejected' 
  | 'new_message' 
  | 'new_review'
  | 'ride_alert';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  rideId?: string;
  bookingId?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  rideId,
  bookingId,
}: CreateNotificationParams) {
  const supabase = createClient();
  
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    ride_id: rideId || null,
    booking_id: bookingId || null,
    read: false,
  });

  if (error) {
    // console.error("Error creating notification:", error);
    return false;
  }

  return true;
}

// Helper functions for specific notification types

export async function notifyBookingRequest(driverId: string, passengerName: string, rideId: string, bookingId: string) {
  return createNotification({
    userId: driverId,
    type: 'booking_request',
    title: 'Nuova richiesta di passaggio',
    body: `${passengerName} ha richiesto di unirsi al tuo passaggio`,
    rideId,
    bookingId,
  });
}

export async function notifyBookingAccepted(passengerId: string, driverName: string, rideId: string, bookingId: string) {
  return createNotification({
    userId: passengerId,
    type: 'booking_accepted',
    title: 'Passaggio confermato!',
    body: `${driverName} ha accettato la tua richiesta`,
    rideId,
    bookingId,
  });
}

export async function notifyBookingRejected(passengerId: string, driverName: string, rideId: string, bookingId: string) {
  return createNotification({
    userId: passengerId,
    type: 'booking_rejected',
    title: 'Richiesta non accettata',
    body: `${driverName} non può offrirti il passaggio`,
    rideId,
    bookingId,
  });
}

export async function notifyNewMessage(userId: string, senderName: string, rideId: string, bookingId: string) {
  return createNotification({
    userId,
    type: 'new_message',
    title: 'Nuovo messaggio',
    body: `Hai ricevuto un messaggio da ${senderName}`,
    rideId,
    bookingId,
  });
}

export async function notifyNewReview(reviewedId: string, reviewerName: string, rideId: string) {
  return createNotification({
    userId: reviewedId,
    type: 'new_review',
    title: 'Hai ricevuto una recensione',
    body: `${reviewerName} ha lasciato una recensione sul tuo passaggio`,
    rideId,
  });
}

export async function notifyRideAlert(userId: string, fromCity: string, toCity: string, rideId: string) {
  return createNotification({
    userId,
    type: 'ride_alert',
    title: 'Nuovo passaggio disponibile!',
    body: `Trovato un passaggio da ${fromCity} a ${toCity}`,
    rideId,
  });
}

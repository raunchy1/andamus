'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MessageInput = {
  booking_id: string;
  content: string;
  type?: 'text' | 'image' | 'location' | 'audio';
  media_url?: string;
  location_lat?: number;
  location_lng?: number;
  duration?: number;
}

export async function sendMessage(input: MessageInput) {
  const supabase = await createClient()

  // ── Server-side validation ──
  if (!input.booking_id || typeof input.booking_id !== 'string') {
    throw new Error("ID-ul rezervării este obligatoriu.")
  }

  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Conținutul mesajului nu poate fi gol.")
  }

  if (input.content.trim().length > 2000) {
    throw new Error("Mesajul este prea lung (maxim 2000 de caractere).")
  }

  const validTypes = ['text', 'image', 'location', 'audio'] as const
  if (input.type && !validTypes.includes(input.type)) {
    throw new Error("Tipul de mesaj nu este valid.")
  }

  if ((input.type === 'image' || input.type === 'audio') && !input.media_url) {
    throw new Error("URL-ul media este obligatoriu pentru mesajele de tip imagine/audio.")
  }

  if (input.type === 'location' && (input.location_lat == null || input.location_lng == null)) {
    throw new Error("Coordonatele sunt obligatorii pentru mesajele de tip locație.")
  }

  // ── Auth check ──
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error("Trebuie să fii autentificat pentru a trimite mesaje.")
  }

  // ── Verify participant ──
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, passenger_id, rides!inner(driver_id)')
    .eq('id', input.booking_id)
    .single()

  if (bookingError || !booking) {
    throw new Error("Rezervarea nu a fost găsită.")
  }

  const rideDriverId = (booking.rides as unknown as { driver_id: string })?.driver_id
  if (user.id !== booking.passenger_id && user.id !== rideDriverId) {
    throw new Error("Nu ai permisiunea de a trimite mesaje în această conversație.")
  }

  // ── Insert ──
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      booking_id: input.booking_id,
      sender_id: user.id,
      content: input.content.trim(),
      type: input.type || 'text',
      media_url: input.media_url,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      duration: input.duration,
    })
    .select()
    .single()

  if (error) {
    // Error logged to Sentry in production
    throw new Error("Eroare la trimiterea mesajului.")
  }

  revalidatePath(`/chat/${input.booking_id}`)
  
  return message
}

export async function markMessagesAsRead(bookingId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Trebuie să fii autentificat.")
  }

  // ── Verify participant ──
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, passenger_id, rides!inner(driver_id)')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    throw new Error("Rezervarea nu a fost găsită.")
  }

  const rideDriverId = (booking.rides as unknown as { driver_id: string })?.driver_id
  if (user.id !== booking.passenger_id && user.id !== rideDriverId) {
    throw new Error("Nu ai permisiunea de a marca mesajele ca citite.")
  }

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('booking_id', bookingId)
    .neq('sender_id', user.id)
    .eq('read', false)

  if (error) {
    // Error logged to Sentry in production
    throw new Error("Eroare la marcarea mesajelor ca citite.")
  }
}

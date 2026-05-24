"use server";

import { createClient } from "@/lib/supabase/server";

export interface BookingRide {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  driver_id: string;
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  created_at: string;
  payment_intent_id: string | null;
  payment_status: string | null;
  rides: BookingRide;
}

export interface BookingRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  created_at: string;
  payment_intent_id: string | null;
  payment_status: string | null;
  passenger: {
    name: string;
    avatar_url: string | null;
  };
  ride: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
  };
}

/**
 * Get bookings for a passenger.
 */
export async function getPassengerBookings(passengerId: string): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      rides(
        id, from_city, to_city, date, time, price, driver_id,
        profiles(id, name, avatar_url)
      )
    `)
    .eq("passenger_id", passengerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/bookings] getPassengerBookings error:", error.message);
    return [];
  }
  return (data || []) as Booking[];
}

/**
 * Get pending booking requests for a driver's rides.
 */
export async function getDriverBookingRequests(rideIds: string[]): Promise<BookingRequest[]> {
  if (rideIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      passenger:profiles(name, avatar_url),
      ride:rides(from_city, to_city, date, time, price)
    `)
    .eq("status", "pending")
    .or("payment_status.is.null,payment_status.eq.authorized")
    .in("ride_id", rideIds);

  if (error) {
    console.error("[data/bookings] getDriverBookingRequests error:", error.message);
    return [];
  }
  return (data || []) as BookingRequest[];
}
